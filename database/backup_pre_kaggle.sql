-- MySQL dump 10.13  Distrib 9.6.0, for macos26.2 (arm64)
--
-- Host: 127.0.0.1    Database: healthcare_ai_db
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'cdff3480-20fb-11f1-a29b-c5e52d316e93:1-144';

--
-- Table structure for table `admissions`
--

DROP TABLE IF EXISTS `admissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admissions` (
  `admission_id` int unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` int unsigned NOT NULL,
  `department_id` int unsigned NOT NULL,
  `admission_date` date NOT NULL,
  `discharge_date` date DEFAULT NULL,
  `diagnosis` varchar(180) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admission_id`),
  KEY `fk_admissions_patient` (`patient_id`),
  KEY `fk_admissions_department` (`department_id`),
  KEY `idx_admissions_date` (`admission_date`),
  KEY `idx_admissions_diagnosis` (`diagnosis`),
  CONSTRAINT `fk_admissions_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_admissions_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_admissions_dates` CHECK (((`discharge_date` is null) or (`discharge_date` >= `admission_date`))),
  CONSTRAINT `chk_admissions_status` CHECK ((`status` in (_utf8mb4'ADMITTED',_utf8mb4'DISCHARGED')))
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admissions`
--

LOCK TABLES `admissions` WRITE;
/*!40000 ALTER TABLE `admissions` DISABLE KEYS */;
INSERT INTO `admissions` VALUES (1,1,1,'2025-08-21','2025-08-24','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(2,2,2,'2025-08-27','2025-08-31','Hypertension','DISCHARGED','2026-09-27 14:34:33'),(3,3,3,'2025-09-02','2025-09-07','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(4,4,4,'2025-09-08','2025-09-14','Asthma exacerbation','DISCHARGED','2026-09-27 14:34:33'),(5,5,5,'2025-09-14','2025-09-16','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(6,6,1,'2025-09-20','2025-09-23','Community-acquired infection','DISCHARGED','2026-09-27 14:34:33'),(7,7,2,'2025-09-26','2025-09-30','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(8,8,3,'2025-10-02',NULL,'Hypertension','ADMITTED','2026-09-27 14:34:33'),(9,9,4,'2025-10-08','2025-10-14','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(10,10,5,'2025-10-14','2025-10-16','Asthma exacerbation','DISCHARGED','2026-09-27 14:34:33'),(11,11,1,'2025-10-20','2025-10-23','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(12,12,2,'2025-10-26','2025-10-30','Community-acquired infection','DISCHARGED','2026-09-27 14:34:33'),(13,13,3,'2025-11-01','2025-11-06','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(14,14,4,'2025-11-07','2025-11-13','Hypertension','DISCHARGED','2026-09-27 14:34:33'),(15,15,5,'2025-11-13','2025-11-15','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(16,16,1,'2025-11-19',NULL,'Asthma exacerbation','ADMITTED','2026-09-27 14:34:33'),(17,17,2,'2025-11-25','2025-11-29','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(18,18,3,'2025-12-01','2025-12-06','Community-acquired infection','DISCHARGED','2026-09-27 14:34:33'),(19,19,4,'2025-12-07','2025-12-13','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(20,20,5,'2025-12-13','2025-12-15','Hypertension','DISCHARGED','2026-09-27 14:34:33'),(21,21,1,'2025-12-19','2025-12-22','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(22,22,2,'2025-12-25','2025-12-29','Asthma exacerbation','DISCHARGED','2026-09-27 14:34:33'),(23,23,3,'2025-12-31','2026-01-05','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(24,24,4,'2026-01-06',NULL,'Community-acquired infection','ADMITTED','2026-09-27 14:34:33'),(25,25,5,'2026-01-12','2026-01-14','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(26,26,1,'2026-01-18','2026-01-21','Hypertension','DISCHARGED','2026-09-27 14:34:33'),(27,27,2,'2026-01-24','2026-01-28','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(28,28,3,'2026-01-30','2026-02-04','Asthma exacerbation','DISCHARGED','2026-09-27 14:34:33'),(29,29,4,'2026-02-05','2026-02-11','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(30,30,5,'2026-02-11','2026-02-13','Community-acquired infection','DISCHARGED','2026-09-27 14:34:33'),(31,31,1,'2026-02-17','2026-02-20','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(32,32,2,'2026-02-23',NULL,'Hypertension','ADMITTED','2026-09-27 14:34:33'),(33,33,3,'2026-03-01','2026-03-06','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(34,34,4,'2026-03-07','2026-03-13','Asthma exacerbation','DISCHARGED','2026-09-27 14:34:33'),(35,35,5,'2026-03-13','2026-03-15','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(36,36,1,'2026-03-19','2026-03-22','Community-acquired infection','DISCHARGED','2026-09-27 14:34:33'),(37,37,2,'2026-03-25','2026-03-29','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(38,38,3,'2026-03-31','2026-04-05','Hypertension','DISCHARGED','2026-09-27 14:34:33'),(39,39,4,'2026-04-06','2026-04-12','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(40,40,5,'2026-04-12',NULL,'Asthma exacerbation','ADMITTED','2026-09-27 14:34:33'),(41,41,1,'2026-04-18','2026-04-21','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(42,42,2,'2026-04-24','2026-04-28','Community-acquired infection','DISCHARGED','2026-09-27 14:34:33'),(43,43,3,'2026-04-30','2026-05-05','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(44,44,4,'2026-05-06','2026-05-12','Hypertension','DISCHARGED','2026-09-27 14:34:33'),(45,45,5,'2026-05-12','2026-05-14','Cardiac arrhythmia','DISCHARGED','2026-09-27 14:34:33'),(46,46,1,'2026-05-18','2026-05-21','Asthma exacerbation','DISCHARGED','2026-09-27 14:34:33'),(47,47,2,'2026-05-24','2026-05-28','Distal radius fracture','DISCHARGED','2026-09-27 14:34:33'),(48,48,3,'2026-05-30',NULL,'Community-acquired infection','ADMITTED','2026-09-27 14:34:33'),(49,49,4,'2026-06-05','2026-06-11','Diabetes mellitus','DISCHARGED','2026-09-27 14:34:33'),(50,50,5,'2026-06-11','2026-06-13','Hypertension','DISCHARGED','2026-09-27 14:34:33'),(64,1,1,'2026-09-28',NULL,'Routine observation transaction test','ADMITTED','2026-09-28 16:58:04'),(66,1,1,'2026-09-28',NULL,'Transaction workflow observation','ADMITTED','2026-09-28 16:58:28');
/*!40000 ALTER TABLE `admissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_query_audit_logs`
--

DROP TABLE IF EXISTS `ai_query_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_query_audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `question` text NOT NULL,
  `generated_sql` text,
  `query_type` varchar(50) DEFAULT NULL,
  `execution_status` varchar(40) NOT NULL,
  `row_count` int unsigned DEFAULT NULL,
  `execution_time_ms` int unsigned DEFAULT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_ai_query_audit_user_created` (`user_id`,`created_at` DESC),
  KEY `idx_ai_query_audit_created` (`created_at` DESC),
  CONSTRAINT `fk_ai_query_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_ai_query_audit_status` CHECK ((`execution_status` in (_utf8mb4'SUCCESS',_utf8mb4'VALIDATION_REJECTED',_utf8mb4'GEMINI_UNAVAILABLE',_utf8mb4'EXECUTION_FAILED',_utf8mb4'SYSTEM_ERROR')))
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_query_audit_logs`
--

