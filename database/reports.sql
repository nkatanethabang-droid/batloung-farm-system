USE batloung_farm;

-- 1. Five most frequently sold fruits (by total boxes sold)
SELECT f.fruit_name, SUM(sd.quantity) AS boxes_sold
FROM sales_details sd JOIN fruits f ON f.fruit_id = sd.fruit_id
GROUP BY f.fruit_id, f.fruit_name ORDER BY boxes_sold DESC LIMIT 5;

-- 2. Sales revenue in a chosen date range (replace the dates)
SELECT COALESCE(SUM(total_amount),0) AS total_sales_revenue
FROM sales WHERE sale_date BETWEEN '2026-11-01' AND '2026-11-30';

-- 3. Vendor who purchased the highest number of boxes
SELECT v.vendor_name, SUM(sd.quantity) AS boxes_purchased
FROM sales s JOIN vendors v ON v.vendor_id = s.vendor_id
JOIN sales_details sd ON sd.sale_id = s.sale_id
GROUP BY v.vendor_id, v.vendor_name ORDER BY boxes_purchased DESC LIMIT 1;

-- 4. Current stock for each fruit and packaging size
SELECT f.fruit_name, st.packaging_size, st.available_quantity
FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id
ORDER BY f.fruit_name, FIELD(st.packaging_size,'small','medium','large');

-- Vendor outstanding balances
SELECT v.vendor_id, v.vendor_name,
       COALESCE(SUM(s.total_amount - s.amount_paid),0) AS outstanding_balance
FROM vendors v LEFT JOIN sales s ON s.vendor_id = v.vendor_id
GROUP BY v.vendor_id, v.vendor_name ORDER BY outstanding_balance DESC;
