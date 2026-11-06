ALTER TABLE queues
  ADD COLUMN status_reason VARCHAR(255) NULL AFTER status;
