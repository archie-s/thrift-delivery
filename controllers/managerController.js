const fs = require('fs').promises;
const path = require('path');
const { readUsersFile, writeUsersFile } = require('../utils/fileHandler');

// File paths
const deliveriesFilePath = path.join(__dirname, '../data/deliveries.json');
const usersFilePath = path.join(__dirname, '../data/users.json');

// Helper function to read deliveries.json
async function readDeliveriesFile() {
    try {
        const data = await fs.readFile(deliveriesFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading deliveries file:', error);
        return { deliveries: [] };
    }
}

// Helper function to write deliveries.json
async function writeDeliveriesFile(data) {
    try {
        await fs.writeFile(deliveriesFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing deliveries file:', error);
        throw error;
    }
}

// CENTRALIZED CONSISTENT RIDER FETCHING
async function getAvailableRiders() {
    try {
        const usersData = await readUsersFile();
        const users = usersData.users || [];
        
        const availableRiders = users.filter(user => 
            user.role === 'rider' && (user.status === 'available' || user.status === undefined)
        );

        //console.log('getAvailableRiders found:', availableRiders.length, 'riders');
        return availableRiders;
    } catch (error) {
        console.error('Error getting available riders:', error);
        return [];
    }
}

async function getAllRiders() {
    try {
        const usersData = await readUsersFile();
        const users = usersData.users || [];
        const riders = users.filter(user => user.role === 'rider');
        
        //console.log('getAllRiders found:', riders.length, 'riders');
        return riders;
    } catch (error) {
        console.error('Error getting all riders:', error);
        return [];
    }
}

// UPDATED CONTROLLERS - USING CENTRALIZED FUNCTIONS
exports.getDashboard = async (req, res) => {
    try {
        console.log('Fetching dashboard data...');
        
        // Use centralized functions for consistent data
        const [deliveriesData, riders, availableRiders] = await Promise.all([
            readDeliveriesFile(),
            getAllRiders(),
            getAvailableRiders()
        ]);

        const deliveries = deliveriesData.deliveries || [];

        //console.log('Dashboard - Total riders:', riders.length);
        //console.log('Dashboard - Available riders:', availableRiders.length);

        const stats = {
            activeDeliveries: deliveries.filter(d => d.status === 'pending').length,
            availableRiders: availableRiders.length,
            queuedOrders: deliveries.filter(d => d.riderId === null).length,
            recentOrders: deliveries.filter(d => d.status === 'completed').slice(0, 3)
        };

        //console.log('Dashboard Stats:', stats);

        res.render('managerDashboard', {
            title: 'Manager Dashboard',
            stats,
            orders: deliveries,
            riders,
            waitlist: deliveries.filter(d => d.riderId === null)
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
};

exports.getDeliveries = async (req, res) => {
    try {
        const [deliveriesData, availableRiders] = await Promise.all([
            readDeliveriesFile(),
            getAvailableRiders() // Use the same centralized function
        ]);

        const deliveries = deliveriesData.deliveries || [];

        //console.log('Deliveries - Available riders:', availableRiders.length);

        res.render('partials/deliveries', {
            title: 'All Deliveries',
            deliveries,
            availableRiders,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Get deliveries error:', error);
        req.flash('error', 'Error loading deliveries');
        res.redirect('/manager/dashboard');
    }
};

// Assign rider to delivery (SIMPLIFIED - no status changes)
exports.assignRider = async (req, res) => {
    try {
        const { id } = req.params;
        const { riderId } = req.body;

        if (!riderId) {
            req.flash('error', 'Please select a rider');
            return res.redirect('/manager/deliveries');
        }

        const deliveriesData = await readDeliveriesFile();
        const deliveries = deliveriesData.deliveries || [];

        const deliveryIndex = deliveries.findIndex(d => d.id === id);
        if (deliveryIndex === -1) {
            req.flash('error', 'Delivery not found');
            return res.redirect('/manager/deliveries');
        }

        // Update delivery only - no rider status changes
        deliveries[deliveryIndex].riderId = riderId;
        deliveries[deliveryIndex].status = 'in-progress';
        deliveries[deliveryIndex].updatedAt = new Date().toISOString();

        await writeDeliveriesFile({ deliveries });

        req.flash('success', 'Rider assigned successfully');
        res.redirect('/manager/deliveries');
    } catch (error) {
        console.error('Assign rider error:', error);
        req.flash('error', 'Error assigning rider');
        res.redirect('/manager/deliveries');
    }
};

// Cancel delivery (SIMPLIFIED - no rider status changes)
exports.cancelDelivery = async (req, res) => {
    try {
        const { id } = req.params;

        const deliveriesData = await readDeliveriesFile();
        const deliveries = deliveriesData.deliveries || [];

        const deliveryIndex = deliveries.findIndex(d => d.id === id);
        if (deliveryIndex === -1) {
            req.flash('error', 'Delivery not found');
            return res.redirect('/manager/deliveries');
        }

        // Mark as cancelled only - no rider status changes
        deliveries[deliveryIndex].status = 'cancelled';
        deliveries[deliveryIndex].updatedAt = new Date().toISOString();

        await writeDeliveriesFile({ deliveries });

        req.flash('success', 'Delivery cancelled successfully');
        res.redirect('/manager/deliveries');
    } catch (error) {
        console.error('Cancel delivery error:', error);
        req.flash('error', 'Error cancelling delivery');
        res.redirect('/manager/deliveries');
    }
};

// Delete delivery (SIMPLIFIED - no rider status changes)
exports.deleteDelivery = async (req, res) => {
    try {
        const { id } = req.params;

        const deliveriesData = await readDeliveriesFile();
        const deliveries = deliveriesData.deliveries || [];

        const deliveryIndex = deliveries.findIndex(d => d.id === id);
        if (deliveryIndex === -1) {
            req.flash('error', 'Delivery not found');
            return res.redirect('/manager/deliveries');
        }

        // Remove delivery only - no rider status changes
        deliveries.splice(deliveryIndex, 1);

        await writeDeliveriesFile({ deliveries });

        req.flash('success', 'Delivery deleted successfully');
        res.redirect('/manager/deliveries');
    } catch (error) {
        console.error('Delete delivery error:', error);
        req.flash('error', 'Error deleting delivery');
        res.redirect('/manager/deliveries');
    }
};

// Keep existing rider management functions as they are
exports.renderAddRider = (req, res) => {
    res.render('addRiders', {
        title: 'Add Rider',
        error: req.flash('error'),
        success: req.flash('success')
    });
};

exports.addRider = async (req, res) => {
    const { name, email, contact } = req.body;
    if (!name || !email || !contact) {
        req.flash('error', 'All fields are required');
        return res.redirect('/manager/riders/add');
    }
    try {
        const data = await readUsersFile();
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
        res.redirect('/manager/riders');
    } catch (err) {
        console.error('Add rider error:', err);
        req.flash('error', 'An error occurred while adding the rider');
        res.redirect('/manager/riders/add');
    }
};

exports.listRiders = async (req, res) => {
    try {
        const riders = await getAllRiders(); // Use centralized function
        res.render('ridersList', {
            title: 'Riders List',
            riders,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('List riders error:', error);
        req.flash('error', 'Unable to load riders list');
        res.redirect('/manager/dashboard');
    }
};