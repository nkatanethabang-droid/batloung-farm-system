const SIZES = ['small', 'medium', 'large'];
const PROVINCES = ['Gauteng','Free State','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West'];
function required(fields) { return (req, res, next) => { const missing = fields.filter(f => req.body[f] === undefined || req.body[f] === null || String(req.body[f]).trim() === ''); if (missing.length) return res.status(400).json({ success:false, message:`Required fields missing: ${missing.join(', ')}` }); next(); }; }
function positiveNumber(value) { return Number.isFinite(Number(value)) && Number(value) > 0; }
module.exports = { SIZES, PROVINCES, required, positiveNumber };
