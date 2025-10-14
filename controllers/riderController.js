const Order = require('../models/Order');
const Rider = require('../models/Rider');

exports.getDashboard = async (req, res) => {
    try {
        const riderId = req.session.user.id;
        const [activeOrders, rider] = await Promise.all([
            Order.getOrdersByRider(riderId),
            Rider.get(riderId)
        ]);
        
        const stats = {
            assignedCount: activeOrders.filter(d => d.status === 'assigned').length,
            inProgressCount: activeOrders.filter(d => d.status === 'in-progress').length,
            completedCount: activeOrders.filter(d => d.status === 'completed').length,
            currentDeliveries: activeOrders.filter(d => 
                d.status === 'assigned' || d.status === 'in-progress'
            )
        };

        res.render('riderDashboard', {
            title: 'Rider Dashboard',
            ...stats
        });
    } catch (error) {
        console.error('Rider dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
};

exports.updateDeliveryStatus = async (req, res) => {
    try {
        // Deprecated: use startDelivery/completeDelivery endpoints with Order model
        res.redirect('/rider/dashboard');
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).send('Error updating delivery status');
    }
};

// Add more rider controller methods here

exports.startDelivery = async (req, res) => {
    try {
        const riderId = req.session.user.id;
        const orderId = req.params.orderId;
        // Ensure the order is assigned to this rider
        const orders = await Order.getOrdersByRider(riderId);
        const order = orders.find(o => o.id === orderId);
        if (!order || order.status !== 'assigned') {
            return res.status(403).send('Unauthorized');
        }
        await Order.updateStatus(orderId, 'in-progress', riderId);
        res.redirect('/rider/dashboard');
    } catch (error) {
        console.error('Start delivery error:', error);
        res.status(500).send('Error starting delivery');
    }
};

exports.completeDelivery = async (req, res) => {
    try {
        const riderId = req.session.user.id;
        const orderId = req.params.orderId;
        const orders = await Order.getOrdersByRider(riderId);
        const order = orders.find(o => o.id === orderId);
        if (!order || (order.status !== 'in-progress' && order.status !== 'assigned')) {
            return res.status(403).send('Unauthorized');
        }
        await Order.updateStatus(orderId, 'completed', riderId);
        res.redirect('/rider/dashboard');
    } catch (error) {
        console.error('Complete delivery error:', error);
        res.status(500).send('Error completing delivery');
    }
};