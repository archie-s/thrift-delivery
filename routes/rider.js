const express = require('express');
const router = express.Router();

// Middleware to check if user is a rider
const isRider = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'rider') {
        return res.redirect('/auth/login');
    }
    next();
};

router.use(isRider);

const riderController = require('../controllers/riderController');

// Rider dashboard
router.get('/dashboard', riderController.getDashboard);

// Add more rider routes here (update delivery status, etc.)

module.exports = router;