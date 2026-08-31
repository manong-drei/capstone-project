-- E-KALUSUGAN demo patient seed — additional batch (records 1251-1750)
-- Shared password for all seeded patients: Patient123!
-- must_change_password = 0 (demo/test accounts)
-- 500 additional patient entries
-- First names, last names, emails, phone numbers, DOBs, PhilHealth IDs,
-- and emergency contact numbers are unique across the existing + new batches.
START TRANSACTION;

-- record 1251: Alexander Roberts
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1251@ekalusugan-demo.test', '09180001251', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alexander', 'Roberts', 'Male', '1972-03-16', '09180001251', 'Poblacion', 'Bago City', 'PH202600000001', 'Emergency Contact 1251', '09170001251', 'pwd', NULL);

-- record 1252: Cory Greene
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1252@ekalusugan-demo.test', '09180001252', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cory', 'Greene', 'Female', '1990-12-01', '09180001252', 'Mailum', 'Bago City', 'PH202600000002', 'Emergency Contact 1252', '09170001252', NULL, NULL);

-- record 1253: Shannon Brown
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1253@ekalusugan-demo.test', '09180001253', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shannon', 'Brown', 'Male', '1941-03-28', '09180001253', 'Ma-ao', 'Bago City', 'PH202600000003', 'Emergency Contact 1253', '09170001253', 'senior', NULL);

-- record 1254: Rhonda Nelson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1254@ekalusugan-demo.test', '09180001254', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Rhonda', 'Nelson', 'Female', '1946-06-05', '09180001254', 'Sampinit', 'Bago City', 'PH202600000004', 'Emergency Contact 1254', '09170001254', 'senior', NULL);

-- record 1255: Brian Gay
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1255@ekalusugan-demo.test', '09180001255', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brian', 'Gay', 'Male', '1949-02-07', '09180001255', 'Calumangan', 'Bago City', 'PH202600000005', 'Emergency Contact 1255', '09170001255', 'senior', NULL);

-- record 1256: Robert Sanders
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1256@ekalusugan-demo.test', '09180001256', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Robert', 'Sanders', 'Female', '1944-03-03', '09180001256', 'Pacol', 'Bago City', 'PH202600000006', 'Emergency Contact 1256', '09170001256', 'senior', NULL);

-- record 1257: Amy Williams
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1257@ekalusugan-demo.test', '09180001257', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Amy', 'Williams', 'Male', '1962-06-10', '09180001257', 'Malingin', 'Bago City', 'PH202600000007', 'Emergency Contact 1257', '09170001257', 'senior', NULL);

-- record 1258: Ruth Douglas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1258@ekalusugan-demo.test', '09180001258', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ruth', 'Douglas', 'Female', '2008-10-29', '09180001258', 'Don Jorge Araneta', 'Bago City', 'PH202600000008', 'Emergency Contact 1258', '09170001258', NULL, NULL);

-- record 1259: Christopher Larson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1259@ekalusugan-demo.test', '09180001259', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Christopher', 'Larson', 'Male', '1983-05-12', '09180001259', 'Napoles', 'Bago City', 'PH202600000009', 'Emergency Contact 1259', '09170001259', NULL, NULL);

-- record 1260: Margaret Wilson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1260@ekalusugan-demo.test', '09180001260', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Margaret', 'Wilson', 'Female', '2010-04-19', '09180001260', 'Busay', 'Bago City', 'PH202600000010', 'Emergency Contact 1260', '09170001260', NULL, NULL);

-- record 1261: Holly Mitchell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1261@ekalusugan-demo.test', '09180001261', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Holly', 'Mitchell', 'Male', '1981-02-20', '09180001261', 'Caridad', 'Bago City', 'PH202600000011', 'Emergency Contact 1261', '09170001261', NULL, NULL);

-- record 1262: Austin Anderson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1262@ekalusugan-demo.test', '09180001262', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Austin', 'Anderson', 'Female', '1966-06-20', '09180001262', 'Balingasag', 'Bago City', 'PH202600000012', 'Emergency Contact 1262', '09170001262', 'senior', NULL);

-- record 1263: Frank Miller
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1263@ekalusugan-demo.test', '09180001263', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Frank', 'Miller', 'Male', '1951-06-26', '09180001263', 'Bagroy', 'Bago City', 'PH202600000013', 'Emergency Contact 1263', '09170001263', 'senior', NULL);

-- record 1264: David Schmidt
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1264@ekalusugan-demo.test', '09180001264', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'David', 'Schmidt', 'Female', '1969-09-26', '09180001264', 'Abuanan', 'Bago City', 'PH202600000014', 'Emergency Contact 1264', '09170001264', NULL, NULL);

-- record 1265: Kristen Hooper
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1265@ekalusugan-demo.test', '09180001265', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kristen', 'Hooper', 'Male', '1972-10-26', '09180001265', 'Ilijan', 'Bago City', 'PH202600000015', 'Emergency Contact 1265', '09170001265', NULL, NULL);

-- record 1266: Cody Harris
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1266@ekalusugan-demo.test', '09180001266', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cody', 'Harris', 'Female', '1952-11-22', '09180001266', 'Taloc', 'Bago City', 'PH202600000016', 'Emergency Contact 1266', '09170001266', 'senior', NULL);

-- record 1267: Madeline Hall
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1267@ekalusugan-demo.test', '09180001267', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Madeline', 'Hall', 'Male', '1945-02-04', '09180001267', 'Lag-asan', 'Bago City', 'PH202600000017', 'Emergency Contact 1267', '09170001267', 'senior', NULL);

-- record 1268: Marie Gordon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1268@ekalusugan-demo.test', '09180001268', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Marie', 'Gordon', 'Female', '1945-03-13', '09180001268', 'Atipuluan', 'Bago City', 'PH202600000018', 'Emergency Contact 1268', '09170001268', 'senior', NULL);

-- record 1269: Phyllis Bridges
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1269@ekalusugan-demo.test', '09180001269', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Phyllis', 'Bridges', 'Male', '1941-08-20', '09180001269', 'Alianza', 'Bago City', 'PH202600000019', 'Emergency Contact 1269', '09170001269', 'senior', NULL);

-- record 1270: Phillip Yang
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1270@ekalusugan-demo.test', '09180001270', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Phillip', 'Yang', 'Female', '1977-08-07', '09180001270', 'Tabunan', 'Bago City', 'PH202600000020', 'Emergency Contact 1270', '09170001270', NULL, NULL);

-- record 1271: Alan Bennett
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1271@ekalusugan-demo.test', '09180001271', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alan', 'Bennett', 'Male', '1989-10-13', '09180001271', 'Binubuhan', 'Bago City', 'PH202600000021', 'Emergency Contact 1271', '09170001271', NULL, NULL);

-- record 1272: Eric Mann
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1272@ekalusugan-demo.test', '09180001272', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Eric', 'Mann', 'Female', '1965-07-14', '09180001272', 'Poblacion', 'Bago City', 'PH202600000022', 'Emergency Contact 1272', '09170001272', 'senior', NULL);

-- record 1273: Cameron Walter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1273@ekalusugan-demo.test', '09180001273', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cameron', 'Walter', 'Male', '1971-12-18', '09180001273', 'Mailum', 'Bago City', 'PH202600000023', 'Emergency Contact 1273', '09170001273', NULL, NULL);

-- record 1274: Jaime Clark
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1274@ekalusugan-demo.test', '09180001274', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jaime', 'Clark', 'Female', '1989-08-08', '09180001274', 'Ma-ao', 'Bago City', 'PH202600000024', 'Emergency Contact 1274', '09170001274', 'pwd', NULL);

-- record 1275: Bobby Mclaughlin
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1275@ekalusugan-demo.test', '09180001275', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bobby', 'Mclaughlin', 'Male', '1966-05-04', '09180001275', 'Sampinit', 'Bago City', 'PH202600000025', 'Emergency Contact 1275', '09170001275', 'senior', NULL);

-- record 1276: Kayla Lane
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1276@ekalusugan-demo.test', '09180001276', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kayla', 'Lane', 'Female', '1990-07-20', '09180001276', 'Calumangan', 'Bago City', 'PH202600000026', 'Emergency Contact 1276', '09170001276', NULL, NULL);

-- record 1277: Meagan Holt
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1277@ekalusugan-demo.test', '09180001277', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Meagan', 'Holt', 'Male', '1944-10-10', '09180001277', 'Pacol', 'Bago City', 'PH202600000027', 'Emergency Contact 1277', '09170001277', 'senior', NULL);

-- record 1278: Jeffery Alexander
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1278@ekalusugan-demo.test', '09180001278', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jeffery', 'Alexander', 'Female', '1948-06-01', '09180001278', 'Malingin', 'Bago City', 'PH202600000028', 'Emergency Contact 1278', '09170001278', 'senior', NULL);

-- record 1279: Nicholas Evans
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1279@ekalusugan-demo.test', '09180001279', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Nicholas', 'Evans', 'Male', '1989-04-25', '09180001279', 'Don Jorge Araneta', 'Bago City', 'PH202600000029', 'Emergency Contact 1279', '09170001279', NULL, NULL);

-- record 1280: Brianna Campbell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1280@ekalusugan-demo.test', '09180001280', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brianna', 'Campbell', 'Female', '1949-01-27', '09180001280', 'Napoles', 'Bago City', 'PH202600000030', 'Emergency Contact 1280', '09170001280', 'senior', NULL);

-- record 1281: Timothy Schneider
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1281@ekalusugan-demo.test', '09180001281', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Timothy', 'Schneider', 'Male', '1973-08-01', '09180001281', 'Busay', 'Bago City', 'PH202600000031', 'Emergency Contact 1281', '09170001281', NULL, NULL);

-- record 1282: Kathleen Collins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1282@ekalusugan-demo.test', '09180001282', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kathleen', 'Collins', 'Female', '2003-10-03', '09180001282', 'Caridad', 'Bago City', 'PH202600000032', 'Emergency Contact 1282', '09170001282', NULL, NULL);

-- record 1283: Jane Morrison
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1283@ekalusugan-demo.test', '09180001283', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jane', 'Morrison', 'Male', '1940-10-16', '09180001283', 'Balingasag', 'Bago City', 'PH202600000033', 'Emergency Contact 1283', '09170001283', 'senior', NULL);

-- record 1284: Justin Fuentes
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1284@ekalusugan-demo.test', '09180001284', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Justin', 'Fuentes', 'Female', '1943-03-06', '09180001284', 'Bagroy', 'Bago City', 'PH202600000034', 'Emergency Contact 1284', '09170001284', 'senior', NULL);

-- record 1285: Kristopher Ferguson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1285@ekalusugan-demo.test', '09180001285', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kristopher', 'Ferguson', 'Male', '1969-04-15', '09180001285', 'Abuanan', 'Bago City', 'PH202600000035', 'Emergency Contact 1285', '09170001285', NULL, NULL);

-- record 1286: Shirley Soto
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1286@ekalusugan-demo.test', '09180001286', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shirley', 'Soto', 'Female', '1954-11-23', '09180001286', 'Ilijan', 'Bago City', 'PH202600000036', 'Emergency Contact 1286', '09170001286', 'senior', NULL);

-- record 1287: Donna Baker
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1287@ekalusugan-demo.test', '09180001287', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Donna', 'Baker', 'Male', '1952-04-22', '09180001287', 'Taloc', 'Bago City', 'PH202600000037', 'Emergency Contact 1287', '09170001287', 'senior', NULL);

-- record 1288: Katie Hahn
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1288@ekalusugan-demo.test', '09180001288', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Katie', 'Hahn', 'Female', '1951-02-28', '09180001288', 'Lag-asan', 'Bago City', 'PH202600000038', 'Emergency Contact 1288', '09170001288', 'senior', NULL);

-- record 1289: Anna Hardin
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1289@ekalusugan-demo.test', '09180001289', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Anna', 'Hardin', 'Male', '1958-11-13', '09180001289', 'Atipuluan', 'Bago City', 'PH202600000039', 'Emergency Contact 1289', '09170001289', 'senior', NULL);

-- record 1290: Kimberly Kim
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1290@ekalusugan-demo.test', '09180001290', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kimberly', 'Kim', 'Female', '1958-06-07', '09180001290', 'Alianza', 'Bago City', 'PH202600000040', 'Emergency Contact 1290', '09170001290', 'senior', NULL);

-- record 1291: Cathy Simpson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1291@ekalusugan-demo.test', '09180001291', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cathy', 'Simpson', 'Male', '1948-09-03', '09180001291', 'Tabunan', 'Bago City', 'PH202600000041', 'Emergency Contact 1291', '09170001291', 'senior', NULL);

-- record 1292: Randy Barron
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1292@ekalusugan-demo.test', '09180001292', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Randy', 'Barron', 'Female', '1970-01-05', '09180001292', 'Binubuhan', 'Bago City', 'PH202600000042', 'Emergency Contact 1292', '09170001292', NULL, NULL);

-- record 1293: Julie Rodriguez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1293@ekalusugan-demo.test', '09180001293', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Julie', 'Rodriguez', 'Male', '1959-05-31', '09180001293', 'Poblacion', 'Bago City', 'PH202600000043', 'Emergency Contact 1293', '09170001293', 'senior', NULL);

-- record 1294: Aaron Alvarado
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1294@ekalusugan-demo.test', '09180001294', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Aaron', 'Alvarado', 'Female', '2004-04-11', '09180001294', 'Mailum', 'Bago City', 'PH202600000044', 'Emergency Contact 1294', '09170001294', NULL, NULL);

-- record 1295: Donald Weber
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1295@ekalusugan-demo.test', '09180001295', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Donald', 'Weber', 'Male', '1948-07-22', '09180001295', 'Ma-ao', 'Bago City', 'PH202600000045', 'Emergency Contact 1295', '09170001295', 'senior', NULL);

-- record 1296: Mike Bradley
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1296@ekalusugan-demo.test', '09180001296', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mike', 'Bradley', 'Female', '1985-09-22', '09180001296', 'Sampinit', 'Bago City', 'PH202600000046', 'Emergency Contact 1296', '09170001296', NULL, NULL);

-- record 1297: Heather Boyer
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1297@ekalusugan-demo.test', '09180001297', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Heather', 'Boyer', 'Male', '1958-10-09', '09180001297', 'Calumangan', 'Bago City', 'PH202600000047', 'Emergency Contact 1297', '09170001297', 'senior', NULL);

-- record 1298: Daniel Cannon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1298@ekalusugan-demo.test', '09180001298', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Daniel', 'Cannon', 'Female', '1953-07-07', '09180001298', 'Pacol', 'Bago City', 'PH202600000048', 'Emergency Contact 1298', '09170001298', 'senior', NULL);

-- record 1299: Chelsea Scott
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1299@ekalusugan-demo.test', '09180001299', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Chelsea', 'Scott', 'Male', '1974-01-22', '09180001299', 'Malingin', 'Bago City', 'PH202600000049', 'Emergency Contact 1299', '09170001299', NULL, NULL);

-- record 1300: Deborah Elliott
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1300@ekalusugan-demo.test', '09180001300', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Deborah', 'Elliott', 'Female', '1959-11-21', '09180001300', 'Don Jorge Araneta', 'Bago City', 'PH202600000050', 'Emergency Contact 1300', '09170001300', 'senior', NULL);

-- record 1301: Gregory Moore
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1301@ekalusugan-demo.test', '09180001301', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gregory', 'Moore', 'Male', '1947-11-13', '09180001301', 'Napoles', 'Bago City', 'PH202600000051', 'Emergency Contact 1301', '09170001301', 'senior', NULL);

-- record 1302: Kelly Foley
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1302@ekalusugan-demo.test', '09180001302', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kelly', 'Foley', 'Female', '2007-03-15', '09180001302', 'Busay', 'Bago City', 'PH202600000052', 'Emergency Contact 1302', '09170001302', 'pregnant', '2027-09-19 23:59:59');

-- record 1303: Terri Dickson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1303@ekalusugan-demo.test', '09180001303', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Terri', 'Dickson', 'Male', '1975-07-14', '09180001303', 'Caridad', 'Bago City', 'PH202600000053', 'Emergency Contact 1303', '09170001303', NULL, NULL);

-- record 1304: Tammy Spears
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1304@ekalusugan-demo.test', '09180001304', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tammy', 'Spears', 'Female', '1975-12-14', '09180001304', 'Balingasag', 'Bago City', 'PH202600000054', 'Emergency Contact 1304', '09170001304', NULL, NULL);

-- record 1305: Jay Short
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1305@ekalusugan-demo.test', '09180001305', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jay', 'Short', 'Male', '1940-09-25', '09180001305', 'Bagroy', 'Bago City', 'PH202600000055', 'Emergency Contact 1305', '09170001305', 'senior', NULL);

-- record 1306: Lindsey Snyder
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1306@ekalusugan-demo.test', '09180001306', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lindsey', 'Snyder', 'Female', '1941-06-01', '09180001306', 'Abuanan', 'Bago City', 'PH202600000056', 'Emergency Contact 1306', '09170001306', 'senior', NULL);

-- record 1307: Bill Parker
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1307@ekalusugan-demo.test', '09180001307', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bill', 'Parker', 'Male', '1954-03-05', '09180001307', 'Ilijan', 'Bago City', 'PH202600000057', 'Emergency Contact 1307', '09170001307', 'senior', NULL);

-- record 1308: James Richardson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1308@ekalusugan-demo.test', '09180001308', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'James', 'Richardson', 'Female', '1967-05-06', '09180001308', 'Taloc', 'Bago City', 'PH202600000058', 'Emergency Contact 1308', '09170001308', NULL, NULL);

-- record 1309: Joan Lutz
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1309@ekalusugan-demo.test', '09180001309', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Joan', 'Lutz', 'Male', '1956-11-18', '09180001309', 'Lag-asan', 'Bago City', 'PH202600000059', 'Emergency Contact 1309', '09170001309', 'senior', NULL);

-- record 1310: Debra Cooper
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1310@ekalusugan-demo.test', '09180001310', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Debra', 'Cooper', 'Female', '2002-08-15', '09180001310', 'Atipuluan', 'Bago City', 'PH202600000060', 'Emergency Contact 1310', '09170001310', NULL, NULL);

-- record 1311: Allison Lopez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1311@ekalusugan-demo.test', '09180001311', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Allison', 'Lopez', 'Male', '1990-11-28', '09180001311', 'Alianza', 'Bago City', 'PH202600000061', 'Emergency Contact 1311', '09170001311', NULL, NULL);

