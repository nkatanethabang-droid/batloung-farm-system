const crypto = require('crypto');
const SECRET = process.env.AUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-secret-change-before-deployment');
if (!SECRET) throw new Error('AUTH_SECRET must be set in the environment before starting in production.');
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, key] = String(stored || '').split(':');
  if (!salt || !key) return false;
  const actual = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(key, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function signToken(user) {
  const payload = Buffer.from(JSON.stringify({ user_id:user.user_id, username:user.username, role:user.role, vendor_id:user.vendor_id || null, exp:Date.now()+8*60*60*1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function authRequired(req,res,next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    if (!token || !token.includes('.')) throw new Error('Missing token');
    const [payload, signature] = token.split('.');
    if (!payload || !signature) throw new Error('Invalid token');
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error('Invalid token');
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!user.exp || user.exp < Date.now()) throw new Error('Expired token');
    req.user = user; next();
  } catch { res.status(401).json({success:false,message:'Please log in to continue.'}); }
}
function adminOnly(req,res,next) { if(req.user?.role !== 'admin') return res.status(403).json({success:false,message:'Administrator access is required.'}); next(); }
module.exports = { hashPassword, verifyPassword, signToken, authRequired, adminOnly };
