const path = require('path');
const fs = require('fs').promises;

const ridersFile = path.join(__dirname, '../data/riders.json');

class Rider {
    static async getAll() {
        try {
            const data = await fs.readFile(ridersFile, 'utf8');
            return JSON.parse(data).riders;
        } catch (error) {
            if (error.code === 'ENOENT') {
                await fs.writeFile(ridersFile, JSON.stringify({ riders: [] }));
                return [];
            }
            throw error;
        }
    }

    static async get(riderId) {
        const riders = await this.getAll();
        return riders.find(r => r.id === riderId);
    }

    static async create(riderData) {
        const riders = await this.getAll();
        const newRider = {
            id: String(riders.length + 1),
            ...riderData,
            status: 'available',
            currentLocation: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        riders.push(newRider);
        await fs.writeFile(ridersFile, JSON.stringify({ riders }, null, 2));
        return newRider;
    }

    static async updateStatus(riderId, status, location = null) {
        const riders = await this.getAll();
        const riderIndex = riders.findIndex(r => r.id === riderId);
        
        if (riderIndex === -1) {
            throw new Error('Rider not found');
        }

        riders[riderIndex] = {
            ...riders[riderIndex],
            status,
            currentLocation: location || riders[riderIndex].currentLocation,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(ridersFile, JSON.stringify({ riders }, null, 2));
        return riders[riderIndex];
    }

    static async updateLocation(riderId, location) {
        const riders = await this.getAll();
        const riderIndex = riders.findIndex(r => r.id === riderId);
        
        if (riderIndex === -1) {
            throw new Error('Rider not found');
        }

        riders[riderIndex] = {
            ...riders[riderIndex],
            currentLocation: location,
            updatedAt: new Date().toISOString()
        };

        await fs.writeFile(ridersFile, JSON.stringify({ riders }, null, 2));
        return riders[riderIndex];
    }

    static async getAvailableRiders() {
        const riders = await this.getAll();
        return riders.filter(r => r.status === 'available');
    }
}

module.exports = Rider;