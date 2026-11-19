USE batloung_farm;
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  role ENUM('admin','vendor') NOT NULL,
  vendor_id INT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  CONSTRAINT chk_user_role_vendor CHECK ((role='vendor' AND vendor_id IS NOT NULL) OR (role='admin' AND vendor_id IS NULL))
) ENGINE=InnoDB;

-- Upgrade existing installations created with the earlier 160-character column.
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(200) NOT NULL;
