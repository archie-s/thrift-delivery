// middleware/authMiddleware.js
module.exports = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    req.flash('error', 'Please log in to view this page');
    res.redirect('/auth/login');
  }
};
