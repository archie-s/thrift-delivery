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
        const { deliveryId, status } = req.body;
        const data = await fs.readFile(deliveriesFile, 'utf8');
        const { deliveries } = JSON.parse(data);

        const delivery = deliveries.find(d => d.id === deliveryId);
        if (!delivery || delivery.riderId !== req.session.user.id) {
            return res.status(403).send('Unauthorized');
        }

        delivery.status = status;
        delivery.updatedAt = new Date().toISOString();

        await fs.writeFile(deliveriesFile, JSON.stringify({ deliveries }, null, 2));
        res.redirect('/rider/dashboard');
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).send('Error updating delivery status');
    }
};

// Add more rider controller methods here