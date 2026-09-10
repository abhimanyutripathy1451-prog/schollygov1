import re

with open('d:\\Projects\\schollygo\\Development\\schollygov1\\schollygov1-backend\\database_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# 1. subjects
sql = re.sub(r'(CREATE TABLE `subjects` \(\n\s*`id` int NOT NULL AUTO_INCREMENT,\n)', r'\1  `code` varchar(50) NOT NULL,\n', sql)
sql = re.sub(r'(PRIMARY KEY \(`id`\),\n)', r'\1  UNIQUE KEY `code` (`code`),\n', sql)

# 2. chapters
sql = re.sub(r'(CREATE TABLE `chapters` \(\n\s*`id` int NOT NULL AUTO_INCREMENT,\n)\s*`subject_code` int NOT NULL,', r'\1  `code` varchar(100) NOT NULL,\n  `subject_code` varchar(50) NOT NULL,', sql)
sql = re.sub(r'(PRIMARY KEY \(`id`\),\n)', r'\1  UNIQUE KEY `code` (`code`),\n', sql)
sql = sql.replace('KEY `subject_code` (`subject_code`),', 'KEY `subject_code` (`subject_code`),')
sql = sql.replace('CONSTRAINT `chapters_ibfk_1` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`id`)', 'CONSTRAINT `chapters_ibfk_1` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`code`)')

# 3. user_subject_progress
sql = sql.replace('`subject_code` int NOT NULL,', '`subject_code` varchar(50) NOT NULL,')
sql = sql.replace('PRIMARY KEY (`user_id`,`subject_code`),', 'PRIMARY KEY (`user_id`,`subject_code`),')
sql = sql.replace('KEY `subject_code` (`subject_code`),', 'KEY `subject_code` (`subject_code`),')
sql = sql.replace('CONSTRAINT `user_subject_progress_ibfk_2` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`id`)', 'CONSTRAINT `user_subject_progress_ibfk_2` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`code`)')

# 4. topics
sql = re.sub(r'(CREATE TABLE `topics` \(\n\s*`id` int NOT NULL AUTO_INCREMENT,\n)\s*`chapter_code` int NOT NULL,', r'\1  `code` varchar(100) NOT NULL,\n  `chapter_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(PRIMARY KEY \(`id`\),\n\s*KEY `chapter_)(id` \(`chapter_code`\),\n)', r'PRIMARY KEY (`id`),\n  UNIQUE KEY `code` (`code`),\n  KEY `chapter_\2', sql)
sql = sql.replace('KEY `chapter_code` (`chapter_code`),', 'KEY `chapter_code` (`chapter_code`),')
sql = sql.replace('CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`id`)', 'CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)')

# 5. user_chapter_progress
sql = sql.replace('`chapter_code` int NOT NULL,', '`chapter_code` varchar(100) NOT NULL,')
sql = sql.replace('PRIMARY KEY (`user_id`,`chapter_code`),', 'PRIMARY KEY (`user_id`,`chapter_code`),')
sql = sql.replace('KEY `chapter_code` (`chapter_code`),', 'KEY `chapter_code` (`chapter_code`),')
sql = sql.replace('CONSTRAINT `user_chapter_progress_ibfk_2` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`id`)', 'CONSTRAINT `user_chapter_progress_ibfk_2` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)')

# 6. quiz_questions
sql = re.sub(r'(CREATE TABLE `quiz_questions` \(\n\s*`id` int NOT NULL AUTO_INCREMENT,\n)\s*`chapter_code` int NOT NULL,\n\s*`topic_code` int NOT NULL,', r'\1  `code` varchar(100) NOT NULL,\n  `chapter_code` varchar(100) NOT NULL,\n  `topic_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(PRIMARY KEY \(`id`\),\n\s*KEY `chapter_)(id` \(`chapter_code`\),\n)', r'PRIMARY KEY (`id`),\n  UNIQUE KEY `code` (`code`),\n  KEY `chapter_\2', sql)
sql = sql.replace('KEY `chapter_code` (`chapter_code`),', 'KEY `chapter_code` (`chapter_code`),')
sql = sql.replace('KEY `quiz_questions_ibfk_2` (`topic_code`),', 'KEY `quiz_questions_ibfk_2` (`topic_code`),')
sql = sql.replace('CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`id`)', 'CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)')
sql = sql.replace('CONSTRAINT `quiz_questions_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`id`)', 'CONSTRAINT `quiz_questions_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)')

# 7. user_topic_progress
sql = sql.replace('`topic_code` int NOT NULL,', '`topic_code` varchar(100) NOT NULL,')
sql = sql.replace('PRIMARY KEY (`user_id`,`topic_code`),', 'PRIMARY KEY (`user_id`,`topic_code`),')
sql = sql.replace('KEY `topic_code` (`topic_code`),', 'KEY `topic_code` (`topic_code`),')
sql = sql.replace('CONSTRAINT `user_topic_progress_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`id`)', 'CONSTRAINT `user_topic_progress_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)')

# 8. quiz_attempts
sql = sql.replace('`chapter_code` int NOT NULL,', '`chapter_code` varchar(100) NOT NULL,')
sql = sql.replace('`topic_code` int DEFAULT NULL,', '`topic_code` varchar(100) DEFAULT NULL,')
sql = sql.replace('KEY `chapter_code` (`chapter_code`),', 'KEY `chapter_code` (`chapter_code`),')
sql = sql.replace('KEY `fk_qa_topic` (`topic_code`),', 'KEY `fk_qa_topic` (`topic_code`),')
sql = sql.replace('CONSTRAINT `fk_qa_topic` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`id`)', 'CONSTRAINT `fk_qa_topic` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)')

# 9. question_attempt_logs
sql = sql.replace('`topic_code` int NOT NULL,', '`topic_code` varchar(100) NOT NULL,')
sql = sql.replace('`chapter_code` int NOT NULL,', '`chapter_code` varchar(100) NOT NULL,')
sql = sql.replace('KEY `topic_code` (`topic_code`),', 'KEY `topic_code` (`topic_code`),')
sql = sql.replace('KEY `chapter_code` (`chapter_code`),', 'KEY `chapter_code` (`chapter_code`),')
sql = sql.replace('KEY `idx_rolling_chapter` (`user_id`,`chapter_code`,`quiz_mode`,`id` DESC),', 'KEY `idx_rolling_chapter` (`user_id`,`chapter_code`,`quiz_mode`,`id` DESC),')
sql = sql.replace('KEY `idx_rolling_topic` (`user_id`,`topic_code`,`id` DESC),', 'KEY `idx_rolling_topic` (`user_id`,`topic_code`,`id` DESC),')
sql = sql.replace('CONSTRAINT `question_attempt_logs_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`id`)', 'CONSTRAINT `question_attempt_logs_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)')
sql = sql.replace('CONSTRAINT `question_attempt_logs_ibfk_3` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`id`)', 'CONSTRAINT `question_attempt_logs_ibfk_3` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)')

with open('d:\\Projects\\schollygo\\Development\\schollygov1\\schollygov1-backend\\database_schema.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
print('Done!')
