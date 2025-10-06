const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Middleware to check if user is a manager
const isManager = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'manager') {
        return res.redirect('/auth/login');
    }
    next();
};

router.use(isManager);

const managerController = require('../controllers/managerController');

// Manager dashboard
router.get('/dashboard', managerController.getDashboard);

// Add more manager routes here (add rider, create delivery, etc.)

module.exports = router;