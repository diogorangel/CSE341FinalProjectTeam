// routes/index.js
const express = require('express');
const router = express.Router();

// --- Middleware for Authentication Check ---
// A reusable function to check if a user is logged in
const isAuthenticated = (req, res, next) => {
    // Passport adds this method to the request object.
    if (req.isAuthenticated()) {
        return next(); // User is logged in, continue to the next handler.
    }
    // User is not logged in, redirect to the login page (or send an error).
    res.redirect('/auth/google'); // Assuming /auth/google is the login initiator
};

// --- Main Routes ---
// Simple root route
router.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// CRITICAL FIX: The Dashboard route must use req.user, which Passport populates.
// We apply the isAuthenticated middleware to protect the route.
router.get('/dashboard', isAuthenticated, (req, res) => {
    // If we reach here, req.user is guaranteed to exist due to the middleware.
    // req.user is the full user object returned by deserializeUser.
    res.send(`<h1>Welcome to the Dashboard!</h1><p>User ID: ${req.user._id}</p>`);
});

// For testing purposes (if you want to access it without middleware):
router.get('/dashboard-test', (req, res) => {
    const userId = req.isAuthenticated() ? req.user._id : 'Not Logged In';
    res.send(`<h1>Welcome to the Dashboard!</h1><p>User ID: ${userId}</p>`);
});


// --- Module Routes ---
router.use('/auth', require('./auth'));       // <-- OAuth Routes (Google, etc.)
router.use('/user', require('./users'));      // <-- User Management (Local Register/Login)
router.use('/record', require('./records'));    // <-- Record CRUD
router.use('/category', require('./category')); // <-- Category CRUD (NEW)
router.use('/comment', require('./comments'));  // <-- Comment CRUD (NEW)

module.exports = router;