// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const cors = require('cors'); 
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

// We comment this out until auth/google.js is created, otherwise it crashes the server.
// require('./auth/google')(passport); 

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());


// Your domain on Render (HTTPS protocol is implied for Render)
const DEPLOY_ORIGIN = 'https://cse341finalprojectteam.onrender.com';

// CORS Specific Configuration
const corsOptions = {
    // 1. Allow localhost for development and your deploy domain for production
    origin: ['http://localhost:8080', DEPLOY_ORIGIN], 
    
    // 2. ESSENTIAL: Allows session cookies (credentials) to be sent.
    credentials: true,
    
    // 3. Allow all HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

// --- Middleware Configuration ---
app.use(cors(corsOptions));
app.use(express.json()); 

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        
        // Ensures 'secure' is true on Render (HTTPS)
        secure: process.env.NODE_ENV === 'production', 
        
        // ESSENTIAL for cross-origin cookie transmission over HTTPS.
        // 'none' is required with 'secure: true' for the Render deployment.
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    } 
}));

// --- Routes and Documentation ---
app.use('/', routes);

// Loads the generated swagger.json file
const swaggerDocument = require('./swagger.json');

// 🚀 MODIFICATION HERE: Forces the Swagger UI to use the HTTPS URL
const swaggerOptions = {
    swaggerOptions: {
        // Tells Swagger UI to use the HTTPS URL defined in your swagger.json as the default
        url: DEPLOY_ORIGIN + '/swagger.json'
    }
};

// Use the new options in the setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions)); 

// =========================================================================
// CRITICAL FIX FOR TESTING: Separate app initialization from server startup.
// We only connect to MongoDB and start the listener if we are not running tests.
// =========================================================================
if (process.env.NODE_ENV !== 'test') {
    // --- MongoDB Connection ---
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('Connected to MongoDB!'))
        .catch(err => console.error('Connection error to MongoDB:', err.message));

    // --- Start Server ---
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API documentation at http://localhost:${PORT}/api-docs`);
    });
}

// 🚀 CRITICAL: Export the Express app instance for Supertest/Jest
module.exports = app;
// This allows the test suite to import the app without starting the server automatically.