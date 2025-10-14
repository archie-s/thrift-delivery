const express = require('express');
const router = express.Router();

// Home page route
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    
    if (req.session.user.role === 'manager') {
        res.redirect('/manager/dashboard');
    } else {
        res.redirect('/rider/dashboard');
    }
});

module.exports = router;