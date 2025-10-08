const User = require('../models/user');
const Record = require('../models/record'); // Needed for cascading delete
const bcrypt = require('bcryptjs'); // For Password Hashing

// =========================================================================
// Auxiliary route for testing (GET /user/protected)
// =========================================================================
exports.getProtectedInfo = (req, res) => {
    // Simple route to verify if the isAuthenticated middleware is working.
    res.status(200).json({ 
        message: "Access granted to protected user info.", 
        userId: req.session.userId 
    });
};

// =========================================================================
// POST /user/register (CREATE)
// =========================================================================
exports.register = async (req, res) => {
    // #swagger.tags = ['Users']
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'User registration data.',
        required: true,
        // FIX: Changed from UserRegister to UserRegistration to match swagger.json
        schema: { $ref: "#/definitions/UserRegistration" }
    } */
    /* #swagger.responses[201] = { description: 'User successfully registered and logged in. A session cookie is returned.', schema: { message: 'User registered and logged in successfully!', userId: '60a7d5b1234567890abcdef' } } */
    /* #swagger.responses[400] = { description: 'Username, email, and password are required.' } */
    /* #swagger.responses[409] = { description: 'User already exists.' } */
    /* #swagger.responses[500] = { description: 'Internal error while registering user.' } */
    
    // FIX: Added 'email' to destructuring as required by Mongoose model
    const { username, password, email } = req.body;

    // FIX: Added 'email' to mandatory check
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    try {
        // --- CRITICAL FIX: Check for existing user by username OR email ---
        const existingUser = await User.findOne({ 
            $or: [{ username: username }, { email: email }] 
        });
        
        if (existingUser) {
            // Provide more specific feedback for a 409 conflict
            if (existingUser.username === username) {
                return res.status(409).json({ message: 'Username is already taken.' });
            }
            if (existingUser.email === email) {
                return res.status(409).json({ message: 'Email is already registered.' });
            }
            return res.status(409).json({ message: 'User already exists.' });
        }

        // Password Hashing (Security!)
        const hashedPassword = await bcrypt.hash(password, 10);

        // FIX: Added 'email' to the new User object
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        
        // Automatic Login: Establish session immediately after registration
        req.session.userId = newUser._id.toString(); // Ensures it's a string
        
        // TEST FIX: userId returned for Jest
        res.status(201).json({ 
            message: 'User registered and logged in successfully!', 
            userId: newUser._id.toString() 
        });

    } catch (error) {
        // This will now successfully show validation errors like invalid email format
        res.status(500).json({ message: 'Error registering user.', error: error.message });
    }
};

// =========================================================================
// POST /user/login (READ/Establish Session)
// =========================================================================
exports.login = async (req, res) => {
    // #swagger.tags = ['Users']
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'User login data (username or email in the username field).',
        required: true,
        schema: { $ref: "#/definitions/UserRegistration" }
    } */
    /* #swagger.responses[200] = { description: 'User successfully logged in. A session cookie is returned.', schema: { message: 'Logged in successfully!', userId: '60a7d5b1234567890abcdef' } } */
    /* #swagger.responses[400] = { description: 'Username and password are required.' } */
    /* #swagger.responses[401] = { description: 'Invalid credentials.' } */
    /* #swagger.responses[500] = { description: 'Internal error while logging in.' } */
    const { username, password } = req.body; // 'username' here might be an email

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // --- CRITICAL FIX: Allow login using username OR email ---
        // Search for user where the input 'username' matches either the stored username or email.
        const user = await User.findOne({ 
            $or: [{ username: username }, { email: username }] 
        });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' }); 
        }
        
        // --- CRITICAL FIX: Handle users created via OAuth (without a local password) ---
        if (!user.password) {
             return res.status(401).json({ 
                message: 'This account was created via social login. Please log in with Google, or reset your local password.' 
            });
        }

        // Hashed Password Comparison
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Session Creation (Cookie Configuration)
        req.session.userId = user._id.toString(); 
        
        // The API responds 200 OK and the cookie is set by express-session
        res.status(200).json({ message: 'Logged in successfully!', userId: user._id.toString() });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in.', error: error.message });
    }
};

// =========================================================================
// GET /user/logout (DESTROY Session)
// =========================================================================
exports.logout = (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.responses[200] = { description: 'Session successfully ended.' } */
    /* #swagger.responses[500] = { description: 'Internal error while logging out.' } */
    
    // Destroys the session and removes the cookie
    req.session.destroy(err => {
        if (err) {
            // FIX: If error occurs during destruction, we still want to log it and send a 500
            console.error("Error during session destruction:", err);
            return res.status(500).json({ message: 'Error logging out.' });
        }
        res.clearCookie('connect.sid'); 
        
        // FIX for test: The test expects plain text/message ('Logged out successfully.'), not JSON.
        res.status(200).send('Logged out successfully.'); 
    });
};