-- record 1312: Luke Rice
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1312@ekalusugan-demo.test', '09180001312', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Luke', 'Rice', 'Female', '1967-03-20', '09180001312', 'Tabunan', 'Bago City', 'PH202600000062', 'Emergency Contact 1312', '09170001312', NULL, NULL);

-- record 1313: Valerie Walker
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1313@ekalusugan-demo.test', '09180001313', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Valerie', 'Walker', 'Male', '1987-08-17', '09180001313', 'Binubuhan', 'Bago City', 'PH202600000063', 'Emergency Contact 1313', '09170001313', NULL, NULL);

-- record 1314: Mary Marshall
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1314@ekalusugan-demo.test', '09180001314', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mary', 'Marshall', 'Female', '1951-05-20', '09180001314', 'Poblacion', 'Bago City', 'PH202600000064', 'Emergency Contact 1314', '09170001314', 'senior', NULL);

-- record 1315: Emily Figueroa
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1315@ekalusugan-demo.test', '09180001315', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Emily', 'Figueroa', 'Male', '1968-09-26', '09180001315', 'Mailum', 'Bago City', 'PH202600000065', 'Emergency Contact 1315', '09170001315', NULL, NULL);

-- record 1316: Shaun Keller
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1316@ekalusugan-demo.test', '09180001316', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shaun', 'Keller', 'Female', '1990-01-06', '09180001316', 'Ma-ao', 'Bago City', 'PH202600000066', 'Emergency Contact 1316', '09170001316', NULL, NULL);

-- record 1317: Craig Tucker
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1317@ekalusugan-demo.test', '09180001317', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Craig', 'Tucker', 'Male', '1943-05-28', '09180001317', 'Sampinit', 'Bago City', 'PH202600000067', 'Emergency Contact 1317', '09170001317', 'senior', NULL);

-- record 1318: Christy Tran
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1318@ekalusugan-demo.test', '09180001318', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Christy', 'Tran', 'Female', '1945-12-13', '09180001318', 'Calumangan', 'Bago City', 'PH202600000068', 'Emergency Contact 1318', '09170001318', 'senior', NULL);

-- record 1319: Kaitlyn Villa
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1319@ekalusugan-demo.test', '09180001319', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kaitlyn', 'Villa', 'Male', '1977-09-13', '09180001319', 'Pacol', 'Bago City', 'PH202600000069', 'Emergency Contact 1319', '09170001319', NULL, NULL);

-- record 1320: Tina Lowe
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1320@ekalusugan-demo.test', '09180001320', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tina', 'Lowe', 'Female', '1957-04-17', '09180001320', 'Malingin', 'Bago City', 'PH202600000070', 'Emergency Contact 1320', '09170001320', 'senior', NULL);

-- record 1321: Dylan Green
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1321@ekalusugan-demo.test', '09180001321', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dylan', 'Green', 'Male', '1943-11-05', '09180001321', 'Don Jorge Araneta', 'Bago City', 'PH202600000071', 'Emergency Contact 1321', '09170001321', 'senior', NULL);

-- record 1322: Rita Jenkins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1322@ekalusugan-demo.test', '09180001322', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Rita', 'Jenkins', 'Female', '1989-10-18', '09180001322', 'Napoles', 'Bago City', 'PH202600000072', 'Emergency Contact 1322', '09170001322', NULL, NULL);

-- record 1323: Albert Johnson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1323@ekalusugan-demo.test', '09180001323', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Albert', 'Johnson', 'Male', '1973-12-29', '09180001323', 'Busay', 'Bago City', 'PH202600000073', 'Emergency Contact 1323', '09170001323', NULL, NULL);

-- record 1324: Theresa Smith
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1324@ekalusugan-demo.test', '09180001324', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Theresa', 'Smith', 'Female', '1995-11-15', '09180001324', 'Caridad', 'Bago City', 'PH202600000074', 'Emergency Contact 1324', '09170001324', NULL, NULL);

-- record 1325: Tyler Wright
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1325@ekalusugan-demo.test', '09180001325', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tyler', 'Wright', 'Male', '1987-03-10', '09180001325', 'Balingasag', 'Bago City', 'PH202600000075', 'Emergency Contact 1325', '09170001325', NULL, NULL);

-- record 1326: Beth Berry
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1326@ekalusugan-demo.test', '09180001326', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Beth', 'Berry', 'Female', '1970-07-31', '09180001326', 'Bagroy', 'Bago City', 'PH202600000076', 'Emergency Contact 1326', '09170001326', NULL, NULL);

-- record 1327: Melody Jensen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1327@ekalusugan-demo.test', '09180001327', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Melody', 'Jensen', 'Male', '2010-03-30', '09180001327', 'Abuanan', 'Bago City', 'PH202600000077', 'Emergency Contact 1327', '09170001327', NULL, NULL);

-- record 1328: Briana Stone
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1328@ekalusugan-demo.test', '09180001328', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Briana', 'Stone', 'Female', '1984-12-23', '09180001328', 'Ilijan', 'Bago City', 'PH202600000078', 'Emergency Contact 1328', '09170001328', NULL, NULL);

-- record 1329: Jill Martin
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1329@ekalusugan-demo.test', '09180001329', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jill', 'Martin', 'Male', '1968-05-20', '09180001329', 'Taloc', 'Bago City', 'PH202600000079', 'Emergency Contact 1329', '09170001329', NULL, NULL);

-- record 1330: Bailey Good
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1330@ekalusugan-demo.test', '09180001330', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bailey', 'Good', 'Female', '2008-09-29', '09180001330', 'Lag-asan', 'Bago City', 'PH202600000080', 'Emergency Contact 1330', '09170001330', NULL, NULL);

-- record 1331: Kim Nichols
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1331@ekalusugan-demo.test', '09180001331', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kim', 'Nichols', 'Male', '1946-06-16', '09180001331', 'Atipuluan', 'Bago City', 'PH202600000081', 'Emergency Contact 1331', '09170001331', 'senior', NULL);

-- record 1332: Ashley Jacobson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1332@ekalusugan-demo.test', '09180001332', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ashley', 'Jacobson', 'Female', '1959-12-15', '09180001332', 'Alianza', 'Bago City', 'PH202600000082', 'Emergency Contact 1332', '09170001332', 'senior', NULL);

-- record 1333: Jacob Cobb
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1333@ekalusugan-demo.test', '09180001333', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jacob', 'Cobb', 'Male', '1974-05-27', '09180001333', 'Tabunan', 'Bago City', 'PH202600000083', 'Emergency Contact 1333', '09170001333', NULL, NULL);

-- record 1334: Amanda Hanson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1334@ekalusugan-demo.test', '09180001334', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Amanda', 'Hanson', 'Female', '1987-10-10', '09180001334', 'Binubuhan', 'Bago City', 'PH202600000084', 'Emergency Contact 1334', '09170001334', NULL, NULL);

-- record 1335: Ryan Lewis
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1335@ekalusugan-demo.test', '09180001335', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ryan', 'Lewis', 'Male', '1970-02-28', '09180001335', 'Poblacion', 'Bago City', 'PH202600000085', 'Emergency Contact 1335', '09170001335', NULL, NULL);

-- record 1336: Nichole Bell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1336@ekalusugan-demo.test', '09180001336', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Nichole', 'Bell', 'Female', '1956-02-02', '09180001336', 'Mailum', 'Bago City', 'PH202600000086', 'Emergency Contact 1336', '09170001336', 'senior', NULL);

-- record 1337: Dana Davies
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1337@ekalusugan-demo.test', '09180001337', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dana', 'Davies', 'Male', '1942-06-11', '09180001337', 'Ma-ao', 'Bago City', 'PH202600000087', 'Emergency Contact 1337', '09170001337', 'senior', NULL);

-- record 1338: Caitlin Bates
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1338@ekalusugan-demo.test', '09180001338', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Caitlin', 'Bates', 'Female', '1959-04-09', '09180001338', 'Sampinit', 'Bago City', 'PH202600000088', 'Emergency Contact 1338', '09170001338', 'senior', NULL);

-- record 1339: Michele Hays
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1339@ekalusugan-demo.test', '09180001339', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Michele', 'Hays', 'Male', '1952-04-12', '09180001339', 'Calumangan', 'Bago City', 'PH202600000089', 'Emergency Contact 1339', '09170001339', 'senior', NULL);

-- record 1340: Derek Stewart
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1340@ekalusugan-demo.test', '09180001340', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Derek', 'Stewart', 'Female', '1959-10-29', '09180001340', 'Pacol', 'Bago City', 'PH202600000090', 'Emergency Contact 1340', '09170001340', 'senior', NULL);

-- record 1341: Peter Knight
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1341@ekalusugan-demo.test', '09180001341', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Peter', 'Knight', 'Male', '1993-10-08', '09180001341', 'Malingin', 'Bago City', 'PH202600000091', 'Emergency Contact 1341', '09170001341', NULL, NULL);

-- record 1342: Suzanne Christian
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1342@ekalusugan-demo.test', '09180001342', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Suzanne', 'Christian', 'Female', '1978-05-17', '09180001342', 'Don Jorge Araneta', 'Bago City', 'PH202600000092', 'Emergency Contact 1342', '09170001342', NULL, NULL);

-- record 1343: Sean Cole
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1343@ekalusugan-demo.test', '09180001343', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sean', 'Cole', 'Male', '1942-10-13', '09180001343', 'Napoles', 'Bago City', 'PH202600000093', 'Emergency Contact 1343', '09170001343', 'senior', NULL);

-- record 1344: Arthur Nguyen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1344@ekalusugan-demo.test', '09180001344', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Arthur', 'Nguyen', 'Female', '1983-12-07', '09180001344', 'Busay', 'Bago City', 'PH202600000094', 'Emergency Contact 1344', '09170001344', NULL, NULL);

-- record 1345: Alexandra Vasquez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1345@ekalusugan-demo.test', '09180001345', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alexandra', 'Vasquez', 'Male', '1948-06-16', '09180001345', 'Caridad', 'Bago City', 'PH202600000095', 'Emergency Contact 1345', '09170001345', 'senior', NULL);

-- record 1346: Darrell Hester
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1346@ekalusugan-demo.test', '09180001346', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Darrell', 'Hester', 'Female', '2009-06-29', '09180001346', 'Balingasag', 'Bago City', 'PH202600000096', 'Emergency Contact 1346', '09170001346', NULL, NULL);

-- record 1347: Andre Barnes
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1347@ekalusugan-demo.test', '09180001347', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Andre', 'Barnes', 'Male', '1958-08-22', '09180001347', 'Bagroy', 'Bago City', 'PH202600000097', 'Emergency Contact 1347', '09170001347', 'senior', NULL);

-- record 1348: Jerry Wood
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1348@ekalusugan-demo.test', '09180001348', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jerry', 'Wood', 'Female', '2006-05-21', '09180001348', 'Abuanan', 'Bago City', 'PH202600000098', 'Emergency Contact 1348', '09170001348', NULL, NULL);

-- record 1349: Sherry Davis
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1349@ekalusugan-demo.test', '09180001349', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sherry', 'Davis', 'Male', '2008-04-05', '09180001349', 'Ilijan', 'Bago City', 'PH202600000099', 'Emergency Contact 1349', '09170001349', NULL, NULL);

-- record 1350: Abigail Warren
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1350@ekalusugan-demo.test', '09180001350', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Abigail', 'Warren', 'Female', '2005-09-27', '09180001350', 'Taloc', 'Bago City', 'PH202600000100', 'Emergency Contact 1350', '09170001350', NULL, NULL);

-- record 1351: Ethan Sparks
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1351@ekalusugan-demo.test', '09180001351', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ethan', 'Sparks', 'Male', '1993-08-23', '09180001351', 'Lag-asan', 'Bago City', 'PH202600000101', 'Emergency Contact 1351', '09170001351', NULL, NULL);

-- record 1352: Lisa Phillips
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1352@ekalusugan-demo.test', '09180001352', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lisa', 'Phillips', 'Female', '2000-11-18', '09180001352', 'Atipuluan', 'Bago City', 'PH202600000102', 'Emergency Contact 1352', '09170001352', NULL, NULL);

-- record 1353: Larry Fisher
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1353@ekalusugan-demo.test', '09180001353', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Larry', 'Fisher', 'Male', '2004-04-10', '09180001353', 'Alianza', 'Bago City', 'PH202600000103', 'Emergency Contact 1353', '09170001353', NULL, NULL);

-- record 1354: Roger Ray
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1354@ekalusugan-demo.test', '09180001354', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Roger', 'Ray', 'Female', '1967-05-01', '09180001354', 'Tabunan', 'Bago City', 'PH202600000104', 'Emergency Contact 1354', '09170001354', NULL, NULL);

-- record 1355: Isaiah Mckee
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1355@ekalusugan-demo.test', '09180001355', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Isaiah', 'Mckee', 'Male', '1966-03-08', '09180001355', 'Binubuhan', 'Bago City', 'PH202600000105', 'Emergency Contact 1355', '09170001355', 'senior', NULL);

-- record 1356: Tiffany Wolfe
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1356@ekalusugan-demo.test', '09180001356', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tiffany', 'Wolfe', 'Female', '1965-03-14', '09180001356', 'Poblacion', 'Bago City', 'PH202600000106', 'Emergency Contact 1356', '09170001356', 'senior', NULL);

-- record 1357: Tony Robbins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1357@ekalusugan-demo.test', '09180001357', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tony', 'Robbins', 'Male', '1968-01-01', '09180001357', 'Mailum', 'Bago City', 'PH202600000107', 'Emergency Contact 1357', '09170001357', NULL, NULL);

-- record 1358: Dawn Taylor
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1358@ekalusugan-demo.test', '09180001358', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dawn', 'Taylor', 'Female', '1944-06-27', '09180001358', 'Ma-ao', 'Bago City', 'PH202600000108', 'Emergency Contact 1358', '09170001358', 'senior', NULL);

-- record 1359: Erin Jones
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1359@ekalusugan-demo.test', '09180001359', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Erin', 'Jones', 'Male', '1990-06-04', '09180001359', 'Sampinit', 'Bago City', 'PH202600000109', 'Emergency Contact 1359', '09170001359', NULL, NULL);

-- record 1360: Lauren Castaneda
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1360@ekalusugan-demo.test', '09180001360', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lauren', 'Castaneda', 'Female', '1952-08-04', '09180001360', 'Calumangan', 'Bago City', 'PH202600000110', 'Emergency Contact 1360', '09170001360', 'senior', NULL);

-- record 1361: Philip Baxter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1361@ekalusugan-demo.test', '09180001361', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Philip', 'Baxter', 'Male', '1972-02-07', '09180001361', 'Pacol', 'Bago City', 'PH202600000111', 'Emergency Contact 1361', '09170001361', NULL, NULL);

-- record 1362: Charles Turner
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1362@ekalusugan-demo.test', '09180001362', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Charles', 'Turner', 'Female', '2000-04-06', '09180001362', 'Malingin', 'Bago City', 'PH202600000112', 'Emergency Contact 1362', '09170001362', NULL, NULL);

-- record 1363: Kelsey Robinson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1363@ekalusugan-demo.test', '09180001363', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kelsey', 'Robinson', 'Male', '1942-03-05', '09180001363', 'Don Jorge Araneta', 'Bago City', 'PH202600000113', 'Emergency Contact 1363', '09170001363', 'senior', NULL);

-- record 1364: Bruce Kennedy
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1364@ekalusugan-demo.test', '09180001364', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bruce', 'Kennedy', 'Female', '2009-12-07', '09180001364', 'Napoles', 'Bago City', 'PH202600000114', 'Emergency Contact 1364', '09170001364', NULL, NULL);

-- record 1365: Barry Hines
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1365@ekalusugan-demo.test', '09180001365', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Barry', 'Hines', 'Male', '1965-09-12', '09180001365', 'Busay', 'Bago City', 'PH202600000115', 'Emergency Contact 1365', '09170001365', 'senior', NULL);

-- record 1366: Molly Allen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1366@ekalusugan-demo.test', '09180001366', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Molly', 'Allen', 'Female', '1954-03-06', '09180001366', 'Caridad', 'Bago City', 'PH202600000116', 'Emergency Contact 1366', '09170001366', 'senior', NULL);

-- record 1367: Benjamin Stevens
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1367@ekalusugan-demo.test', '09180001367', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Benjamin', 'Stevens', 'Male', '1991-04-20', '09180001367', 'Balingasag', 'Bago City', 'PH202600000117', 'Emergency Contact 1367', '09170001367', NULL, NULL);

-- record 1368: Mercedes Wong
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1368@ekalusugan-demo.test', '09180001368', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mercedes', 'Wong', 'Female', '2009-09-12', '09180001368', 'Bagroy', 'Bago City', 'PH202600000118', 'Emergency Contact 1368', '09170001368', NULL, NULL);

-- record 1369: Wayne Hunt
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1369@ekalusugan-demo.test', '09180001369', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Wayne', 'Hunt', 'Male', '1978-11-25', '09180001369', 'Abuanan', 'Bago City', 'PH202600000119', 'Emergency Contact 1369', '09170001369', NULL, NULL);

-- record 1370: Jodi Hudson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1370@ekalusugan-demo.test', '09180001370', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jodi', 'Hudson', 'Female', '2003-01-11', '09180001370', 'Ilijan', 'Bago City', 'PH202600000120', 'Emergency Contact 1370', '09170001370', 'pregnant', '2027-04-20 23:59:59');

-- record 1371: Susan Shelton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1371@ekalusugan-demo.test', '09180001371', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Susan', 'Shelton', 'Male', '2010-12-07', '09180001371', 'Taloc', 'Bago City', 'PH202600000121', 'Emergency Contact 1371', '09170001371', NULL, NULL);

-- record 1372: Troy Hopkins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1372@ekalusugan-demo.test', '09180001372', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Troy', 'Hopkins', 'Female', '1940-01-19', '09180001372', 'Lag-asan', 'Bago City', 'PH202600000122', 'Emergency Contact 1372', '09170001372', 'senior', NULL);

-- record 1373: George Bowen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1373@ekalusugan-demo.test', '09180001373', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'George', 'Bowen', 'Male', '1986-07-26', '09180001373', 'Atipuluan', 'Bago City', 'PH202600000123', 'Emergency Contact 1373', '09170001373', NULL, NULL);

-- record 1374: Ricky Whitney
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1374@ekalusugan-demo.test', '09180001374', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ricky', 'Whitney', 'Female', '1961-01-14', '09180001374', 'Alianza', 'Bago City', 'PH202600000124', 'Emergency Contact 1374', '09170001374', 'senior', NULL);

-- record 1375: Travis Howard
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1375@ekalusugan-demo.test', '09180001375', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Travis', 'Howard', 'Male', '1955-06-28', '09180001375', 'Tabunan', 'Bago City', 'PH202600000125', 'Emergency Contact 1375', '09170001375', 'senior', NULL);

