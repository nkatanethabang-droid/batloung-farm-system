const {pool}=require('../config/db');
const {verifyPassword,signToken,hashPassword}=require('../auth/security');
async function login(req,res,next){try{const {username,password,role}=req.body;if(!username||!password)return res.status(400).json({success:false,message:'Enter administrator username and password.'});const [rows]=await pool.execute('SELECT user_id,username,password_hash,role,vendor_id,is_active FROM users WHERE username=? AND role=? LIMIT 1',[String(username).trim(),'admin']);if(!rows.length||!rows[0].is_active||!verifyPassword(password,rows[0].password_hash))return res.status(401).json({success:false,message:'Incorrect username or password.'});const u=rows[0];const user={user_id:u.user_id,username:u.username,role:u.role,vendor_id:u.vendor_id};res.json({success:true,token:signToken(user),user});}catch(e){next(e)}}
async function me(req,res){res.json({success:true,user:req.user})}

async function registerVendor(req,res,next){
  let c;
  try{
    c=await pool.getConnection();
    const {vendor_name,phone_number,location,username,password}=req.body;
    if(!vendor_name||!phone_number||!location||!username||!password||String(password).length<10)
      return res.status(400).json({success:false,message:'Complete all fields. Password must be at least 10 characters.'});
    await c.beginTransaction();
    const [v]=await c.execute('INSERT INTO vendors(vendor_name,phone_number,location) VALUES(?,?,?)',[String(vendor_name).trim(),String(phone_number).trim(),String(location).trim()]);
    await c.execute("INSERT INTO users(username,password_hash,role,vendor_id) VALUES(?,?,'vendor',?)",[String(username).trim(),hashPassword(password),v.insertId]);
    await c.commit();
    res.status(201).json({success:true,message:'Vendor account created. You can now log in.'});
  }catch(e){if(c){try{await c.rollback()}catch{}}if(e.code==='ER_DUP_ENTRY')return res.status(409).json({success:false,message:'That username or phone number is already registered.'});next(e)}
  finally{if(c)c.release()}
}
async function createVendorAccount(req,res,next){try{const {username,password}=req.body;if(!username||!password||String(password).length<10)return res.status(400).json({success:false,message:'Username and password (at least 10 characters) are required.'});const [v]=await pool.execute('SELECT vendor_id FROM vendors WHERE vendor_id=?',[req.params.vendorId]);if(!v.length)return res.status(404).json({success:false,message:'Vendor not found.'});await pool.execute("INSERT INTO users(username,password_hash,role,vendor_id) VALUES(?,?,'vendor',?)",[String(username).trim(),hashPassword(password),req.params.vendorId]);res.status(201).json({success:true,message:'Vendor login account created.'});}catch(e){next(e)}}
async function vendorPortal(req,res,next){try{if(req.user.role!=='vendor'||!req.user.vendor_id)return res.status(403).json({success:false,message:'Vendor account required.'});const [rows]=await pool.execute(`SELECT s.sale_id,s.sale_date,s.payment_status,s.total_amount,s.amount_paid,(s.total_amount-s.amount_paid) outstanding_balance,s.payment_method FROM sales s WHERE s.vendor_id=? ORDER BY s.sale_date DESC,s.sale_id DESC`,[req.user.vendor_id]);res.json({success:true,data:rows})}catch(e){next(e)}}
module.exports = { login, me, registerVendor, createVendorAccount, vendorPortal };
