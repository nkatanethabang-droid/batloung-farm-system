USE batloung_farm;
-- Run once on an existing Batloung Farm database.
ALTER TABLE vendors
  MODIFY location VARCHAR(500) NOT NULL,
  ADD COLUMN latitude DECIMAL(10,7) NULL,
  ADD COLUMN longitude DECIMAL(10,7) NULL,
  ADD COLUMN place_id VARCHAR(255) NULL,
  ADD COLUMN street VARCHAR(255) NULL,
  ADD COLUMN area VARCHAR(255) NULL,
  ADD COLUMN town VARCHAR(255) NULL;
