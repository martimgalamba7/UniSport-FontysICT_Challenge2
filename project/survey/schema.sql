-- ==========================================================
-- UniSport Research Survey Database Schema
-- Academic Project: Fontys ICT Semester 1 • Block 2 (Challenge 2)
-- Tool: HeidiSQL / MariaDB / MySQL
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `unisport_db`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `unisport_db`;

-- ----------------------------------------------------------
-- Table structure for `survey_responses`
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `survey_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` VARCHAR(32) NOT NULL UNIQUE,
  `timestamp` DATETIME NOT NULL,
  `student_status` ENUM('Yes', 'No') NOT NULL,
  `sports_frequency` VARCHAR(50) NOT NULL,
  `favorite_sports_json` JSON NOT NULL COMMENT 'Array of favorite sports selected by the respondent',
  `skipped_due_to_company` VARCHAR(50) NOT NULL COMMENT 'Frequency of skipping sports due to lack of company',
  `obstacles_json` JSON NOT NULL COMMENT 'List of reported student obstacles when organizing sports',
  `rating_quick_creation` TINYINT UNSIGNED NOT NULL COMMENT '1-5 Likert scale for 30-sec activity creation',
  `rating_geo_feed` TINYINT UNSIGNED NOT NULL COMMENT '1-5 Likert scale for map/geographic feed filter',
  `extra_features_feedback` TEXT NULL COMMENT 'Open text ideas and suggested platform features',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Normalized tables for deeper relational queries (Optional)
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS `response_sports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` VARCHAR(32) NOT NULL,
  `sport_name` VARCHAR(100) NOT NULL,
  FOREIGN KEY (`response_id`) REFERENCES `survey_responses`(`response_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `response_obstacles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` VARCHAR(32) NOT NULL,
  `obstacle_description` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`response_id`) REFERENCES `survey_responses`(`response_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Useful Analytical Queries for Academic Research & Reporting
-- ----------------------------------------------------------

-- 1. Sports frequency breakdown across respondents
-- SELECT sports_frequency, COUNT(*) AS respondent_count, 
--        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM survey_responses), 1) AS percentage
-- FROM survey_responses 
-- GROUP BY sports_frequency;

-- 2. Average feature interest scores
-- SELECT 
--   ROUND(AVG(rating_quick_creation), 2) AS avg_quick_creation_score,
--   ROUND(AVG(rating_geo_feed), 2) AS avg_geo_feed_score
-- FROM survey_responses;

-- 3. Frequency of skipping sports due to lack of company among active students
-- SELECT skipped_due_to_company, COUNT(*) AS count
-- FROM survey_responses
-- WHERE student_status = 'Yes'
-- GROUP BY skipped_due_to_company;
