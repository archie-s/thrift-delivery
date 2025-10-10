const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const managerController = require('../controllers/managerController');


const authMiddleware = require('../middleware/authMiddleware');
router.get('/riders/add', authMiddleware, managerController.renderAddRider);
router.post('/riders/add', authMiddleware, managerController.addRider);


// Middleware to check if user is a manager
const isManager = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'manager') {
        return res.redirect('/auth/login');
    }
    next();
};

router.use(isManager);



// Manager dashboard
router.get('/dashboard', managerController.getDashboard);

// Using this space to add more  manager routes here (add rider, create delivery, etc.)
// Show add rider form
router.get('/riders/add', authMiddleware, managerController.renderAddRider);
// Handle form submission
router.post('/riders/add', authMiddleware, managerController.addRider);

router.get('/riders', authMiddleware, managerController.listRiders);


module.exports = router;