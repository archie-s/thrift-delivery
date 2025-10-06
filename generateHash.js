const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'testpassword123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Generated hash:', hash);
}

generateHash();