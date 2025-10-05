// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport'); // We need Passport to handle the routes

// =========================================================================
// GET /auth/google
// 1. Starts the Google OAuth process.
//    'profile' and 'email' scopes request permission to access user data.
// =========================================================================
router.get(
    '/google',
    // #swagger.tags = ['Authentication']
    /* #swagger.responses[302] = { description: 'Redirects to Google login page.' } */
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// =========================================================================
// GET /auth/google/callback
// 2. Google redirects the user back to this route.
//    Passport handles the code exchange and finalizes the login/session.
// =========================================================================
router.get(
    '/google/callback',
    // #swagger.tags = ['Authentication']
    /* #swagger.responses[302] = { description: 'Redirects user to success/failure page.' } */
    passport.authenticate('google', { 
        failureRedirect: '/', // Redirect to homepage or login on failure
        successRedirect: '/dashboard' // Redirect to a protected page on success
    })
);

// =========================================================================
// GET /auth/logout
// 3. Custom route to log out of Passport and destroy the session.
// =========================================================================
router.get('/logout', (req, res) => {
    // #swagger.tags = ['Authentication']
    /* #swagger.responses[200] = { description: 'Successfully logged out.' } */
    
    // Passport adds a logout method to the request object (since Express 4.x)
    req.logout((err) => {
        if (err) {
            console.error("Error during passport logout:", err);
            return res.status(500).json({ message: 'Error logging out.' });
        }
        
        // Destroys the session and clears the cookie (similar to our user controller)
        req.session.destroy(err => {
            if (err) {
                console.error("Error destroying session after logout:", err);
            }
            res.clearCookie('connect.sid'); 
            res.status(200).json({ message: 'Logged out successfully.' });
        });
    });
});

module.exports = router;