-- record 1376: Rodney Moody
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1376@ekalusugan-demo.test', '09180001376', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Rodney', 'Moody', 'Female', '1995-06-29', '09180001376', 'Binubuhan', 'Bago City', 'PH202600000126', 'Emergency Contact 1376', '09170001376', NULL, NULL);

-- record 1377: Shane Buchanan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1377@ekalusugan-demo.test', '09180001377', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shane', 'Buchanan', 'Male', '1942-03-10', '09180001377', 'Poblacion', 'Bago City', 'PH202600000127', 'Emergency Contact 1377', '09170001377', 'senior', NULL);

-- record 1378: Erik Warner
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1378@ekalusugan-demo.test', '09180001378', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Erik', 'Warner', 'Female', '1976-03-15', '09180001378', 'Mailum', 'Bago City', 'PH202600000128', 'Emergency Contact 1378', '09170001378', NULL, NULL);

-- record 1379: Melvin Vance
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1379@ekalusugan-demo.test', '09180001379', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Melvin', 'Vance', 'Male', '1942-02-25', '09180001379', 'Ma-ao', 'Bago City', 'PH202600000129', 'Emergency Contact 1379', '09170001379', 'senior', NULL);

-- record 1380: Candice Terry
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1380@ekalusugan-demo.test', '09180001380', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Candice', 'Terry', 'Female', '1964-04-27', '09180001380', 'Sampinit', 'Bago City', 'PH202600000130', 'Emergency Contact 1380', '09170001380', 'senior', NULL);

-- record 1381: Chad Riley
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1381@ekalusugan-demo.test', '09180001381', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Chad', 'Riley', 'Male', '1977-07-01', '09180001381', 'Calumangan', 'Bago City', 'PH202600000131', 'Emergency Contact 1381', '09170001381', NULL, NULL);

-- record 1382: Jimmy Parsons
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1382@ekalusugan-demo.test', '09180001382', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jimmy', 'Parsons', 'Female', '2008-03-31', '09180001382', 'Pacol', 'Bago City', 'PH202600000132', 'Emergency Contact 1382', '09170001382', NULL, NULL);

-- record 1383: Judy Patrick
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1383@ekalusugan-demo.test', '09180001383', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Judy', 'Patrick', 'Male', '2005-06-26', '09180001383', 'Malingin', 'Bago City', 'PH202600000133', 'Emergency Contact 1383', '09170001383', NULL, NULL);

-- record 1384: Billy Robertson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1384@ekalusugan-demo.test', '09180001384', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Billy', 'Robertson', 'Female', '1971-09-26', '09180001384', 'Don Jorge Araneta', 'Bago City', 'PH202600000134', 'Emergency Contact 1384', '09170001384', NULL, NULL);

-- record 1385: Cassandra Goodwin
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1385@ekalusugan-demo.test', '09180001385', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cassandra', 'Goodwin', 'Male', '2000-11-06', '09180001385', 'Napoles', 'Bago City', 'PH202600000135', 'Emergency Contact 1385', '09170001385', NULL, NULL);

-- record 1386: Virginia Wilcox
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1386@ekalusugan-demo.test', '09180001386', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Virginia', 'Wilcox', 'Female', '1962-10-01', '09180001386', 'Busay', 'Bago City', 'PH202600000136', 'Emergency Contact 1386', '09170001386', 'senior', NULL);

-- record 1387: Robin Miles
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1387@ekalusugan-demo.test', '09180001387', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Robin', 'Miles', 'Male', '1940-02-07', '09180001387', 'Caridad', 'Bago City', 'PH202600000137', 'Emergency Contact 1387', '09170001387', 'senior', NULL);

-- record 1388: Kristin Harper
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1388@ekalusugan-demo.test', '09180001388', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kristin', 'Harper', 'Female', '1959-09-27', '09180001388', 'Balingasag', 'Bago City', 'PH202600000138', 'Emergency Contact 1388', '09170001388', 'senior', NULL);

-- record 1389: Tanya Erickson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1389@ekalusugan-demo.test', '09180001389', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tanya', 'Erickson', 'Male', '1970-05-26', '09180001389', 'Bagroy', 'Bago City', 'PH202600000139', 'Emergency Contact 1389', '09170001389', 'pwd', NULL);

-- record 1390: Savannah Hensley
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1390@ekalusugan-demo.test', '09180001390', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Savannah', 'Hensley', 'Female', '1952-11-25', '09180001390', 'Abuanan', 'Bago City', 'PH202600000140', 'Emergency Contact 1390', '09170001390', 'senior', NULL);

-- record 1391: Dustin Combs
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1391@ekalusugan-demo.test', '09180001391', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dustin', 'Combs', 'Male', '1980-09-24', '09180001391', 'Ilijan', 'Bago City', 'PH202600000141', 'Emergency Contact 1391', '09170001391', NULL, NULL);

-- record 1392: Betty Price
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1392@ekalusugan-demo.test', '09180001392', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Betty', 'Price', 'Female', '1974-06-14', '09180001392', 'Taloc', 'Bago City', 'PH202600000142', 'Emergency Contact 1392', '09170001392', NULL, NULL);

-- record 1393: Jenna Ball
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1393@ekalusugan-demo.test', '09180001393', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jenna', 'Ball', 'Male', '1947-10-07', '09180001393', 'Lag-asan', 'Bago City', 'PH202600000143', 'Emergency Contact 1393', '09170001393', 'senior', NULL);

-- record 1394: Denise Dillon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1394@ekalusugan-demo.test', '09180001394', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Denise', 'Dillon', 'Female', '1973-10-06', '09180001394', 'Atipuluan', 'Bago City', 'PH202600000144', 'Emergency Contact 1394', '09170001394', NULL, NULL);

-- record 1395: Tracey May
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1395@ekalusugan-demo.test', '09180001395', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tracey', 'May', 'Male', '1963-05-14', '09180001395', 'Alianza', 'Bago City', 'PH202600000145', 'Emergency Contact 1395', '09170001395', 'senior', NULL);

-- record 1396: Allen Dixon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1396@ekalusugan-demo.test', '09180001396', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Allen', 'Dixon', 'Female', '1951-12-04', '09180001396', 'Tabunan', 'Bago City', 'PH202600000146', 'Emergency Contact 1396', '09170001396', 'senior', NULL);

-- record 1397: Dorothy Hatfield
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1397@ekalusugan-demo.test', '09180001397', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dorothy', 'Hatfield', 'Male', '1969-01-06', '09180001397', 'Binubuhan', 'Bago City', 'PH202600000147', 'Emergency Contact 1397', '09170001397', NULL, NULL);

-- record 1398: Kristi Lara
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1398@ekalusugan-demo.test', '09180001398', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kristi', 'Lara', 'Female', '1974-03-10', '09180001398', 'Poblacion', 'Bago City', 'PH202600000148', 'Emergency Contact 1398', '09170001398', NULL, NULL);

-- record 1399: Alexis Rogers
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1399@ekalusugan-demo.test', '09180001399', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alexis', 'Rogers', 'Male', '1957-10-28', '09180001399', 'Mailum', 'Bago City', 'PH202600000149', 'Emergency Contact 1399', '09170001399', 'senior', NULL);

-- record 1400: Alison Bowers
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1400@ekalusugan-demo.test', '09180001400', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alison', 'Bowers', 'Female', '2003-06-19', '09180001400', 'Ma-ao', 'Bago City', 'PH202600000150', 'Emergency Contact 1400', '09170001400', NULL, NULL);

-- record 1401: Gary Armstrong
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1401@ekalusugan-demo.test', '09180001401', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gary', 'Armstrong', 'Male', '1994-01-24', '09180001401', 'Sampinit', 'Bago City', 'PH202600000151', 'Emergency Contact 1401', '09170001401', NULL, NULL);

-- record 1402: Brittany Wade
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1402@ekalusugan-demo.test', '09180001402', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brittany', 'Wade', 'Female', '1965-06-17', '09180001402', 'Calumangan', 'Bago City', 'PH202600000152', 'Emergency Contact 1402', '09170001402', 'senior', NULL);

-- record 1403: Adam Garrett
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1403@ekalusugan-demo.test', '09180001403', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Adam', 'Garrett', 'Male', '1979-05-29', '09180001403', 'Pacol', 'Bago City', 'PH202600000153', 'Emergency Contact 1403', '09170001403', NULL, NULL);

-- record 1404: Pamela Lee
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1404@ekalusugan-demo.test', '09180001404', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Pamela', 'Lee', 'Female', '1949-08-21', '09180001404', 'Malingin', 'Bago City', 'PH202600000154', 'Emergency Contact 1404', '09170001404', 'senior', NULL);

-- record 1405: Chris Carlson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1405@ekalusugan-demo.test', '09180001405', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Chris', 'Carlson', 'Male', '1961-02-18', '09180001405', 'Don Jorge Araneta', 'Bago City', 'PH202600000155', 'Emergency Contact 1405', '09170001405', 'senior', NULL);

-- record 1406: Jillian Murray
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1406@ekalusugan-demo.test', '09180001406', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jillian', 'Murray', 'Female', '1947-06-01', '09180001406', 'Napoles', 'Bago City', 'PH202600000156', 'Emergency Contact 1406', '09170001406', 'senior', NULL);

-- record 1407: Jesse Bender
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1407@ekalusugan-demo.test', '09180001407', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jesse', 'Bender', 'Male', '1995-08-21', '09180001407', 'Busay', 'Bago City', 'PH202600000157', 'Emergency Contact 1407', '09170001407', NULL, NULL);

-- record 1408: Cynthia Pierce
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1408@ekalusugan-demo.test', '09180001408', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cynthia', 'Pierce', 'Female', '1970-09-02', '09180001408', 'Caridad', 'Bago City', 'PH202600000158', 'Emergency Contact 1408', '09170001408', NULL, NULL);

-- record 1409: Kara Farmer
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1409@ekalusugan-demo.test', '09180001409', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kara', 'Farmer', 'Male', '1989-10-26', '09180001409', 'Balingasag', 'Bago City', 'PH202600000159', 'Emergency Contact 1409', '09170001409', NULL, NULL);

-- record 1410: Crystal Perez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1410@ekalusugan-demo.test', '09180001410', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Crystal', 'Perez', 'Female', '1940-01-17', '09180001410', 'Bagroy', 'Bago City', 'PH202600000160', 'Emergency Contact 1410', '09170001410', 'senior', NULL);

-- record 1411: Sheri Hunter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1411@ekalusugan-demo.test', '09180001411', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sheri', 'Hunter', 'Male', '1944-04-05', '09180001411', 'Abuanan', 'Bago City', 'PH202600000161', 'Emergency Contact 1411', '09170001411', 'senior', NULL);

-- record 1412: Andrew Morton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1412@ekalusugan-demo.test', '09180001412', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Andrew', 'Morton', 'Female', '1953-10-27', '09180001412', 'Ilijan', 'Bago City', 'PH202600000162', 'Emergency Contact 1412', '09170001412', 'senior', NULL);

-- record 1413: Stacy White
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1413@ekalusugan-demo.test', '09180001413', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Stacy', 'White', 'Male', '1999-02-15', '09180001413', 'Taloc', 'Bago City', 'PH202600000163', 'Emergency Contact 1413', '09170001413', NULL, NULL);

-- record 1414: Colin Meadows
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1414@ekalusugan-demo.test', '09180001414', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Colin', 'Meadows', 'Female', '1960-01-27', '09180001414', 'Lag-asan', 'Bago City', 'PH202600000164', 'Emergency Contact 1414', '09170001414', 'senior', NULL);

-- record 1415: Gabrielle Bailey
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1415@ekalusugan-demo.test', '09180001415', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gabrielle', 'Bailey', 'Male', '1969-08-18', '09180001415', 'Atipuluan', 'Bago City', 'PH202600000165', 'Emergency Contact 1415', '09170001415', NULL, NULL);

-- record 1416: Lori Rodgers
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1416@ekalusugan-demo.test', '09180001416', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lori', 'Rodgers', 'Female', '1945-07-26', '09180001416', 'Alianza', 'Bago City', 'PH202600000166', 'Emergency Contact 1416', '09170001416', 'senior', NULL);

-- record 1417: Tommy Obrien
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1417@ekalusugan-demo.test', '09180001417', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tommy', 'Obrien', 'Male', '1956-04-01', '09180001417', 'Tabunan', 'Bago City', 'PH202600000167', 'Emergency Contact 1417', '09170001417', 'senior', NULL);

-- record 1418: Douglas Edwards
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1418@ekalusugan-demo.test', '09180001418', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Douglas', 'Edwards', 'Female', '1958-09-29', '09180001418', 'Binubuhan', 'Bago City', 'PH202600000168', 'Emergency Contact 1418', '09170001418', 'senior', NULL);

-- record 1419: Isaac Schmitt
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1419@ekalusugan-demo.test', '09180001419', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Isaac', 'Schmitt', 'Male', '1966-09-28', '09180001419', 'Poblacion', 'Bago City', 'PH202600000169', 'Emergency Contact 1419', '09170001419', NULL, NULL);

-- record 1420: Joy Thompson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1420@ekalusugan-demo.test', '09180001420', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Joy', 'Thompson', 'Female', '1952-04-26', '09180001420', 'Mailum', 'Bago City', 'PH202600000170', 'Emergency Contact 1420', '09170001420', 'senior', NULL);

-- record 1421: Manuel Carrillo
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1421@ekalusugan-demo.test', '09180001421', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Manuel', 'Carrillo', 'Male', '1974-03-03', '09180001421', 'Ma-ao', 'Bago City', 'PH202600000171', 'Emergency Contact 1421', '09170001421', NULL, NULL);

-- record 1422: Scott Nunez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1422@ekalusugan-demo.test', '09180001422', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Scott', 'Nunez', 'Female', '1947-02-20', '09180001422', 'Sampinit', 'Bago City', 'PH202600000172', 'Emergency Contact 1422', '09170001422', 'senior', NULL);

-- record 1423: Steve Stout
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1423@ekalusugan-demo.test', '09180001423', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Steve', 'Stout', 'Male', '1959-10-08', '09180001423', 'Calumangan', 'Bago City', 'PH202600000173', 'Emergency Contact 1423', '09170001423', 'senior', NULL);

-- record 1424: Rebecca Cook
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1424@ekalusugan-demo.test', '09180001424', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Rebecca', 'Cook', 'Female', '1969-09-03', '09180001424', 'Pacol', 'Bago City', 'PH202600000174', 'Emergency Contact 1424', '09170001424', NULL, NULL);

-- record 1425: Ernest Chang
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1425@ekalusugan-demo.test', '09180001425', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ernest', 'Chang', 'Male', '1942-09-04', '09180001425', 'Malingin', 'Bago City', 'PH202600000175', 'Emergency Contact 1425', '09170001425', 'senior', NULL);

-- record 1426: Tracy Ortiz
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1426@ekalusugan-demo.test', '09180001426', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tracy', 'Ortiz', 'Female', '1981-02-18', '09180001426', 'Don Jorge Araneta', 'Bago City', 'PH202600000176', 'Emergency Contact 1426', '09170001426', NULL, NULL);

-- record 1427: Shawn Klein
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1427@ekalusugan-demo.test', '09180001427', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shawn', 'Klein', 'Male', '1943-08-22', '09180001427', 'Napoles', 'Bago City', 'PH202600000177', 'Emergency Contact 1427', '09170001427', 'senior', NULL);

-- record 1428: Randall Simmons
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1428@ekalusugan-demo.test', '09180001428', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Randall', 'Simmons', 'Female', '1981-10-26', '09180001428', 'Busay', 'Bago City', 'PH202600000178', 'Emergency Contact 1428', '09170001428', NULL, NULL);

-- record 1429: Desiree Howell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1429@ekalusugan-demo.test', '09180001429', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Desiree', 'Howell', 'Male', '1957-07-06', '09180001429', 'Caridad', 'Bago City', 'PH202600000179', 'Emergency Contact 1429', '09170001429', 'senior', NULL);

-- record 1430: Lonnie Jacobs
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1430@ekalusugan-demo.test', '09180001430', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lonnie', 'Jacobs', 'Female', '1957-11-30', '09180001430', 'Balingasag', 'Bago City', 'PH202600000180', 'Emergency Contact 1430', '09170001430', 'senior', NULL);

-- record 1431: Bradley Burns
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1431@ekalusugan-demo.test', '09180001431', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bradley', 'Burns', 'Male', '1941-02-17', '09180001431', 'Bagroy', 'Bago City', 'PH202600000181', 'Emergency Contact 1431', '09170001431', 'senior', NULL);

-- record 1432: Linda Foster
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1432@ekalusugan-demo.test', '09180001432', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Linda', 'Foster', 'Female', '1998-03-25', '09180001432', 'Abuanan', 'Bago City', 'PH202600000182', 'Emergency Contact 1432', '09170001432', NULL, NULL);

-- record 1433: Lee Young
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1433@ekalusugan-demo.test', '09180001433', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lee', 'Young', 'Male', '2007-02-02', '09180001433', 'Ilijan', 'Bago City', 'PH202600000183', 'Emergency Contact 1433', '09170001433', NULL, NULL);

-- record 1434: Laurie Thomas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1434@ekalusugan-demo.test', '09180001434', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Laurie', 'Thomas', 'Female', '1948-06-09', '09180001434', 'Taloc', 'Bago City', 'PH202600000184', 'Emergency Contact 1434', '09170001434', 'senior', NULL);

-- record 1435: Jeanette Watson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1435@ekalusugan-demo.test', '09180001435', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jeanette', 'Watson', 'Male', '1951-07-23', '09180001435', 'Lag-asan', 'Bago City', 'PH202600000185', 'Emergency Contact 1435', '09170001435', 'senior', NULL);

-- record 1436: Barbara Dunn
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1436@ekalusugan-demo.test', '09180001436', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Barbara', 'Dunn', 'Female', '2007-04-30', '09180001436', 'Atipuluan', 'Bago City', 'PH202600000186', 'Emergency Contact 1436', '09170001436', NULL, NULL);

-- record 1437: Megan Glover
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1437@ekalusugan-demo.test', '09180001437', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Megan', 'Glover', 'Male', '1991-04-06', '09180001437', 'Alianza', 'Bago City', 'PH202600000187', 'Emergency Contact 1437', '09170001437', NULL, NULL);

-- record 1438: Corey Martinez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1438@ekalusugan-demo.test', '09180001438', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Corey', 'Martinez', 'Female', '1999-05-03', '09180001438', 'Tabunan', 'Bago City', 'PH202600000188', 'Emergency Contact 1438', '09170001438', 'pregnant', '2027-09-15 23:59:59');

