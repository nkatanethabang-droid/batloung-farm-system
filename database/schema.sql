CREATE DATABASE IF NOT EXISTS batloung_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE batloung_farm;

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL UNIQUE,
  province ENUM('Gauteng','Free State','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West') NOT NULL,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fruits (
  fruit_id INT AUTO_INCREMENT PRIMARY KEY,
  fruit_name VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255),
  status ENUM('available','unavailable') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vendors (
  vendor_id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_name VARCHAR(120) NOT NULL,
  phone_number VARCHAR(30) NOT NULL UNIQUE,
  location VARCHAR(500) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  place_id VARCHAR(255) NULL,
  street VARCHAR(255) NULL,
  area VARCHAR(255) NULL,
  town VARCHAR(255) NULL,
  registration_date DATE NOT NULL DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchases (
  purchase_id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_details (
  purchase_detail_id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  fruit_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
  packaging_size ENUM('small','medium','large') NOT NULL,
  CONSTRAINT fk_pd_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id) ON DELETE CASCADE,
  CONSTRAINT fk_pd_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  sale_id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  sale_date DATE NOT NULL,
  payment_status ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  payment_method ENUM('CASH','MOBILE_MONEY','CREDIT') NOT NULL DEFAULT 'CREDIT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales_details (
  sales_detail_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  fruit_id INT NOT NULL,
  packaging_size ENUM('small','medium','large') NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  CONSTRAINT fk_sd_sale FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
  CONSTRAINT fk_sd_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Stock is tracked independently for every fruit and packaging size.
CREATE TABLE IF NOT EXISTS stock (
  stock_id INT AUTO_INCREMENT PRIMARY KEY,
  fruit_id INT NOT NULL,
  packaging_size ENUM('small','medium','large') NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_stock_fruit_size UNIQUE (fruit_id, packaging_size),
  CONSTRAINT fk_stock_fruit FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Extra supporting tables: standard selling prices and payment history.
CREATE TABLE IF NOT EXISTS packaging_prices (
  price_id INT AUTO_INCREMENT PRIMARY KEY,
  fruit_id INT NOT NULL,
  packaging_size ENUM('small','medium','large') NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
  UNIQUE KEY uq_price_fruit_size (fruit_id, packaging_size),
  FOREIGN KEY (fruit_id) REFERENCES fruits(fruit_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vendor_payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method ENUM('CASH','MOBILE_MONEY','CREDIT') NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  reference_note VARCHAR(180),
  FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT IGNORE INTO fruits (fruit_name, description, status) VALUES
('Apples','Fresh apples sourced from South African suppliers','available'),
('Bananas','Fresh bananas for street vendors and retailers','available'),
('Oranges','Fresh oranges','available'),
('Mangoes','Seasonal fresh mangoes','available'),
('Grapes','Fresh table grapes','available');

-- Initial price list is illustrative and can be edited from the application.
INSERT IGNORE INTO packaging_prices (fruit_id, packaging_size, selling_price)
SELECT fruit_id, sizes.packaging_size, sizes.selling_price
FROM fruits
CROSS JOIN (
  SELECT 'small' packaging_size, 85.00 selling_price UNION ALL
  SELECT 'medium', 150.00 UNION ALL SELECT 'large', 260.00
) sizes;

INSERT IGNORE INTO stock (fruit_id, packaging_size, available_quantity)
SELECT fruit_id, sizes.packaging_size, 0 FROM fruits
CROSS JOIN (SELECT 'small' packaging_size UNION ALL SELECT 'medium' UNION ALL SELECT 'large') sizes;
