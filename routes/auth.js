const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/profile/edit', authMiddleware, authController.renderEditProfile);
router.post('/profile/edit', authMiddleware, authController.updateProfile);






// Login page
router.get('/login', authController.renderLogin);

// Login post
router.post('/login', authController.login);

// Registration page
router.get('/register', authController.renderRegister);

// Registration post
router.post('/register', authController.register);

//profile one 
router.get('/profile', authMiddleware, authController.renderProfile);

// Logout
router.get('/logout', authController.logout);

module.exports = router;