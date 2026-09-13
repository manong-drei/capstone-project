CREATE TABLE IF NOT EXISTS queue_sequences (
  queue_date DATE NOT NULL,
  category VARCHAR(20) NOT NULL,
  sequence_type VARCHAR(20) NOT NULL,
  last_number INT UNSIGNED NOT NULL,
  PRIMARY KEY (queue_date, category, sequence_type)
) ENGINE=InnoDB;
