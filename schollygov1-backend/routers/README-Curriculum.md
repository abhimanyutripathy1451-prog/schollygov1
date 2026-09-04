# Curriculum & Content Module

This module manages the learning path of a student in SchollyGo. The curriculum tree is deeply relational, defining the structure of knowledge content presented to users.

## 1. Curriculum Hierarchy & Data Model

The database schemas enforce a strict hierarchical dependency:
1. **`curriculums`**: The root of the tree (e.g., 'GEN' - General Curriculum, 'CBSE' - Central Board of Secondary Education).
2. **`subjects`**: Tied to a `curriculum_code` and `grade` (e.g., Mathematics, Grade 10).
3. **`chapters`**: Tied to a `subject_id`. Chapters represent a significant module of learning.
4. **`topics`**: Tied to a `chapter_id`. Topics are the granular learning items inside a chapter.
5. **`chapter_resources`**: Additional reference material tied to a `chapter_id`.

## 2. API Endpoints

- **`GET /curriculum/curriculums`**: Returns all available curriculums.
- **`GET /curriculum/curriculums/{curriculum_code}/grades`**: Returns unique grades available for a curriculum based on the `subjects` table.
- **`GET /curriculum/subjects`**: Returns subjects for a specific curriculum, alongside the current user's progress (`mastery_percentage`).
- **`GET /curriculum/subjects/{subject_id}/chapters`**: (Deep Fetch) Returns all chapters belonging to the subject. *This endpoint aggregates Topics in-memory and nests them inside each chapter object to optimize frontend loading and avoid N+1 query patterns.* It also checks `partner_chapter_unlocks` to determine if a chapter is locked.
- **`GET /curriculum/chapters/{chapter_id}/topics`**: Standalone endpoint to fetch topics for a chapter.
- **`GET /curriculum/chapters/{chapter_id}/resources`**: Fetches supplementary resources for a chapter, respecting `partner_id` boundaries.

## 3. Data Integrity & Query Optimization

- **N+1 Avoidance**: The backend strictly avoids N+1 queries. When retrieving nested structures, it fetches all child nodes (e.g., topics for all chapters) in a single query and aggregates them into the parent structure in-memory (`O(N)` loop over records).
- **Error Handling**: Missing entities (like requesting chapters for a non-existent subject) are checked securely, raising an HTTP 404 Not Found rather than returning empty lists or internal server errors.
- **Access Control (Locks)**: Chapters might be "locked" depending on the student's `partner_id` and the `sequence_order` defined in `partner_chapter_unlocks`.

## 4. Expected Nested JSON Response (Example)

When requesting `/curriculum/subjects/1/chapters`, the frontend expects the following structure:
```json
[
  {
    "id": 101,
    "subject_id": 1,
    "title": "Algebra Basics",
    "sequence_order": 1,
    "is_locked": 0,
    "status": "untested",
    "topics": [
      {
        "id": 501,
        "chapter_id": 101,
        "title": "Linear Equations",
        "sequence_order": 1,
        "mastery_state": "proficient",
        "accuracy": 85.5
      }
    ]
  }
]
```

---

## 5. Missing Features & Technical Debt

While the data fetching is optimized against N+1 query patterns and 404 edge cases, there are critical gaps that need to be addressed for a massive production deployment:

### 1. The `is_active` Filtering Bug
- **Issue**: The database schema includes an `is_active` boolean column for `curriculums`, `subjects`, `chapters`, and `topics`. Currently, only the Topics query filters out inactive rows (`t.is_active = TRUE`).
- **Impact**: If a content administrator sets a Curriculum, Subject, or Chapter to `is_active = FALSE` (to hide it as a draft or for maintenance), the API ignores this flag and continues to serve the hidden content to students.
- **Fix Required**: Add `WHERE is_active = TRUE` to the SQL queries in `/curriculums`, `/subjects`, and `/chapters` endpoints.

### 2. The Missing Caching Layer (Performance)
- **Issue**: Curriculum data (Subjects, Chapters, Topics) almost never changes. Currently, the `/subjects` and `/chapters` endpoints perform a `LEFT JOIN` against `user_subject_progress` and `user_chapter_progress` to fetch the static curriculum tree and the student's dynamic, personalized scores in the exact same query.
- **Impact**: Hitting a relational database for massive static data trees on every single page load is expensive at scale. Because the response is uniquely personalized to a specific `user_id` on every request, we cannot utilize edge-caching.
- **Fix Required**: We should implement Redis Caching (or in-memory caching like fastapi-cache). Decouple the data: fetch the static curriculum tree from Redis (returning it in milliseconds) and fetch a lightweight array of the user's progress via a separate route to merge dynamically.

### 3. Large Payload Sizes (Scalability)
- **Issue**: We solved the N+1 network request problem by bundling all Chapters and Topics into one giant nested JSON response.
- **Impact**: If a Subject has 30 Chapters, and each Chapter has 15 Topics, that single JSON payload could become massive (megabytes in size). This will slow down the Vite frontend parsing and network transfer times, especially on poor mobile connections.
- **Fix Required**: Implement shallow vs. deep fetching (Pagination/Lazy-Loading). The API could return the Chapters and only deeply nest the Topics for the currently active Chapter, lazy-loading the rest on-demand when the user expands a new section.

### 4. Missing Sorting & Ordering Logic (Data Integrity)
- **Issue**: Raw MySQL does not guarantee the order of returned rows unless you explicitly tell it to. While chapters and topics currently use `ORDER BY sequence_order`, other entities like `subjects` and `curriculums` fall back to `ORDER BY id`.
- **Impact**: If a subject is deleted and recreated, its `id` will change, potentially rendering "Advanced Physics" before "Basic Physics" if the frontend relies on implicit SQL ordering.
- **Fix Required**: Ensure every Curriculum `GET` request has a strict chronological ordering applied at the SQL level (e.g., adding and enforcing a `sequence_order` column universally across all hierarchy tables).