-- record 1439: Shari Cross
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1439@ekalusugan-demo.test', '09180001439', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shari', 'Cross', 'Male', '1988-03-19', '09180001439', 'Binubuhan', 'Bago City', 'PH202600000189', 'Emergency Contact 1439', '09170001439', NULL, NULL);

-- record 1440: Katherine Gibbs
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1440@ekalusugan-demo.test', '09180001440', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Katherine', 'Gibbs', 'Female', '1997-09-01', '09180001440', 'Poblacion', 'Bago City', 'PH202600000190', 'Emergency Contact 1440', '09170001440', NULL, NULL);

-- record 1441: Keith Conley
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1441@ekalusugan-demo.test', '09180001441', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Keith', 'Conley', 'Male', '1964-11-08', '09180001441', 'Mailum', 'Bago City', 'PH202600000191', 'Emergency Contact 1441', '09170001441', 'senior', NULL);

-- record 1442: Nina Sharp
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1442@ekalusugan-demo.test', '09180001442', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Nina', 'Sharp', 'Female', '1949-07-01', '09180001442', 'Ma-ao', 'Bago City', 'PH202600000192', 'Emergency Contact 1442', '09170001442', 'senior', NULL);

-- record 1443: Logan Ward
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1443@ekalusugan-demo.test', '09180001443', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Logan', 'Ward', 'Male', '1969-04-12', '09180001443', 'Sampinit', 'Bago City', 'PH202600000193', 'Emergency Contact 1443', '09170001443', NULL, NULL);

-- record 1444: Kyle Lucas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1444@ekalusugan-demo.test', '09180001444', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kyle', 'Lucas', 'Female', '2002-06-25', '09180001444', 'Calumangan', 'Bago City', 'PH202600000194', 'Emergency Contact 1444', '09170001444', NULL, NULL);

-- record 1445: Brenda Gardner
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1445@ekalusugan-demo.test', '09180001445', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brenda', 'Gardner', 'Male', '1986-09-15', '09180001445', 'Pacol', 'Bago City', 'PH202600000195', 'Emergency Contact 1445', '09170001445', NULL, NULL);

-- record 1446: Paige Dominguez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1446@ekalusugan-demo.test', '09180001446', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Paige', 'Dominguez', 'Female', '1942-08-26', '09180001446', 'Malingin', 'Bago City', 'PH202600000196', 'Emergency Contact 1446', '09170001446', 'senior', NULL);

-- record 1447: Alfred Cohen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1447@ekalusugan-demo.test', '09180001447', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alfred', 'Cohen', 'Male', '1991-05-13', '09180001447', 'Don Jorge Araneta', 'Bago City', 'PH202600000197', 'Emergency Contact 1447', '09170001447', NULL, NULL);

-- record 1448: Angelica Costa
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1448@ekalusugan-demo.test', '09180001448', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Angelica', 'Costa', 'Female', '2003-09-16', '09180001448', 'Napoles', 'Bago City', 'PH202600000198', 'Emergency Contact 1448', '09170001448', NULL, NULL);

-- record 1449: Danny Sims
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1449@ekalusugan-demo.test', '09180001449', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Danny', 'Sims', 'Male', '2001-06-27', '09180001449', 'Busay', 'Bago City', 'PH202600000199', 'Emergency Contact 1449', '09170001449', NULL, NULL);

-- record 1450: Kathy Craig
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1450@ekalusugan-demo.test', '09180001450', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kathy', 'Craig', 'Female', '2007-12-08', '09180001450', 'Caridad', 'Bago City', 'PH202600000200', 'Emergency Contact 1450', '09170001450', NULL, NULL);

-- record 1451: Annette Ross
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1451@ekalusugan-demo.test', '09180001451', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Annette', 'Ross', 'Male', '1999-10-20', '09180001451', 'Balingasag', 'Bago City', 'PH202600000201', 'Emergency Contact 1451', '09170001451', NULL, NULL);

-- record 1452: Russell Wilkinson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1452@ekalusugan-demo.test', '09180001452', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Russell', 'Wilkinson', 'Female', '1943-06-29', '09180001452', 'Bagroy', 'Bago City', 'PH202600000202', 'Emergency Contact 1452', '09170001452', 'senior', NULL);

-- record 1453: Caitlyn Gallegos
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1453@ekalusugan-demo.test', '09180001453', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Caitlyn', 'Gallegos', 'Male', '1981-04-29', '09180001453', 'Abuanan', 'Bago City', 'PH202600000203', 'Emergency Contact 1453', '09170001453', NULL, NULL);

-- record 1454: Alicia Mullins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1454@ekalusugan-demo.test', '09180001454', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alicia', 'Mullins', 'Female', '1970-04-19', '09180001454', 'Ilijan', 'Bago City', 'PH202600000204', 'Emergency Contact 1454', '09170001454', NULL, NULL);

-- record 1455: Shelly Rose
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1455@ekalusugan-demo.test', '09180001455', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shelly', 'Rose', 'Male', '1970-06-23', '09180001455', 'Taloc', 'Bago City', 'PH202600000205', 'Emergency Contact 1455', '09170001455', NULL, NULL);

-- record 1456: Connor Chandler
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1456@ekalusugan-demo.test', '09180001456', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Connor', 'Chandler', 'Female', '1997-04-22', '09180001456', 'Lag-asan', 'Bago City', 'PH202600000206', 'Emergency Contact 1456', '09170001456', NULL, NULL);

-- record 1457: Taylor Liu
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1457@ekalusugan-demo.test', '09180001457', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Taylor', 'Liu', 'Male', '1973-04-25', '09180001457', 'Atipuluan', 'Bago City', 'PH202600000207', 'Emergency Contact 1457', '09170001457', NULL, NULL);

-- record 1458: Robyn Potts
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1458@ekalusugan-demo.test', '09180001458', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Robyn', 'Potts', 'Female', '1955-07-24', '09180001458', 'Alianza', 'Bago City', 'PH202600000208', 'Emergency Contact 1458', '09170001458', 'senior', NULL);

-- record 1459: Adrienne Fox
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1459@ekalusugan-demo.test', '09180001459', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Adrienne', 'Fox', 'Male', '1949-03-04', '09180001459', 'Tabunan', 'Bago City', 'PH202600000209', 'Emergency Contact 1459', '09170001459', 'senior', NULL);

-- record 1460: Meghan Johnston
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1460@ekalusugan-demo.test', '09180001460', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Meghan', 'Johnston', 'Female', '1952-08-15', '09180001460', 'Binubuhan', 'Bago City', 'PH202600000210', 'Emergency Contact 1460', '09170001460', 'senior', NULL);

-- record 1461: Tamara Carpenter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1461@ekalusugan-demo.test', '09180001461', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tamara', 'Carpenter', 'Male', '1978-06-12', '09180001461', 'Poblacion', 'Bago City', 'PH202600000211', 'Emergency Contact 1461', '09170001461', NULL, NULL);

-- record 1462: Jordan Strong
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1462@ekalusugan-demo.test', '09180001462', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jordan', 'Strong', 'Female', '1977-12-07', '09180001462', 'Mailum', 'Bago City', 'PH202600000212', 'Emergency Contact 1462', '09170001462', NULL, NULL);

-- record 1463: Melinda Vazquez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1463@ekalusugan-demo.test', '09180001463', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Melinda', 'Vazquez', 'Male', '1951-07-03', '09180001463', 'Ma-ao', 'Bago City', 'PH202600000213', 'Emergency Contact 1463', '09170001463', 'senior', NULL);

-- record 1464: Raymond Caldwell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1464@ekalusugan-demo.test', '09180001464', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Raymond', 'Caldwell', 'Female', '2010-11-21', '09180001464', 'Sampinit', 'Bago City', 'PH202600000214', 'Emergency Contact 1464', '09170001464', NULL, NULL);

-- record 1465: Morgan Maxwell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1465@ekalusugan-demo.test', '09180001465', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Morgan', 'Maxwell', 'Male', '1975-01-17', '09180001465', 'Calumangan', 'Bago City', 'PH202600000215', 'Emergency Contact 1465', '09170001465', NULL, NULL);

-- record 1466: Nancy Fletcher
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1466@ekalusugan-demo.test', '09180001466', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Nancy', 'Fletcher', 'Female', '1996-10-17', '09180001466', 'Pacol', 'Bago City', 'PH202600000216', 'Emergency Contact 1466', '09170001466', NULL, NULL);

-- record 1467: Lynn Norris
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1467@ekalusugan-demo.test', '09180001467', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lynn', 'Norris', 'Male', '2008-05-06', '09180001467', 'Malingin', 'Bago City', 'PH202600000217', 'Emergency Contact 1467', '09170001467', NULL, NULL);

-- record 1468: Lawrence Arnold
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1468@ekalusugan-demo.test', '09180001468', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lawrence', 'Arnold', 'Female', '1960-12-25', '09180001468', 'Don Jorge Araneta', 'Bago City', 'PH202600000218', 'Emergency Contact 1468', '09170001468', 'senior', NULL);

-- record 1469: Marc Cox
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1469@ekalusugan-demo.test', '09180001469', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Marc', 'Cox', 'Male', '1957-05-08', '09180001469', 'Napoles', 'Bago City', 'PH202600000219', 'Emergency Contact 1469', '09170001469', 'senior', NULL);

-- record 1470: Brandi Hanna
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1470@ekalusugan-demo.test', '09180001470', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brandi', 'Hanna', 'Female', '1953-06-01', '09180001470', 'Busay', 'Bago City', 'PH202600000220', 'Emergency Contact 1470', '09170001470', 'senior', NULL);

-- record 1471: Carl Mcclure
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1471@ekalusugan-demo.test', '09180001471', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Carl', 'Mcclure', 'Male', '2008-02-25', '09180001471', 'Caridad', 'Bago City', 'PH202600000221', 'Emergency Contact 1471', '09170001471', NULL, NULL);

-- record 1472: Christina Rojas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1472@ekalusugan-demo.test', '09180001472', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Christina', 'Rojas', 'Female', '1978-02-23', '09180001472', 'Balingasag', 'Bago City', 'PH202600000222', 'Emergency Contact 1472', '09170001472', NULL, NULL);

-- record 1473: Christine Love
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1473@ekalusugan-demo.test', '09180001473', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Christine', 'Love', 'Male', '1980-06-01', '09180001473', 'Bagroy', 'Bago City', 'PH202600000223', 'Emergency Contact 1473', '09170001473', NULL, NULL);

-- record 1474: Jeremy Barber
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1474@ekalusugan-demo.test', '09180001474', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jeremy', 'Barber', 'Female', '1940-10-31', '09180001474', 'Abuanan', 'Bago City', 'PH202600000224', 'Emergency Contact 1474', '09170001474', 'senior', NULL);

-- record 1475: Ian Day
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1475@ekalusugan-demo.test', '09180001475', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ian', 'Day', 'Male', '2007-10-01', '09180001475', 'Ilijan', 'Bago City', 'PH202600000225', 'Emergency Contact 1475', '09170001475', NULL, NULL);

-- record 1476: Anne Meyers
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1476@ekalusugan-demo.test', '09180001476', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Anne', 'Meyers', 'Female', '1981-09-21', '09180001476', 'Taloc', 'Bago City', 'PH202600000226', 'Emergency Contact 1476', '09170001476', NULL, NULL);

-- record 1477: Leslie Avila
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1477@ekalusugan-demo.test', '09180001477', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Leslie', 'Avila', 'Male', '1985-05-15', '09180001477', 'Lag-asan', 'Bago City', 'PH202600000227', 'Emergency Contact 1477', '09170001477', NULL, NULL);

-- record 1478: Duane Oconnor
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1478@ekalusugan-demo.test', '09180001478', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Duane', 'Oconnor', 'Female', '1997-05-19', '09180001478', 'Atipuluan', 'Bago City', 'PH202600000228', 'Emergency Contact 1478', '09170001478', NULL, NULL);

-- record 1479: Carolyn Esparza
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1479@ekalusugan-demo.test', '09180001479', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Carolyn', 'Esparza', 'Male', '1992-11-04', '09180001479', 'Alianza', 'Bago City', 'PH202600000229', 'Emergency Contact 1479', '09170001479', NULL, NULL);

-- record 1480: Ronnie Fields
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1480@ekalusugan-demo.test', '09180001480', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ronnie', 'Fields', 'Female', '1945-04-05', '09180001480', 'Tabunan', 'Bago City', 'PH202600000230', 'Emergency Contact 1480', '09170001480', 'senior', NULL);

-- record 1481: Willie Murphy
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1481@ekalusugan-demo.test', '09180001481', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Willie', 'Murphy', 'Male', '1951-12-03', '09180001481', 'Binubuhan', 'Bago City', 'PH202600000231', 'Emergency Contact 1481', '09170001481', 'senior', NULL);

-- record 1482: Jeffrey Hoffman
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1482@ekalusugan-demo.test', '09180001482', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jeffrey', 'Hoffman', 'Female', '1996-10-03', '09180001482', 'Poblacion', 'Bago City', 'PH202600000232', 'Emergency Contact 1482', '09170001482', NULL, NULL);

-- record 1483: Beverly Chapman
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1483@ekalusugan-demo.test', '09180001483', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Beverly', 'Chapman', 'Male', '2000-09-26', '09180001483', 'Mailum', 'Bago City', 'PH202600000233', 'Emergency Contact 1483', '09170001483', NULL, NULL);

-- record 1484: Alex Andrews
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1484@ekalusugan-demo.test', '09180001484', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alex', 'Andrews', 'Female', '2006-02-05', '09180001484', 'Ma-ao', 'Bago City', 'PH202600000234', 'Emergency Contact 1484', '09170001484', NULL, NULL);

-- record 1485: Jon Shepherd
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1485@ekalusugan-demo.test', '09180001485', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jon', 'Shepherd', 'Male', '2001-12-01', '09180001485', 'Sampinit', 'Bago City', 'PH202600000235', 'Emergency Contact 1485', '09170001485', NULL, NULL);

-- record 1486: Frederick Carson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1486@ekalusugan-demo.test', '09180001486', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Frederick', 'Carson', 'Female', '2009-12-25', '09180001486', 'Calumangan', 'Bago City', 'PH202600000236', 'Emergency Contact 1486', '09170001486', NULL, NULL);

-- record 1487: Kelli Schroeder
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1487@ekalusugan-demo.test', '09180001487', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kelli', 'Schroeder', 'Male', '1953-12-07', '09180001487', 'Pacol', 'Bago City', 'PH202600000237', 'Emergency Contact 1487', '09170001487', 'senior', NULL);

-- record 1488: Glenn Beck
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1488@ekalusugan-demo.test', '09180001488', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Glenn', 'Beck', 'Female', '1993-08-26', '09180001488', 'Malingin', 'Bago City', 'PH202600000238', 'Emergency Contact 1488', '09170001488', NULL, NULL);

-- record 1489: Evan King
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1489@ekalusugan-demo.test', '09180001489', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Evan', 'King', 'Male', '1947-07-03', '09180001489', 'Don Jorge Araneta', 'Bago City', 'PH202600000239', 'Emergency Contact 1489', '09170001489', 'senior', NULL);

-- record 1490: Kaylee Morgan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1490@ekalusugan-demo.test', '09180001490', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kaylee', 'Morgan', 'Female', '1948-03-18', '09180001490', 'Napoles', 'Bago City', 'PH202600000240', 'Emergency Contact 1490', '09170001490', 'senior', NULL);

-- record 1491: Marcus Hancock
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1491@ekalusugan-demo.test', '09180001491', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Marcus', 'Hancock', 'Male', '2002-09-01', '09180001491', 'Busay', 'Bago City', 'PH202600000241', 'Emergency Contact 1491', '09170001491', NULL, NULL);

-- record 1492: Anita Holmes
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1492@ekalusugan-demo.test', '09180001492', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Anita', 'Holmes', 'Female', '1969-11-20', '09180001492', 'Caridad', 'Bago City', 'PH202600000242', 'Emergency Contact 1492', '09170001492', NULL, NULL);

-- record 1493: Brett Black
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1493@ekalusugan-demo.test', '09180001493', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brett', 'Black', 'Male', '2007-02-11', '09180001493', 'Balingasag', 'Bago City', 'PH202600000243', 'Emergency Contact 1493', '09170001493', NULL, NULL);

-- record 1494: Melanie Raymond
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1494@ekalusugan-demo.test', '09180001494', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Melanie', 'Raymond', 'Female', '1975-02-02', '09180001494', 'Bagroy', 'Bago City', 'PH202600000244', 'Emergency Contact 1494', '09170001494', NULL, NULL);

-- record 1495: Brent Mcdonald
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1495@ekalusugan-demo.test', '09180001495', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brent', 'Mcdonald', 'Male', '1989-05-25', '09180001495', 'Abuanan', 'Bago City', 'PH202600000245', 'Emergency Contact 1495', '09170001495', NULL, NULL);

-- record 1496: Karina Andrade
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1496@ekalusugan-demo.test', '09180001496', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Karina', 'Andrade', 'Female', '1944-11-17', '09180001496', 'Ilijan', 'Bago City', 'PH202600000246', 'Emergency Contact 1496', '09170001496', 'senior', NULL);

-- record 1497: Emma Powers
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1497@ekalusugan-demo.test', '09180001497', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Emma', 'Powers', 'Male', '1996-05-01', '09180001497', 'Taloc', 'Bago City', 'PH202600000247', 'Emergency Contact 1497', '09170001497', NULL, NULL);

-- record 1498: Mario Pearson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1498@ekalusugan-demo.test', '09180001498', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mario', 'Pearson', 'Female', '1992-06-29', '09180001498', 'Lag-asan', 'Bago City', 'PH202600000248', 'Emergency Contact 1498', '09170001498', NULL, NULL);

-- record 1499: Danielle Eaton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1499@ekalusugan-demo.test', '09180001499', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Danielle', 'Eaton', 'Male', '1958-10-18', '09180001499', 'Atipuluan', 'Bago City', 'PH202600000249', 'Emergency Contact 1499', '09170001499', 'senior', NULL);

-- record 1500: Joe Barker
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1500@ekalusugan-demo.test', '09180001500', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Joe', 'Barker', 'Female', '2010-08-24', '09180001500', 'Alianza', 'Bago City', 'PH202600000250', 'Emergency Contact 1500', '09170001500', NULL, NULL);

