const fs = require('fs').promises;
const path = require('path');
const usersFilePath = path.join(__dirname, '../data/users.json');



async function readUsersFile() {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
}

async function writeUsersFile(data) {
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2));
}

module.exports = { readUsersFile, writeUsersFile };
