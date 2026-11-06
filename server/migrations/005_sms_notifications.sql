ALTER TABLE users
  ADD COLUMN temp_password_expires_at DATETIME NULL,
  ADD COLUMN temp_password_used_at DATETIME NULL,
  ADD COLUMN credential_version INT UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN login_failures INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN login_locked_until DATETIME NULL;
UPDATE users SET temp_password_expires_at = '2000-01-01 00:00:00' WHERE must_change_password = 1;
ALTER TABLE queues
  ADD COLUMN sms_alert_state ENUM('armed','suppressed','enqueued') NULL,
  ADD COLUMN sms_initial_position INT UNSIGNED NULL,
  ADD COLUMN sms_initial_threshold INT UNSIGNED NULL,
  ADD INDEX queues_sms_order (category, status, created_at);
CREATE TABLE sms_settings (
  id TINYINT UNSIGNED PRIMARY KEY,
  threshold INT UNSIGNED NOT NULL DEFAULT 5,
  next_submission_at DATETIME NULL,
  next_poll_at DATETIME NULL,
  updated_by INT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO sms_settings (id, threshold) VALUES (1, 5);
CREATE TABLE sms_jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purpose ENUM('temporary_password','queue_alert') NOT NULL,
  user_id INT UNSIGNED NULL,
  patient_id INT UNSIGNED NULL,
  queue_id INT UNSIGNED NULL,
  credential_version INT UNSIGNED NULL,
  recipient VARCHAR(11) NOT NULL,
  deduplication_key VARCHAR(100) NOT NULL UNIQUE,
  payload TEXT NULL,
  state ENUM('queued','submitting','submitted','failed','unknown','cancelled') NOT NULL DEFAULT 'queued',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  provider_message_id BIGINT UNSIGNED NULL,
  provider_status VARCHAR(20) NULL,
  last_error VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX sms_due (state, next_attempt_at),
  INDEX sms_account (user_id, id)
);
CREATE TABLE sms_password_audit (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  actor_user_id INT UNSIGNED NOT NULL,
  credential_version INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
