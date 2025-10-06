const path = require('path');
const fs = require('fs').promises;

const ordersFile = path.join(__dirname, '../data/orders.json');
const waitlistFile = path.join(__dirname, '../data/waitlist.json');

class Order {
    static async getAll() {
        try {
            const data = await fs.readFile(ordersFile, 'utf8');
            return JSON.parse(data).orders;
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(ordersFile, JSON.stringify({ orders: [] }));
                return [];
            }
            throw error;
        }
    }

    static async getWaitlist() {
        try {
            const data = await fs.readFile(waitlistFile, 'utf8');
            return JSON.parse(data).orders;
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(waitlistFile, JSON.stringify({ orders: [] }));
                return [];
            }
            throw error;
        }
    }

    static async create(orderData) {
        const orders = await this.getAll();
        const newOrder = {
            id: String(orders.length + 1),
            ...orderData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        orders.push(newOrder);
        await fs.writeFile(ordersFile, JSON.stringify({ orders }, null, 2));
        
        // Add to waitlist if no rider is assigned
        if (!newOrder.riderId) {
            const waitlist = await this.getWaitlist();
            waitlist.push(newOrder);
            await fs.writeFile(waitlistFile, JSON.stringify({ orders: waitlist }, null, 2));
        }
        
        return newOrder;
    }

    static async updateStatus(orderId, status, riderId = null) {
        const orders = await this.getAll();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            throw new Error('Order not found');
        }

        orders[orderIndex] = {
            ...orders[orderIndex],
            status,
            riderId,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(ordersFile, JSON.stringify({ orders }, null, 2));
        
        // Remove from waitlist if assigned to rider
        if (riderId) {
            const waitlist = await this.getWaitlist();
            const filteredWaitlist = waitlist.filter(o => o.id !== orderId);
            await fs.writeFile(waitlistFile, JSON.stringify({ orders: filteredWaitlist }, null, 2));
        }

        return orders[orderIndex];
    }

    static async getOrdersByRider(riderId) {
        const orders = await this.getAll();
        return orders.filter(o => o.riderId === riderId);
    }

    static async getOrdersByStatus(status) {
        const orders = await this.getAll();
        return orders.filter(o => o.status === status);
    }
}

module.exports = Order;