import re

with open('database_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# 1. subjects
sql = re.sub(r'(CREATE TABLE `subjects` \([\s\S]*?`id` int NOT NULL AUTO_INCREMENT,)', r'\1\n  `code` varchar(50) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `subjects`[\s\S]*?)(PRIMARY KEY \(`id`\))', r'\1\2,\n  UNIQUE KEY `code` (`code`)', sql)

# 2. chapters
sql = re.sub(r'(CREATE TABLE `chapters` \([\s\S]*?`id` int NOT NULL AUTO_INCREMENT,)\n\s*`subject_code` int NOT NULL,', r'\1\n  `code` varchar(100) NOT NULL,\n  `subject_code` varchar(50) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `chapters`[\s\S]*?)(PRIMARY KEY \(`id`\))', r'\1\2,\n  UNIQUE KEY `code` (`code`)', sql)
sql = re.sub(r'(CREATE TABLE `chapters`[\s\S]*?)KEY `subject_code` \(`subject_code`\)', r'\1KEY `subject_code` (`subject_code`)', sql)
sql = re.sub(r'(CREATE TABLE `chapters`[\s\S]*?)CONSTRAINT `chapters_ibfk_1` FOREIGN KEY \(`subject_code`\) REFERENCES `subjects` \(`id`\)', r'\1CONSTRAINT `chapters_ibfk_1` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`code`)', sql)

# 3. user_subject_progress
sql = re.sub(r'(CREATE TABLE `user_subject_progress`[\s\S]*?)`subject_code` int NOT NULL,', r'\1`subject_code` varchar(50) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `user_subject_progress`[\s\S]*?)PRIMARY KEY \(`user_id`,`subject_code`\)', r'\1PRIMARY KEY (`user_id`,`subject_code`)', sql)
sql = re.sub(r'(CREATE TABLE `user_subject_progress`[\s\S]*?)KEY `subject_code` \(`subject_code`\)', r'\1KEY `subject_code` (`subject_code`)', sql)
sql = re.sub(r'(CREATE TABLE `user_subject_progress`[\s\S]*?)CONSTRAINT `user_subject_progress_ibfk_2` FOREIGN KEY \(`subject_code`\) REFERENCES `subjects` \(`id`\)', r'\1CONSTRAINT `user_subject_progress_ibfk_2` FOREIGN KEY (`subject_code`) REFERENCES `subjects` (`code`)', sql)

# 4. topics
sql = re.sub(r'(CREATE TABLE `topics` \([\s\S]*?`id` int NOT NULL AUTO_INCREMENT,)\n\s*`chapter_code` int NOT NULL,', r'\1\n  `code` varchar(100) NOT NULL,\n  `chapter_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `topics`[\s\S]*?)(PRIMARY KEY \(`id`\))', r'\1\2,\n  UNIQUE KEY `code` (`code`)', sql)
sql = re.sub(r'(CREATE TABLE `topics`[\s\S]*?)KEY `chapter_code` \(`chapter_code`\)', r'\1KEY `chapter_code` (`chapter_code`)', sql)
sql = re.sub(r'(CREATE TABLE `topics`[\s\S]*?)CONSTRAINT `topics_ibfk_1` FOREIGN KEY \(`chapter_code`\) REFERENCES `chapters` \(`id`\)', r'\1CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)', sql)

# 5. user_chapter_progress
sql = re.sub(r'(CREATE TABLE `user_chapter_progress`[\s\S]*?)`chapter_code` int NOT NULL,', r'\1`chapter_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `user_chapter_progress`[\s\S]*?)PRIMARY KEY \(`user_id`,`chapter_code`\)', r'\1PRIMARY KEY (`user_id`,`chapter_code`)', sql)
sql = re.sub(r'(CREATE TABLE `user_chapter_progress`[\s\S]*?)KEY `chapter_code` \(`chapter_code`\)', r'\1KEY `chapter_code` (`chapter_code`)', sql)
sql = re.sub(r'(CREATE TABLE `user_chapter_progress`[\s\S]*?)CONSTRAINT `user_chapter_progress_ibfk_2` FOREIGN KEY \(`chapter_code`\) REFERENCES `chapters` \(`id`\)', r'\1CONSTRAINT `user_chapter_progress_ibfk_2` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)', sql)

# 6. quiz_questions
sql = re.sub(r'(CREATE TABLE `quiz_questions` \([\s\S]*?`id` int NOT NULL AUTO_INCREMENT,)\n\s*`chapter_code` int NOT NULL,\n\s*`topic_code` int NOT NULL,', r'\1\n  `code` varchar(100) NOT NULL,\n  `chapter_code` varchar(100) NOT NULL,\n  `topic_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `quiz_questions`[\s\S]*?)(PRIMARY KEY \(`id`\))', r'\1\2,\n  UNIQUE KEY `code` (`code`)', sql)
sql = re.sub(r'(CREATE TABLE `quiz_questions`[\s\S]*?)KEY `chapter_code` \(`chapter_code`\)', r'\1KEY `chapter_code` (`chapter_code`)', sql)
sql = re.sub(r'(CREATE TABLE `quiz_questions`[\s\S]*?)KEY `quiz_questions_ibfk_2` \(`topic_code`\)', r'\1KEY `quiz_questions_ibfk_2` (`topic_code`)', sql)
sql = re.sub(r'(CREATE TABLE `quiz_questions`[\s\S]*?)CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY \(`chapter_code`\) REFERENCES `chapters` \(`id`\)', r'\1CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)', sql)
sql = re.sub(r'(CREATE TABLE `quiz_questions`[\s\S]*?)CONSTRAINT `quiz_questions_ibfk_2` FOREIGN KEY \(`topic_code`\) REFERENCES `topics` \(`id`\)', r'\1CONSTRAINT `quiz_questions_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)', sql)

# 7. user_topic_progress
sql = re.sub(r'(CREATE TABLE `user_topic_progress`[\s\S]*?)`topic_code` int NOT NULL,', r'\1`topic_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `user_topic_progress`[\s\S]*?)PRIMARY KEY \(`user_id`,`topic_code`\)', r'\1PRIMARY KEY (`user_id`,`topic_code`)', sql)
sql = re.sub(r'(CREATE TABLE `user_topic_progress`[\s\S]*?)KEY `topic_code` \(`topic_code`\)', r'\1KEY `topic_code` (`topic_code`)', sql)
sql = re.sub(r'(CREATE TABLE `user_topic_progress`[\s\S]*?)CONSTRAINT `user_topic_progress_ibfk_2` FOREIGN KEY \(`topic_code`\) REFERENCES `topics` \(`id`\)', r'\1CONSTRAINT `user_topic_progress_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)', sql)

# 8. quiz_attempts
sql = re.sub(r'(CREATE TABLE `quiz_attempts`[\s\S]*?)`chapter_code` int NOT NULL,', r'\1`chapter_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `quiz_attempts`[\s\S]*?)`topic_code` int DEFAULT NULL,', r'\1`topic_code` varchar(100) DEFAULT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `quiz_attempts`[\s\S]*?)KEY `chapter_code` \(`chapter_code`\)', r'\1KEY `chapter_code` (`chapter_code`)', sql)
sql = re.sub(r'(CREATE TABLE `quiz_attempts`[\s\S]*?)KEY `fk_qa_topic` \(`topic_code`\)', r'\1KEY `fk_qa_topic` (`topic_code`)', sql)
sql = re.sub(r'(CREATE TABLE `quiz_attempts`[\s\S]*?)CONSTRAINT `fk_qa_topic` FOREIGN KEY \(`topic_code`\) REFERENCES `topics` \(`id`\)', r'\1CONSTRAINT `fk_qa_topic` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)', sql)

# 9. question_attempt_logs
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)`topic_code` int NOT NULL,', r'\1`topic_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)`chapter_code` int NOT NULL,', r'\1`chapter_code` varchar(100) NOT NULL,', sql)
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)KEY `topic_code` \(`topic_code`\)', r'\1KEY `topic_code` (`topic_code`)', sql)
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)KEY `chapter_code` \(`chapter_code`\)', r'\1KEY `chapter_code` (`chapter_code`)', sql)
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)KEY `idx_rolling_chapter` \(`user_id`,`chapter_code`,`quiz_mode`,`id` DESC\)', r'\1KEY `idx_rolling_chapter` (`user_id`,`chapter_code`,`quiz_mode`,`id` DESC)', sql)
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)KEY `idx_rolling_topic` \(`user_id`,`topic_code`,`id` DESC\)', r'\1KEY `idx_rolling_topic` (`user_id`,`topic_code`,`id` DESC)', sql)
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)CONSTRAINT `question_attempt_logs_ibfk_2` FOREIGN KEY \(`topic_code`\) REFERENCES `topics` \(`id`\)', r'\1CONSTRAINT `question_attempt_logs_ibfk_2` FOREIGN KEY (`topic_code`) REFERENCES `topics` (`code`)', sql)
sql = re.sub(r'(CREATE TABLE `question_attempt_logs`[\s\S]*?)CONSTRAINT `question_attempt_logs_ibfk_3` FOREIGN KEY \(`chapter_code`\) REFERENCES `chapters` \(`id`\)', r'\1CONSTRAINT `question_attempt_logs_ibfk_3` FOREIGN KEY (`chapter_code`) REFERENCES `chapters` (`code`)', sql)

with open('database_schema.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
print('Done!')
