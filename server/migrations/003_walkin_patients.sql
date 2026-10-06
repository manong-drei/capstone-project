-- Run once after 001 and 002. Existing account patients keep their user_id.
ALTER TABLE patients MODIFY user_id INT UNSIGNED NULL;
ALTER TABLE patients
  ADD COLUMN archived_into_patient_id INT UNSIGNED NULL,
  ADD INDEX idx_patients_contact (contact_number),
  ADD INDEX idx_patients_name_dob (last_name, first_name, date_of_birth),
  ADD CONSTRAINT fk_patients_archived_into FOREIGN KEY (archived_into_patient_id)
    REFERENCES patients(patient_id) ON DELETE RESTRICT;

ALTER TABLE queues
  ADD COLUMN is_walk_in TINYINT(1) NOT NULL DEFAULT 0 AFTER patient_id;
UPDATE queues SET is_walk_in = 1 WHERE patient_id IS NULL;

CREATE TABLE patient_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  actor_user_id INT UNSIGNED NULL,
  action VARCHAR(30) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_patient_audit_patient (patient_id, created_at),
  CONSTRAINT fk_patient_audit_patient FOREIGN KEY (patient_id)
    REFERENCES patients(patient_id) ON DELETE RESTRICT
) ENGINE=InnoDB;
