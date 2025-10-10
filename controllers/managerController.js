const Order = require('../models/Order');
const Rider = require('../models/Rider');
const { readUsersFile, writeUsersFile } = require('../utils/fileHandler');


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

//Kris work(rider details and adding rider)

// Adding a new rider

// Show the form
exports.renderAddRider = (req, res) => {
    res.render('addRiders', {
        title: 'Add Rider',
        error: req.flash('error'),
        success: req.flash('success')
    });
};

// Process the form
exports.addRider = async (req, res) => {
    const { name, email, contact } = req.body;
    if (!name || !email || !contact) {
        req.flash('error', 'All fields are required');
        return res.redirect('/manager/riders/add');
    }
    try {
        // Read current users
        const data = await readUsersFile(); // Or your riders JSON file
        // Check for duplicate email
        if (data.users.find(u => u.email === email)) {
            req.flash('error', 'Email already exists');
            return res.redirect('/manager/riders/add');
        }
        const newRider = {
            id: String(data.users.length + 1),
            name,
            email,
            contact,
            role: 'rider',
            status: 'available',
            createdAt: new Date().toISOString(),
        };
        data.users.push(newRider);
        await writeUsersFile(data);
        req.flash('success', 'Rider added successfully');
        res.redirect('/manager/riders'); // Or wherever you list riders
    } catch (err) {
        req.flash('error', 'An error occurred while adding the rider');
        res.redirect('/manager/riders/add');
    }
};

// List all riders
exports.listRiders = async (req, res) => {
    try {
        const data = await readUsersFile();
        const riders = data.users.filter(user => user.role === 'rider');
        res.render('ridersList', {
            title: 'Riders List',
            riders,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        req.flash('error', 'Unable to load riders list');
        res.redirect('/manager/dashboard');
    }
};
