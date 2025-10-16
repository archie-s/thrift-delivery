const fs = require('fs').promises;
const path = require('path');
const usersFilePath = path.join(__dirname, '../data/users.json');



async function readUsersFile() {
    try {
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist, return an empty users structure
        if (error.code === 'ENOENT') {
            return { users: [] };
        }
        // If JSON is invalid, rethrow to let caller handle
        throw error;
    }
}

async function writeUsersFile(data) {
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));
}

module.exports = { readUsersFile, writeUsersFile };