-- record 1501: Brooke Holland
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1501@ekalusugan-demo.test', '09180001501', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brooke', 'Holland', 'Male', '1978-11-17', '09180001501', 'Tabunan', 'Bago City', 'PH202600000251', 'Emergency Contact 1501', '09170001501', NULL, NULL);

-- record 1502: Sonia Arias
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1502@ekalusugan-demo.test', '09180001502', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sonia', 'Arias', 'Female', '1959-03-17', '09180001502', 'Binubuhan', 'Bago City', 'PH202600000252', 'Emergency Contact 1502', '09170001502', 'senior', NULL);

-- record 1503: Riley Thornton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1503@ekalusugan-demo.test', '09180001503', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Riley', 'Thornton', 'Male', '2001-04-13', '09180001503', 'Poblacion', 'Bago City', 'PH202600000253', 'Emergency Contact 1503', '09170001503', NULL, NULL);

-- record 1504: Sheryl Mccoy
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1504@ekalusugan-demo.test', '09180001504', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sheryl', 'Mccoy', 'Female', '1945-07-13', '09180001504', 'Mailum', 'Bago City', 'PH202600000254', 'Emergency Contact 1504', '09170001504', 'senior', NULL);

-- record 1505: Brittney Trujillo
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1505@ekalusugan-demo.test', '09180001505', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brittney', 'Trujillo', 'Male', '1992-02-16', '09180001505', 'Ma-ao', 'Bago City', 'PH202600000255', 'Emergency Contact 1505', '09170001505', NULL, NULL);

-- record 1506: Sara West
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1506@ekalusugan-demo.test', '09180001506', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sara', 'West', 'Female', '1974-09-23', '09180001506', 'Sampinit', 'Bago City', 'PH202600000256', 'Emergency Contact 1506', '09170001506', NULL, NULL);

-- record 1507: Ann Hawkins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1507@ekalusugan-demo.test', '09180001507', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ann', 'Hawkins', 'Male', '2010-11-25', '09180001507', 'Calumangan', 'Bago City', 'PH202600000257', 'Emergency Contact 1507', '09170001507', NULL, NULL);

-- record 1508: Caleb Reese
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1508@ekalusugan-demo.test', '09180001508', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Caleb', 'Reese', 'Female', '1996-03-21', '09180001508', 'Pacol', 'Bago City', 'PH202600000258', 'Emergency Contact 1508', '09170001508', NULL, NULL);

-- record 1509: Natasha Oliver
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1509@ekalusugan-demo.test', '09180001509', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Natasha', 'Oliver', 'Male', '1973-05-22', '09180001509', 'Malingin', 'Bago City', 'PH202600000259', 'Emergency Contact 1509', '09170001509', NULL, NULL);

-- record 1510: Meredith Blackwell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1510@ekalusugan-demo.test', '09180001510', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Meredith', 'Blackwell', 'Female', '1988-06-20', '09180001510', 'Don Jorge Araneta', 'Bago City', 'PH202600000260', 'Emergency Contact 1510', '09170001510', NULL, NULL);

-- record 1511: Tara Olson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1511@ekalusugan-demo.test', '09180001511', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tara', 'Olson', 'Male', '2002-06-08', '09180001511', 'Napoles', 'Bago City', 'PH202600000261', 'Emergency Contact 1511', '09170001511', NULL, NULL);

-- record 1512: Gail Lambert
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1512@ekalusugan-demo.test', '09180001512', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gail', 'Lambert', 'Female', '1957-10-26', '09180001512', 'Busay', 'Bago City', 'PH202600000262', 'Emergency Contact 1512', '09170001512', 'senior', NULL);

-- record 1513: Collin Coleman
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1513@ekalusugan-demo.test', '09180001513', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Collin', 'Coleman', 'Male', '1984-08-05', '09180001513', 'Caridad', 'Bago City', 'PH202600000263', 'Emergency Contact 1513', '09170001513', NULL, NULL);

-- record 1514: Ellen Wilkins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1514@ekalusugan-demo.test', '09180001514', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ellen', 'Wilkins', 'Female', '1956-12-16', '09180001514', 'Balingasag', 'Bago City', 'PH202600000264', 'Emergency Contact 1514', '09170001514', 'senior', NULL);

-- record 1515: Bernard Tapia
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1515@ekalusugan-demo.test', '09180001515', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bernard', 'Tapia', 'Male', '1958-06-16', '09180001515', 'Bagroy', 'Bago City', 'PH202600000265', 'Emergency Contact 1515', '09170001515', 'senior', NULL);

-- record 1516: Grant Benton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1516@ekalusugan-demo.test', '09180001516', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Grant', 'Benton', 'Female', '1988-12-23', '09180001516', 'Abuanan', 'Bago City', 'PH202600000266', 'Emergency Contact 1516', '09170001516', NULL, NULL);

-- record 1517: Brad Gonzalez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1517@ekalusugan-demo.test', '09180001517', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brad', 'Gonzalez', 'Male', '1975-05-05', '09180001517', 'Ilijan', 'Bago City', 'PH202600000267', 'Emergency Contact 1517', '09170001517', NULL, NULL);

-- record 1518: Rachael Silva
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1518@ekalusugan-demo.test', '09180001518', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Rachael', 'Silva', 'Female', '1979-10-22', '09180001518', 'Taloc', 'Bago City', 'PH202600000268', 'Emergency Contact 1518', '09170001518', NULL, NULL);

-- record 1519: Steven Knox
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1519@ekalusugan-demo.test', '09180001519', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Steven', 'Knox', 'Male', '1945-03-21', '09180001519', 'Lag-asan', 'Bago City', 'PH202600000269', 'Emergency Contact 1519', '09170001519', 'senior', NULL);

-- record 1520: Chase Hale
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1520@ekalusugan-demo.test', '09180001520', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Chase', 'Hale', 'Female', '1982-02-16', '09180001520', 'Atipuluan', 'Bago City', 'PH202600000270', 'Emergency Contact 1520', '09170001520', NULL, NULL);

-- record 1521: Glen Duncan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1521@ekalusugan-demo.test', '09180001521', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Glen', 'Duncan', 'Male', '1951-04-27', '09180001521', 'Alianza', 'Bago City', 'PH202600000271', 'Emergency Contact 1521', '09170001521', 'senior', NULL);

-- record 1522: Miranda Ramirez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1522@ekalusugan-demo.test', '09180001522', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Miranda', 'Ramirez', 'Female', '1978-12-12', '09180001522', 'Tabunan', 'Bago City', 'PH202600000272', 'Emergency Contact 1522', '09170001522', NULL, NULL);

-- record 1523: Rebekah Howe
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1523@ekalusugan-demo.test', '09180001523', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Rebekah', 'Howe', 'Male', '2007-12-07', '09180001523', 'Binubuhan', 'Bago City', 'PH202600000273', 'Emergency Contact 1523', '09170001523', NULL, NULL);

-- record 1524: Amber Hill
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1524@ekalusugan-demo.test', '09180001524', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Amber', 'Hill', 'Female', '1954-04-13', '09180001524', 'Poblacion', 'Bago City', 'PH202600000274', 'Emergency Contact 1524', '09170001524', 'senior', NULL);

-- record 1525: Haley Lawson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1525@ekalusugan-demo.test', '09180001525', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Haley', 'Lawson', 'Male', '1998-02-05', '09180001525', 'Mailum', 'Bago City', 'PH202600000275', 'Emergency Contact 1525', '09170001525', NULL, NULL);

-- record 1526: Heidi Jordan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1526@ekalusugan-demo.test', '09180001526', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Heidi', 'Jordan', 'Female', '1984-01-28', '09180001526', 'Ma-ao', 'Bago City', 'PH202600000276', 'Emergency Contact 1526', '09170001526', NULL, NULL);

-- record 1527: Sonya Olsen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1527@ekalusugan-demo.test', '09180001527', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sonya', 'Olsen', 'Male', '1985-09-27', '09180001527', 'Sampinit', 'Bago City', 'PH202600000277', 'Emergency Contact 1527', '09170001527', 'pwd', NULL);

-- record 1528: Autumn Morrow
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1528@ekalusugan-demo.test', '09180001528', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Autumn', 'Morrow', 'Female', '1962-08-07', '09180001528', 'Calumangan', 'Bago City', 'PH202600000278', 'Emergency Contact 1528', '09170001528', 'senior', NULL);

-- record 1529: Kristy George
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1529@ekalusugan-demo.test', '09180001529', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kristy', 'George', 'Male', '1977-01-28', '09180001529', 'Pacol', 'Bago City', 'PH202600000279', 'Emergency Contact 1529', '09170001529', NULL, NULL);

-- record 1530: Mandy Cummings
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1530@ekalusugan-demo.test', '09180001530', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mandy', 'Cummings', 'Female', '1943-07-02', '09180001530', 'Malingin', 'Bago City', 'PH202600000280', 'Emergency Contact 1530', '09170001530', 'senior', NULL);

-- record 1531: Darren Cochran
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1531@ekalusugan-demo.test', '09180001531', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Darren', 'Cochran', 'Male', '1994-05-24', '09180001531', 'Don Jorge Araneta', 'Bago City', 'PH202600000281', 'Emergency Contact 1531', '09170001531', NULL, NULL);

-- record 1532: Deanna Dyer
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1532@ekalusugan-demo.test', '09180001532', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Deanna', 'Dyer', 'Female', '1996-03-27', '09180001532', 'Napoles', 'Bago City', 'PH202600000282', 'Emergency Contact 1532', '09170001532', NULL, NULL);

-- record 1533: Vicki Griffin
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1533@ekalusugan-demo.test', '09180001533', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Vicki', 'Griffin', 'Male', '1973-10-07', '09180001533', 'Busay', 'Bago City', 'PH202600000283', 'Emergency Contact 1533', '09170001533', NULL, NULL);

-- record 1534: Loretta Gomez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1534@ekalusugan-demo.test', '09180001534', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Loretta', 'Gomez', 'Female', '1952-05-19', '09180001534', 'Caridad', 'Bago City', 'PH202600000284', 'Emergency Contact 1534', '09170001534', 'senior', NULL);

-- record 1535: Mitchell Owen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1535@ekalusugan-demo.test', '09180001535', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mitchell', 'Owen', 'Male', '1975-09-27', '09180001535', 'Balingasag', 'Bago City', 'PH202600000285', 'Emergency Contact 1535', '09170001535', NULL, NULL);

-- record 1536: Louis Schwartz
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1536@ekalusugan-demo.test', '09180001536', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Louis', 'Schwartz', 'Female', '2009-07-21', '09180001536', 'Bagroy', 'Bago City', 'PH202600000286', 'Emergency Contact 1536', '09170001536', NULL, NULL);

-- record 1537: Clifford Payne
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1537@ekalusugan-demo.test', '09180001537', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Clifford', 'Payne', 'Male', '1989-06-10', '09180001537', 'Abuanan', 'Bago City', 'PH202600000287', 'Emergency Contact 1537', '09170001537', NULL, NULL);

-- record 1538: Kristina Wise
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1538@ekalusugan-demo.test', '09180001538', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kristina', 'Wise', 'Female', '1978-05-07', '09180001538', 'Ilijan', 'Bago City', 'PH202600000288', 'Emergency Contact 1538', '09170001538', NULL, NULL);

-- record 1539: Joanne Dickerson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1539@ekalusugan-demo.test', '09180001539', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Joanne', 'Dickerson', 'Male', '1943-09-21', '09180001539', 'Taloc', 'Bago City', 'PH202600000289', 'Emergency Contact 1539', '09170001539', 'senior', NULL);

-- record 1540: Courtney Merritt
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1540@ekalusugan-demo.test', '09180001540', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Courtney', 'Merritt', 'Female', '1946-09-23', '09180001540', 'Lag-asan', 'Bago City', 'PH202600000290', 'Emergency Contact 1540', '09170001540', 'senior', NULL);

-- record 1541: Kathryn Kane
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1541@ekalusugan-demo.test', '09180001541', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kathryn', 'Kane', 'Male', '1980-08-03', '09180001541', 'Atipuluan', 'Bago City', 'PH202600000291', 'Emergency Contact 1541', '09170001541', NULL, NULL);

-- record 1542: Dakota Francis
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1542@ekalusugan-demo.test', '09180001542', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dakota', 'Francis', 'Female', '1973-03-15', '09180001542', 'Alianza', 'Bago City', 'PH202600000292', 'Emergency Contact 1542', '09170001542', NULL, NULL);

-- record 1543: Kristie Baldwin
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1543@ekalusugan-demo.test', '09180001543', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kristie', 'Baldwin', 'Male', '1969-06-28', '09180001543', 'Tabunan', 'Bago City', 'PH202600000293', 'Emergency Contact 1543', '09170001543', NULL, NULL);

-- record 1544: Dominique Pace
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1544@ekalusugan-demo.test', '09180001544', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dominique', 'Pace', 'Female', '1975-01-18', '09180001544', 'Binubuhan', 'Bago City', 'PH202600000294', 'Emergency Contact 1544', '09170001544', NULL, NULL);

-- record 1545: Jake Cardenas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1545@ekalusugan-demo.test', '09180001545', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jake', 'Cardenas', 'Male', '1986-04-15', '09180001545', 'Poblacion', 'Bago City', 'PH202600000295', 'Emergency Contact 1545', '09170001545', NULL, NULL);

-- record 1546: Tonya Michael
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1546@ekalusugan-demo.test', '09180001546', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tonya', 'Michael', 'Female', '1949-08-27', '09180001546', 'Mailum', 'Bago City', 'PH202600000296', 'Emergency Contact 1546', '09170001546', 'senior', NULL);

-- record 1547: Becky Hamilton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1547@ekalusugan-demo.test', '09180001547', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Becky', 'Hamilton', 'Male', '1943-01-25', '09180001547', 'Ma-ao', 'Bago City', 'PH202600000297', 'Emergency Contact 1547', '09170001547', 'senior', NULL);

-- record 1548: Kellie Vega
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1548@ekalusugan-demo.test', '09180001548', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kellie', 'Vega', 'Female', '1975-06-16', '09180001548', 'Sampinit', 'Bago City', 'PH202600000298', 'Emergency Contact 1548', '09170001548', NULL, NULL);

-- record 1549: Gordon Dodson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1549@ekalusugan-demo.test', '09180001549', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gordon', 'Dodson', 'Male', '2008-11-18', '09180001549', 'Calumangan', 'Bago City', 'PH202600000299', 'Emergency Contact 1549', '09170001549', NULL, NULL);

-- record 1550: Jack Sullivan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1550@ekalusugan-demo.test', '09180001550', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jack', 'Sullivan', 'Female', '2008-02-19', '09180001550', 'Pacol', 'Bago City', 'PH202600000300', 'Emergency Contact 1550', '09170001550', 'pwd', NULL);

-- record 1551: Derrick Parks
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1551@ekalusugan-demo.test', '09180001551', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Derrick', 'Parks', 'Male', '1987-09-21', '09180001551', 'Malingin', 'Bago City', 'PH202600000301', 'Emergency Contact 1551', '09170001551', NULL, NULL);

-- record 1552: Wanda Gutierrez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1552@ekalusugan-demo.test', '09180001552', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Wanda', 'Gutierrez', 'Female', '1989-01-03', '09180001552', 'Don Jorge Araneta', 'Bago City', 'PH202600000302', 'Emergency Contact 1552', '09170001552', NULL, NULL);

-- record 1553: Madison Villarreal
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1553@ekalusugan-demo.test', '09180001553', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Madison', 'Villarreal', 'Male', '1988-10-01', '09180001553', 'Napoles', 'Bago City', 'PH202600000303', 'Emergency Contact 1553', '09170001553', NULL, NULL);

-- record 1554: Leonard Branch
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1554@ekalusugan-demo.test', '09180001554', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Leonard', 'Branch', 'Female', '1998-05-28', '09180001554', 'Busay', 'Bago City', 'PH202600000304', 'Emergency Contact 1554', '09170001554', NULL, NULL);

-- record 1555: Henry Quinn
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1555@ekalusugan-demo.test', '09180001555', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Henry', 'Quinn', 'Male', '1950-07-17', '09180001555', 'Caridad', 'Bago City', 'PH202600000305', 'Emergency Contact 1555', '09170001555', 'senior', NULL);

-- record 1556: Mia Cameron
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1556@ekalusugan-demo.test', '09180001556', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mia', 'Cameron', 'Female', '1950-01-22', '09180001556', 'Balingasag', 'Bago City', 'PH202600000306', 'Emergency Contact 1556', '09170001556', 'senior', NULL);

-- record 1557: Norma Miranda
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1557@ekalusugan-demo.test', '09180001557', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Norma', 'Miranda', 'Male', '1953-06-13', '09180001557', 'Bagroy', 'Bago City', 'PH202600000307', 'Emergency Contact 1557', '09170001557', 'senior', NULL);

-- record 1558: Dalton Jennings
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1558@ekalusugan-demo.test', '09180001558', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dalton', 'Jennings', 'Female', '2003-03-27', '09180001558', 'Abuanan', 'Bago City', 'PH202600000308', 'Emergency Contact 1558', '09170001558', NULL, NULL);

-- record 1559: Carrie Buckley
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1559@ekalusugan-demo.test', '09180001559', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Carrie', 'Buckley', 'Male', '1990-11-12', '09180001559', 'Ilijan', 'Bago City', 'PH202600000309', 'Emergency Contact 1559', '09170001559', NULL, NULL);

-- record 1560: Krystal Deleon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1560@ekalusugan-demo.test', '09180001560', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Krystal', 'Deleon', 'Female', '1941-07-18', '09180001560', 'Taloc', 'Bago City', 'PH202600000310', 'Emergency Contact 1560', '09170001560', 'senior', NULL);

-- record 1561: Renee Carroll
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1561@ekalusugan-demo.test', '09180001561', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Renee', 'Carroll', 'Male', '1992-06-14', '09180001561', 'Lag-asan', 'Bago City', 'PH202600000311', 'Emergency Contact 1561', '09170001561', NULL, NULL);

-- record 1562: Kirsten Nolan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1562@ekalusugan-demo.test', '09180001562', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kirsten', 'Nolan', 'Female', '1999-11-14', '09180001562', 'Atipuluan', 'Bago City', 'PH202600000312', 'Emergency Contact 1562', '09170001562', NULL, NULL);

-- record 1563: Sierra Meyer
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1563@ekalusugan-demo.test', '09180001563', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sierra', 'Meyer', 'Male', '2000-03-05', '09180001563', 'Alianza', 'Bago City', 'PH202600000313', 'Emergency Contact 1563', '09170001563', NULL, NULL);

