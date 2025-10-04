// controllers/users.js
const User = require('../models/user');
const bcrypt = require('bcryptjs'); // For Password Hashing

// POST /user/register
exports.register = async (req, res) => {
    // #swagger.tags = ['Users']
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'User registration credentials.',
        required: true,
        schema: { $ref: "#/definitions/UserRegistration" } // Uses the schema defined in swagger.js
    } */
    /* #swagger.responses[201] = {
        description: 'User successfully registered and logged in. A session cookie is returned.',
        schema: { message: 'User registered and logged in successfully!', userId: '60a7d5b1234567890abcdef' }
    } */
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

// POST /user/login
exports.login = async (req, res) => {
    // #swagger.tags = ['Users']
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'User login credentials.',
        required: true,
        schema: { $ref: "#/definitions/UserRegistration" } // Uses the schema defined in swagger.js
    } */
    /* #swagger.responses[200] = {
        description: 'User successfully logged in. A session cookie is returned.',
        schema: { message: 'Logged in successfully!', userId: '60a7d5b1234567890abcdef' }
    } */
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

// GET /user/logout
exports.logout = (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.security = [{ "SessionCookie": [] }] // Indicates this route requires authentication (to destroy the current session)
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