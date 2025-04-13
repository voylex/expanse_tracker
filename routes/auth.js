const express = require('express');
const router = express.Router();

// Login page
router.get('/', (req, res) => {
    res.render('login', { error: null });
});

// Login handler
router.post('/', (req, res) => {
    const { passcode } = req.body;
    const validPasscode = process.env.AUTH_TOKEN || '1234';
    
    if (passcode === validPasscode) {
        // Set cookie with 24 hour expiry
        res.cookie('authToken', validPasscode, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        });
        return res.redirect('/');
    }
    
    res.render('login', { error: 'Invalid passcode' });
});

// Logout handler
router.get('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.redirect('/login');
});

module.exports = router; 