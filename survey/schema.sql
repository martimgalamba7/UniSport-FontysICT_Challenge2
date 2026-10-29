-- ==========================================================================
-- UniSport Research Survey Database Schema
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS `unisport_db`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `unisport_db`;

-- --- Primary Survey Responses Table ---
CREATE TABLE IF NOT EXISTS `survey_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` VARCHAR(32) NOT NULL UNIQUE,
  `timestamp` DATETIME NOT NULL,
  `student_status` ENUM('Yes', 'No') NOT NULL,
  `sports_frequency` VARCHAR(50) NOT NULL,
  `favorite_sports_json` JSON NOT NULL,
  `skipped_due_to_company` VARCHAR(50) NOT NULL,
  `obstacles_json` JSON NOT NULL,
  `rating_quick_creation` TINYINT UNSIGNED NOT NULL,
  `rating_geo_feed` TINYINT UNSIGNED NOT NULL,
  `extra_features_feedback` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- Normalized Relational Tables ---
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