-- record 1564: Stacey Braun
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1564@ekalusugan-demo.test', '09180001564', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Stacey', 'Braun', 'Female', '2006-03-06', '09180001564', 'Tabunan', 'Bago City', 'PH202600000314', 'Emergency Contact 1564', '09170001564', NULL, NULL);

-- record 1565: Gavin Griffith
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1565@ekalusugan-demo.test', '09180001565', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gavin', 'Griffith', 'Male', '2004-01-29', '09180001565', 'Binubuhan', 'Bago City', 'PH202600000315', 'Emergency Contact 1565', '09170001565', NULL, NULL);

-- record 1566: Tom Long
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1566@ekalusugan-demo.test', '09180001566', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tom', 'Long', 'Female', '1950-01-10', '09180001566', 'Poblacion', 'Bago City', 'PH202600000316', 'Emergency Contact 1566', '09170001566', 'senior', NULL);

-- record 1567: Colleen Jackson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1567@ekalusugan-demo.test', '09180001567', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Colleen', 'Jackson', 'Male', '1949-01-13', '09180001567', 'Mailum', 'Bago City', 'PH202600000317', 'Emergency Contact 1567', '09170001567', 'senior', NULL);

-- record 1568: Connie Saunders
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1568@ekalusugan-demo.test', '09180001568', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Connie', 'Saunders', 'Female', '1944-11-29', '09180001568', 'Ma-ao', 'Bago City', 'PH202600000318', 'Emergency Contact 1568', '09170001568', 'senior', NULL);

-- record 1569: Wendy Rhodes
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1569@ekalusugan-demo.test', '09180001569', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Wendy', 'Rhodes', 'Male', '1961-01-28', '09180001569', 'Sampinit', 'Bago City', 'PH202600000319', 'Emergency Contact 1569', '09170001569', 'senior', NULL);

-- record 1570: Kurt Wagner
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1570@ekalusugan-demo.test', '09180001570', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kurt', 'Wagner', 'Female', '1943-07-19', '09180001570', 'Calumangan', 'Bago City', 'PH202600000320', 'Emergency Contact 1570', '09170001570', 'senior', NULL);

-- record 1571: Shelia Conner
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1571@ekalusugan-demo.test', '09180001571', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shelia', 'Conner', 'Male', '1987-07-13', '09180001571', 'Pacol', 'Bago City', 'PH202600000321', 'Emergency Contact 1571', '09170001571', NULL, NULL);

-- record 1572: Casey Peterson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1572@ekalusugan-demo.test', '09180001572', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Casey', 'Peterson', 'Female', '1984-03-24', '09180001572', 'Malingin', 'Bago City', 'PH202600000322', 'Emergency Contact 1572', '09170001572', NULL, NULL);

-- record 1573: Erika Perkins
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1573@ekalusugan-demo.test', '09180001573', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Erika', 'Perkins', 'Male', '1954-08-23', '09180001573', 'Don Jorge Araneta', 'Bago City', 'PH202600000323', 'Emergency Contact 1573', '09170001573', 'senior', NULL);

-- record 1574: Glenda Haas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1574@ekalusugan-demo.test', '09180001574', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Glenda', 'Haas', 'Female', '1970-05-29', '09180001574', 'Napoles', 'Bago City', 'PH202600000324', 'Emergency Contact 1574', '09170001574', NULL, NULL);

-- record 1575: Michaela Carter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1575@ekalusugan-demo.test', '09180001575', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Michaela', 'Carter', 'Male', '1981-01-27', '09180001575', 'Busay', 'Bago City', 'PH202600000325', 'Emergency Contact 1575', '09170001575', NULL, NULL);

-- record 1576: Garrett Harvey
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1576@ekalusugan-demo.test', '09180001576', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Garrett', 'Harvey', 'Female', '1976-02-19', '09180001576', 'Caridad', 'Bago City', 'PH202600000326', 'Emergency Contact 1576', '09170001576', NULL, NULL);

-- record 1577: Tanner Russell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1577@ekalusugan-demo.test', '09180001577', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tanner', 'Russell', 'Male', '2006-02-16', '09180001577', 'Balingasag', 'Bago City', 'PH202600000327', 'Emergency Contact 1577', '09170001577', NULL, NULL);

-- record 1578: Janice Becker
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1578@ekalusugan-demo.test', '09180001578', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Janice', 'Becker', 'Female', '1992-02-17', '09180001578', 'Bagroy', 'Bago City', 'PH202600000328', 'Emergency Contact 1578', '09170001578', NULL, NULL);

-- record 1579: Drew Richards
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1579@ekalusugan-demo.test', '09180001579', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Drew', 'Richards', 'Male', '1972-01-03', '09180001579', 'Abuanan', 'Bago City', 'PH202600000329', 'Emergency Contact 1579', '09170001579', NULL, NULL);

-- record 1580: Alexa Mooney
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1580@ekalusugan-demo.test', '09180001580', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alexa', 'Mooney', 'Female', '1957-10-15', '09180001580', 'Ilijan', 'Bago City', 'PH202600000330', 'Emergency Contact 1580', '09170001580', 'senior', NULL);

-- record 1581: Dale House
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1581@ekalusugan-demo.test', '09180001581', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dale', 'House', 'Male', '1948-03-02', '09180001581', 'Taloc', 'Bago City', 'PH202600000331', 'Emergency Contact 1581', '09170001581', 'senior', NULL);

-- record 1582: Audrey Monroe
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1582@ekalusugan-demo.test', '09180001582', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Audrey', 'Monroe', 'Female', '1951-11-01', '09180001582', 'Lag-asan', 'Bago City', 'PH202600000332', 'Emergency Contact 1582', '09170001582', 'senior', NULL);

-- record 1583: Cheyenne Weaver
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1583@ekalusugan-demo.test', '09180001583', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cheyenne', 'Weaver', 'Male', '1965-03-20', '09180001583', 'Atipuluan', 'Bago City', 'PH202600000333', 'Emergency Contact 1583', '09170001583', 'senior', NULL);

-- record 1584: Brandy Hughes
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1584@ekalusugan-demo.test', '09180001584', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brandy', 'Hughes', 'Female', '2004-02-11', '09180001584', 'Alianza', 'Bago City', 'PH202600000334', 'Emergency Contact 1584', '09170001584', NULL, NULL);

-- record 1585: Todd Mathews
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1585@ekalusugan-demo.test', '09180001585', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Todd', 'Mathews', 'Male', '2003-05-20', '09180001585', 'Tabunan', 'Bago City', 'PH202600000335', 'Emergency Contact 1585', '09170001585', NULL, NULL);

-- record 1586: Charlene Vaughan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1586@ekalusugan-demo.test', '09180001586', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Charlene', 'Vaughan', 'Female', '1968-07-21', '09180001586', 'Binubuhan', 'Bago City', 'PH202600000336', 'Emergency Contact 1586', '09170001586', NULL, NULL);

-- record 1587: Jeremiah Brooks
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1587@ekalusugan-demo.test', '09180001587', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jeremiah', 'Brooks', 'Male', '1998-12-04', '09180001587', 'Poblacion', 'Bago City', 'PH202600000337', 'Emergency Contact 1587', '09170001587', NULL, NULL);

-- record 1588: Selena Sweeney
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1588@ekalusugan-demo.test', '09180001588', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Selena', 'Sweeney', 'Female', '1978-10-25', '09180001588', 'Mailum', 'Bago City', 'PH202600000338', 'Emergency Contact 1588', '09170001588', NULL, NULL);

-- record 1589: Walter Massey
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1589@ekalusugan-demo.test', '09180001589', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Walter', 'Massey', 'Male', '1981-10-07', '09180001589', 'Ma-ao', 'Bago City', 'PH202600000339', 'Emergency Contact 1589', '09170001589', NULL, NULL);

-- record 1590: Jesus Atkinson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1590@ekalusugan-demo.test', '09180001590', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jesus', 'Atkinson', 'Female', '1956-09-30', '09180001590', 'Sampinit', 'Bago City', 'PH202600000340', 'Emergency Contact 1590', '09170001590', 'senior', NULL);

-- record 1591: Krista Ritter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1591@ekalusugan-demo.test', '09180001591', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Krista', 'Ritter', 'Male', '2005-10-31', '09180001591', 'Calumangan', 'Bago City', 'PH202600000341', 'Emergency Contact 1591', '09170001591', NULL, NULL);

-- record 1592: April Mccarthy
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1592@ekalusugan-demo.test', '09180001592', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'April', 'Mccarthy', 'Female', '1984-07-10', '09180001592', 'Pacol', 'Bago City', 'PH202600000342', 'Emergency Contact 1592', '09170001592', NULL, NULL);

-- record 1593: Martin Grant
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1593@ekalusugan-demo.test', '09180001593', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Martin', 'Grant', 'Male', '1960-03-25', '09180001593', 'Malingin', 'Bago City', 'PH202600000343', 'Emergency Contact 1593', '09170001593', 'senior', NULL);

-- record 1594: Shelby Reed
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1594@ekalusugan-demo.test', '09180001594', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shelby', 'Reed', 'Female', '1952-01-05', '09180001594', 'Don Jorge Araneta', 'Bago City', 'PH202600000344', 'Emergency Contact 1594', '09170001594', 'senior', NULL);

-- record 1595: Stacie Freeman
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1595@ekalusugan-demo.test', '09180001595', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Stacie', 'Freeman', 'Male', '1981-03-04', '09180001595', 'Napoles', 'Bago City', 'PH202600000345', 'Emergency Contact 1595', '09170001595', NULL, NULL);

-- record 1596: Jorge Shannon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1596@ekalusugan-demo.test', '09180001596', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jorge', 'Shannon', 'Female', '1948-09-13', '09180001596', 'Busay', 'Bago City', 'PH202600000346', 'Emergency Contact 1596', '09170001596', 'senior', NULL);

-- record 1597: Max Brewer
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1597@ekalusugan-demo.test', '09180001597', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Max', 'Brewer', 'Male', '1998-10-08', '09180001597', 'Caridad', 'Bago City', 'PH202600000347', 'Emergency Contact 1597', '09170001597', NULL, NULL);

-- record 1598: Carol Snow
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1598@ekalusugan-demo.test', '09180001598', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Carol', 'Snow', 'Female', '1965-05-30', '09180001598', 'Balingasag', 'Bago City', 'PH202600000348', 'Emergency Contact 1598', '09170001598', 'senior', NULL);

-- record 1599: Francisco Perry
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1599@ekalusugan-demo.test', '09180001599', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Francisco', 'Perry', 'Male', '2002-01-09', '09180001599', 'Bagroy', 'Bago City', 'PH202600000349', 'Emergency Contact 1599', '09170001599', NULL, NULL);

-- record 1600: Eileen Adams
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1600@ekalusugan-demo.test', '09180001600', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Eileen', 'Adams', 'Female', '1993-12-11', '09180001600', 'Abuanan', 'Bago City', 'PH202600000350', 'Emergency Contact 1600', '09170001600', NULL, NULL);

-- record 1601: Monique Stokes
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1601@ekalusugan-demo.test', '09180001601', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Monique', 'Stokes', 'Male', '1970-12-03', '09180001601', 'Ilijan', 'Bago City', 'PH202600000351', 'Emergency Contact 1601', '09170001601', NULL, NULL);

-- record 1602: Rickey Moon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1602@ekalusugan-demo.test', '09180001602', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Rickey', 'Moon', 'Female', '2004-08-13', '09180001602', 'Taloc', 'Bago City', 'PH202600000352', 'Emergency Contact 1602', '09170001602', NULL, NULL);

-- record 1603: Jared Golden
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1603@ekalusugan-demo.test', '09180001603', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jared', 'Golden', 'Male', '1945-03-26', '09180001603', 'Lag-asan', 'Bago City', 'PH202600000353', 'Emergency Contact 1603', '09170001603', 'senior', NULL);

-- record 1604: Calvin Stevenson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1604@ekalusugan-demo.test', '09180001604', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Calvin', 'Stevenson', 'Female', '1957-01-09', '09180001604', 'Atipuluan', 'Bago City', 'PH202600000354', 'Emergency Contact 1604', '09170001604', 'senior', NULL);

-- record 1605: Ashlee Blake
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1605@ekalusugan-demo.test', '09180001605', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ashlee', 'Blake', 'Male', '1942-09-05', '09180001605', 'Alianza', 'Bago City', 'PH202600000355', 'Emergency Contact 1605', '09170001605', 'senior', NULL);

-- record 1606: Bethany Moreno
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1606@ekalusugan-demo.test', '09180001606', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bethany', 'Moreno', 'Female', '2010-01-01', '09180001606', 'Tabunan', 'Bago City', 'PH202600000356', 'Emergency Contact 1606', '09170001606', NULL, NULL);

-- record 1607: Bridget Myers
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1607@ekalusugan-demo.test', '09180001607', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bridget', 'Myers', 'Male', '1946-10-16', '09180001607', 'Binubuhan', 'Bago City', 'PH202600000357', 'Emergency Contact 1607', '09170001607', 'senior', NULL);

-- record 1608: Tyrone Bartlett
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1608@ekalusugan-demo.test', '09180001608', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tyrone', 'Bartlett', 'Female', '1954-04-21', '09180001608', 'Poblacion', 'Bago City', 'PH202600000358', 'Emergency Contact 1608', '09170001608', 'senior', NULL);

-- record 1609: Janet Daniels
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1609@ekalusugan-demo.test', '09180001609', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Janet', 'Daniels', 'Male', '1958-06-14', '09180001609', 'Mailum', 'Bago City', 'PH202600000359', 'Emergency Contact 1609', '09170001609', 'senior', NULL);

-- record 1610: Alejandro Vaughn
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1610@ekalusugan-demo.test', '09180001610', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alejandro', 'Vaughn', 'Female', '1975-11-16', '09180001610', 'Ma-ao', 'Bago City', 'PH202600000360', 'Emergency Contact 1610', '09170001610', NULL, NULL);

-- record 1611: Maurice Phelps
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1611@ekalusugan-demo.test', '09180001611', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Maurice', 'Phelps', 'Male', '1966-10-20', '09180001611', 'Sampinit', 'Bago City', 'PH202600000361', 'Emergency Contact 1611', '09170001611', NULL, NULL);

-- record 1612: Vickie Farrell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1612@ekalusugan-demo.test', '09180001612', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Vickie', 'Farrell', 'Female', '1962-07-13', '09180001612', 'Calumangan', 'Bago City', 'PH202600000362', 'Emergency Contact 1612', '09170001612', 'senior', NULL);

-- record 1613: Leon Norton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1613@ekalusugan-demo.test', '09180001613', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Leon', 'Norton', 'Male', '1959-05-28', '09180001613', 'Pacol', 'Bago City', 'PH202600000363', 'Emergency Contact 1613', '09170001613', 'senior', NULL);

-- record 1614: Jamie Conrad
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1614@ekalusugan-demo.test', '09180001614', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jamie', 'Conrad', 'Female', '1965-04-19', '09180001614', 'Malingin', 'Bago City', 'PH202600000364', 'Emergency Contact 1614', '09170001614', 'senior', NULL);

-- record 1615: Sydney Potter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1615@ekalusugan-demo.test', '09180001615', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sydney', 'Potter', 'Male', '1942-08-16', '09180001615', 'Don Jorge Araneta', 'Bago City', 'PH202600000365', 'Emergency Contact 1615', '09170001615', 'senior', NULL);

-- record 1616: Kendra Small
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1616@ekalusugan-demo.test', '09180001616', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kendra', 'Small', 'Female', '1967-07-21', '09180001616', 'Napoles', 'Bago City', 'PH202600000366', 'Emergency Contact 1616', '09170001616', NULL, NULL);

-- record 1617: Wesley Nicholson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1617@ekalusugan-demo.test', '09180001617', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Wesley', 'Nicholson', 'Male', '1983-02-10', '09180001617', 'Busay', 'Bago City', 'PH202600000367', 'Emergency Contact 1617', '09170001617', NULL, NULL);

-- record 1618: Kaitlin Levine
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1618@ekalusugan-demo.test', '09180001618', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kaitlin', 'Levine', 'Female', '1993-07-15', '09180001618', 'Caridad', 'Bago City', 'PH202600000368', 'Emergency Contact 1618', '09170001618', NULL, NULL);

-- record 1619: Debbie Vargas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1619@ekalusugan-demo.test', '09180001619', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Debbie', 'Vargas', 'Male', '1962-05-17', '09180001619', 'Balingasag', 'Bago City', 'PH202600000369', 'Emergency Contact 1619', '09170001619', 'senior', NULL);

-- record 1620: Reginald Kelly
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1620@ekalusugan-demo.test', '09180001620', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Reginald', 'Kelly', 'Female', '1983-11-09', '09180001620', 'Bagroy', 'Bago City', 'PH202600000370', 'Emergency Contact 1620', '09170001620', NULL, NULL);

-- record 1621: Jeff Hicks
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1621@ekalusugan-demo.test', '09180001621', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jeff', 'Hicks', 'Male', '1946-10-03', '09180001621', 'Abuanan', 'Bago City', 'PH202600000371', 'Emergency Contact 1621', '09170001621', 'senior', NULL);

-- record 1622: Belinda Hoover
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1622@ekalusugan-demo.test', '09180001622', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Belinda', 'Hoover', 'Female', '2010-05-22', '09180001622', 'Ilijan', 'Bago City', 'PH202600000372', 'Emergency Contact 1622', '09170001622', NULL, NULL);

-- record 1623: Edgar Holder
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1623@ekalusugan-demo.test', '09180001623', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Edgar', 'Holder', 'Male', '1960-01-09', '09180001623', 'Taloc', 'Bago City', 'PH202600000373', 'Emergency Contact 1623', '09170001623', 'senior', NULL);

-- record 1624: Ralph Fritz
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1624@ekalusugan-demo.test', '09180001624', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ralph', 'Fritz', 'Female', '1986-08-08', '09180001624', 'Lag-asan', 'Bago City', 'PH202600000374', 'Emergency Contact 1624', '09170001624', NULL, NULL);

-- record 1625: Cindy Leon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1625@ekalusugan-demo.test', '09180001625', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cindy', 'Leon', 'Male', '1994-05-12', '09180001625', 'Atipuluan', 'Bago City', 'PH202600000375', 'Emergency Contact 1625', '09170001625', NULL, NULL);

-- record 1626: Toni Franco
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1626@ekalusugan-demo.test', '09180001626', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Toni', 'Franco', 'Female', '1990-12-17', '09180001626', 'Alianza', 'Bago City', 'PH202600000376', 'Emergency Contact 1626', '09170001626', NULL, NULL);

