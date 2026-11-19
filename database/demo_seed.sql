-- Optional demonstration data. Run AFTER schema.sql. Safe to run once on a fresh database.
USE batloung_farm;
INSERT IGNORE INTO suppliers(business_name,contact_person,phone,province,address) VALUES
('Highveld Fresh Produce','Lerato Mokoena','+27 11 555 0101','Gauteng','Johannesburg, Gauteng, South Africa'),
('Cape Orchard Suppliers','Sipho Daniels','+27 21 555 0102','Western Cape','Cape Town, Western Cape, South Africa'),
('Free State Fruit Co-op','Mpho Molefe','+27 51 555 0103','Free State','Bloemfontein, Free State, South Africa');
INSERT IGNORE INTO vendors(vendor_name,phone_number,location) VALUES
('Maseru Market Traders','+266 5810 1001','Maseru Main Market'),
('Berea Street Vendors','+266 5810 1002','Berea, Maseru'),
('Roma Mini Retailers','+266 5810 1003','Roma, Maseru District');
-- Opening stock demonstrates independent small / medium / large balances.
INSERT INTO stock(fruit_id,packaging_size,available_quantity)
SELECT fruit_id,'small',45 FROM fruits WHERE fruit_name='Apples'
ON DUPLICATE KEY UPDATE available_quantity=VALUES(available_quantity);
INSERT INTO stock(fruit_id,packaging_size,available_quantity)
SELECT fruit_id,'medium',28 FROM fruits WHERE fruit_name='Apples'
ON DUPLICATE KEY UPDATE available_quantity=VALUES(available_quantity);
INSERT INTO stock(fruit_id,packaging_size,available_quantity)
SELECT fruit_id,'large',16 FROM fruits WHERE fruit_name='Apples'
ON DUPLICATE KEY UPDATE available_quantity=VALUES(available_quantity);
INSERT INTO stock(fruit_id,packaging_size,available_quantity)
SELECT fruit_id,'small',38 FROM fruits WHERE fruit_name='Bananas'
ON DUPLICATE KEY UPDATE available_quantity=VALUES(available_quantity);
INSERT INTO stock(fruit_id,packaging_size,available_quantity)
SELECT fruit_id,'medium',22 FROM fruits WHERE fruit_name='Bananas'
ON DUPLICATE KEY UPDATE available_quantity=VALUES(available_quantity);
INSERT INTO stock(fruit_id,packaging_size,available_quantity)
SELECT fruit_id,'large',12 FROM fruits WHERE fruit_name='Bananas'
ON DUPLICATE KEY UPDATE available_quantity=VALUES(available_quantity);

-- One sample multi-line purchase and one sample multi-line sale for report demos.
-- The NOT EXISTS checks make this optional demo section safe to re-run.
SET @demo_supplier = (SELECT supplier_id FROM suppliers WHERE business_name='Highveld Fresh Produce' LIMIT 1);
SET @demo_vendor = (SELECT vendor_id FROM vendors WHERE vendor_name='Maseru Market Traders' LIMIT 1);
SET @apple = (SELECT fruit_id FROM fruits WHERE fruit_name='Apples' LIMIT 1);
SET @orange = (SELECT fruit_id FROM fruits WHERE fruit_name='Oranges' LIMIT 1);
SET @demo_purchase = (SELECT purchase_id FROM purchases WHERE supplier_id=@demo_supplier AND purchase_date='2026-11-15' LIMIT 1);
INSERT INTO purchases(supplier_id,purchase_date,total_amount)
SELECT @demo_supplier,'2026-11-15',3300.00 WHERE @demo_purchase IS NULL;
SET @demo_purchase = COALESCE(@demo_purchase,LAST_INSERT_ID());
INSERT INTO purchase_details(purchase_id,fruit_id,quantity,unit_cost,packaging_size)
SELECT @demo_purchase,@apple,20,55.00,'small'
WHERE NOT EXISTS(SELECT 1 FROM purchase_details WHERE purchase_id=@demo_purchase);
INSERT INTO purchase_details(purchase_id,fruit_id,quantity,unit_cost,packaging_size)
SELECT @demo_purchase,@orange,10,220.00,'large'
WHERE NOT EXISTS(SELECT 1 FROM purchase_details WHERE purchase_id=@demo_purchase AND fruit_id=@orange);
SET @demo_sale = (SELECT sale_id FROM sales WHERE vendor_id=@demo_vendor AND sale_date='2026-11-16' LIMIT 1);
INSERT INTO sales(vendor_id,sale_date,payment_status,total_amount,amount_paid,payment_method)
SELECT @demo_vendor,'2026-11-16','PARTIALLY_PAID',705.00,300.00,'CASH' WHERE @demo_sale IS NULL;
SET @demo_sale = COALESCE(@demo_sale,LAST_INSERT_ID());
INSERT INTO sales_details(sale_id,fruit_id,packaging_size,quantity,unit_price)
SELECT @demo_sale,@apple,'small',3,85.00
WHERE NOT EXISTS(SELECT 1 FROM sales_details WHERE sale_id=@demo_sale);
INSERT INTO sales_details(sale_id,fruit_id,packaging_size,quantity,unit_price)
SELECT @demo_sale,@orange,'medium',3,150.00
WHERE NOT EXISTS(SELECT 1 FROM sales_details WHERE sale_id=@demo_sale AND fruit_id=@orange);
INSERT INTO vendor_payments(sale_id,payment_method,amount,reference_note)
SELECT @demo_sale,'CASH',300.00,'Demonstration partial payment'
WHERE NOT EXISTS(SELECT 1 FROM vendor_payments WHERE sale_id=@demo_sale);
