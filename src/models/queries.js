// Reusable SQL query definitions. Controllers use parameterised statements throughout.
const STOCK_BY_SIZE = `SELECT f.fruit_name, st.fruit_id, st.packaging_size, st.available_quantity
  FROM stock st JOIN fruits f ON f.fruit_id = st.fruit_id
  ORDER BY f.fruit_name, FIELD(st.packaging_size,'small','medium','large')`;
const VENDOR_BALANCES = `SELECT v.vendor_id, v.vendor_name,
  COALESCE(SUM(s.total_amount-s.amount_paid),0) AS outstanding_balance
  FROM vendors v LEFT JOIN sales s ON s.vendor_id=v.vendor_id
  GROUP BY v.vendor_id,v.vendor_name ORDER BY outstanding_balance DESC`;
module.exports = { STOCK_BY_SIZE, VENDOR_BALANCES };
