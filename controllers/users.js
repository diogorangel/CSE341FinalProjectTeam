// controllers/users.js
const User = require('../models/user');
const Record = require('../models/record'); // Needed for cascading delete
const bcrypt = require('bcryptjs'); // For Password Hashing

// POST /user/register (CREATE)
exports.register = async (req, res) => {
    // #swagger.tags = ['Users']
    /* #swagger.parameters['body'] = { ... } */
    /* #swagger.responses[201] = { description: 'User successfully registered and logged in. A session cookie is returned.', schema: { message: 'User registered and logged in successfully!', userId: '60a7d5b1234567890abcdef' } } */
    /* #swagger.responses[400] = { description: 'Username and password are required.' } */
    /* #swagger.responses[409] = { description: 'User already exists.' } */
    /* #swagger.responses[500] = { description: 'Internal error while registering user.' } */
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists.' });
        }

        // Password Hashing (Security!)
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        
        // Automatic Login
        req.session.userId = newUser._id; 
        
        res.status(201).json({ message: 'User registered and logged in successfully!', userId: newUser._id });

    } catch (error) {
        res.status(500).json({ message: 'Error registering user.', error: error.message });
    }
};

// POST /user/login (READ/Establish Session)
exports.login = async (req, res) => {
    // #swagger.tags = ['Users']
    /* #swagger.parameters['body'] = { ... } */
    /* #swagger.responses[200] = { description: 'User successfully logged in. A session cookie is returned.', schema: { message: 'Logged in successfully!', userId: '60a7d5b1234567890abcdef' } } */
    /* #swagger.responses[400] = { description: 'Username and password are required.' } */
    /* #swagger.responses[401] = { description: 'Invalid credentials.' } */
    /* #swagger.responses[500] = { description: 'Internal error while logging in.' } */
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' }); 
        }

        // Hashed Password Comparison
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Session Creation (Cookie Configuration)
        req.session.userId = user._id; 
        
        // The API responds 200 OK and the cookie is set by express-session
        res.status(200).json({ message: 'Logged in successfully!', userId: user._id });

    } catch (error) {
        res.status(500).json({ message: 'Error logging in.', error: error.message });
    }
};

// GET /user/logout (DESTROY Session)
exports.logout = (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.responses[200] = { description: 'Session successfully ended.' } */
    /* #swagger.responses[500] = { description: 'Internal error while logging out.' } */
    // Destroys the session and removes the cookie
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out.' });
        }
        res.clearCookie('connect.sid'); 
        res.status(200).json({ message: 'Logged out successfully.' });
    });
};

// =========================================================================
// 🚀 NEW: GET /user/all - Get All Users (READ/List)
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
    /* #swagger.parameters['body'] = { ... } */
    /* #swagger.responses[200] = { description: 'User profile successfully updated.' } */
    /* #swagger.responses[404] = { description: 'User not found.' } */
    /* NOTE: 401/403 are handled by the isAuthenticated middleware */
    
    const userId = req.params.id; 
    const { username, password } = req.body;
    let updateFields = {};

    try {
        // Find the user to ensure existence
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 1. Update username if provided
        if (username) {
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

    const userId = req.params.id; 
    
    try {
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