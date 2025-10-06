const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');

// Helper function to read users file
async function readUsersFile() {
    try {
        const data = await fs.readFile(usersFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return { users: [] };
        }
        throw error;
    }
}

// Helper function to write users file
async function writeUsersFile(data) {
    await fs.writeFile(usersFile, JSON.stringify(data, null, 2));
}

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        req.flash('error', 'Email and password are required');
        return res.redirect('/auth/login');
    }
    
    try {
        const data = await fs.readFile(usersFile, 'utf8');
        const users = JSON.parse(data).users;
        const user = users.find(u => u.email === email);
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }
        
        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        if (user.role === 'manager') {
            return res.redirect('/manager/dashboard');
        } else {
            return res.redirect('/rider/dashboard');
        }
    } catch (error) {
        req.flash('error', 'An error occurred during login');
        return res.redirect('/auth/login');
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
};

exports.renderLogin = (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'manager') {
            return res.redirect('/manager/dashboard');
        } else {
            return res.redirect('/rider/dashboard');
        }
    }
    res.render('login', { 
        title: 'Login',
        error: req.flash('error')
    });
};

exports.renderRegister = (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'manager') {
            return res.redirect('/manager/dashboard');
        } else {
            return res.redirect('/rider/dashboard');
        }
    }
    res.render('register', { 
        title: 'Create Account',
        error: req.flash('error')
    });
};

exports.register = async (req, res) => {
    const { name, email, password, confirmPassword, role } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword || !role) {
        req.flash('error', 'All fields are required');
        return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/auth/register');
    }

    if (!['manager', 'rider'].includes(role)) {
        req.flash('error', 'Invalid role selected');
        return res.redirect('/auth/register');
    }

    try {
        // Read existing users
        const data = await readUsersFile();
        
        // Check if email already exists
        if (data.users.find(u => u.email === email)) {
            req.flash('error', 'Email already registered');
            return res.redirect('/auth/register');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: String(data.users.length + 1),
            name,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };

        // Add to users array
        data.users.push(newUser);

        // Save to file
        await writeUsersFile(data);

        // Set session and redirect
        req.session.user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        };

        req.flash('success', 'Account created successfully');
        
        if (role === 'manager') {
            res.redirect('/manager/dashboard');
        } else {
            res.redirect('/rider/dashboard');
        }
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration');
        res.redirect('/auth/register');
    }
};
