// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const cors = require('cors'); 
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
// 🚀 CORRECTION 1: Adding Passport import
const passport = require('passport'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

// 🚀 CRITICAL CORRECTION 2: Initializes the strategy configuration (e.g., Google) BEFORE using them.
// Assuming the Passport configuration is in './config/passport'.
require('./config/passport'); 


// Your domain on Render (HTTPS protocol is implied for Render)
const DEPLOY_ORIGIN = 'https://cse341finalprojectteam.onrender.com';

// CORS Specific Configuration
const corsOptions = {
    // 1. Allow localhost for development and your deploy domain for production
    origin: [`http://localhost:${PORT}`, DEPLOY_ORIGIN], 
    
    // 2. ESSENTIAL: Allows session cookies (credentials) to be sent.
    credentials: true,
    
    // 3. Allow all HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

// --- Middleware Configuration ---
app.use(cors(corsOptions));
app.use(express.json()); 

// Session Configuration (MUST come before Passport)
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        
        // Ensures 'secure' is false for localhost (HTTP) and true for production (HTTPS).
        secure: process.env.NODE_ENV === 'production', 
        
        // ESSENTIAL: 'none' for cross-origin HTTPS (production), 'lax' for development.
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    } 
}));

// 🚀 CORRECTION 3: Passport Middleware (MUST come after Session)
app.use(passport.initialize());
app.use(passport.session());


// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('Connection error to MongoDB:', err.message));

// --- Routes and Documentation ---
// Fallback to the main routes aggregator (which likely includes /users, /records, etc.)
app.use('/', routes);

// Loads the generated swagger.json file
const swaggerDocument = require('./swagger.json');

// 🚀 MODIFICATION HERE: Forces the Swagger UI to use the HTTPS URL
// This helps prevent caching issues from forcing HTTP on the deployed documentation.
const swaggerOptions = {
    swaggerOptions: {
        // Tells Swagger UI to use the HTTPS URL defined in your swagger.json as the default
        url: DEPLOY_ORIGIN + '/swagger.json'
    }
};

// Use the new options in the setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions)); 

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API documentation at http://localhost:${PORT}/api-docs`);
});

module.exports = app;