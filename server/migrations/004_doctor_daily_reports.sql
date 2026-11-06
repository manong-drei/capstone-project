CREATE TABLE IF NOT EXISTS doctor_daily_reports (
  doctor_id INT UNSIGNED NOT NULL,
  report_date DATE NOT NULL,
  data JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (doctor_id, report_date),
  CONSTRAINT fk_doctor_daily_reports_doctor FOREIGN KEY (doctor_id)
    REFERENCES doctors(doctor_id) ON DELETE RESTRICT
) ENGINE=InnoDB;
