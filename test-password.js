const bcrypt = require('bcrypt');

async function testPassword() {
    const testPassword = 'testpassword123';
    const storedHash = '$2b$10$YvhXkEgqBgGhFdzS4Jx8huuP9Xn7L9h08GgQow3td8rQ2ET.hKpym';
    
    console.log('Testing password hash:');
    console.log('Password:', testPassword);
    console.log('Stored Hash:', storedHash);
    
    try {
        const match = await bcrypt.compare(testPassword, storedHash);
        console.log('Match result:', match);
        
        // Generate a new hash for verification
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('New hash generated:', newHash);
    } catch (error) {
        console.error('Error testing password:', error);
    }
}

testPassword();