SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_notices`;
DROP TABLE IF EXISTS `xp_logs`;
DROP TABLE IF EXISTS `question_attempt_logs`;
DROP TABLE IF EXISTS `question_reports`;
DROP TABLE IF EXISTS `user_mistake_lifecycle`;
DROP TABLE IF EXISTS `user_question_history`;
DROP TABLE IF EXISTS `quiz_attempts`;
DROP TABLE IF EXISTS `user_topic_progress`;
DROP TABLE IF EXISTS `quiz_questions`;
DROP TABLE IF EXISTS `user_chapter_progress`;
DROP TABLE IF EXISTS `topics`;
DROP TABLE IF EXISTS `user_subject_progress`;
DROP TABLE IF EXISTS `chapters`;
DROP TABLE IF EXISTS `subjects`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `ranks`;
DROP TABLE IF EXISTS `partners`;
DROP TABLE IF EXISTS `curriculums`;
DROP TABLE IF EXISTS `chapters_bkp`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `curriculums` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `board` varchar(100) NOT NULL,
  `stream` varchar(50) DEFAULT NULL,
  `medium` varchar(100) DEFAULT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `type` enum('school_board','competitive_exam','certification') NOT NULL DEFAULT 'school_board',
  `is_active` tinyint DEFAULT '1',
  `sequence_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `partner_code` varchar(20) NOT NULL,
  `referral_code` varchar(20) NOT NULL,
  `partner_name` varchar(255) NOT NULL,
  `partner_type` enum('coaching_class','school','individual_teacher','promoter') NOT NULL,
  `contact_person` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pin_code` varchar(10) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `brand_primary_color` varchar(10) DEFAULT NULL,
  `roll_number_prefix` varchar(10) DEFAULT 'TT',
  `passkey_hash` varchar(255) NOT NULL,
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_code` (`partner_code`),
  UNIQUE KEY `referral_code` (`referral_code`),
  UNIQUE KEY `mobile` (`mobile`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `ranks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rank_level` int NOT NULL,
  `title` varchar(50) NOT NULL,
  `min_xp` int NOT NULL,
  `tier` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rank_level` (`rank_level`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `roll_number` varchar(50) NOT NULL,
  `partner_id` int DEFAULT NULL,
  `mobile` varchar(15) NOT NULL,
  `passkey_hash` varchar(255) NOT NULL,
  `referral_code` varchar(20) NOT NULL,
  `referred_by_user_id` varchar(36) DEFAULT NULL,
  `full_name` varchar(100) NOT NULL,
  `gender` varchar(20) DEFAULT 'Not Specified',
  `avatar_seed` varchar(255) DEFAULT NULL,
  `curriculum_code` varchar(50) NOT NULL,
  `grade` varchar(20) DEFAULT NULL,
  `school_name` varchar(150) DEFAULT 'Not Specified',
  `parent_name` varchar(100) NOT NULL,
  `parent_mobile` varchar(15) DEFAULT NULL,
  `parent_email` varchar(100) DEFAULT NULL,
  `total_xp` int DEFAULT '0',
  `vault_question` varchar(255) DEFAULT NULL,
  `vault_answer` varchar(255) DEFAULT NULL,
  `current_streak` int DEFAULT '0',
  `last_streak_date` date DEFAULT NULL,
  `streak_freezes` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `referral_code` (`referral_code`),
  UNIQUE KEY `roll_number` (`roll_number`),
  KEY `curriculum_code` (`curriculum_code`),
  KEY `referred_by_user_id` (`referred_by_user_id`),
  KEY `idx_users_leaderboard_xp` (`total_xp` DESC),
  KEY `idx_users_leaderboard_streak` (`current_streak` DESC),
  KEY `idx_partner_leaderboard_xp` (`partner_id`,`total_xp` DESC),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`curriculum_code`) REFERENCES `curriculums` (`code`) ON DELETE RESTRICT,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`referred_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `curriculum_code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_translations` json DEFAULT NULL,
  `icon_class` varchar(100) DEFAULT 'ph-fill ph-book-open-text',
  `sequence_order` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `curriculum_code` (`curriculum_code`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`curriculum_code`) REFERENCES `curriculums` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `chapters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `subject_code` varchar(50) NOT NULL,
  `module_name` varchar(100) NOT NULL,
  `module_translations` json DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `title_translations` json DEFAULT NULL,
  `description` text,
  `sequence_order` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `subject_code` (`subject_code`),
  CONSTRAINT `chapters_ibfk_1` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_subject_progress` (
  `user_id` varchar(36) NOT NULL,
  `subject_code` varchar(50) NOT NULL,
  `mastery_percentage` decimal(5,2) DEFAULT '0.00',
  `previous_mastery_percentage` decimal(5,2) DEFAULT '0.00',
  `chapters_completed` int DEFAULT '0',
  `total_chapters` int DEFAULT '0',
  `last_attempted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`,`subject_code`),
  KEY `subject_code` (`subject_code`),
  CONSTRAINT `user_subject_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_subject_progress_ibfk_2` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `topics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `chapter_code` varchar(100) NOT NULL,
  `title` varchar(200) NOT NULL,
  `title_translations` json DEFAULT NULL,
  `description` text,
  `importance_level` enum('low','medium','high') DEFAULT 'medium',
  `base_difficulty` enum('easy','medium','hard') DEFAULT 'medium',
  `estimated_minutes` int DEFAULT NULL,
  `sequence_order` int DEFAULT '0',
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `chapter_code` (`chapter_code`),
  CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_chapter_progress` (
  `user_id` varchar(36) NOT NULL,
  `chapter_code` varchar(100) NOT NULL,
  `status` enum('locked','untested','calibrating','active') DEFAULT 'untested',
  `mastery_percentage` decimal(5,2) DEFAULT '0.00',
  `lifetime_attempts` int DEFAULT '0',
  `last_attempted_at` timestamp NULL DEFAULT NULL,
  `rolling_attempts_count` int DEFAULT '0',
  `previous_mastery_percentage` decimal(5,2) DEFAULT '0.00',
  `unresolved_mistakes_count` int DEFAULT '0',
  PRIMARY KEY (`user_id`,`chapter_code`),
  KEY `chapter_code` (`chapter_code`),
  KEY `idx_last_attempted` (`last_attempted_at`),
  CONSTRAINT `user_chapter_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_chapter_progress_ibfk_2` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `quiz_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `chapter_code` varchar(100) NOT NULL,
  `topic_code` varchar(100) NOT NULL,
  `base_xp` int NOT NULL DEFAULT '10',
  `difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `difficulty_weight` decimal(5,2) DEFAULT NULL,
  `expected_time_seconds` int DEFAULT '60',
  `question_type` enum('mcq','msq','true_false') NOT NULL DEFAULT 'mcq',
  `tags` json DEFAULT NULL,
  `question_text` text NOT NULL,
  `question_image_url` varchar(500) DEFAULT NULL,
  `option_0` text,
  `option_0_image_url` varchar(500) DEFAULT NULL,
  `option_1` text,
  `option_1_image_url` varchar(500) DEFAULT NULL,
  `option_2` text,
  `option_2_image_url` varchar(500) DEFAULT NULL,
  `option_3` text,
  `option_3_image_url` varchar(500) DEFAULT NULL,
  `correct_answers` json NOT NULL,
  `explanation` text,
  `question_translations` json DEFAULT NULL,
  `options_translations` json DEFAULT NULL,
  `explanation_translations` json DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `chapter_code` (`chapter_code`),
  KEY `quiz_questions_ibfk_2` (`topic_code`),
  CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`) ON DELETE CASCADE,
  CONSTRAINT `quiz_questions_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`) ON DELETE CASCADE,
  CONSTRAINT `quiz_questions_chk_1` CHECK ((((`question_type` = _utf8mb4'true_false') and ((`option_0` is not null) or (`option_0_image_url` is not null)) and ((`option_1` is not null) or (`option_1_image_url` is not null))) or ((`question_type` in (_utf8mb4'mcq',_utf8mb4'msq')) and ((`option_0` is not null) or (`option_0_image_url` is not null)) and ((`option_1` is not null) or (`option_1_image_url` is not null)) and ((`option_2` is not null) or (`option_2_image_url` is not null)) and ((`option_3` is not null) or (`option_3_image_url` is not null)))))
) ENGINE=InnoDB AUTO_INCREMENT=136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_topic_progress` (
  `user_id` varchar(36) NOT NULL,
  `topic_code` varchar(100) NOT NULL,
  `status` enum('locked','untested','calibrating','active') DEFAULT 'untested',
  `mastery_percentage` decimal(5,2) DEFAULT '0.00',
  `easy_accuracy` decimal(5,2) DEFAULT '0.00',
  `medium_accuracy` decimal(5,2) DEFAULT '0.00',
  `hard_accuracy` decimal(5,2) DEFAULT '0.00',
  `lifetime_attempts` int DEFAULT '0',
  `last_attempted_at` timestamp NULL DEFAULT NULL,
  `rolling_attempts_count` int DEFAULT '0',
  `previous_mastery_percentage` decimal(5,2) DEFAULT '0.00',
  `unresolved_mistakes_count` int DEFAULT '0',
  PRIMARY KEY (`user_id`,`topic_code`),
  KEY `topic_code` (`topic_code`),
  KEY `idx_last_attempted` (`last_attempted_at`),
  CONSTRAINT `user_topic_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_topic_progress_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `quiz_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `chapter_code` varchar(100) NOT NULL,
  `difficulty_chosen` enum('easy','medium','hard','adaptive') NOT NULL,
  `score` int NOT NULL,
  `total_questions` int NOT NULL,
  `time_taken_seconds` int DEFAULT '0',
  `xp_earned` int NOT NULL,
  `attempted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `topic_code` varchar(100) DEFAULT NULL,
  `accuracy` decimal(5,2) DEFAULT '0.00',
  `idempotency_key` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_idempotency` (`idempotency_key`),
  KEY `user_id` (`user_id`),
  KEY `chapter_code` (`chapter_code`),
  KEY `fk_qa_topic` (`topic_code`),
  CONSTRAINT `fk_qa_topic` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`) ON DELETE CASCADE,
  CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_question_history` (
  `user_id` varchar(36) NOT NULL,
  `question_id` int NOT NULL,
  `is_correct` tinyint DEFAULT '0',
  `times_seen` int DEFAULT '1',
  `last_seen_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `avg_time_spent` int DEFAULT '0',
  `ever_incorrect` tinyint DEFAULT '0',
  `is_resolved` tinyint DEFAULT '0',
  PRIMARY KEY (`user_id`,`question_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `user_question_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_question_history_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_mistake_lifecycle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `question_id` int NOT NULL,
  `status` enum('pending','resolved') DEFAULT 'pending',
  `failed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `attempts_to_resolve` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`question_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `user_mistake_lifecycle_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_mistake_lifecycle_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `question_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `issue_type` enum('wrong_answer','incomplete_question','unclear','other') NOT NULL,
  `comment` text,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `question_reports_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_reports_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `question_attempt_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `topic_code` varchar(100) NOT NULL,
  `chapter_code` varchar(100) NOT NULL,
  `question_id` int NOT NULL,
  `difficulty` enum('easy','medium','hard','adaptive') NOT NULL,
  `is_correct` tinyint DEFAULT '0',
  `attempted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `quiz_mode` enum('sandbox','adaptive') DEFAULT 'adaptive',
  PRIMARY KEY (`id`),
  KEY `topic_code` (`topic_code`),
  KEY `chapter_code` (`chapter_code`),
  KEY `question_id` (`question_id`),
  KEY `idx_rolling_chapter` (`user_id`,`chapter_code`,`quiz_mode`,`id` DESC),
  KEY `idx_rolling_topic` (`user_id`,`topic_code`,`id` DESC),
  CONSTRAINT `question_attempt_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `question_attempt_logs_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`) ON DELETE CASCADE,
  CONSTRAINT `question_attempt_logs_ibfk_3` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`) ON DELETE CASCADE,
  CONSTRAINT `question_attempt_logs_ibfk_4` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `xp_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `amount` int NOT NULL,
  `source_type` enum('quiz','streak_bonus','manual','invite_bonus') NOT NULL,
  `source_reference_table` enum('users','chapters','quiz_attempts') DEFAULT NULL,
  `source_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `xp_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_notices` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `notice_type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `action_cta` varchar(50) DEFAULT NULL,
  `action_url` varchar(255) DEFAULT NULL,
  `is_dismissed` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_notices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
