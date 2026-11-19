const { pool } = require('../config/db');
const { inTransaction } = require('../services/transactions');
const sizes=['small','medium','large'];
function validItems(items, mode){return Array.isArray(items)&&items.length>0&&items.every(i=>Number.isInteger(Number(i.fruit_id))&&Number(i.fruit_id)>0&&Number.isInteger(Number(i.quantity))&&Number(i.quantity)>0&&sizes.includes(i.packaging_size)&&(mode==='sale'||(Number.isFinite(Number(i.unit_cost))&&Number(i.unit_cost)>=0)));}
async function purchase(req,res,next){try{const {supplier_id,purchase_date,items}=req.body;if(!supplier_id||!validItems(items,'purchase'))return res.status(400).json({success:false,message:'Provide a supplier, date and valid purchase items (fruit, size, positive quantity and unit cost).'});const result=await inTransaction(async c=>{const [sup]=await c.execute('SELECT supplier_id FROM suppliers WHERE supplier_id=?',[supplier_id]);if(!sup.length){const e=new Error('Supplier not found.');e.status=404;throw e;}let total=0;for(const item of items)total+=Number(item.quantity)*Number(item.unit_cost);const [p]=await c.execute('INSERT INTO purchases(supplier_id,purchase_date,total_amount) VALUES(?,?,?)',[supplier_id,purchase_date||new Date().toISOString().slice(0,10),total]);for(const item of items){await c.execute('INSERT INTO purchase_details(purchase_id,fruit_id,quantity,unit_cost,packaging_size) VALUES(?,?,?,?,?)',[p.insertId,item.fruit_id,item.quantity,item.unit_cost,item.packaging_size]);const [s]=await c.execute('SELECT stock_id FROM stock WHERE fruit_id=? AND packaging_size=? FOR UPDATE',[item.fruit_id,item.packaging_size]);if(s.length)await c.execute('UPDATE stock SET available_quantity=available_quantity+? WHERE stock_id=?',[item.quantity,s[0].stock_id]);else await c.execute('INSERT INTO stock(fruit_id,packaging_size,available_quantity) VALUES(?,?,?)',[item.fruit_id,item.packaging_size,item.quantity]);}return {purchase_id:p.insertId,total_amount:total};});res.status(201).json({success:true,message:'Purchase recorded and stock increased.',data:result});}catch(e){next(e);}}
async function sale(req,res,next){
  try {
    const {vendor_id,sale_date,items,payment_method='CREDIT',amount_paid=0}=req.body;
    if(!Number.isInteger(Number(vendor_id))||Number(vendor_id)<=0||!validItems(items,'sale')||!['CASH','MOBILE_MONEY','CREDIT'].includes(payment_method)||!Number.isFinite(Number(amount_paid))||Number(amount_paid)<0){
      return res.status(400).json({success:false,message:'Provide a valid vendor, sale items, payment method and non-negative amount_paid.'});
    }
    const result=await inTransaction(async c=>{
      const [v]=await c.execute('SELECT vendor_id, vendor_name FROM vendors WHERE vendor_id=?',[vendor_id]);
      if(!v.length){const e=new Error('Vendor not found.');e.status=404;throw e;}

      // Combine repeated fruit/size lines before checking stock. This prevents
      // two separate lines from using the same available boxes twice.
      const grouped=new Map();
      for(const item of items){
        const key=`${Number(item.fruit_id)}-${item.packaging_size}`;
        const current=grouped.get(key)||{fruit_id:Number(item.fruit_id),packaging_size:item.packaging_size,quantity:0};
        current.quantity+=Number(item.quantity); grouped.set(key,current);
      }
      const stockChecks=[...grouped.values()].sort((a,b)=>a.fruit_id-b.fruit_id||sizes.indexOf(a.packaging_size)-sizes.indexOf(b.packaging_size));
      const priceMap=new Map(); let total=0;
      for(const item of stockChecks){
        const [rows]=await c.execute(`SELECT st.available_quantity,p.selling_price
          FROM stock st LEFT JOIN packaging_prices p ON p.fruit_id=st.fruit_id AND p.packaging_size=st.packaging_size
          WHERE st.fruit_id=? AND st.packaging_size=? FOR UPDATE`,[item.fruit_id,item.packaging_size]);
        if(!rows.length||Number(rows[0].available_quantity)<item.quantity){
          const e=new Error(`Not enough ${item.packaging_size} boxes for fruit ID ${item.fruit_id}. The whole sale was cancelled and stock was not changed.`);e.status=400;throw e;
        }
        if(rows[0].selling_price===null){const e=new Error(`A selling price has not been set for fruit ID ${item.fruit_id} (${item.packaging_size}).`);e.status=400;throw e;}
        priceMap.set(`${item.fruit_id}-${item.packaging_size}`,Number(rows[0].selling_price));
      }
      // Prices come from the database, not from browser-submitted values.
      const pricedItems=items.map(item=>({...item,unit_price:priceMap.get(`${Number(item.fruit_id)}-${item.packaging_size}`)}));
      for(const item of pricedItems) total+=Number(item.quantity)*item.unit_price;
      if(Number(amount_paid)>total){const e=new Error('Amount paid cannot exceed the sale total.');e.status=400;throw e;}
      const paid=Number(amount_paid), status=paid===0?'UNPAID':paid>=total?'PAID':'PARTIALLY_PAID';
      const [saleRow]=await c.execute('INSERT INTO sales(vendor_id,sale_date,payment_status,total_amount,amount_paid,payment_method) VALUES(?,?,?,?,?,?)',[vendor_id,sale_date||new Date().toISOString().slice(0,10),status,total,paid,payment_method]);
      for(const item of pricedItems){
        await c.execute('INSERT INTO sales_details(sale_id,fruit_id,packaging_size,quantity,unit_price) VALUES(?,?,?,?,?)',[saleRow.insertId,item.fruit_id,item.packaging_size,item.quantity,item.unit_price]);
      }
      for(const item of stockChecks){
        await c.execute('UPDATE stock SET available_quantity=available_quantity-? WHERE fruit_id=? AND packaging_size=?',[item.quantity,item.fruit_id,item.packaging_size]);
      }
      let initialPayment=null;
      if(paid>0) {
        const [paymentRow]=await c.execute('INSERT INTO vendor_payments(sale_id,payment_method,amount,reference_note) VALUES(?,?,?,?)',[saleRow.insertId,payment_method,paid,req.body.reference_note||null]);
        initialPayment={payment_id:paymentRow.insertId,receipt_number:`PAY-${String(paymentRow.insertId).padStart(8,'0')}`,amount:paid,payment_method};
      }
      const [receiptItems]=await c.execute(`SELECT f.fruit_name,sd.packaging_size,sd.quantity,sd.unit_price
        FROM sales_details sd JOIN fruits f ON f.fruit_id=sd.fruit_id WHERE sd.sale_id=? ORDER BY sd.sales_detail_id`,[saleRow.insertId]);
      return {sale_id:saleRow.insertId,receipt_number:`SALE-${String(saleRow.insertId).padStart(8,'0')}`,vendor_name:v[0].vendor_name,sale_date:sale_date||new Date().toISOString().slice(0,10),items:receiptItems,total_amount:total,amount_paid:paid,outstanding_balance:total-paid,payment_status:status,payment:initialPayment};
    });
    res.status(201).json({success:true,message:'Sale recorded; stock reduced.',data:result});
  } catch(e){next(e);}
}
async function addPayment(req,res,next){try{const {amount,payment_method,reference_note}=req.body;if(!Number.isFinite(Number(amount))||Number(amount)<=0||!['CASH','MOBILE_MONEY','CREDIT'].includes(payment_method))return res.status(400).json({success:false,message:'A positive payment amount and valid method are required.'});const result=await inTransaction(async c=>{const [rows]=await c.execute('SELECT s.*,v.vendor_name FROM sales s JOIN vendors v ON v.vendor_id=s.vendor_id WHERE s.sale_id=? FOR UPDATE',[req.params.saleId]);if(!rows.length){const e=new Error('Sale not found.');e.status=404;throw e;}const sale=rows[0], outstanding=Number(sale.total_amount)-Number(sale.amount_paid);if(Number(amount)>outstanding){const e=new Error(`Payment exceeds outstanding balance of ${outstanding.toFixed(2)}.`);e.status=400;throw e;}const paid=Number(sale.amount_paid)+Number(amount),status=paid>=Number(sale.total_amount)?'PAID':'PARTIALLY_PAID';const [paymentRow]=await c.execute('INSERT INTO vendor_payments(sale_id,payment_method,amount,reference_note) VALUES(?,?,?,?)',[req.params.saleId,payment_method,amount,reference_note||null]);await c.execute('UPDATE sales SET amount_paid=?,payment_status=?,payment_method=? WHERE sale_id=?',[paid,status,payment_method,req.params.saleId]);return {sale_id:Number(req.params.saleId),payment_id:paymentRow.insertId,receipt_number:`PAY-${String(paymentRow.insertId).padStart(8,'0')}`,payment_date:new Date().toISOString(),payment_amount:Number(amount),payment_method,vendor_name:sale.vendor_name,total_amount:Number(sale.total_amount),amount_paid:paid,outstanding_balance:Number(sale.total_amount)-paid,payment_status:status};});res.status(201).json({success:true,message:'Payment recorded.',data:result});}catch(e){next(e);}}
module.exports={purchase,sale,addPayment};
