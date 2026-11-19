function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} was not found.` });
}
function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || (err.code === 'ER_DUP_ENTRY' ? 409 : 500);
  res.status(status).json({ success: false, message: status === 500 ? 'An unexpected server error occurred. Please try again.' : err.message, ...(process.env.NODE_ENV === 'development' ? { detail: err.message } : {}) });
}
module.exports = { notFound, errorHandler };