-- record 1627: Whitney Roman
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1627@ekalusugan-demo.test', '09180001627', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Whitney', 'Roman', 'Male', '1940-02-11', '09180001627', 'Tabunan', 'Bago City', 'PH202600000377', 'Emergency Contact 1627', '09170001627', 'senior', NULL);

-- record 1628: Diane Rangel
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1628@ekalusugan-demo.test', '09180001628', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Diane', 'Rangel', 'Female', '1993-03-29', '09180001628', 'Binubuhan', 'Bago City', 'PH202600000378', 'Emergency Contact 1628', '09170001628', NULL, NULL);

-- record 1629: Joanna Paul
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1629@ekalusugan-demo.test', '09180001629', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Joanna', 'Paul', 'Male', '1972-12-08', '09180001629', 'Poblacion', 'Bago City', 'PH202600000379', 'Emergency Contact 1629', '09170001629', NULL, NULL);

-- record 1630: Stanley Parrish
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1630@ekalusugan-demo.test', '09180001630', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Stanley', 'Parrish', 'Female', '1940-04-05', '09180001630', 'Mailum', 'Bago City', 'PH202600000380', 'Emergency Contact 1630', '09170001630', 'senior', NULL);

-- record 1631: Jenny Gilbert
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1631@ekalusugan-demo.test', '09180001631', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jenny', 'Gilbert', 'Male', '2008-01-02', '09180001631', 'Ma-ao', 'Bago City', 'PH202600000381', 'Emergency Contact 1631', '09170001631', NULL, NULL);

-- record 1632: Hunter Henderson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1632@ekalusugan-demo.test', '09180001632', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Hunter', 'Henderson', 'Female', '1956-03-05', '09180001632', 'Sampinit', 'Bago City', 'PH202600000382', 'Emergency Contact 1632', '09170001632', 'senior', NULL);

-- record 1633: Chloe Williamson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1633@ekalusugan-demo.test', '09180001633', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Chloe', 'Williamson', 'Male', '1957-08-23', '09180001633', 'Calumangan', 'Bago City', 'PH202600000383', 'Emergency Contact 1633', '09170001633', 'senior', NULL);

-- record 1634: Roy Brock
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1634@ekalusugan-demo.test', '09180001634', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Roy', 'Brock', 'Female', '1946-12-05', '09180001634', 'Pacol', 'Bago City', 'PH202600000384', 'Emergency Contact 1634', '09170001634', 'senior', NULL);

-- record 1635: Levi Pham
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1635@ekalusugan-demo.test', '09180001635', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Levi', 'Pham', 'Male', '1992-05-09', '09180001635', 'Malingin', 'Bago City', 'PH202600000385', 'Emergency Contact 1635', '09170001635', NULL, NULL);

-- record 1636: Howard Munoz
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1636@ekalusugan-demo.test', '09180001636', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Howard', 'Munoz', 'Female', '1945-06-27', '09180001636', 'Don Jorge Araneta', 'Bago City', 'PH202600000386', 'Emergency Contact 1636', '09170001636', 'senior', NULL);

-- record 1637: Bonnie Benson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1637@ekalusugan-demo.test', '09180001637', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bonnie', 'Benson', 'Male', '2004-07-21', '09180001637', 'Napoles', 'Bago City', 'PH202600000387', 'Emergency Contact 1637', '09170001637', NULL, NULL);

-- record 1638: Johnny Pacheco
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1638@ekalusugan-demo.test', '09180001638', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Johnny', 'Pacheco', 'Female', '1945-10-02', '09180001638', 'Busay', 'Bago City', 'PH202600000388', 'Emergency Contact 1638', '09170001638', 'senior', NULL);

-- record 1639: Daryl Villegas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1639@ekalusugan-demo.test', '09180001639', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Daryl', 'Villegas', 'Male', '1979-06-28', '09180001639', 'Caridad', 'Bago City', 'PH202600000389', 'Emergency Contact 1639', '09170001639', NULL, NULL);

-- record 1640: Destiny Peters
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1640@ekalusugan-demo.test', '09180001640', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Destiny', 'Peters', 'Female', '1967-02-28', '09180001640', 'Balingasag', 'Bago City', 'PH202600000390', 'Emergency Contact 1640', '09170001640', NULL, NULL);

-- record 1641: Curtis Colon
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1641@ekalusugan-demo.test', '09180001641', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Curtis', 'Colon', 'Male', '1955-02-20', '09180001641', 'Bagroy', 'Bago City', 'PH202600000391', 'Emergency Contact 1641', '09170001641', 'senior', NULL);

-- record 1642: Sylvia Davidson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1642@ekalusugan-demo.test', '09180001642', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sylvia', 'Davidson', 'Female', '1981-01-03', '09180001642', 'Abuanan', 'Bago City', 'PH202600000392', 'Emergency Contact 1642', '09170001642', 'pregnant', '2027-04-12 23:59:59');

-- record 1643: Devin Todd
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1643@ekalusugan-demo.test', '09180001643', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Devin', 'Todd', 'Male', '1975-09-23', '09180001643', 'Ilijan', 'Bago City', 'PH202600000393', 'Emergency Contact 1643', '09170001643', NULL, NULL);

-- record 1644: Katelyn Stuart
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1644@ekalusugan-demo.test', '09180001644', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Katelyn', 'Stuart', 'Female', '1974-12-17', '09180001644', 'Taloc', 'Bago City', 'PH202600000394', 'Emergency Contact 1644', '09170001644', NULL, NULL);

-- record 1645: Mckenzie Vincent
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1645@ekalusugan-demo.test', '09180001645', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mckenzie', 'Vincent', 'Male', '1986-06-15', '09180001645', 'Lag-asan', 'Bago City', 'PH202600000395', 'Emergency Contact 1645', '09170001645', NULL, NULL);

-- record 1646: Jackie Roy
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1646@ekalusugan-demo.test', '09180001646', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jackie', 'Roy', 'Female', '1997-03-10', '09180001646', 'Atipuluan', 'Bago City', 'PH202600000396', 'Emergency Contact 1646', '09170001646', NULL, NULL);

-- record 1647: Doris Montgomery
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1647@ekalusugan-demo.test', '09180001647', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Doris', 'Montgomery', 'Male', '1964-06-01', '09180001647', 'Alianza', 'Bago City', 'PH202600000397', 'Emergency Contact 1647', '09170001647', 'senior', NULL);

-- record 1648: Penny Ryan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1648@ekalusugan-demo.test', '09180001648', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Penny', 'Ryan', 'Female', '1987-01-09', '09180001648', 'Tabunan', 'Bago City', 'PH202600000398', 'Emergency Contact 1648', '09170001648', NULL, NULL);

-- record 1649: Carly Mcdaniel
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1649@ekalusugan-demo.test', '09180001649', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Carly', 'Mcdaniel', 'Male', '1989-09-20', '09180001649', 'Binubuhan', 'Bago City', 'PH202600000399', 'Emergency Contact 1649', '09170001649', NULL, NULL);

-- record 1650: Shawna Delgado
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1650@ekalusugan-demo.test', '09180001650', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shawna', 'Delgado', 'Female', '1993-09-09', '09180001650', 'Poblacion', 'Bago City', 'PH202600000400', 'Emergency Contact 1650', '09170001650', NULL, NULL);

-- record 1651: Lance Walsh
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1651@ekalusugan-demo.test', '09180001651', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lance', 'Walsh', 'Male', '1955-01-22', '09180001651', 'Mailum', 'Bago City', 'PH202600000401', 'Emergency Contact 1651', '09170001651', 'senior', NULL);

-- record 1652: Sophia Valenzuela
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1652@ekalusugan-demo.test', '09180001652', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sophia', 'Valenzuela', 'Female', '1943-04-19', '09180001652', 'Ma-ao', 'Bago City', 'PH202600000402', 'Emergency Contact 1652', '09170001652', 'senior', NULL);

-- record 1653: Trevor Reilly
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1653@ekalusugan-demo.test', '09180001653', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Trevor', 'Reilly', 'Male', '1996-11-07', '09180001653', 'Sampinit', 'Bago City', 'PH202600000403', 'Emergency Contact 1653', '09170001653', NULL, NULL);

-- record 1654: Andres Morris
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1654@ekalusugan-demo.test', '09180001654', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Andres', 'Morris', 'Female', '1945-03-22', '09180001654', 'Calumangan', 'Bago City', 'PH202600000404', 'Emergency Contact 1654', '09170001654', 'senior', NULL);

-- record 1655: Bryce Bruce
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1655@ekalusugan-demo.test', '09180001655', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Bryce', 'Bruce', 'Male', '1947-12-21', '09180001655', 'Pacol', 'Bago City', 'PH202600000405', 'Emergency Contact 1655', '09170001655', 'senior', NULL);

-- record 1656: Brendan Harrison
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1656@ekalusugan-demo.test', '09180001656', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Brendan', 'Harrison', 'Female', '1942-09-13', '09180001656', 'Malingin', 'Bago City', 'PH202600000406', 'Emergency Contact 1656', '09170001656', 'senior', NULL);

-- record 1657: Mallory Woodard
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1657@ekalusugan-demo.test', '09180001657', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mallory', 'Woodard', 'Male', '1959-03-22', '09180001657', 'Don Jorge Araneta', 'Bago City', 'PH202600000407', 'Emergency Contact 1657', '09170001657', 'senior', NULL);

-- record 1658: Jade Maldonado
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1658@ekalusugan-demo.test', '09180001658', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jade', 'Maldonado', 'Female', '2000-03-21', '09180001658', 'Napoles', 'Bago City', 'PH202600000408', 'Emergency Contact 1658', '09170001658', NULL, NULL);

-- record 1659: Marilyn Wheeler
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1659@ekalusugan-demo.test', '09180001659', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Marilyn', 'Wheeler', 'Male', '1965-05-06', '09180001659', 'Busay', 'Bago City', 'PH202600000409', 'Emergency Contact 1659', '09170001659', 'senior', NULL);

-- record 1660: Tricia Pruitt
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1660@ekalusugan-demo.test', '09180001660', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tricia', 'Pruitt', 'Female', '1959-06-25', '09180001660', 'Caridad', 'Bago City', 'PH202600000410', 'Emergency Contact 1660', '09170001660', 'senior', NULL);

-- record 1661: Alexandria Key
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1661@ekalusugan-demo.test', '09180001661', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alexandria', 'Key', 'Male', '1942-04-27', '09180001661', 'Balingasag', 'Bago City', 'PH202600000411', 'Emergency Contact 1661', '09170001661', 'senior', NULL);

-- record 1662: Mackenzie Hickman
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1662@ekalusugan-demo.test', '09180001662', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mackenzie', 'Hickman', 'Female', '1958-08-19', '09180001662', 'Bagroy', 'Bago City', 'PH202600000412', 'Emergency Contact 1662', '09170001662', 'senior', NULL);

-- record 1663: Lorraine Valentine
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1663@ekalusugan-demo.test', '09180001663', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lorraine', 'Valentine', 'Male', '1948-12-02', '09180001663', 'Abuanan', 'Bago City', 'PH202600000413', 'Emergency Contact 1663', '09170001663', 'senior', NULL);

-- record 1664: Alvin Bush
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1664@ekalusugan-demo.test', '09180001664', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alvin', 'Bush', 'Female', '1943-05-04', '09180001664', 'Ilijan', 'Bago City', 'PH202600000414', 'Emergency Contact 1664', '09170001664', 'senior', NULL);

-- record 1665: Mikayla Chen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1665@ekalusugan-demo.test', '09180001665', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mikayla', 'Chen', 'Male', '1965-10-02', '09180001665', 'Taloc', 'Bago City', 'PH202600000415', 'Emergency Contact 1665', '09170001665', 'senior', NULL);

-- record 1666: Gregg Dalton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1666@ekalusugan-demo.test', '09180001666', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gregg', 'Dalton', 'Female', '1977-07-24', '09180001666', 'Lag-asan', 'Bago City', 'PH202600000416', 'Emergency Contact 1666', '09170001666', NULL, NULL);

-- record 1667: Javier Bray
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1667@ekalusugan-demo.test', '09180001667', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Javier', 'Bray', 'Male', '1944-01-25', '09180001667', 'Atipuluan', 'Bago City', 'PH202600000417', 'Emergency Contact 1667', '09170001667', 'senior', NULL);

-- record 1668: Kylie Henry
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1668@ekalusugan-demo.test', '09180001668', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kylie', 'Henry', 'Female', '2007-03-26', '09180001668', 'Alianza', 'Bago City', 'PH202600000418', 'Emergency Contact 1668', '09170001668', NULL, NULL);

-- record 1669: Jim Mays
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1669@ekalusugan-demo.test', '09180001669', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jim', 'Mays', 'Male', '1985-11-11', '09180001669', 'Tabunan', 'Bago City', 'PH202600000419', 'Emergency Contact 1669', '09170001669', NULL, NULL);

-- record 1670: Sherri Bryant
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1670@ekalusugan-demo.test', '09180001670', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sherri', 'Bryant', 'Female', '2007-06-27', '09180001670', 'Binubuhan', 'Bago City', 'PH202600000420', 'Emergency Contact 1670', '09170001670', NULL, NULL);

-- record 1671: Greg Joseph
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1671@ekalusugan-demo.test', '09180001671', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Greg', 'Joseph', 'Male', '1969-09-13', '09180001671', 'Poblacion', 'Bago City', 'PH202600000421', 'Emergency Contact 1671', '09170001671', NULL, NULL);

-- record 1672: Hayley Patterson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1672@ekalusugan-demo.test', '09180001672', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Hayley', 'Patterson', 'Female', '1953-10-03', '09180001672', 'Mailum', 'Bago City', 'PH202600000422', 'Emergency Contact 1672', '09170001672', 'senior', NULL);

-- record 1673: Jocelyn Fischer
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1673@ekalusugan-demo.test', '09180001673', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jocelyn', 'Fischer', 'Male', '1991-03-27', '09180001673', 'Ma-ao', 'Bago City', 'PH202600000423', 'Emergency Contact 1673', '09170001673', NULL, NULL);

-- record 1674: Yolanda Peck
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1674@ekalusugan-demo.test', '09180001674', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Yolanda', 'Peck', 'Female', '1997-05-31', '09180001674', 'Sampinit', 'Bago City', 'PH202600000424', 'Emergency Contact 1674', '09170001674', NULL, NULL);

-- record 1675: Maureen Chan
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1675@ekalusugan-demo.test', '09180001675', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Maureen', 'Chan', 'Male', '1974-04-09', '09180001675', 'Calumangan', 'Bago City', 'PH202600000425', 'Emergency Contact 1675', '09170001675', NULL, NULL);

-- record 1676: Hailey Stark
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1676@ekalusugan-demo.test', '09180001676', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Hailey', 'Stark', 'Female', '1985-05-20', '09180001676', 'Pacol', 'Bago City', 'PH202600000426', 'Emergency Contact 1676', '09170001676', 'pregnant', '2027-06-25 23:59:59');

-- record 1677: Warren Ramsey
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1677@ekalusugan-demo.test', '09180001677', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Warren', 'Ramsey', 'Male', '1985-02-15', '09180001677', 'Malingin', 'Bago City', 'PH202600000427', 'Emergency Contact 1677', '09170001677', NULL, NULL);

-- record 1678: Eugene Steele
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1678@ekalusugan-demo.test', '09180001678', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Eugene', 'Steele', 'Female', '2009-12-10', '09180001678', 'Don Jorge Araneta', 'Bago City', 'PH202600000428', 'Emergency Contact 1678', '09170001678', NULL, NULL);

-- record 1679: Kari Henson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1679@ekalusugan-demo.test', '09180001679', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kari', 'Henson', 'Male', '1955-07-27', '09180001679', 'Napoles', 'Bago City', 'PH202600000429', 'Emergency Contact 1679', '09170001679', 'senior', NULL);

-- record 1680: Dean Hart
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1680@ekalusugan-demo.test', '09180001680', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dean', 'Hart', 'Female', '1977-05-07', '09180001680', 'Busay', 'Bago City', 'PH202600000430', 'Emergency Contact 1680', '09170001680', NULL, NULL);

-- record 1681: Karla Daniel
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1681@ekalusugan-demo.test', '09180001681', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Karla', 'Daniel', 'Male', '1966-12-19', '09180001681', 'Caridad', 'Bago City', 'PH202600000431', 'Emergency Contact 1681', '09170001681', NULL, NULL);

-- record 1682: Misty Santana
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1682@ekalusugan-demo.test', '09180001682', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Misty', 'Santana', 'Female', '1984-12-25', '09180001682', 'Balingasag', 'Bago City', 'PH202600000432', 'Emergency Contact 1682', '09170001682', NULL, NULL);

-- record 1683: Cole Jarvis
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1683@ekalusugan-demo.test', '09180001683', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cole', 'Jarvis', 'Male', '1993-04-08', '09180001683', 'Bagroy', 'Bago City', 'PH202600000433', 'Emergency Contact 1683', '09170001683', NULL, NULL);

-- record 1684: Jonathon Mccall
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1684@ekalusugan-demo.test', '09180001684', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jonathon', 'Mccall', 'Female', '1983-08-25', '09180001684', 'Abuanan', 'Bago City', 'PH202600000434', 'Emergency Contact 1684', '09170001684', NULL, NULL);

-- record 1685: Alec Bond
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1685@ekalusugan-demo.test', '09180001685', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alec', 'Bond', 'Male', '1964-03-11', '09180001685', 'Ilijan', 'Bago City', 'PH202600000435', 'Emergency Contact 1685', '09170001685', 'senior', NULL);

-- record 1686: Edwin Gallagher
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1686@ekalusugan-demo.test', '09180001686', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Edwin', 'Gallagher', 'Female', '1995-08-01', '09180001686', 'Taloc', 'Bago City', 'PH202600000436', 'Emergency Contact 1686', '09170001686', NULL, NULL);

-- record 1687: Jasmin Austin
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1687@ekalusugan-demo.test', '09180001687', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jasmin', 'Austin', 'Male', '1972-04-12', '09180001687', 'Lag-asan', 'Bago City', 'PH202600000437', 'Emergency Contact 1687', '09170001687', NULL, NULL);

-- record 1688: Alisha Mills
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1688@ekalusugan-demo.test', '09180001688', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Alisha', 'Mills', 'Female', '1983-05-29', '09180001688', 'Atipuluan', 'Bago City', 'PH202600000438', 'Emergency Contact 1688', '09170001688', 'pwd', NULL);

-- record 1689: Jean Crawford
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1689@ekalusugan-demo.test', '09180001689', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jean', 'Crawford', 'Male', '1965-10-30', '09180001689', 'Alianza', 'Bago City', 'PH202600000439', 'Emergency Contact 1689', '09170001689', 'senior', NULL);

