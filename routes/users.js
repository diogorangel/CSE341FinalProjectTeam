//routes/users.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');

// Middleware Import
// FIX APPLIED: Using destructuring and assuming the middleware file is named 'isAuthenticated'.
const { isAuthenticated } = require('../middleware/authenticate'); 

// --- User Session Management (C/R/D for Session) ---

// POST /user/register - C (Create User and Session)
router.post('/register',isAuthenticated, usersController.register);

// POST /user/login - R (Read/Establish Session)
router.post('/login', usersController.login);

// GET /user/logout - D (Destroy Session)
router.get('/logout', usersController.logout);


// --- 🌐 Google OAuth Endpoints ---
// NOTE: These routes typically use the 'passport' library in a real application. 
// For this API setup, we are defining the controllers where the OAuth logic would reside.

// GET /user/google - Starts the Google OAuth process (redirects to Google)
router.get('/google', usersController.googleAuth);

// GET /user/google/callback - Receives the token from Google and logs the user in
router.get('/google/callback', usersController.googleCallback);


// --- 🚀 User Profile CRUD Endpoints ---

// GET /user/all - R (Read/List All Users)
// Protected by authentication. Controller excludes the password field.
router.get('/all', isAuthenticated, usersController.getAllUsers);

// PUT /user/:id - U (Update User Profile)
// Requires a user ID in the path and authentication/authorization middleware.
router.put('/:id', isAuthenticated, usersController.updateUser); 

// DELETE /user/:id - D (Delete User Account)
// Requires a user ID in the path and authentication/authorization middleware.
router.delete('/:id', isAuthenticated, usersController.deleteUser); 


module.exports = router;