LOCK TABLES `ai_query_audit_logs` WRITE;
/*!40000 ALTER TABLE `ai_query_audit_logs` DISABLE KEYS */;
INSERT INTO `ai_query_audit_logs` VALUES (1,1,'How many patients are in the database?',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-29 15:18:31.642'),(2,1,'Step 7A controlled verification: count patients.','SELECT COUNT(*) AS patient_count FROM patients','aggregation','SUCCESS',1,16,'2026-09-29 15:18:54.549'),(3,1,'Step 7A controlled verification: unsafe SQL must be rejected.','DROP TABLE patients','other','VALIDATION_REJECTED',NULL,NULL,'2026-09-29 15:18:54.553'),(4,1,'How many patients are in the database?',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-29 15:29:39.810'),(5,1,'How many patients are in the database?',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-29 16:12:10.523'),(6,1,'How many patients are in the database?',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-29 16:40:49.699'),(7,1,'How many patients are in the database?','SELECT COUNT(*) AS total_patients FROM patients','SELECT','SUCCESS',1,3,'2026-09-29 17:17:44.963'),(8,1,'How many patients are in the database?','SELECT COUNT(*) AS total_patients FROM patients','SELECT','SUCCESS',1,6,'2026-09-30 05:59:27.914'),(9,1,'How many patients were admitted with a diagnosis containing diabetes?','SELECT COUNT(DISTINCT patient_id) AS patient_count FROM admissions WHERE diagnosis LIKE \'%diabetes%\'','SELECT','SUCCESS',1,6,'2026-09-30 06:00:02.532'),(10,1,'Show the top 5 departments by number of admissions',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-30 06:00:26.626'),(11,1,'How many patients are in the database?','SELECT COUNT(*) AS total_patients FROM patients','SELECT','SUCCESS',1,4,'2026-09-30 06:05:13.632'),(12,1,'What is the average age of patients?','SELECT AVG(age) AS average_age FROM patients','SELECT','SUCCESS',1,3,'2026-09-30 06:05:29.590'),(13,1,'What is the average age of patients?','SELECT AVG(age) AS average_age FROM patients','SELECT','SUCCESS',1,2,'2026-09-30 06:05:38.289'),(14,1,'What is the average age of patients?','SELECT AVG(age) AS average_age FROM patients','SELECT','SUCCESS',1,1,'2026-09-30 06:05:46.917'),(15,1,'What is the average age of patients?','SELECT AVG(age) AS average_age FROM patients','SELECT','SUCCESS',1,1,'2026-09-30 06:05:56.029'),(16,1,'how many patients were admitted last month?',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-30 06:13:37.270'),(17,1,'how many patuents were admitted in last month?',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-30 06:16:17.140'),(18,1,'how many patients were admitted last week?',NULL,NULL,'GEMINI_UNAVAILABLE',NULL,NULL,'2026-09-30 06:20:10.542'),(19,1,'how many patients were admitted in last month?','SELECT COUNT(DISTINCT patient_id) AS patient_count FROM admissions WHERE admission_date >= DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, \'%Y-%m-01\') AND admission_date < DATE_FORMAT(CURDATE(), \'%Y-%m-01\')','SELECT','SUCCESS',1,8,'2026-09-30 13:44:25.542'),(20,1,'how many patients were admitted in last siz months?','SELECT COUNT(DISTINCT patient_id) AS patient_count FROM admissions WHERE admission_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)','SELECT','SUCCESS',1,3,'2026-09-30 13:47:10.240'),(21,1,'How many patients were admitted with diabetes?','SELECT COUNT(DISTINCT patient_id) AS patient_count FROM admissions WHERE diagnosis LIKE \'%diabetes%\'','SELECT','SUCCESS',1,2,'2026-09-30 13:51:23.733'),(22,1,'drop the patients table from the database',NULL,'','VALIDATION_REJECTED',NULL,NULL,'2026-09-30 14:07:37.616'),(23,1,'How many admissions happened in each department?','SELECT d.department_name, COUNT(a.admission_id) AS admission_count FROM departments d LEFT JOIN admissions a ON d.department_id = a.department_id GROUP BY d.department_id, d.department_name ORDER BY admission_count DESC;','SELECT','VALIDATION_REJECTED',NULL,NULL,'2026-09-30 14:15:09.527'),(24,1,'how many patients were admitted last year','SELECT COUNT(DISTINCT patient_id) AS patient_count FROM admissions WHERE YEAR(admission_date) = YEAR(CURDATE()) - 1','SELECT','SUCCESS',1,5,'2026-10-01 09:47:57.717'),(25,1,'how many patients with cancer admitted last month?','SELECT COUNT(DISTINCT patient_id) AS cancer_patient_count FROM admissions WHERE LOWER(diagnosis) LIKE \'%cancer%\' AND admission_date >= DATE_SUB(DATE_FORMAT(CURRENT_DATE(), \'%Y-%m-01\'), INTERVAL 1 MONTH) AND admission_date < DATE_FORMAT(CURRENT_DATE(), \'%Y-%m-01\')','SELECT','SUCCESS',1,12,'2026-10-08 09:50:56.203'),(26,1,'What is the average age of patients?','SELECT AVG(age) AS average_age FROM patients','SELECT','SUCCESS',1,17,'2026-10-08 09:55:21.368');
/*!40000 ALTER TABLE `ai_query_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `appointment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` int unsigned NOT NULL,
  `doctor_id` int unsigned NOT NULL,
  `appointment_date` datetime NOT NULL,
  `status` varchar(20) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`appointment_id`),
  KEY `fk_appointments_patient` (`patient_id`),
  KEY `fk_appointments_doctor` (`doctor_id`),
  KEY `idx_appointments_date` (`appointment_date`),
  CONSTRAINT `fk_appointments_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_appointments_status` CHECK ((`status` in (_utf8mb4'SCHEDULED',_utf8mb4'COMPLETED',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,1,1,'2025-09-06 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(2,2,2,'2025-09-11 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(3,3,3,'2025-09-16 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(4,4,4,'2025-09-21 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(5,5,5,'2025-09-26 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(6,6,6,'2025-10-01 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(7,7,7,'2025-10-06 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(8,8,8,'2025-10-11 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(9,9,9,'2025-10-16 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(10,10,10,'2025-10-21 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(11,11,1,'2025-10-26 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(12,12,2,'2025-10-31 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(13,13,3,'2025-11-05 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(14,14,4,'2025-11-10 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(15,15,5,'2025-11-15 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(16,16,6,'2025-11-20 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(17,17,7,'2025-11-25 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(18,18,8,'2025-11-30 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(19,19,9,'2025-12-05 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(20,20,10,'2025-12-10 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(21,21,1,'2025-12-15 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(22,22,2,'2025-12-20 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(23,23,3,'2025-12-25 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(24,24,4,'2025-12-30 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(25,25,5,'2026-01-04 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(26,26,6,'2026-01-09 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(27,27,7,'2026-01-14 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(28,28,8,'2026-01-19 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(29,29,9,'2026-01-24 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(30,30,10,'2026-01-29 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(31,31,1,'2026-02-03 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(32,32,2,'2026-02-08 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(33,33,3,'2026-02-13 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(34,34,4,'2026-02-18 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(35,35,5,'2026-02-23 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(36,36,6,'2026-02-28 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(37,37,7,'2026-03-05 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(38,38,8,'2026-03-10 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(39,39,9,'2026-03-15 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(40,40,10,'2026-03-20 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(41,41,1,'2026-03-25 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(42,42,2,'2026-03-30 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(43,43,3,'2026-04-04 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(44,44,4,'2026-04-09 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(45,45,5,'2026-04-14 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(46,46,6,'2026-04-19 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(47,47,7,'2026-04-24 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(48,48,8,'2026-04-29 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(49,49,9,'2026-05-04 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(50,50,10,'2026-05-09 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(51,1,1,'2026-05-14 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(52,2,2,'2026-05-19 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(53,3,3,'2026-05-24 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(54,4,4,'2026-05-29 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33'),(55,5,5,'2026-06-03 09:00:00','SCHEDULED','Routine consultation','2026-09-27 14:34:33'),(56,6,6,'2026-06-08 09:00:00','COMPLETED','Diabetes follow-up','2026-09-27 14:34:33'),(57,7,7,'2026-06-13 09:00:00','CANCELLED','Blood pressure review','2026-09-27 14:34:33'),(58,8,8,'2026-06-18 09:00:00','SCHEDULED','Chest discomfort review','2026-09-27 14:34:33'),(59,9,9,'2026-06-23 09:00:00','COMPLETED','Joint pain assessment','2026-09-27 14:34:33'),(60,10,10,'2026-06-28 09:00:00','CANCELLED','Fever evaluation','2026-09-27 14:34:33');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `log_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `table_name` varchar(64) NOT NULL,
  `operation` varchar(20) NOT NULL,
  `record_id` bigint unsigned NOT NULL,
  `description` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  CONSTRAINT `chk_audit_operation` CHECK ((`operation` in (_utf8mb4'INSERT',_utf8mb4'UPDATE',_utf8mb4'DELETE')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (2,'billing','INSERT',65,'Billing record inserted for patient #1; amount=2,500.00; payment_status=PENDING','2026-09-28 16:58:04'),(3,'billing','INSERT',66,'Billing record inserted for patient #1; amount=2,500.00; payment_status=PENDING','2026-09-28 16:58:28');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing`
--

DROP TABLE IF EXISTS `billing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billing` (
  `bill_id` int unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` int unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_status` varchar(20) NOT NULL,
  `bill_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bill_id`),
  KEY `fk_billing_patient` (`patient_id`),
  KEY `idx_billing_date` (`bill_date`),
  CONSTRAINT `fk_billing_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_billing_amount` CHECK ((`amount` >= 0)),
  CONSTRAINT `chk_billing_status` CHECK ((`payment_status` in (_utf8mb4'PAID',_utf8mb4'PENDING',_utf8mb4'CANCELLED')))
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing`
--

LOCK TABLES `billing` WRITE;
/*!40000 ALTER TABLE `billing` DISABLE KEYS */;
INSERT INTO `billing` VALUES (1,1,1937.00,'PAID','2025-10-14','2026-09-27 14:34:33'),(2,2,2374.00,'PENDING','2025-10-18','2026-09-27 14:34:33'),(3,3,2811.00,'CANCELLED','2025-10-22','2026-09-27 14:34:33'),(4,4,3248.00,'PAID','2025-10-26','2026-09-27 14:34:33'),(5,5,3685.00,'PENDING','2025-10-30','2026-09-27 14:34:33'),(6,6,4122.00,'CANCELLED','2025-11-03','2026-09-27 14:34:33'),(7,7,4559.00,'PAID','2025-11-07','2026-09-27 14:34:33'),(8,8,4996.00,'PENDING','2025-11-11','2026-09-27 14:34:33'),(9,9,5433.00,'CANCELLED','2025-11-15','2026-09-27 14:34:33'),(10,10,5870.00,'PAID','2025-11-19','2026-09-27 14:34:33'),(11,11,6307.00,'PENDING','2025-11-23','2026-09-27 14:34:33'),(12,12,6744.00,'CANCELLED','2025-11-27','2026-09-27 14:34:33'),(13,13,7181.00,'PAID','2025-12-01','2026-09-27 14:34:33'),(14,14,7618.00,'PENDING','2025-12-05','2026-09-27 14:34:33'),(15,15,8055.00,'CANCELLED','2025-12-09','2026-09-27 14:34:33'),(16,16,8492.00,'PAID','2025-12-13','2026-09-27 14:34:33'),(17,17,8929.00,'PENDING','2025-12-17','2026-09-27 14:34:33'),(18,18,9366.00,'CANCELLED','2025-12-21','2026-09-27 14:34:33'),(19,19,9803.00,'PAID','2025-12-25','2026-09-27 14:34:33'),(20,20,10240.00,'PENDING','2025-12-29','2026-09-27 14:34:33'),(21,21,10677.00,'CANCELLED','2026-01-02','2026-09-27 14:34:33'),(22,22,11114.00,'PAID','2026-01-06','2026-09-27 14:34:33'),(23,23,11551.00,'PENDING','2026-01-10','2026-09-27 14:34:33'),(24,24,11988.00,'CANCELLED','2026-01-14','2026-09-27 14:34:33'),(25,25,12425.00,'PAID','2026-01-18','2026-09-27 14:34:33'),(26,26,12862.00,'PENDING','2026-01-22','2026-09-27 14:34:33'),(27,27,13299.00,'CANCELLED','2026-01-26','2026-09-27 14:34:33'),(28,28,13736.00,'PAID','2026-01-30','2026-09-27 14:34:33'),(29,29,14173.00,'PENDING','2026-02-03','2026-09-27 14:34:33'),(30,30,14610.00,'CANCELLED','2026-02-07','2026-09-27 14:34:33'),(31,31,15047.00,'PAID','2026-02-11','2026-09-27 14:34:33'),(32,32,15484.00,'PENDING','2026-02-15','2026-09-27 14:34:33'),(33,33,15921.00,'CANCELLED','2026-02-19','2026-09-27 14:34:33'),(34,34,16358.00,'PAID','2026-02-23','2026-09-27 14:34:33'),(35,35,16795.00,'PENDING','2026-02-27','2026-09-27 14:34:33'),(36,36,17232.00,'CANCELLED','2026-03-03','2026-09-27 14:34:33'),(37,37,17669.00,'PAID','2026-03-07','2026-09-27 14:34:33'),(38,38,18106.00,'PENDING','2026-03-11','2026-09-27 14:34:33'),(39,39,18543.00,'CANCELLED','2026-03-15','2026-09-27 14:34:33'),(40,40,18980.00,'PAID','2026-03-19','2026-09-27 14:34:33'),(41,41,19417.00,'PENDING','2026-03-23','2026-09-27 14:34:33'),(42,42,19854.00,'CANCELLED','2026-03-27','2026-09-27 14:34:33'),(43,43,20291.00,'PAID','2026-03-31','2026-09-27 14:34:33'),(44,44,20728.00,'PENDING','2026-04-04','2026-09-27 14:34:33'),(45,45,21165.00,'CANCELLED','2026-04-08','2026-09-27 14:34:33'),(46,46,21602.00,'PAID','2026-04-12','2026-09-27 14:34:33'),(47,47,22039.00,'PENDING','2026-04-16','2026-09-27 14:34:33'),(48,48,22476.00,'CANCELLED','2026-04-20','2026-09-27 14:34:33'),(49,49,22913.00,'PAID','2026-04-24','2026-09-27 14:34:33'),(50,50,23350.00,'PENDING','2026-04-28','2026-09-27 14:34:33'),(65,1,2500.00,'PENDING','2026-09-28','2026-09-28 16:58:04'),(66,1,2500.00,'PENDING','2026-09-28','2026-09-28 16:58:28');
/*!40000 ALTER TABLE `billing` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_billing_insert` AFTER INSERT ON `billing` FOR EACH ROW BEGIN
  INSERT INTO audit_logs (table_name, operation, record_id, description)
  VALUES (
    'billing',
    'INSERT',
    NEW.bill_id,
    CONCAT('Billing record inserted for patient #', NEW.patient_id,
           '; amount=', FORMAT(NEW.amount, 2),
           '; payment_status=', NEW.payment_status)
  );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `department_statistics`
--

DROP TABLE IF EXISTS `department_statistics`;
/*!50001 DROP VIEW IF EXISTS `department_statistics`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `department_statistics` AS SELECT 
 1 AS `department_id`,
 1 AS `department_name`,
 1 AS `doctor_count`,
 1 AS `admission_count`,
 1 AS `average_patient_billing`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `department_id` int unsigned NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `department_name` (`department_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Cardiology','East Wing, Level 2','2026-09-27 14:34:33'),(2,'Neurology','East Wing, Level 3','2026-09-27 14:34:33'),(3,'Orthopedics','West Wing, Level 1','2026-09-27 14:34:33'),(4,'General Medicine','Central Wing, Level 1','2026-09-27 14:34:33'),(5,'Pediatrics','North Wing, Level 2','2026-09-27 14:34:33');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctors` (
  `doctor_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `specialization` varchar(120) NOT NULL,
  `department_id` int unsigned NOT NULL,
  `email` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_doctors_department` (`department_id`),
  CONSTRAINT `fk_doctors_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` VALUES (1,'Dr. Anika Rao','Interventional Cardiology',1,'anika.rao@hospital.test','2026-09-27 14:34:33'),(2,'Dr. Vikram Sen','Cardiac Electrophysiology',1,'vikram.sen@hospital.test','2026-09-27 14:34:33'),(3,'Dr. Neha Kapoor','Clinical Neurology',2,'neha.kapoor@hospital.test','2026-09-27 14:34:33'),(4,'Dr. Kabir Mehta','Stroke Medicine',2,'kabir.mehta@hospital.test','2026-09-27 14:34:33'),(5,'Dr. Isha Nair','Orthopedic Surgery',3,'isha.nair@hospital.test','2026-09-27 14:34:33'),(6,'Dr. Arjun Das','Sports Medicine',3,'arjun.das@hospital.test','2026-09-27 14:34:33'),(7,'Dr. Sara Khan','Internal Medicine',4,'sara.khan@hospital.test','2026-09-27 14:34:33'),(8,'Dr. Dev Patel','Pulmonology',4,'dev.patel@hospital.test','2026-09-27 14:34:33'),(9,'Dr. Pooja Iyer','Pediatric Medicine',5,'pooja.iyer@hospital.test','2026-09-27 14:34:33'),(10,'Dr. Rohan Bose','Pediatric Infectious Disease',5,'rohan.bose@hospital.test','2026-09-27 14:34:33');
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lab_reports`
--

DROP TABLE IF EXISTS `lab_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_reports` (
  `report_id` int unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` int unsigned NOT NULL,
  `test_name` varchar(120) NOT NULL,
  `result` varchar(255) NOT NULL,
  `report_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `fk_lab_reports_patient` (`patient_id`),
  CONSTRAINT `fk_lab_reports_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_reports`
--

LOCK TABLES `lab_reports` WRITE;
/*!40000 ALTER TABLE `lab_reports` DISABLE KEYS */;
INSERT INTO `lab_reports` VALUES (1,1,'HbA1c','7.2% — elevated','2025-10-05','2026-09-27 14:34:33'),(2,2,'Complete Blood Count','Within reference range','2025-10-09','2026-09-27 14:34:33'),(3,3,'Lipid Profile','LDL borderline high','2025-10-13','2026-09-27 14:34:33'),(4,4,'Thyroid Function Test','Within reference range','2025-10-17','2026-09-27 14:34:33'),(5,5,'Chest X-ray','No acute infiltrates','2025-10-21','2026-09-27 14:34:33'),(6,6,'HbA1c','7.2% — elevated','2025-10-25','2026-09-27 14:34:33'),(7,7,'Complete Blood Count','Within reference range','2025-10-29','2026-09-27 14:34:33'),(8,8,'Lipid Profile','LDL borderline high','2025-11-02','2026-09-27 14:34:33'),(9,9,'Thyroid Function Test','Within reference range','2025-11-06','2026-09-27 14:34:33'),(10,10,'Chest X-ray','No acute infiltrates','2025-11-10','2026-09-27 14:34:33'),(11,11,'HbA1c','7.2% — elevated','2025-11-14','2026-09-27 14:34:33'),(12,12,'Complete Blood Count','Within reference range','2025-11-18','2026-09-27 14:34:33'),(13,13,'Lipid Profile','LDL borderline high','2025-11-22','2026-09-27 14:34:33'),(14,14,'Thyroid Function Test','Within reference range','2025-11-26','2026-09-27 14:34:33'),(15,15,'Chest X-ray','No acute infiltrates','2025-11-30','2026-09-27 14:34:33'),(16,16,'HbA1c','7.2% — elevated','2025-12-04','2026-09-27 14:34:33'),(17,17,'Complete Blood Count','Within reference range','2025-12-08','2026-09-27 14:34:33'),(18,18,'Lipid Profile','LDL borderline high','2025-12-12','2026-09-27 14:34:33'),(19,19,'Thyroid Function Test','Within reference range','2025-12-16','2026-09-27 14:34:33'),(20,20,'Chest X-ray','No acute infiltrates','2025-12-20','2026-09-27 14:34:33'),(21,21,'HbA1c','7.2% — elevated','2025-12-24','2026-09-27 14:34:33'),(22,22,'Complete Blood Count','Within reference range','2025-12-28','2026-09-27 14:34:33'),(23,23,'Lipid Profile','LDL borderline high','2026-01-01','2026-09-27 14:34:33'),(24,24,'Thyroid Function Test','Within reference range','2026-01-05','2026-09-27 14:34:33'),(25,25,'Chest X-ray','No acute infiltrates','2026-01-09','2026-09-27 14:34:33'),(26,26,'HbA1c','7.2% — elevated','2026-01-13','2026-09-27 14:34:33'),(27,27,'Complete Blood Count','Within reference range','2026-01-17','2026-09-27 14:34:33'),(28,28,'Lipid Profile','LDL borderline high','2026-01-21','2026-09-27 14:34:33'),(29,29,'Thyroid Function Test','Within reference range','2026-01-25','2026-09-27 14:34:33'),(30,30,'Chest X-ray','No acute infiltrates','2026-01-29','2026-09-27 14:34:33'),(31,31,'HbA1c','7.2% — elevated','2026-02-02','2026-09-27 14:34:33'),(32,32,'Complete Blood Count','Within reference range','2026-02-06','2026-09-27 14:34:33'),(33,33,'Lipid Profile','LDL borderline high','2026-02-10','2026-09-27 14:34:33'),(34,34,'Thyroid Function Test','Within reference range','2026-02-14','2026-09-27 14:34:33'),(35,35,'Chest X-ray','No acute infiltrates','2026-02-18','2026-09-27 14:34:33'),(36,36,'HbA1c','7.2% — elevated','2026-02-22','2026-09-27 14:34:33'),(37,37,'Complete Blood Count','Within reference range','2026-02-26','2026-09-27 14:34:33'),(38,38,'Lipid Profile','LDL borderline high','2026-03-02','2026-09-27 14:34:33'),(39,39,'Thyroid Function Test','Within reference range','2026-03-06','2026-09-27 14:34:33'),(40,40,'Chest X-ray','No acute infiltrates','2026-03-10','2026-09-27 14:34:33'),(41,41,'HbA1c','7.2% — elevated','2026-03-14','2026-09-27 14:34:33'),(42,42,'Complete Blood Count','Within reference range','2026-03-18','2026-09-27 14:34:33'),(43,43,'Lipid Profile','LDL borderline high','2026-03-22','2026-09-27 14:34:33'),(44,44,'Thyroid Function Test','Within reference range','2026-03-26','2026-09-27 14:34:33'),(45,45,'Chest X-ray','No acute infiltrates','2026-03-30','2026-09-27 14:34:33'),(46,46,'HbA1c','7.2% — elevated','2026-04-03','2026-09-27 14:34:33'),(47,47,'Complete Blood Count','Within reference range','2026-04-07','2026-09-27 14:34:33'),(48,48,'Lipid Profile','LDL borderline high','2026-04-11','2026-09-27 14:34:33'),(49,49,'Thyroid Function Test','Within reference range','2026-04-15','2026-09-27 14:34:33'),(50,50,'Chest X-ray','No acute infiltrates','2026-04-19','2026-09-27 14:34:33');
/*!40000 ALTER TABLE `lab_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `patient_summary`
--

DROP TABLE IF EXISTS `patient_summary`;
/*!50001 DROP VIEW IF EXISTS `patient_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `patient_summary` AS SELECT 
 1 AS `patient_id`,
 1 AS `patient_name`,
 1 AS `age`,
 1 AS `gender`,
 1 AS `blood_group`,
 1 AS `appointment_count`,
 1 AS `admission_count`,
 1 AS `total_billing_amount`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `patient_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `age` tinyint unsigned NOT NULL,
  `gender` varchar(12) NOT NULL,
  `blood_group` varchar(3) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `city` varchar(80) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_id`),
  UNIQUE KEY `phone` (`phone`),
  CONSTRAINT `chk_patients_age` CHECK ((`age` between 0 and 120)),
  CONSTRAINT `chk_patients_blood_group` CHECK ((`blood_group` in (_utf8mb4'A+',_utf8mb4'A-',_utf8mb4'B+',_utf8mb4'B-',_utf8mb4'AB+',_utf8mb4'AB-',_utf8mb4'O+',_utf8mb4'O-'))),
  CONSTRAINT `chk_patients_gender` CHECK ((`gender` in (_utf8mb4'MALE',_utf8mb4'FEMALE',_utf8mb4'OTHER')))
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,'Aditi Sharma',34,'FEMALE','A+','9000000001','Bengaluru','2026-09-27 14:34:33'),(2,'Rohan Verma',52,'MALE','O+','9000000002','Pune','2026-09-27 14:34:33'),(3,'Meera Iyer',29,'FEMALE','B+','9000000003','Chennai','2026-09-27 14:34:33'),(4,'Karan Malhotra',46,'MALE','AB+','9000000004','Mumbai','2026-09-27 14:34:33'),(5,'Sneha Reddy',41,'FEMALE','O-','9000000005','Hyderabad','2026-09-27 14:34:33'),(6,'Arnav Gupta',63,'MALE','A-','9000000006','Delhi','2026-09-27 14:34:33'),(7,'Kavya Menon',37,'FEMALE','B-','9000000007','Kochi','2026-09-27 14:34:33'),(8,'Ishaan Roy',24,'MALE','O+','9000000008','Kolkata','2026-09-27 14:34:33'),(9,'Nisha Bhat',55,'FEMALE','A+','9000000009','Mysuru','2026-09-27 14:34:33'),(10,'Aditya Joshi',48,'MALE','B+','9000000010','Nagpur','2026-09-27 14:34:33'),(11,'Priya Nair',32,'FEMALE','AB-','9000000011','Kochi','2026-09-27 14:34:33'),(12,'Siddharth Jain',59,'MALE','O-','9000000012','Jaipur','2026-09-27 14:34:33'),(13,'Ananya Das',27,'FEMALE','A+','9000000013','Kolkata','2026-09-27 14:34:33'),(14,'Varun Sethi',44,'MALE','B-','9000000014','Delhi','2026-09-27 14:34:33'),(15,'Lakshmi Rao',68,'FEMALE','O+','9000000015','Bengaluru','2026-09-27 14:34:33'),(16,'Manav Kulkarni',39,'MALE','A-','9000000016','Pune','2026-09-27 14:34:33'),(17,'Divya Pillai',35,'FEMALE','B+','9000000017','Chennai','2026-09-27 14:34:33'),(18,'Rahul Khanna',51,'MALE','AB+','9000000018','Mumbai','2026-09-27 14:34:33'),(19,'Tanya Singh',30,'FEMALE','O-','9000000019','Lucknow','2026-09-27 14:34:33'),(20,'Harsh Vardhan',57,'MALE','A+','9000000020','Patna','2026-09-27 14:34:33'),(21,'Ira Mukherjee',42,'FEMALE','B-','9000000021','Kolkata','2026-09-27 14:34:33'),(22,'Nikhil Arora',36,'MALE','O+','9000000022','Delhi','2026-09-27 14:34:33'),(23,'Sonal Agarwal',49,'FEMALE','A-','9000000023','Jaipur','2026-09-27 14:34:33'),(24,'Yash Chawla',26,'MALE','B+','9000000024','Chandigarh','2026-09-27 14:34:33'),(25,'Bhavna Sood',61,'FEMALE','AB-','9000000025','Shimla','2026-09-27 14:34:33'),(26,'Aman Tripathi',45,'MALE','O-','9000000026','Varanasi','2026-09-27 14:34:33'),(27,'Ritu Bansal',38,'FEMALE','A+','9000000027','Indore','2026-09-27 14:34:33'),(28,'Mohit Saxena',54,'MALE','B-','9000000028','Kanpur','2026-09-27 14:34:33'),(29,'Geeta Krishnan',47,'FEMALE','O+','9000000029','Chennai','2026-09-27 14:34:33'),(30,'Pranav Mishra',33,'MALE','A-','9000000030','Bhopal','2026-09-27 14:34:33'),(31,'Sana Qureshi',40,'FEMALE','B+','9000000031','Hyderabad','2026-09-27 14:34:33'),(32,'Arvind Kumar',65,'MALE','AB+','9000000032','Delhi','2026-09-27 14:34:33'),(33,'Leela Thomas',28,'FEMALE','O-','9000000033','Kochi','2026-09-27 14:34:33'),(34,'Suresh Naidu',58,'MALE','A+','9000000034','Visakhapatnam','2026-09-27 14:34:33'),(35,'Maya Chatterjee',43,'FEMALE','B-','9000000035','Kolkata','2026-09-27 14:34:33'),(36,'Vivek Shetty',50,'MALE','O+','9000000036','Mangaluru','2026-09-27 14:34:33'),(37,'Reema Dutta',31,'FEMALE','A-','9000000037','Guwahati','2026-09-27 14:34:33'),(38,'Akash Yadav',53,'MALE','B+','9000000038','Noida','2026-09-27 14:34:33'),(39,'Pallavi Desai',36,'FEMALE','AB-','9000000039','Surat','2026-09-27 14:34:33'),(40,'Naveen Babu',60,'MALE','O-','9000000040','Bengaluru','2026-09-27 14:34:33'),(41,'Shalini Paul',29,'FEMALE','A+','9000000041','Pune','2026-09-27 14:34:33'),(42,'Gaurav Tiwari',56,'MALE','B-','9000000042','Prayagraj','2026-09-27 14:34:33'),(43,'Asha Fernandes',45,'FEMALE','O+','9000000043','Goa','2026-09-27 14:34:33'),(44,'Tarun Arvind',34,'MALE','A-','9000000044','Chennai','2026-09-27 14:34:33'),(45,'Nandini Ghosh',52,'FEMALE','B+','9000000045','Kolkata','2026-09-27 14:34:33'),(46,'Hemant Shah',62,'MALE','AB+','9000000046','Ahmedabad','2026-09-27 14:34:33'),(47,'Jyoti Sinha',39,'FEMALE','O-','9000000047','Ranchi','2026-09-27 14:34:33'),(48,'Kunal Bedi',27,'MALE','A+','9000000048','Delhi','2026-09-27 14:34:33'),(49,'Sakshi Arora',48,'FEMALE','B-','9000000049','Gurugram','2026-09-27 14:34:33'),(50,'Ramesh Iyer',66,'MALE','O+','9000000050','Chennai','2026-09-27 14:34:33');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `prescription_id` int unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` int unsigned NOT NULL,
  `doctor_id` int unsigned NOT NULL,
  `medicine` varchar(150) NOT NULL,
  `dosage` varchar(120) NOT NULL,
  `prescription_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`prescription_id`),
  KEY `fk_prescriptions_patient` (`patient_id`),
  KEY `fk_prescriptions_doctor` (`doctor_id`),
  CONSTRAINT `fk_prescriptions_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_prescriptions_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
INSERT INTO `prescriptions` VALUES (1,1,1,'Metformin','500 mg twice daily','2025-10-09','2026-09-27 14:34:33'),(2,2,2,'Amlodipine','5 mg once daily','2025-10-13','2026-09-27 14:34:33'),(3,3,3,'Atorvastatin','20 mg at night','2025-10-17','2026-09-27 14:34:33'),(4,4,4,'Salbutamol inhaler','Two puffs as needed','2025-10-21','2026-09-27 14:34:33'),(5,5,5,'Paracetamol','500 mg every 8 hours','2025-10-25','2026-09-27 14:34:33'),(6,6,6,'Amoxicillin','500 mg three times daily','2025-10-29','2026-09-27 14:34:33'),(7,7,7,'Metformin','500 mg twice daily','2025-11-02','2026-09-27 14:34:33'),(8,8,8,'Amlodipine','5 mg once daily','2025-11-06','2026-09-27 14:34:33'),(9,9,9,'Atorvastatin','20 mg at night','2025-11-10','2026-09-27 14:34:33'),(10,10,10,'Salbutamol inhaler','Two puffs as needed','2025-11-14','2026-09-27 14:34:33'),(11,11,1,'Paracetamol','500 mg every 8 hours','2025-11-18','2026-09-27 14:34:33'),(12,12,2,'Amoxicillin','500 mg three times daily','2025-11-22','2026-09-27 14:34:33'),(13,13,3,'Metformin','500 mg twice daily','2025-11-26','2026-09-27 14:34:33'),(14,14,4,'Amlodipine','5 mg once daily','2025-11-30','2026-09-27 14:34:33'),(15,15,5,'Atorvastatin','20 mg at night','2025-12-04','2026-09-27 14:34:33'),(16,16,6,'Salbutamol inhaler','Two puffs as needed','2025-12-08','2026-09-27 14:34:33'),(17,17,7,'Paracetamol','500 mg every 8 hours','2025-12-12','2026-09-27 14:34:33'),(18,18,8,'Amoxicillin','500 mg three times daily','2025-12-16','2026-09-27 14:34:33'),(19,19,9,'Metformin','500 mg twice daily','2025-12-20','2026-09-27 14:34:33'),(20,20,10,'Amlodipine','5 mg once daily','2025-12-24','2026-09-27 14:34:33'),(21,21,1,'Atorvastatin','20 mg at night','2025-12-28','2026-09-27 14:34:33'),(22,22,2,'Salbutamol inhaler','Two puffs as needed','2026-01-01','2026-09-27 14:34:33'),(23,23,3,'Paracetamol','500 mg every 8 hours','2026-01-05','2026-09-27 14:34:33'),(24,24,4,'Amoxicillin','500 mg three times daily','2026-01-09','2026-09-27 14:34:33'),(25,25,5,'Metformin','500 mg twice daily','2026-01-13','2026-09-27 14:34:33'),(26,26,6,'Amlodipine','5 mg once daily','2026-01-17','2026-09-27 14:34:33'),(27,27,7,'Atorvastatin','20 mg at night','2026-01-21','2026-09-27 14:34:33'),(28,28,8,'Salbutamol inhaler','Two puffs as needed','2026-01-25','2026-09-27 14:34:33'),(29,29,9,'Paracetamol','500 mg every 8 hours','2026-01-29','2026-09-27 14:34:33'),(30,30,10,'Amoxicillin','500 mg three times daily','2026-02-02','2026-09-27 14:34:33'),(31,31,1,'Metformin','500 mg twice daily','2026-02-06','2026-09-27 14:34:33'),(32,32,2,'Amlodipine','5 mg once daily','2026-02-10','2026-09-27 14:34:33'),(33,33,3,'Atorvastatin','20 mg at night','2026-02-14','2026-09-27 14:34:33'),(34,34,4,'Salbutamol inhaler','Two puffs as needed','2026-02-18','2026-09-27 14:34:33'),(35,35,5,'Paracetamol','500 mg every 8 hours','2026-02-22','2026-09-27 14:34:33'),(36,36,6,'Amoxicillin','500 mg three times daily','2026-02-26','2026-09-27 14:34:33'),(37,37,7,'Metformin','500 mg twice daily','2026-03-02','2026-09-27 14:34:33'),(38,38,8,'Amlodipine','5 mg once daily','2026-03-06','2026-09-27 14:34:33'),(39,39,9,'Atorvastatin','20 mg at night','2026-03-10','2026-09-27 14:34:33'),(40,40,10,'Salbutamol inhaler','Two puffs as needed','2026-03-14','2026-09-27 14:34:33'),(41,41,1,'Paracetamol','500 mg every 8 hours','2026-03-18','2026-09-27 14:34:33'),(42,42,2,'Amoxicillin','500 mg three times daily','2026-03-22','2026-09-27 14:34:33'),(43,43,3,'Metformin','500 mg twice daily','2026-03-26','2026-09-27 14:34:33'),(44,44,4,'Amlodipine','5 mg once daily','2026-03-30','2026-09-27 14:34:33'),(45,45,5,'Atorvastatin','20 mg at night','2026-04-03','2026-09-27 14:34:33'),(46,46,6,'Salbutamol inhaler','Two puffs as needed','2026-04-07','2026-09-27 14:34:33'),(47,47,7,'Paracetamol','500 mg every 8 hours','2026-04-11','2026-09-27 14:34:33'),(48,48,8,'Amoxicillin','500 mg three times daily','2026-04-15','2026-09-27 14:34:33'),(49,49,9,'Metformin','500 mg twice daily','2026-04-19','2026-09-27 14:34:33'),(50,50,10,'Amlodipine','5 mg once daily','2026-04-23','2026-09-27 14:34:33');
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `chk_users_role` CHECK ((`role` in (_utf8mb4'ADMIN',_utf8mb4'DOCTOR',_utf8mb4'STAFF')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Aarav Mehta','admin@hospital.test','$2b$10$20CqqDCCMThJ2OmVij9Cne5zx1mySkGRl//8ZGZUbRwyyurWe40TC','ADMIN','2026-09-27 14:34:33'),(2,'Dr. Mira Shah','doctor@hospital.test','$2b$10$20CqqDCCMThJ2OmVij9Cne5zx1mySkGRl//8ZGZUbRwyyurWe40TC','DOCTOR','2026-09-27 14:34:33'),(3,'Riya Kapoor','staff@hospital.test','$2b$10$20CqqDCCMThJ2OmVij9Cne5zx1mySkGRl//8ZGZUbRwyyurWe40TC','STAFF','2026-09-27 14:34:33');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `department_statistics`
--

/*!50001 DROP VIEW IF EXISTS `department_statistics`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `department_statistics` AS select `d`.`department_id` AS `department_id`,`d`.`department_name` AS `department_name`,coalesce(`dc`.`doctor_count`,0) AS `doctor_count`,coalesce(`ac`.`admission_count`,0) AS `admission_count`,coalesce(`ba`.`average_patient_billing`,0.00) AS `average_patient_billing` from (((`departments` `d` left join (select `doctors`.`department_id` AS `department_id`,count(0) AS `doctor_count` from `doctors` group by `doctors`.`department_id`) `dc` on((`dc`.`department_id` = `d`.`department_id`))) left join (select `admissions`.`department_id` AS `department_id`,count(0) AS `admission_count` from `admissions` group by `admissions`.`department_id`) `ac` on((`ac`.`department_id` = `d`.`department_id`))) left join (select `admitted_patients`.`department_id` AS `department_id`,avg(`patient_bills`.`total_billing_amount`) AS `average_patient_billing` from ((select distinct `admissions`.`department_id` AS `department_id`,`admissions`.`patient_id` AS `patient_id` from `admissions`) `admitted_patients` left join (select `billing`.`patient_id` AS `patient_id`,sum(`billing`.`amount`) AS `total_billing_amount` from `billing` group by `billing`.`patient_id`) `patient_bills` on((`patient_bills`.`patient_id` = `admitted_patients`.`patient_id`))) group by `admitted_patients`.`department_id`) `ba` on((`ba`.`department_id` = `d`.`department_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `patient_summary`
--

/*!50001 DROP VIEW IF EXISTS `patient_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `patient_summary` AS select `p`.`patient_id` AS `patient_id`,`p`.`name` AS `patient_name`,`p`.`age` AS `age`,`p`.`gender` AS `gender`,`p`.`blood_group` AS `blood_group`,coalesce(`ap`.`appointment_count`,0) AS `appointment_count`,coalesce(`ad`.`admission_count`,0) AS `admission_count`,coalesce(`bl`.`total_billing_amount`,0.00) AS `total_billing_amount` from (((`patients` `p` left join (select `appointments`.`patient_id` AS `patient_id`,count(0) AS `appointment_count` from `appointments` group by `appointments`.`patient_id`) `ap` on((`ap`.`patient_id` = `p`.`patient_id`))) left join (select `admissions`.`patient_id` AS `patient_id`,count(0) AS `admission_count` from `admissions` group by `admissions`.`patient_id`) `ad` on((`ad`.`patient_id` = `p`.`patient_id`))) left join (select `billing`.`patient_id` AS `patient_id`,sum(`billing`.`amount`) AS `total_billing_amount` from `billing` group by `billing`.`patient_id`) `bl` on((`bl`.`patient_id` = `p`.`patient_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-14 19:13:39
