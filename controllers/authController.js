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
        const { readUsersFile } = require('../utils/fileHandler');
        const data = await readUsersFile();
        const users = data.users || [];
        const user = users.find(u => u.email === email);

        if (!user) {
            // Don't reveal whether the email exists — generic message
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        const passwordMatch = await bcrypt.compare(password, user.password || '');
        if (!passwordMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // If the account requires a password reset, don't set full session and redirect to reset page
        if (user.mustResetPassword) {
            // store a temporary id in session to allow reset
            req.session.resetUserId = user.id;
            return res.redirect('/auth/reset-password');
        }

        // Set session and ensure it's saved before redirecting to avoid a race
        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        // Save session to guarantee the cookie and session store are updated
        return req.session.save(err => {
            if (err) console.error('Session save error after login:', err);
            if (user.role === 'manager') {
                return res.redirect('/manager/dashboard');
            } else {
                return res.redirect('/rider/dashboard');
            }
        });
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

        // Don't auto-login after registration; require explicit login
        req.flash('success', 'Account created successfully. Please log in.');
        return res.redirect('/auth/login');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration');
        res.redirect('/auth/register');
    }
};

// Render profile page for current user
exports.renderProfile = async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Please log in to view your profile');
        return res.redirect('/auth/login');
    }

    try {
        const data = await readUsersFile();
        const user = data.users.find(u => u.id === req.session.user.id);

        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }

        // Choose view based on role
        if (user.role === 'manager') {
            res.render('managerProfile', {
                title: 'Manager Profile',
                user,
                success: req.flash('success'),
                error: req.flash('error')
            });
        } else {
            res.render('riderProfile', {
                title: 'Rider Profile',
                user,
                success: req.flash('success'),
                error: req.flash('error')
            });
        }
    } catch (error) {
        req.flash('error', 'An error occurred loading profile');
        res.redirect('/auth/login');
    }
};
// Update profile for current user

// Render the edit profile form
exports.renderEditProfile = async (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Please log in to edit your profile');
        return res.redirect('/auth/login');
    }
    try {
        const data = await readUsersFile();
        const user = data.users.find(u => u.id === req.session.user.id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }
        res.render('editProfile', { user, error: req.flash('error'), success: req.flash('success') });
    } catch (error) {
        req.flash('error', 'An error occurred loading profile');
        res.redirect('/auth/profile');
    }
};

// Handle profile update (password change)
exports.updateProfile = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    if (!req.session.user) {
        req.flash('error', 'Please log in to update your profile');
        return res.redirect('/auth/login');
    }
    if (!newPassword || !confirmPassword) {
        req.flash('error', 'All fields are required');
        return res.redirect('/auth/profile/edit');
    }
    if (newPassword !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/auth/profile/edit');
    }
    try {
        const data = await readUsersFile();
        const user = data.users.find(u => u.id === req.session.user.id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await writeUsersFile(data);
        req.flash('success', 'Password updated successfully');
        res.redirect('/auth/profile');
    } catch (error) {
        req.flash('error', 'An error occurred updating profile');
        res.redirect('/auth/profile/edit');
    }
};

// Render reset password form (for users created by manager)
exports.renderResetPassword = async (req, res) => {
    const resetUserId = req.session.resetUserId;
    if (!resetUserId) {
        req.flash('error', 'No password reset in progress');
        return res.redirect('/auth/login');
    }
    res.render('resetPassword', { title: 'Reset Password', error: req.flash('error'), success: req.flash('success') });
};

exports.resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const resetUserId = req.session.resetUserId;
    if (!resetUserId) {
        req.flash('error', 'No password reset in progress');
        return res.redirect('/auth/login');
    }
    if (!newPassword || !confirmPassword) {
        req.flash('error', 'All fields are required');
        return res.redirect('/auth/reset-password');
    }
    if (newPassword !== confirmPassword) {
        req.flash('error', 'Passwords do not match');
        return res.redirect('/auth/reset-password');
    }
    try {
        const { readUsersFile, writeUsersFile } = require('../utils/fileHandler');
        const data = await readUsersFile();
        const user = data.users.find(u => u.id === resetUserId);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/auth/login');
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.mustResetPassword = false;
        await writeUsersFile(data);
        // Clean up reset session key
        delete req.session.resetUserId;
        // Store success flash then save session before redirecting so flash persists
        req.flash('success', 'Password reset successful. Please log in.');
        return req.session.save(err => {
            if (err) console.error('Session save error after password reset:', err);
            return res.redirect('/auth/login');
        });
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error', 'Failed to reset password');
        return res.redirect('/auth/reset-password');
    }
};
