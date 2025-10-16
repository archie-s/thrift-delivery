const Order = require('../models/Order');
const Rider = require('../models/Rider');
const { readUsersFile, writeUsersFile } = require('../utils/fileHandler');
const bcrypt = require('bcrypt');


exports.getDashboard = async (req, res) => {
    try {
        const [orders, waitlist, usersData] = await Promise.all([
            Order.getAll(),
            Order.getWaitlist(),
            readUsersFile()
        ]);

        const riders = usersData.users.filter(u => u.role === 'rider');

        const ordersWithRiderNames = orders.map(o => ({
            ...o,
            riderName: riders.find(r => r.id === o.riderId)?.name || null
        }));

        const stats = {
            // Active = currently assigned to a rider (regardless of status)
            activeDeliveries: orders.filter(d => !!d.riderId).length,
            availableRiders: riders.filter(r => r.status === 'available').length,
            queuedOrders: waitlist.length,
            recentOrders: ordersWithRiderNames.slice(0, 5)
        };

        res.render('managerDashboard', {
            title: 'Manager Dashboard',
            stats,
            orders: ordersWithRiderNames,
            riders,
            waitlist
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
};

// Render add delivery (order) form
exports.renderAddDelivery = async (req, res) => {
    try {
        // Source riders from users.json so all registered riders appear
        const usersData = await readUsersFile();
        const riders = usersData.users.filter(u => u.role === 'rider');
        res.render('addDelivery', {
            title: 'Add Delivery',
            riders,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        req.flash('error', 'Unable to load add delivery form');
        res.redirect('/manager/dashboard');
    }
};

// Handle add delivery submission
exports.addDelivery = async (req, res) => {
    try {
        const { customerName, address, pickupLocation, dropoffLocation, riderId } = req.body;
        // items[] inputs come in as an array
        let items = req.body['items[]'] || req.body.items;

        // Normalize items to array of strings
        if (!items) {
            req.flash('error', 'Customer name, address, pickup, dropoff and items are required');
            return res.redirect('/manager/deliveries/add');
        }
        if (!Array.isArray(items)) {
            // Could be single value or comma-separated
            items = String(items).trim().startsWith('[') ? JSON.parse(items) : String(items).split(',').map(s => s.trim()).filter(Boolean);
        } else {
            items = items.map(i => String(i).trim()).filter(Boolean);
        }

        if (!customerName || !address || !pickupLocation || !dropoffLocation || items.length === 0) {
            req.flash('error', 'Customer name, address, pickup, dropoff and items are required');
            return res.redirect('/manager/deliveries/add');
        }

        const newOrder = await Order.create({
            customerName,
            address,
            pickupLocation,
            dropoffLocation,
            items,
            riderId: riderId || null
        });

        if (riderId) {
            await Order.updateStatus(newOrder.id, 'assigned', riderId);
        }

        req.flash('success', 'Delivery created successfully');
        res.redirect('/manager/dashboard');
    } catch (error) {
        console.error('Add delivery error:', error);
        req.flash('error', 'Error creating delivery');
        res.redirect('/manager/deliveries/add');
    }
};

// List all deliveries (orders)
exports.listDeliveries = async (req, res) => {
    try {
        const [orders, usersData] = await Promise.all([
            Order.getAll(),
            readUsersFile()
        ]);
        const riders = usersData.users.filter(u => u.role === 'rider');
        let ordersWithRiderNames = orders.map(o => ({
            ...o,
            riderName: riders.find(r => r.id === o.riderId)?.name || null
        }));

        const { status, rider, dropoff, pickup, customer, id } = req.query;
        const ciIncludes = (a = '', b = '') => String(a).toLowerCase().includes(String(b).toLowerCase());

        if (status && status.trim()) {
            ordersWithRiderNames = ordersWithRiderNames.filter(o => o.status === status);
        }
        if (rider && rider.trim()) {
            ordersWithRiderNames = ordersWithRiderNames.filter(o =>
                ciIncludes(o.riderName || '', rider) || ciIncludes(o.riderId || '', rider)
            );
        }
        if (dropoff && dropoff.trim()) {
            ordersWithRiderNames = ordersWithRiderNames.filter(o => ciIncludes(o.dropoffLocation || '', dropoff));
        }
        if (pickup && pickup.trim()) {
            ordersWithRiderNames = ordersWithRiderNames.filter(o => ciIncludes(o.pickupLocation || '', pickup));
        }
        if (customer && customer.trim()) {
            ordersWithRiderNames = ordersWithRiderNames.filter(o => ciIncludes(o.customerName || '', customer));
        }
        if (id && id.trim()) {
            ordersWithRiderNames = ordersWithRiderNames.filter(o => ciIncludes(o.id || '', id));
        }

        res.render('deliveriesList', {
            title: 'All Deliveries',
            orders: ordersWithRiderNames,
            query: { status: status || '', rider: rider || '', dropoff: dropoff || '', pickup: pickup || '', customer: customer || '', id: id || '' }
        });
    } catch (error) {
        req.flash('error', 'Unable to load deliveries');
        res.redirect('/manager/dashboard');
    }
};

// View a single delivery (order)
exports.viewDelivery = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const [orders, usersData] = await Promise.all([
            Order.getAll(),
            readUsersFile()
        ]);
        const riders = usersData.users.filter(u => u.role === 'rider');
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/manager/deliveries');
        }
        const riderName = riders.find(r => r.id === order.riderId)?.name || null;
        res.render('deliveryDetail', {
            title: `Delivery ${order.id}`,
            order: { ...order, riderName }
        });
    } catch (error) {
        req.flash('error', 'Unable to load delivery');
        res.redirect('/manager/deliveries');
    }
};

exports.cancelDelivery = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        // Verify order exists
        const orders = await Order.getAll();
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/manager/deliveries');
        }
        await Order.cancel(orderId);
        req.flash('success', 'Delivery cancelled');
        res.redirect('/manager/dashboard');
    } catch (error) {
        console.error('Cancel delivery error:', error);
        req.flash('error', 'Unable to cancel delivery');
        res.redirect(`/manager/deliveries/${req.params.orderId}`);
    }
};