-- record 1690: Diamond Berger
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1690@ekalusugan-demo.test', '09180001690', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Diamond', 'Berger', 'Female', '1978-05-04', '09180001690', 'Tabunan', 'Bago City', 'PH202600000440', 'Emergency Contact 1690', '09170001690', NULL, NULL);

-- record 1691: Dave Crane
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1691@ekalusugan-demo.test', '09180001691', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dave', 'Crane', 'Male', '1989-01-25', '09180001691', 'Binubuhan', 'Bago City', 'PH202600000441', 'Emergency Contact 1691', '09170001691', NULL, NULL);

-- record 1692: Claire Mora
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1692@ekalusugan-demo.test', '09180001692', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Claire', 'Mora', 'Female', '1994-01-27', '09180001692', 'Poblacion', 'Bago City', 'PH202600000442', 'Emergency Contact 1692', '09170001692', NULL, NULL);

-- record 1693: Judith Pratt
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1693@ekalusugan-demo.test', '09180001693', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Judith', 'Pratt', 'Male', '1978-09-14', '09180001693', 'Mailum', 'Bago City', 'PH202600000443', 'Emergency Contact 1693', '09170001693', NULL, NULL);

-- record 1694: Dillon Hubbard
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1694@ekalusugan-demo.test', '09180001694', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dillon', 'Hubbard', 'Female', '2008-03-16', '09180001694', 'Ma-ao', 'Bago City', 'PH202600000444', 'Emergency Contact 1694', '09170001694', NULL, NULL);

-- record 1695: Tim Harrington
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1695@ekalusugan-demo.test', '09180001695', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tim', 'Harrington', 'Male', '1979-01-25', '09180001695', 'Sampinit', 'Bago City', 'PH202600000445', 'Emergency Contact 1695', '09170001695', NULL, NULL);

-- record 1696: Mathew Horton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1696@ekalusugan-demo.test', '09180001696', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mathew', 'Horton', 'Female', '2001-05-28', '09180001696', 'Calumangan', 'Bago City', 'PH202600000446', 'Emergency Contact 1696', '09170001696', NULL, NULL);

-- record 1697: Julian Kline
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1697@ekalusugan-demo.test', '09180001697', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Julian', 'Kline', 'Male', '1967-01-30', '09180001697', 'Pacol', 'Bago City', 'PH202600000447', 'Emergency Contact 1697', '09170001697', NULL, NULL);

-- record 1698: Sabrina Marsh
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1698@ekalusugan-demo.test', '09180001698', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sabrina', 'Marsh', 'Female', '1988-11-16', '09180001698', 'Malingin', 'Bago City', 'PH202600000448', 'Emergency Contact 1698', '09170001698', NULL, NULL);

-- record 1699: Omar Pugh
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1699@ekalusugan-demo.test', '09180001699', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Omar', 'Pugh', 'Male', '1980-12-19', '09180001699', 'Don Jorge Araneta', 'Bago City', 'PH202600000449', 'Emergency Contact 1699', '09170001699', NULL, NULL);

-- record 1700: Seth Herman
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1700@ekalusugan-demo.test', '09180001700', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Seth', 'Herman', 'Female', '2004-06-16', '09180001700', 'Napoles', 'Bago City', 'PH202600000450', 'Emergency Contact 1700', '09170001700', NULL, NULL);

-- record 1701: Ivan Cordova
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1701@ekalusugan-demo.test', '09180001701', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ivan', 'Cordova', 'Male', '2002-09-10', '09180001701', 'Busay', 'Bago City', 'PH202600000451', 'Emergency Contact 1701', '09170001701', NULL, NULL);

-- record 1702: Blake Rivers
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1702@ekalusugan-demo.test', '09180001702', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Blake', 'Rivers', 'Female', '2001-12-21', '09180001702', 'Caridad', 'Bago City', 'PH202600000452', 'Emergency Contact 1702', '09170001702', NULL, NULL);

-- record 1703: Patty Drake
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1703@ekalusugan-demo.test', '09180001703', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Patty', 'Drake', 'Male', '1943-01-05', '09180001703', 'Balingasag', 'Bago City', 'PH202600000453', 'Emergency Contact 1703', '09170001703', 'senior', NULL);

-- record 1704: Caroline Christensen
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1704@ekalusugan-demo.test', '09180001704', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Caroline', 'Christensen', 'Female', '1954-06-23', '09180001704', 'Bagroy', 'Bago City', 'PH202600000454', 'Emergency Contact 1704', '09170001704', 'senior', NULL);

-- record 1705: Dan Burke
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1705@ekalusugan-demo.test', '09180001705', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dan', 'Burke', 'Male', '2001-07-24', '09180001705', 'Abuanan', 'Bago City', 'PH202600000455', 'Emergency Contact 1705', '09170001705', NULL, NULL);

-- record 1706: Mariah Glenn
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1706@ekalusugan-demo.test', '09180001706', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Mariah', 'Glenn', 'Female', '2002-06-06', '09180001706', 'Ilijan', 'Bago City', 'PH202600000456', 'Emergency Contact 1706', '09170001706', NULL, NULL);

-- record 1707: Harry Melton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1707@ekalusugan-demo.test', '09180001707', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Harry', 'Melton', 'Male', '1971-07-01', '09180001707', 'Taloc', 'Bago City', 'PH202600000457', 'Emergency Contact 1707', '09170001707', NULL, NULL);

-- record 1708: Jody Gray
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1708@ekalusugan-demo.test', '09180001708', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jody', 'Gray', 'Female', '1945-01-03', '09180001708', 'Lag-asan', 'Bago City', 'PH202600000458', 'Emergency Contact 1708', '09170001708', 'senior', NULL);

-- record 1709: Aimee Gates
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1709@ekalusugan-demo.test', '09180001709', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Aimee', 'Gates', 'Male', '1968-01-02', '09180001709', 'Atipuluan', 'Bago City', 'PH202600000459', 'Emergency Contact 1709', '09170001709', NULL, NULL);

-- record 1710: Sue Bauer
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1710@ekalusugan-demo.test', '09180001710', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sue', 'Bauer', 'Female', '1945-01-05', '09180001710', 'Alianza', 'Bago City', 'PH202600000460', 'Emergency Contact 1710', '09170001710', 'senior', NULL);

-- record 1711: Lindsay Moss
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1711@ekalusugan-demo.test', '09180001711', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Lindsay', 'Moss', 'Male', '1944-03-23', '09180001711', 'Tabunan', 'Bago City', 'PH202600000461', 'Emergency Contact 1711', '09170001711', 'senior', NULL);

-- record 1712: Kerry Hood
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1712@ekalusugan-demo.test', '09180001712', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kerry', 'Hood', 'Female', '1962-07-22', '09180001712', 'Binubuhan', 'Bago City', 'PH202600000462', 'Emergency Contact 1712', '09170001712', 'senior', NULL);

-- record 1713: Claudia Hurst
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1713@ekalusugan-demo.test', '09180001713', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Claudia', 'Hurst', 'Male', '1949-02-10', '09180001713', 'Poblacion', 'Bago City', 'PH202600000463', 'Emergency Contact 1713', '09170001713', 'senior', NULL);

-- record 1714: Christie Wiley
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1714@ekalusugan-demo.test', '09180001714', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Christie', 'Wiley', 'Female', '1976-04-09', '09180001714', 'Mailum', 'Bago City', 'PH202600000464', 'Emergency Contact 1714', '09170001714', NULL, NULL);

-- record 1715: Angie Skinner
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1715@ekalusugan-demo.test', '09180001715', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Angie', 'Skinner', 'Male', '1994-06-30', '09180001715', 'Ma-ao', 'Bago City', 'PH202600000465', 'Emergency Contact 1715', '09170001715', NULL, NULL);

-- record 1716: Ariel Terrell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1716@ekalusugan-demo.test', '09180001716', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ariel', 'Terrell', 'Female', '1951-08-07', '09180001716', 'Sampinit', 'Bago City', 'PH202600000466', 'Emergency Contact 1716', '09170001716', 'senior', NULL);

-- record 1717: Traci Page
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1717@ekalusugan-demo.test', '09180001717', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Traci', 'Page', 'Male', '1946-06-04', '09180001717', 'Calumangan', 'Bago City', 'PH202600000467', 'Emergency Contact 1717', '09170001717', 'senior', NULL);

-- record 1718: Darlene Underwood
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1718@ekalusugan-demo.test', '09180001718', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Darlene', 'Underwood', 'Female', '1969-07-31', '09180001718', 'Pacol', 'Bago City', 'PH202600000468', 'Emergency Contact 1718', '09170001718', NULL, NULL);

-- record 1719: Candace Frazier
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1719@ekalusugan-demo.test', '09180001719', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Candace', 'Frazier', 'Male', '1981-04-25', '09180001719', 'Malingin', 'Bago City', 'PH202600000469', 'Emergency Contact 1719', '09170001719', NULL, NULL);

-- record 1720: Tabitha Leonard
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1720@ekalusugan-demo.test', '09180001720', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tabitha', 'Leonard', 'Female', '1945-11-20', '09180001720', 'Don Jorge Araneta', 'Bago City', 'PH202600000470', 'Emergency Contact 1720', '09170001720', 'senior', NULL);

-- record 1721: Kirk Barton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1721@ekalusugan-demo.test', '09180001721', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Kirk', 'Barton', 'Male', '2006-02-08', '09180001721', 'Napoles', 'Bago City', 'PH202600000471', 'Emergency Contact 1721', '09170001721', NULL, NULL);

-- record 1722: Gwendolyn Hampton
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1722@ekalusugan-demo.test', '09180001722', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Gwendolyn', 'Hampton', 'Female', '2005-12-16', '09180001722', 'Busay', 'Bago City', 'PH202600000472', 'Emergency Contact 1722', '09170001722', NULL, NULL);

-- record 1723: Ray Melendez
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1723@ekalusugan-demo.test', '09180001723', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ray', 'Melendez', 'Male', '1962-12-11', '09180001723', 'Caridad', 'Bago City', 'PH202600000473', 'Emergency Contact 1723', '09170001723', 'senior', NULL);

-- record 1724: Peggy Pitts
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1724@ekalusugan-demo.test', '09180001724', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Peggy', 'Pitts', 'Female', '1983-03-11', '09180001724', 'Balingasag', 'Bago City', 'PH202600000474', 'Emergency Contact 1724', '09170001724', NULL, NULL);

-- record 1725: Ross Shaw
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1725@ekalusugan-demo.test', '09180001725', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ross', 'Shaw', 'Male', '1961-06-17', '09180001725', 'Bagroy', 'Bago City', 'PH202600000475', 'Emergency Contact 1725', '09170001725', 'senior', NULL);

-- record 1726: Johnathan Poole
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1726@ekalusugan-demo.test', '09180001726', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Johnathan', 'Poole', 'Female', '1959-01-31', '09180001726', 'Abuanan', 'Bago City', 'PH202600000476', 'Emergency Contact 1726', '09170001726', 'senior', NULL);

-- record 1727: Dwayne Carr
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1727@ekalusugan-demo.test', '09180001727', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Dwayne', 'Carr', 'Male', '2007-09-20', '09180001727', 'Ilijan', 'Bago City', 'PH202600000477', 'Emergency Contact 1727', '09170001727', NULL, NULL);

-- record 1728: Darius Sanford
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1728@ekalusugan-demo.test', '09180001728', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Darius', 'Sanford', 'Female', '1949-09-06', '09180001728', 'Taloc', 'Bago City', 'PH202600000478', 'Emergency Contact 1728', '09170001728', 'senior', NULL);

-- record 1729: Terry Anthony
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1729@ekalusugan-demo.test', '09180001729', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Terry', 'Anthony', 'Male', '1943-09-01', '09180001729', 'Lag-asan', 'Bago City', 'PH202600000479', 'Emergency Contact 1729', '09170001729', 'senior', NULL);

-- record 1730: Geoffrey Porter
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1730@ekalusugan-demo.test', '09180001730', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Geoffrey', 'Porter', 'Female', '1978-04-07', '09180001730', 'Atipuluan', 'Bago City', 'PH202600000480', 'Emergency Contact 1730', '09170001730', NULL, NULL);

-- record 1731: Noah Noble
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1731@ekalusugan-demo.test', '09180001731', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Noah', 'Noble', 'Male', '1977-11-01', '09180001731', 'Alianza', 'Bago City', 'PH202600000481', 'Emergency Contact 1731', '09170001731', NULL, NULL);

-- record 1732: Don Mccormick
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1732@ekalusugan-demo.test', '09180001732', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Don', 'Mccormick', 'Female', '1967-02-06', '09180001732', 'Tabunan', 'Bago City', 'PH202600000482', 'Emergency Contact 1732', '09170001732', NULL, NULL);

-- record 1733: Franklin Mcgrath
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1733@ekalusugan-demo.test', '09180001733', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Franklin', 'Mcgrath', 'Male', '1950-10-03', '09180001733', 'Binubuhan', 'Bago City', 'PH202600000483', 'Emergency Contact 1733', '09170001733', 'senior', NULL);

-- record 1734: Jermaine Forbes
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1734@ekalusugan-demo.test', '09180001734', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jermaine', 'Forbes', 'Female', '1995-03-18', '09180001734', 'Poblacion', 'Bago City', 'PH202600000484', 'Emergency Contact 1734', '09170001734', 'pwd', NULL);

-- record 1735: Sandy Sandoval
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1735@ekalusugan-demo.test', '09180001735', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Sandy', 'Sandoval', 'Male', '1981-03-28', '09180001735', 'Mailum', 'Bago City', 'PH202600000485', 'Emergency Contact 1735', '09170001735', NULL, NULL);

-- record 1736: Joann Giles
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1736@ekalusugan-demo.test', '09180001736', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Joann', 'Giles', 'Female', '1959-03-31', '09180001736', 'Ma-ao', 'Bago City', 'PH202600000486', 'Emergency Contact 1736', '09170001736', 'senior', NULL);

-- record 1737: Adriana Horn
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1737@ekalusugan-demo.test', '09180001737', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Adriana', 'Horn', 'Male', '1956-02-15', '09180001737', 'Sampinit', 'Bago City', 'PH202600000487', 'Emergency Contact 1737', '09170001737', 'senior', NULL);

-- record 1738: Ariana Little
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1738@ekalusugan-demo.test', '09180001738', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ariana', 'Little', 'Female', '1989-12-19', '09180001738', 'Calumangan', 'Bago City', 'PH202600000488', 'Emergency Contact 1738', '09170001738', NULL, NULL);

-- record 1739: Jackson Ochoa
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1739@ekalusugan-demo.test', '09180001739', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Jackson', 'Ochoa', 'Male', '1974-09-01', '09180001739', 'Pacol', 'Bago City', 'PH202600000489', 'Emergency Contact 1739', '09170001739', NULL, NULL);

-- record 1740: Daisy Blankenship
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1740@ekalusugan-demo.test', '09180001740', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Daisy', 'Blankenship', 'Female', '1954-03-18', '09180001740', 'Malingin', 'Bago City', 'PH202600000490', 'Emergency Contact 1740', '09170001740', 'senior', NULL);

-- record 1741: Karl Odonnell
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1741@ekalusugan-demo.test', '09180001741', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Karl', 'Odonnell', 'Male', '1949-08-07', '09180001741', 'Don Jorge Araneta', 'Bago City', 'PH202600000491', 'Emergency Contact 1741', '09170001741', 'senior', NULL);

-- record 1742: Micheal Sheppard
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1742@ekalusugan-demo.test', '09180001742', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Micheal', 'Sheppard', 'Female', '1989-01-09', '09180001742', 'Napoles', 'Bago City', 'PH202600000492', 'Emergency Contact 1742', '09170001742', NULL, NULL);

-- record 1743: Summer Gregory
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1743@ekalusugan-demo.test', '09180001743', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Summer', 'Gregory', 'Male', '1976-09-13', '09180001743', 'Busay', 'Bago City', 'PH202600000493', 'Emergency Contact 1743', '09170001743', NULL, NULL);

-- record 1744: Roberta Matthews
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1744@ekalusugan-demo.test', '09180001744', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Roberta', 'Matthews', 'Female', '1945-12-26', '09180001744', 'Caridad', 'Bago City', 'PH202600000494', 'Emergency Contact 1744', '09170001744', 'senior', NULL);

-- record 1745: Tracie Hull
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1745@ekalusugan-demo.test', '09180001745', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Tracie', 'Hull', 'Male', '2006-05-09', '09180001745', 'Balingasag', 'Bago City', 'PH202600000495', 'Emergency Contact 1745', '09170001745', NULL, NULL);

-- record 1746: Ruben Riggs
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1746@ekalusugan-demo.test', '09180001746', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ruben', 'Riggs', 'Female', '1947-08-27', '09180001746', 'Bagroy', 'Bago City', 'PH202600000496', 'Emergency Contact 1746', '09170001746', 'senior', NULL);

-- record 1747: Shelley Holloway
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1747@ekalusugan-demo.test', '09180001747', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Shelley', 'Holloway', 'Male', '1978-07-03', '09180001747', 'Abuanan', 'Bago City', 'PH202600000497', 'Emergency Contact 1747', '09170001747', NULL, NULL);

-- record 1748: Stuart Salinas
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1748@ekalusugan-demo.test', '09180001748', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Stuart', 'Salinas', 'Female', '1987-03-28', '09180001748', 'Ilijan', 'Bago City', 'PH202600000498', 'Emergency Contact 1748', '09170001748', NULL, NULL);

-- record 1749: Cristian Dawson
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1749@ekalusugan-demo.test', '09180001749', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Cristian', 'Dawson', 'Male', '2005-03-07', '09180001749', 'Taloc', 'Bago City', 'PH202600000499', 'Emergency Contact 1749', '09170001749', NULL, NULL);

-- record 1750: Ebony Cunningham
INSERT INTO users (email, phone, password_hash, role, must_change_password) VALUES ('patient1750@ekalusugan-demo.test', '09180001750', '$2b$10$FfposNncV9ZbRQhowIE2lO.4sVP6MLgsr.v4XVJoJVRp4FgFfIaji', 'patient', 0);
INSERT INTO patients (user_id, first_name, last_name, gender, date_of_birth, contact_number, barangay, city, philhealth_id, emergency_contact, emg_contact_no, priority_category, priority_expires_at) VALUES (LAST_INSERT_ID(), 'Ebony', 'Cunningham', 'Female', '1998-01-06', '09180001750', 'Lag-asan', 'Bago City', 'PH202600000500', 'Emergency Contact 1750', '09170001750', NULL, NULL);
COMMIT;
