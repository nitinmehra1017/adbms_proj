USE healthcare_ai_db;

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Aarav Mehta', 'admin@hospital.test', '$2b$10$20CqqDCCMThJ2OmVij9Cne5zx1mySkGRl//8ZGZUbRwyyurWe40TC', 'ADMIN'),
  ('Dr. Mira Shah', 'doctor@hospital.test', '$2b$10$20CqqDCCMThJ2OmVij9Cne5zx1mySkGRl//8ZGZUbRwyyurWe40TC', 'DOCTOR'),
  ('Riya Kapoor', 'staff@hospital.test', '$2b$10$20CqqDCCMThJ2OmVij9Cne5zx1mySkGRl//8ZGZUbRwyyurWe40TC', 'STAFF');

INSERT INTO departments (department_name, location) VALUES
  ('Cardiology', 'East Wing, Level 2'),
  ('Neurology', 'East Wing, Level 3'),
  ('Orthopedics', 'West Wing, Level 1'),
  ('General Medicine', 'Central Wing, Level 1'),
  ('Pediatrics', 'North Wing, Level 2');

INSERT INTO doctors (name, specialization, department_id, email) VALUES
  ('Dr. Anika Rao', 'Interventional Cardiology', 1, 'anika.rao@hospital.test'),
  ('Dr. Vikram Sen', 'Cardiac Electrophysiology', 1, 'vikram.sen@hospital.test'),
  ('Dr. Neha Kapoor', 'Clinical Neurology', 2, 'neha.kapoor@hospital.test'),
  ('Dr. Kabir Mehta', 'Stroke Medicine', 2, 'kabir.mehta@hospital.test'),
  ('Dr. Isha Nair', 'Orthopedic Surgery', 3, 'isha.nair@hospital.test'),
  ('Dr. Arjun Das', 'Sports Medicine', 3, 'arjun.das@hospital.test'),
  ('Dr. Sara Khan', 'Internal Medicine', 4, 'sara.khan@hospital.test'),
  ('Dr. Dev Patel', 'Pulmonology', 4, 'dev.patel@hospital.test'),
  ('Dr. Pooja Iyer', 'Pediatric Medicine', 5, 'pooja.iyer@hospital.test'),
  ('Dr. Rohan Bose', 'Pediatric Infectious Disease', 5, 'rohan.bose@hospital.test');

INSERT INTO patients (name, age, gender, blood_group, phone, city) VALUES
 ('Aditi Sharma',34,'FEMALE','A+','9000000001','Bengaluru'),('Rohan Verma',52,'MALE','O+','9000000002','Pune'),('Meera Iyer',29,'FEMALE','B+','9000000003','Chennai'),('Karan Malhotra',46,'MALE','AB+','9000000004','Mumbai'),('Sneha Reddy',41,'FEMALE','O-','9000000005','Hyderabad'),
 ('Arnav Gupta',63,'MALE','A-','9000000006','Delhi'),('Kavya Menon',37,'FEMALE','B-','9000000007','Kochi'),('Ishaan Roy',24,'MALE','O+','9000000008','Kolkata'),('Nisha Bhat',55,'FEMALE','A+','9000000009','Mysuru'),('Aditya Joshi',48,'MALE','B+','9000000010','Nagpur'),
 ('Priya Nair',32,'FEMALE','AB-','9000000011','Kochi'),('Siddharth Jain',59,'MALE','O-','9000000012','Jaipur'),('Ananya Das',27,'FEMALE','A+','9000000013','Kolkata'),('Varun Sethi',44,'MALE','B-','9000000014','Delhi'),('Lakshmi Rao',68,'FEMALE','O+','9000000015','Bengaluru'),
 ('Manav Kulkarni',39,'MALE','A-','9000000016','Pune'),('Divya Pillai',35,'FEMALE','B+','9000000017','Chennai'),('Rahul Khanna',51,'MALE','AB+','9000000018','Mumbai'),('Tanya Singh',30,'FEMALE','O-','9000000019','Lucknow'),('Harsh Vardhan',57,'MALE','A+','9000000020','Patna'),
 ('Ira Mukherjee',42,'FEMALE','B-','9000000021','Kolkata'),('Nikhil Arora',36,'MALE','O+','9000000022','Delhi'),('Sonal Agarwal',49,'FEMALE','A-','9000000023','Jaipur'),('Yash Chawla',26,'MALE','B+','9000000024','Chandigarh'),('Bhavna Sood',61,'FEMALE','AB-','9000000025','Shimla'),
 ('Aman Tripathi',45,'MALE','O-','9000000026','Varanasi'),('Ritu Bansal',38,'FEMALE','A+','9000000027','Indore'),('Mohit Saxena',54,'MALE','B-','9000000028','Kanpur'),('Geeta Krishnan',47,'FEMALE','O+','9000000029','Chennai'),('Pranav Mishra',33,'MALE','A-','9000000030','Bhopal'),
 ('Sana Qureshi',40,'FEMALE','B+','9000000031','Hyderabad'),('Arvind Kumar',65,'MALE','AB+','9000000032','Delhi'),('Leela Thomas',28,'FEMALE','O-','9000000033','Kochi'),('Suresh Naidu',58,'MALE','A+','9000000034','Visakhapatnam'),('Maya Chatterjee',43,'FEMALE','B-','9000000035','Kolkata'),
 ('Vivek Shetty',50,'MALE','O+','9000000036','Mangaluru'),('Reema Dutta',31,'FEMALE','A-','9000000037','Guwahati'),('Akash Yadav',53,'MALE','B+','9000000038','Noida'),('Pallavi Desai',36,'FEMALE','AB-','9000000039','Surat'),('Naveen Babu',60,'MALE','O-','9000000040','Bengaluru'),
 ('Shalini Paul',29,'FEMALE','A+','9000000041','Pune'),('Gaurav Tiwari',56,'MALE','B-','9000000042','Prayagraj'),('Asha Fernandes',45,'FEMALE','O+','9000000043','Goa'),('Tarun Arvind',34,'MALE','A-','9000000044','Chennai'),('Nandini Ghosh',52,'FEMALE','B+','9000000045','Kolkata'),
 ('Hemant Shah',62,'MALE','AB+','9000000046','Ahmedabad'),('Jyoti Sinha',39,'FEMALE','O-','9000000047','Ranchi'),('Kunal Bedi',27,'MALE','A+','9000000048','Delhi'),('Sakshi Arora',48,'FEMALE','B-','9000000049','Gurugram'),('Ramesh Iyer',66,'MALE','O+','9000000050','Chennai');

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason)
WITH RECURSIVE sequence_numbers AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM sequence_numbers WHERE n < 60)
SELECT MOD(n - 1, 50) + 1, MOD(n - 1, 10) + 1, DATE_ADD('2025-09-01 09:00:00', INTERVAL n * 5 DAY),
  ELT(MOD(n - 1, 3) + 1, 'SCHEDULED', 'COMPLETED', 'CANCELLED'),
  ELT(MOD(n - 1, 6) + 1, 'Routine consultation', 'Diabetes follow-up', 'Blood pressure review', 'Chest discomfort review', 'Joint pain assessment', 'Fever evaluation')
