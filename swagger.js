const swaggerAutogen = require('swagger-autogen')(); 

const doc = {
    info: {
        title: 'Personal Record Keeper API', // Title adjusted to reflect the project
        version: '1.0.0',
        description: 'A simple Express API for managing personal records with MongoDB.',
    },
    servers: [
        {
            // Deploy URL (Render) - Must be the API base URL, not the docs path
            url: 'https://cse341finalprojectteam.onrender.com',
            description: 'Production/Remote Server (Render)',
        },
        {
            // Local development URL
            url: 'http://localhost:8080', 
            description: 'Local Development Server',
        }
    ],
    
    // ✅ CORRECTION: Add HTTPS to schemes
    schemes: ['http', 'https'], 

    tags: [
        {
            name: 'Users',
            description: 'User registration and session management (Login/Logout, Profile CRUD)'
        },
        {
            name: 'Records',
            description: 'CRUD operations for Personal Records'
        }
    ],
    
    // Authentication Schemes
    securityDefinitions: {
        SessionCookie: {
            type: "apiKey",
            in: "cookie",
            name: "connect.sid", // Default cookie name used by express-session
            description: "Session cookie for authentication."
        }
    },

    // 🚀 NEW PATHS object to define all your API routes
    paths: {
        // --- EXISTING USER PATHS ---
        "/user/register": { /* ... */ }, // Assume POST is defined elsewhere or found by autogen
        "/user/login": { /* ... */ },    // Assume POST is defined elsewhere or found by autogen
        "/user/logout": { /* ... */ },   // Assume GET is defined elsewhere or found by autogen

        // --- 🚀 NEW USER PROFILE CRUD ENDPOINT ---
        "/user/{id}": {
            "put": {
                "tags": ["Users"],
                "summary": "Updates the logged-in user's profile.",
                "description": "Allows the user to update their own account details (e.g., username, password). Requires authentication.",
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "type": "string",
                        "description": "The ID of the user to update (must match the logged-in user's ID)."
                    },
                    {
                        "name": "body",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "$ref": "#/definitions/UserUpdate"
                        }
                    }
                ],
                "responses": {
                    "200": { "description": "User profile successfully updated." },
                    "401": { "description": "Access denied. Please log in." },
                    "403": { "description": "Forbidden: User ID mismatch." }
                },
                "security": [{ "SessionCookie": [] }]
            },
            "delete": {
                "tags": ["Users"],
                "summary": "Deletes the logged-in user's account.",
                "description": "Permanently deletes the user account and destroys the session. Requires authentication.",
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "type": "string",
                        "description": "The ID of the user to delete (must match the logged-in user's ID)."
                    }
                ],
                "responses": {
                    "204": { "description": "User account successfully deleted (No Content)." },
                    "401": { "description": "Access denied. Please log in." },
                    "403": { "description": "Forbidden: User ID mismatch." }
                },
                "security": [{ "SessionCookie": [] }]
            }
        },
        
        // --- EXISTING RECORD PATHS ---
        // "/record/": { /* ... */ },      // Assume GET/POST are defined elsewhere or found by autogen
        // "/record/{id}": { /* ... */ } // Assume GET/PUT/DELETE are defined elsewhere or found by autogen
    },

    // Model Definitions
    definitions: {
        UserRegistration: {
             _id: "60a7d5b1234567890abcefd0", // Including the ID for visualization
             username: "testuser",
             password: "password123"
        },
        UserUpdate: {
             _id: "60a7d5b1234567890abcefd0", // Including the ID for visualization
             username: "testuser1",
             password: "password1234"
        },
        // Complete definition of the Record Object (for GET responses)
        Record: {
            _id: "60a7d5b1234567890abcefd0", // Including the ID for visualization
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "555-123-4567",
            birthday: "1985-05-15",
            ownerId: "60a7d5b1234567890abcdef" 
        },
        // Definition of the Object for Update/Creation (POST/PUT Request Body)
        RecordUpdate: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            phone: "555-987-6543",
            birthday: "1995-10-20"
        }
    }
};

const outputFile = './swagger.json';
const endpointsFiles = ['./routes/index.js']; 

// Generate swagger.json
swaggerAutogen(outputFile, endpointsFiles, doc);