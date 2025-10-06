const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login page
router.get('/login', authController.renderLogin);

// Login post
router.post('/login', authController.login);

// Registration page
router.get('/register', authController.renderRegister);

// Registration post
router.post('/register', authController.register);

// Logout
router.get('/logout', authController.logout);

module.exports = router;