FROM sequence_numbers;

INSERT INTO admissions (patient_id, department_id, admission_date, discharge_date, diagnosis, status)
WITH RECURSIVE sequence_numbers AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM sequence_numbers WHERE n < 50)
SELECT MOD(n - 1, 50) + 1, MOD(n - 1, 5) + 1, DATE_ADD('2025-08-15', INTERVAL n * 6 DAY),
  CASE WHEN MOD(n, 8) = 0 THEN NULL ELSE DATE_ADD(DATE_ADD('2025-08-15', INTERVAL n * 6 DAY), INTERVAL MOD(n, 5) + 2 DAY) END,
  ELT(MOD(n - 1, 6) + 1, 'Diabetes mellitus', 'Hypertension', 'Cardiac arrhythmia', 'Asthma exacerbation', 'Distal radius fracture', 'Community-acquired infection'),
  CASE WHEN MOD(n, 8) = 0 THEN 'ADMITTED' ELSE 'DISCHARGED' END
FROM sequence_numbers;

INSERT INTO lab_reports (patient_id, test_name, result, report_date)
WITH RECURSIVE sequence_numbers AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM sequence_numbers WHERE n < 50)
SELECT n, ELT(MOD(n - 1, 5) + 1, 'HbA1c', 'Complete Blood Count', 'Lipid Profile', 'Thyroid Function Test', 'Chest X-ray'),
  ELT(MOD(n - 1, 5) + 1, '7.2% — elevated', 'Within reference range', 'LDL borderline high', 'Within reference range', 'No acute infiltrates'),
  DATE_ADD('2025-10-01', INTERVAL n * 4 DAY)
FROM sequence_numbers;

INSERT INTO prescriptions (patient_id, doctor_id, medicine, dosage, prescription_date)
WITH RECURSIVE sequence_numbers AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM sequence_numbers WHERE n < 50)
SELECT n, MOD(n - 1, 10) + 1,
  ELT(MOD(n - 1, 6) + 1, 'Metformin', 'Amlodipine', 'Atorvastatin', 'Salbutamol inhaler', 'Paracetamol', 'Amoxicillin'),
  ELT(MOD(n - 1, 6) + 1, '500 mg twice daily', '5 mg once daily', '20 mg at night', 'Two puffs as needed', '500 mg every 8 hours', '500 mg three times daily'),
  DATE_ADD('2025-10-05', INTERVAL n * 4 DAY)
FROM sequence_numbers;

INSERT INTO billing (patient_id, amount, payment_status, bill_date)
WITH RECURSIVE sequence_numbers AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM sequence_numbers WHERE n < 50)
SELECT n, 1500 + (n * 437), ELT(MOD(n - 1, 3) + 1, 'PAID', 'PENDING', 'CANCELLED'), DATE_ADD('2025-10-10', INTERVAL n * 4 DAY)
FROM sequence_numbers;
