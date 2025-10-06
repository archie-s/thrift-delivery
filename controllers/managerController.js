const Order = require('../models/Order');
const Rider = require('../models/Rider');

exports.getDashboard = async (req, res) => {
    try {
        const [orders, waitlist, riders] = await Promise.all([
            Order.getAll(),
            Order.getWaitlist(),
            Rider.getAll()
        ]);

        const stats = {
            activeDeliveries: orders.filter(d => d.status === 'in-progress').length,
            availableRiders: riders.filter(r => r.status === 'available').length,
            queuedOrders: waitlist.length,
            recentOrders: orders.slice(0, 5) // Show only recent 5 orders
        };

        res.render('managerDashboard', {
            title: 'Manager Dashboard',
            stats,
            orders,
            riders,
            waitlist
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
};

exports.createDelivery = async (req, res) => {
    try {
        const { customerName, address, items } = req.body;
        const data = await fs.readFile(deliveriesFile, 'utf8');
        const { deliveries } = JSON.parse(data);

        const newDelivery = {
            id: String(deliveries.length + 1),
            customerName,
            address,
            items: JSON.parse(items),
            status: 'pending',
            riderId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        deliveries.push(newDelivery);
        await fs.writeFile(deliveriesFile, JSON.stringify({ deliveries }, null, 2));

        res.redirect('/manager/dashboard');
    } catch (error) {
        console.error('Create delivery error:', error);
        res.status(500).send('Error creating delivery');
    }
};

// Add more manager controller methods here