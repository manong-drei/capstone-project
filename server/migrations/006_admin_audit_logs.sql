CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_user_id INT UNSIGNED NULL,
  actor_name VARCHAR(200) NOT NULL,
  actor_role VARCHAR(20) NULL,
  is_development BOOLEAN NOT NULL DEFAULT FALSE,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT UNSIGNED NULL,
  outcome ENUM('success', 'failed', 'denied') NOT NULL,
  reason VARCHAR(250) NULL,
  ip_address VARCHAR(45) NULL,
  details JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  INDEX idx_audit_time (created_at, id),
  INDEX idx_audit_actor (actor_user_id, created_at, id),
  INDEX idx_audit_action (action, created_at, id),
  INDEX idx_audit_outcome (outcome, created_at, id)
) ENGINE=InnoDB;