// =========================================================================
// GET /user/google (Google OAuth Initiation - Boilerplate)
// =========================================================================
exports.googleAuth = (req, res) => {
    // #swagger.tags = ['Authentication']
    /* #swagger.responses[302] = { description: 'Redirects to Google OAuth consent screen.' } */
    // NOTE: In a real app, this is typically handled by passport.authenticate('google')
    // Placeholder to allow the route to be added back to users.js
    res.status(501).json({ message: 'Google OAuth initiation not yet implemented.' });
};

// =========================================================================
// GET /user/google/callback (Google OAuth Finalization - Boilerplate)
// =========================================================================
exports.googleCallback = (req, res) => {
    // #swagger.tags = ['Authentication']
    /* #swagger.responses[302] = { description: 'Redirects user to home/dashboard after successful login.' } */
    // NOTE: In a real app, this is typically handled by passport.authenticate('google') with success/failure redirects
    // Placeholder to allow the route to be added back to users.js
    res.status(501).json({ message: 'Google OAuth callback not yet implemented.' });
};


// =========================================================================
// GET /user/all - Get All Users (READ/List)
// =========================================================================
exports.getAllUsers = async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.security = [{ "SessionCookie": [] }] 
    /* #swagger.responses[200] = { 
        description: 'List of all users (password field is excluded).',
        schema: [{ _id: '60a7d5b1...', username: 'testuser' }]
    } */
    /* #swagger.responses[500] = { description: 'Internal error while retrieving users.' } */

    try {
        // Find all users and use .select('-password') to EXCLUDE the password field.
        const users = await User.find({}).select('-password');
        
        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ message: 'Error retrieving users.', error: error.message });
    }
};

// =========================================================================
// PUT /user/:id - Update User Profile (UPDATE)
// =========================================================================
exports.updateUser = async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.security = [{ "SessionCookie": [] }] 
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'Fields to update (username and/or password).',
        required: true,
        schema: { username: 'newUsername', password: 'newPassword123' }
    } */
    /* #swagger.responses[200] = { description: 'User profile successfully updated.' } */
    /* #swagger.responses[404] = { description: 'User not found.' } */
    /* NOTE: 401/403 are handled by the isAuthenticated middleware */
    
    // FIX: Uses req.params.id for consistency with the route definition in routes/users.js
    const userId = req.params.id; 
    const { username, password } = req.body;
    let updateFields = {};

    try {
        // Find the user to ensure existence and check authorization
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Basic authorization check: Only allow users to update their own profile
        if (req.session.userId !== userId) {
            // Though isAuthenticated should catch this for unauthenticated, we check ID here
            return res.status(403).json({ message: 'Forbidden: You can only update your own account.' });
        }


        // 1. Update username if provided
        if (username) {
             // Check if the new username is already taken by a different user
            const existingUserWithUsername = await User.findOne({ username });
            if (existingUserWithUsername && existingUserWithUsername._id.toString() !== userId) {
                 return res.status(409).json({ message: 'Username is already taken by another user.' });
            }
            updateFields.username = username;
        }

        // 2. Update and HASH password if provided
        if (password) {
            // Hashed Password (Security!)
            updateFields.password = await bcrypt.hash(password, 10);
        }
        
        // Ensure at least one field is being updated
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        // Perform the update
        await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true });

        res.status(200).json({ message: 'User profile successfully updated.' });

    } catch (error) {
        // This can catch Mongoose validation errors or other server errors
        res.status(500).json({ message: 'Error updating user profile.', error: error.message });
    }
};

// =========================================================================
// DELETE /user/:id - Delete User Account (DELETE)
// =========================================================================
exports.deleteUser = async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.security = [{ "SessionCookie": [] }] 
    /* #swagger.responses[204] = { description: 'User account successfully deleted (No Content).' } */
    /* #swagger.responses[404] = { description: 'User not found.' } */
    /* NOTE: 401/403 are handled by the isAuthenticated middleware */

    // FIX: Uses req.params.id for consistency with the route definition in routes/users.js
    const userId = req.params.id; 
    
    try {
        // Authorization check: Only allow users to delete their own profile
        if (req.session.userId !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own account.' });
        }
        
        // 1. Cascading Delete: Delete all associated records first
        await Record.deleteMany({ ownerId: userId });

        // 2. Delete the User account
        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // 3. Destroy the session and clear the cookie
        req.session.destroy(err => {
            if (err) {
                // Log the error but proceed with the final 204 response
                console.error("Error destroying session after account deletion:", err);
            }
            res.clearCookie('connect.sid'); 
            // 204 No Content is the standard response for a successful DELETE operation
            res.status(204).send();
        });

    } catch (error) {
        res.status(500).json({ message: 'Error deleting user account.', error: error.message });
    }
};
// =========================================================================
// End of controllers/users.js
