# Gamification Module (Core Engine)

The Gamification engine in SchollyGo is designed to drive long-term student retention and engagement. By focusing on psychological tension, spaced repetition, and prestige scaling, the system maintains a balanced economy purely driven by XP, Ranks, and Streaks.

## Core Mechanics

### 1. Experience Points (XP)
XP is the fundamental currency of engagement. It is cumulative and is used to drive both the Leaderboard position and the user's Rank.
- **Topic Warm-Ups**: Award 0 XP. They are designed for practice and sandbox learning.
- **Chapter Adaptive Quizzes**: Award dynamic XP based on question difficulty, base XP, and accuracy.

### 2. Ranks & Prestige (The "Endgame" Solution)
Ranks provide users with a sense of progression and status.
- **Standard Ranks**: Users progress through predefined ranks (e.g., Novice, Apprentice, Master) based on fixed XP thresholds defined in the `ranks` table.
- **Prestige Scaling**: To solve the "Endgame" problem (what happens when a user reaches the highest rank), the system dynamically calculates Prestige levels. Once a user surpasses the maximum rank's XP threshold, they earn a Prestige Level (e.g., Grandmaster +1, Grandmaster +2) for every additional 5,000 XP earned. This provides an infinite scaling progression loop.

### 3. Streaks & Streak Freezes
The streak system creates psychological tension and daily engagement habits.
- **Streak Freezes**: Act as a safety net to prevent users from losing their streak if they miss a day.
- **Earning Freezes**:
  - **Rank Ups**: Automatically awards +1 freeze when reaching a new rank or prestige level.
  - **7-Day Milestones**: Automatically awards +1 freeze for maintaining a streak for 7 consecutive days.
- **The Hard Cap**: To preserve the psychological tension of the streak, users can hold a maximum of **3 Streak Freezes**. Any freezes earned while at the cap are silently discarded.

### 4. Anti-Farming & Diminishing Returns
To protect the integrity of the leaderboard and prevent bots or users from farming XP on easy quizzes, the system enforces a decay curve.
- **Diminishing Returns Formula**: `Multiplier = max(0.2, 0.75 ^ lifetime_attempts)`
- When a user repeats the exact same chapter quiz, the base XP reward drops exponentially, capping at a minimum of 20% of the original XP. This incentivizes users to explore new chapters and subjects rather than grinding the same content.

## API & UI Synchronization

The Vite frontend relies on real-time metadata to trigger gamification pop-ups, rank-up animations, and streak notifications.

The `POST /quiz/attempts` endpoint injects the following metadata directly into the JSON response:
- `has_ranked_up`: Boolean indicating if the XP pushed the user over a rank or prestige threshold.
- `new_rank_title`: The new rank string (including dynamic prestige titles).
- `streak_freezes_awarded`: Integer denoting how many freezes were granted in this attempt.
- `current_streak_freezes_balance`: Live total of the user's streak freezes (capped at 3).
- `current_streak`: The user's newly calculated streak.

## Professional KPIs & Tracking

The Gamification module tracks several key metrics to measure product health and student engagement:

1. **Rank Velocity (Time to Level Up)**
   - Measured by analyzing the timestamps between rank progression events. Helps identify if the 5,000 XP prestige interval is too steep or too easy.
2. **Streak Retention (Survival Rate)**
   - Tracks the average length of user streaks and how frequently streak freezes are consumed. A high consumption rate with low retention indicates users might be struggling with daily engagement.
3. **Leaderboard Integrity**
   - The XP decay curve ensures that the top leaderboard positions are held by users who engage with a wide breadth of content, rather than farming a single chapter.

## Database & Performance Considerations
- **Date Boundaries**: Leaderboard queries (Weekly/Monthly) calculate precise `datetime` boundaries in Python rather than relying on MySQL functions like `YEARWEEK()`. This allows the database to utilize the `idx_xplogs_createdat` index effectively and prevents full table scans.
- **Concurrency**: XP and Streak calculations inside `POST /quiz/attempts` utilize `SELECT ... FOR UPDATE` row-level locks on the `users` table to prevent race conditions during rapid submissions.
