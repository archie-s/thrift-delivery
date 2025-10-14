const express = require('express');
const router = express.Router();
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

// Riders management
router.get('/riders/add', authMiddleware, managerController.renderAddRider);
router.post('/riders/add', authMiddleware, managerController.addRider);
router.get('/riders', authMiddleware, managerController.listRiders);
router.post('/riders/:riderId/delete', authMiddleware, managerController.deleteRider);

// Deliveries (orders)
router.get('/deliveries/add', authMiddleware, managerController.renderAddDelivery);
router.post('/deliveries/add', authMiddleware, managerController.addDelivery);
router.get('/deliveries', authMiddleware, managerController.listDeliveries);
router.get('/deliveries/:orderId', authMiddleware, managerController.viewDelivery);
router.post('/deliveries/:orderId/cancel', authMiddleware, managerController.cancelDelivery);
router.post('/deliveries/:orderId/delete', authMiddleware, managerController.deleteDelivery);

// Assign rider to an order
router.get('/assign-rider/:orderId', authMiddleware, managerController.renderAssignRider);
router.post('/assign-rider/:orderId', authMiddleware, managerController.assignRider);

module.exports = router;