// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const cors = require('cors'); 
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

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
app.use(cors(corsOptions)); // Applying CORRECTED CORS options
app.use(express.json()); 

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        
        // CORRECTION 1: Ensures 'secure' is true on Render (HTTPS)
        secure: process.env.NODE_ENV === 'production', 
        
        // CORRECTION 2: ESSENTIAL for cross-origin cookie transmission over HTTPS.
        // 'lax' for local development, 'none' for production (with secure: true).
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    } 
}));

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('Connection error to MongoDB:', err.message));

// --- Routes and Documentation ---
app.use('/', routes);

// Loads the generated swagger.json file
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API documentation at http://localhost:${PORT}/api-docs`);
});