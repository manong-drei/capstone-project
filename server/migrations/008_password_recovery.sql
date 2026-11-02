CREATE TABLE IF NOT EXISTS password_recoveries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  patient_id INT UNSIGNED NOT NULL,
  phone VARCHAR(11) NOT NULL,
  credential_version INT UNSIGNED NOT NULL,
  otp_hash CHAR(64) NULL,
  reset_token_hash CHAR(64) NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('pending','verified','completed','expired','failed','cancelled') NOT NULL DEFAULT 'pending',
  expires_at DATETIME(3) NOT NULL,
  reset_expires_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX recovery_phone_time (phone, created_at),
  INDEX recovery_user_status (user_id, status),
  INDEX recovery_expiry (status, expires_at)
) ENGINE=InnoDB;
