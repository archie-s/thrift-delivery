const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const managerController = require('../controllers/managerController');
const authMiddleware = require('../middleware/authMiddleware');

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

// Deliveries routes
router.get('/deliveries', managerController.getDeliveries);
router.post('/deliveries/:id/assign-rider', managerController.assignRider);
router.post('/deliveries/:id/cancel', managerController.cancelDelivery);
router.post('/deliveries/:id/delete', managerController.deleteDelivery);

// Rider routes
router.get('/riders/add', managerController.renderAddRider);
router.post('/riders/add', managerController.addRider);
router.get('/riders', managerController.listRiders);

module.exports = router;