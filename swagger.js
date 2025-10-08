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
        },
        // 🆕 NEW: Adding Tags for the new collections
        {
            name: 'Categories',
            description: 'Management of record categories (e.g., Work, Personal, School)'
        },
        {
            name: 'Comments',
            description: 'Adding and retrieving comments on specific records'
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

    // 🚀 NEW PATHS object to define all your API routes - ALL PATHS FILLED
    paths: {
        // --- USER AUTH PATHS ---
        "/user/register": { 
            "post": {
                "tags": ["Users"],
                "summary": "Registers a new user.",
                "parameters": [
                    { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/UserRegistration" } }
                ],
                "responses": { "201": { "description": "User successfully created." } }
            }
        }, 
        "/user/login": { 
            "post": {
                "tags": ["Users"],
                "summary": "Logs in a user.",
                "parameters": [
                    { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/UserRegistration" } }
                ],
                "responses": { "200": { "description": "Login successful." } }
            }
        },    
        "/user/logout": { 
            "post": {
                "tags": ["Users"],
                "summary": "Logs out the current user.",
                "responses": { "200": { "description": "Logged out successfully." } },
                "security": [{ "SessionCookie": [] }]
            }
        },   

        // --- USER PROFILE CRUD ENDPOINT ---
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
        
        // --- RECORD PATHS ---
        "/record": {
            "get": {
                "tags": ["Records"],
                "summary": "Retrieves all records for the logged-in user.",
                "responses": { "200": { "description": "List of user-owned records." } },
                "security": [{ "SessionCookie": [] }]
            },
            "post": {
                "tags": ["Records"],
                "summary": "Creates a new record.",
                "parameters": [
                    { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/RecordUpdate" } }
                ],
                "responses": { "201": { "description": "Record successfully created." } },
                "security": [{ "SessionCookie": [] }]
            }
        },    
        "/record/{id}": {
            "get": {
                "tags": ["Records"],
                "summary": "Retrieves a single record by ID.",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" } ],
                "responses": { "200": { "description": "Record found." } },
                "security": [{ "SessionCookie": [] }]
            },
            "put": {
                "tags": ["Records"],
                "summary": "Updates an existing record (Owner only).",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" }, { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/RecordUpdate" } } ],
                "responses": { "200": { "description": "Record successfully updated." } },
                "security": [{ "SessionCookie": [] }]
            },
            "delete": {
                "tags": ["Records"],
                "summary": "Deletes a record (Owner only).",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" } ],
                "responses": { "204": { "description": "Record successfully deleted (No Content)." } },
                "security": [{ "SessionCookie": [] }]
            }
        }, 
        
        // --- CATEGORY PATHS ---
        "/category": {
            "get": {
                "tags": ["Categories"],
                "summary": "Retrieves all categories for the logged-in user.",
                "responses": { "200": { "description": "List of user-owned categories." } },
                "security": [{ "SessionCookie": [] }]
            },
            "post": {
                "tags": ["Categories"],
                "summary": "Creates a new category.",
                "parameters": [ { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/CategoryUpdate" } } ],
                "responses": { "201": { "description": "Category successfully created." } },
                "security": [{ "SessionCookie": [] }]
            }
        },
        "/category/{id}": {
            "get": {
                "tags": ["Categories"],
                "summary": "Retrieves a single category by ID.",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" } ],
                "responses": { "200": { "description": "Category found." } }
            },
            "put": {
                "tags": ["Categories"],
                "summary": "Updates an existing category (Owner only).",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" }, { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/CategoryUpdate" } } ],
                "responses": { "200": { "description": "Category successfully updated." } },
                "security": [{ "SessionCookie": [] }]
            },
            "delete": {
                "tags": ["Categories"],
                "summary": "Deletes a category (Owner only).",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" } ],
                "responses": { "204": { "description": "Category successfully deleted (No Content)." } },
                "security": [{ "SessionCookie": [] }]
            }
        },

        // --- COMMENT PATHS ---
        "/comment": {
            "get": {
                "tags": ["Comments"],
                "summary": "Retrieves all comments in the system (Public).",
                "responses": { "200": { "description": "List of all comments." } }
            },
            "post": {
                "tags": ["Comments"],
                "summary": "Creates a new comment on a record.",
                "parameters": [ { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/CommentCreate" } } ],
                "responses": { "201": { "description": "Comment successfully created." } },
                "security": [{ "SessionCookie": [] }]
            }
        },
        "/comment/{id}": {
            "get": {
                "tags": ["Comments"],
                "summary": "Retrieves a single comment by ID (Public).",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" } ],
                "responses": { "200": { "description": "Comment found." } }
            },
            "put": {
                "tags": ["Comments"],
                "summary": "Updates an existing comment (Author only).",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" }, { "name": "body", "in": "body", "required": true, "schema": { "$ref": "#/definitions/CommentUpdate" } } ],
                "responses": { "200": { "description": "Comment successfully updated." } },
                "security": [{ "SessionCookie": [] }]
            },
            "delete": {
                "tags": ["Comments"],
                "summary": "Deletes a comment (Author only).",
                "parameters": [ { "name": "id", "in": "path", "required": true, "type": "string" } ],
                "responses": { "204": { "description": "Comment successfully deleted (No Content)." } },
                "security": [{ "SessionCookie": [] }]
            }
        },
        "/comment/record/{recordId}": {
            "get": {
                "tags": ["Comments"],
                "summary": "Retrieves all comments for a specific Record (Public).",
                "parameters": [ { "name": "recordId", "in": "path", "required": true, "type": "string", "description": "ID of the Record." } ],
                "responses": { "200": { "description": "List of comments for the Record." } }
            }
        }
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
        },
        
        // 🆕 UPDATED: Complete Category Model Definition (for GET responses)
        Category: {
            "type": "object",
            "properties": {
                "_id": { "type": "string", "example": "60a7d5b1234567890abcefd1" },
                "name": { "type": "string", "example": "Work" },
                "description": { "type": "string", "example": "Contacts related to my professional life.", "description": "User-provided description of the category." },
                "colorHex": { "type": "string", "example": "#FF5733", "description": "Hexadecimal color code for UI representation." },
                "isDefault": { "type": "boolean", "example": false, "description": "Indicates if this is a system default category. Server-managed." },
                "recordCount": { "type": "integer", "example": 15, "description": "Total number of records associated with this category. Server-managed." },
                "ownerId": { "type": "string", "example": "60a7d5b1234567890abcdef" },
                "createdAt": { "type": "string", "format": "date-time", "example": "2025-10-08T17:00:00.000Z", "description": "Timestamp of creation. Server-managed." },
                "updatedAt": { "type": "string", "format": "date-time", "example": "2025-10-09T10:30:00.000Z", "description": "Timestamp of last update. Server-managed." }
            }
        },
        // 🆕 NEW: Definition for Category Creation/Update (POST/PUT Request Body)
        CategoryUpdate: {
            "type": "object",
            "properties": {
                "name": { "type": "string", "example": "Family", "description": "The category name. Must be unique per user." },
                "description": { "type": "string", "example": "My personal family and friend records (optional)." },
                "colorHex": { "type": "string", "example": "#00AAFF", "description": "Optional hex color code for display." }
            }
        },
        
        // 🆕 UPDATED: Comment Model Definition (Reflects Mongoose timestamps)
        Comment: {
            "type": "object",
            "properties": {
                "_id": { "type": "string", "example": "60a7d5b1234567890abcefd2" },
                "recordId": { "type": "string", "example": "60a7d5b1234567890abcefd0", "description": "ID of the Record the comment belongs to." },
                "ownerId": { "type": "string", "example": "60a7d5b1234567890abcdef", "description": "ID of the User who authored the comment." },
                "text": { "type": "string", "example": "This is a great record entry.", "description": "The content of the comment." },
                "createdAt": { "type": "string", "format": "date-time", "example": "2025-10-08T17:00:00.000Z", "description": "Timestamp of creation." },
                "updatedAt": { "type": "string", "format": "date-time", "example": "2025-10-08T17:15:00.000Z", "description": "Timestamp of last update." }
            }
        },
        // 🆕 NEW: Definition for Comment Creation (POST Request Body)
        CommentCreate: {
            "type": "object",
            "properties": {
                "recordId": { "type": "string", "example": "60a7d5b1234567890abcefd0", "description": "The ID of the Record to comment on." },
                "text": { "type": "string", "example": "This is my new insightful comment." }
            },
            "required": ["recordId", "text"]
        },
        // 🆕 NEW: Definition for Comment Update (PUT Request Body)
        CommentUpdate: {
            "type": "object",
            "properties": {
                "text": { "type": "string", "example": "This comment has been edited." }
            },
            "required": ["text"]
        }
    }
};

const outputFile = './swagger.json';
// ⚠️ MAKE SURE THIS ARRAY INCLUDES ALL YOUR ROUTE FILES
const endpointsFiles = ['./routes/index.js']; 

// Generate swagger.json
swaggerAutogen(outputFile, endpointsFiles, doc);