require('dotenv').config();
const {pool}=require('./src/config/db');
const {hashPassword}=require('./src/auth/security');
(async()=>{const username=process.env.ADMIN_USERNAME||'admin';const password=process.env.ADMIN_PASSWORD;if(!password||password.length<10){console.error('Set ADMIN_PASSWORD to at least 10 characters in .env, then run: node scripts_create_admin.js');process.exit(1)}try{await pool.execute("INSERT INTO users(username,password_hash,role,vendor_id) VALUES(?,?,'admin',NULL) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash),role='admin',vendor_id=NULL,is_active=1",[username,hashPassword(password)]);console.log(`Administrator account ready: ${username}`)}catch(e){console.error(e.message);process.exitCode=1}finally{await pool.end()}})();
