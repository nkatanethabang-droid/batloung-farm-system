const { pool } = require('../config/db');
const { PROVINCES } = require('../middleware/validate');

const configs = {
  suppliers: { table:'suppliers', id:'supplier_id', fields:['business_name','contact_person','phone','province','address'], required:['business_name','contact_person','phone','province','address'] },
  fruits: { table:'fruits', id:'fruit_id', fields:['fruit_name','description','status'], required:['fruit_name'] },
  vendors: { table:'vendors', id:'vendor_id', fields:['vendor_name','phone_number','location','latitude','longitude','place_id','street','area','town'], required:['vendor_name','phone_number','location'] }
};
function controller(type) {
  const c = configs[type];
  return {
    list: async (req,res,next) => { try {
      let sql = `SELECT * FROM ${c.table}`; const params=[];
      if(type==='vendors' && req.query.search){ sql += ' WHERE vendor_name LIKE ? OR phone_number LIKE ?'; params.push(`%${req.query.search}%`,`%${req.query.search}%`); }
      if(type==='fruits' && req.query.available==='true') sql += " WHERE status='available'";
      const [rows]=await pool.execute(sql,params); res.json({success:true,data:rows});
    } catch(e){next(e);} },
    get: async(req,res,next)=>{try{const [rows]=await pool.execute(`SELECT * FROM ${c.table} WHERE ${c.id}=?`,[req.params.id]); if(!rows.length)return res.status(404).json({success:false,message:'Record not found.'});res.json({success:true,data:rows[0]});}catch(e){next(e);}},
    create: async(req,res,next)=>{try{const missing=c.required.filter(k=>req.body[k]===undefined||String(req.body[k]).trim()==='');if(missing.length)return res.status(400).json({success:false,message:`Missing: ${missing.join(', ')}`});if(type==='suppliers'&&!PROVINCES.includes(req.body.province))return res.status(400).json({success:false,message:'Select a valid South African province.'});const fields=c.fields.filter(k=>req.body[k]!==undefined);const vals=fields.map(k=>req.body[k]);let r;if(type==='vendors'){[r]=await pool.execute(`INSERT INTO vendors (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,vals);}else if(type==='fruits'){const connection=await pool.getConnection();try{await connection.beginTransaction();[r]=await connection.execute(`INSERT INTO fruits (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,vals);for(const size of ['small','medium','large']){await connection.execute('INSERT INTO stock(fruit_id,packaging_size,available_quantity) VALUES(?,?,0)',[r.insertId,size]);await connection.execute('INSERT INTO packaging_prices(fruit_id,packaging_size,selling_price) VALUES(?,?,0)',[r.insertId,size]);}await connection.commit();}catch(err){try{await connection.rollback()}catch{}throw err;}finally{connection.release();}}else{[r]=await pool.execute(`INSERT INTO ${c.table} (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,vals);}res.status(201).json({success:true,message:type==='vendors'?'Vendor registered successfully.':type==='fruits'?'Fruit added with stock rows and editable prices for all three packaging sizes.':'Record created successfully.',id:r.insertId});}catch(e){next(e);}},
    update: async(req,res,next)=>{try{const fields=c.fields.filter(k=>req.body[k]!==undefined);if(!fields.length)return res.status(400).json({success:false,message:'Provide at least one field to update.'});if(type==='suppliers'&&req.body.province&&!PROVINCES.includes(req.body.province))return res.status(400).json({success:false,message:'Select a valid South African province.'});const [r]=await pool.execute(`UPDATE ${c.table} SET ${fields.map(k=>`${k}=?`).join(',')} WHERE ${c.id}=?`,[...fields.map(k=>req.body[k]),req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Record not found.'});res.json({success:true,message:'Record updated.'});}catch(e){next(e);}},
    remove: async(req,res,next)=>{try{const [r]=await pool.execute(`DELETE FROM ${c.table} WHERE ${c.id}=?`,[req.params.id]);if(!r.affectedRows)return res.status(404).json({success:false,message:'Record not found.'});res.json({success:true,message:'Record deleted.'});}catch(e){next(e);}}
  };
}
module.exports = { controller };
