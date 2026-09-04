# Authentication & User Management Module

This module handles secure user registration, session management via JWT, and profile hydration for the `schollygov1` application.

## 1. Core User Flow & Features

- **Signup Flow (`POST /auth/signup`)**:
  - Accepts user details (nickName, mobile, curriculum_code, grade, passkey, inviteCode).
  - Validates unique constraints (username and mobile).
  - **Gamification Init**: Automatically assigns a default `avatar_seed` and gives 50 `total_xp` if an `inviteCode` is used.
  - **Partner Mapping**: Resolves `centerCode` or `inviteCode` to assign a `partner_id` and a customized `roll_number_prefix`.
  - Generates a globally unique `roll_number`.
  - Hashes the passkey securely.
  
- **Login Flow (`POST /auth/login`)**:
  - Allows login via `identifier` (which can be a username, mobile number, or roll number).
  - Validates the passkey against the stored bcrypt hash.
  - Issues a stateless JWT access token (valid for 24 hours).

- **Profile Hydration (`GET /auth/me` & `GET /auth/profile/{user_id}`)**:
  - Validates the JWT Bearer token on every request.
  - Joins the user data with the `curriculums` table to provide readable curriculum names.
  - **Dynamic Gamification Sync**: Recalculates total XP from `xp_logs` to ensure consistency.
  - **Streak Enforcement**: Checks `last_streak_date`. If the user missed days (beyond their available `streak_freezes`), it resets `current_streak` to 0.
  - **Rank Computation**: Queries the `ranks` table to determine the user's current level, next level threshold, and progress percentage.

- **Profile Editing (`PUT /auth/profile/{user_id}`)**:
  - Allows users to patch their avatar, school, parent details, and passkey.

- **Helper Endpoints**: 
  - `/auth/check-username` (Provides fallback suggestions if taken)
  - `/auth/check-mobile`
  - `/auth/check-invite-code` 

## 2. Database Schemas

- **`users` Table**: Primary entity. Uses UUIDs (`VARCHAR(36)`). Tracks all gamification attributes (`total_xp`, `coins`, `current_streak`, `streak_freezes`).
- **`partners` Table**: Represents institutions or referrers. Provides a `roll_number_prefix` (default: `TT`).
- **`curriculums` Table**: Master list of supported curriculums. Signup requires a valid `curriculum_code` (e.g., 'GEN').
- **`ranks` Table**: Maps `min_xp` to a specific `rank_level` and `title`.
- **`xp_logs` Table**: Append-only log of XP gains to maintain an audit trail and dynamically reconstruct user XP.

## 3. Security Hardening (Implemented)

- **Passkey Hashing**: 4-digit passkeys are hashed using `bcrypt` (gensalt) before storage. Plain-text fallbacks have been removed.
- **Environment Secrets**: JWT signature generation uses `os.getenv("SECRET_KEY")` rather than a hardcoded string.
- **Rate Limiting**: Integrated `slowapi`. `POST /auth/login` is limited to 3/minute; `POST /auth/signup` is limited to 5/minute to deter brute-force and spam attacks.
- **Stateless Sessions**: JWT tokens enforce expiration logic natively.

## 4. End-to-End Testing (Completed)

We have verified the module with a strict testing paradigm:
- **Test Database Architecture**: `pytest` creates a dynamic `test_schollygov1` database, sources `database_schema.sql`, and intercepts the `get_db` FastAPI dependency to ensure tests execute against real MySQL engine constraints (like Foreign Keys).
- **Backend Tests (`tests/test_auth_e2e.py`)**:
  - `test_signup_success`
  - `test_signup_duplicate` (Validates 400 response)
  - `test_login_success`
  - `test_login_invalid_passkey` (Validates 401 response)
  - `test_get_me_success` (Validates JWT authorization)
  - `test_get_me_invalid_token`
- **Frontend UI Tests**: Playwright scripts in `auth.spec.ts` simulate the complete user flow from filling the form to validating `localStorage` token persistence.

---

## 5. Missing Features & Technical Debt

While the core module is functional and secure, the following features are missing and should be prioritized for a production-ready application:

1. **OTP Verification**: Currently, signup trusts the provided mobile number. There is no Twilio/SMS integration to verify the user owns the number via OTP.
2. **Password / Passkey Reset**: There is no `/auth/forgot-passkey` endpoint. If a user forgets their 4-digit pin, they are locked out permanently.
3. **Token Refresh Strategy**: The system issues a single JWT valid for 24 hours. There is no `/auth/refresh` endpoint and no concept of long-lived Refresh Tokens. Users will abruptly lose their session after 24 hours.
4. **Token Revocation (Logout)**: There is no server-side token blacklist. When a user clicks "Logout", the frontend drops the token, but the token remains cryptographically valid until its 24-hour expiration.
5. **Account Deletion**: Apple App Store and Google Play require a user-facing "Delete Account" button. There is currently no `DELETE /auth/profile/{user_id}` endpoint.
6. **Role-Based Access Control (RBAC)**: All users share the same access level. There is no `role` column (e.g., `admin`, `teacher`, `student`) to protect sensitive administrative routes in the future.