exports.deleteDelivery = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        // Verify order exists
        const orders = await Order.getAll();
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/manager/deliveries');
        }
        await Order.delete(orderId);
        req.flash('success', 'Delivery deleted');
        res.redirect('/manager/dashboard');
    } catch (error) {
        console.error('Delete delivery error:', error);
        req.flash('error', 'Unable to delete delivery');
        res.redirect(`/manager/deliveries/${req.params.orderId}`);
    }
};

// Render assign rider page for a specific order
exports.renderAssignRider = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const [orders, usersData] = await Promise.all([
            Order.getAll(),
            readUsersFile()
        ]);
        const riders = usersData.users.filter(u => u.role === 'rider');
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/manager/dashboard');
        }
        res.render('assignRider', {
            title: 'Assign Rider',
            order,
            riders,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        req.flash('error', 'Unable to load assign rider page');
        res.redirect('/manager/dashboard');
    }
};

// Handle assignment submission
exports.assignRider = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { riderId } = req.body;
        if (!riderId) {
            req.flash('error', 'Please select a rider');
            return res.redirect(`/manager/assign-rider/${orderId}`);
        }
        await Order.updateStatus(orderId, 'assigned', riderId);
        req.flash('success', 'Rider assigned successfully');
        res.redirect('/manager/dashboard');
    } catch (error) {
        console.error('Assign rider error:', error);
        req.flash('error', 'Failed to assign rider');
        res.redirect('/manager/dashboard');
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
    const { name, email, contact, password, confirmPassword } = req.body;
    if (!name || !email || !contact || !password || !confirmPassword) {
        req.flash('error', 'All fields are required');
        return res.redirect('/manager/riders/add');
    }
    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/manager/riders/add');
    }

    // Validate contact: 10-12 digits
    const contactDigits = String(contact).replace(/\D/g, '');
    if (contactDigits.length < 10 || contactDigits.length > 12) {
        req.flash('error', 'Contact number must be 10 to 12 digits');
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
        const hashedPassword = await bcrypt.hash(password, 10);
        const newRider = {
            id: String(data.users.length + 1),
            name,
            email,
            contact: contactDigits,
            role: 'rider',
            status: 'available',
            password: hashedPassword,
            mustResetPassword: true,
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

exports.deleteRider = async (req, res) => {
    try {
        const riderId = req.params.riderId;
        const data = await readUsersFile();
        const before = data.users.length;

        // Remove any user matching the rider id and role 'rider'
        data.users = data.users.filter(u => !(u.role === 'rider' && String(u.id) === String(riderId)));

        if (data.users.length === before) {
            req.flash('error', `Rider with id ${riderId} not found`);
            return res.redirect('/manager/riders');
        }

        // Write updated users file
        await writeUsersFile(data);

        // Re-read to verify persistence
        const verify = await readUsersFile();
        const stillExists = verify.users.some(u => u.role === 'rider' && String(u.id) === String(riderId));
        if (stillExists) {
            console.error(`Failed to remove rider ${riderId} from users.json`);
            req.flash('error', 'Failed to delete rider (could not persist change)');
            return res.redirect('/manager/riders');
        }

        req.flash('success', 'Rider deleted');
        // Save session to ensure flash and session persist before redirect
        return req.session.save(err => {
            if (err) console.error('Session save error after deleting rider:', err);
            return res.redirect('/manager/riders');
        });
    } catch (error) {
        console.error('Delete rider error:', error);
        req.flash('error', 'Failed to delete rider');
        return req.session.save(err => {
            if (err) console.error('Session save error on failure to delete rider:', err);
            return res.redirect('/manager/riders');
        });
    }
};
