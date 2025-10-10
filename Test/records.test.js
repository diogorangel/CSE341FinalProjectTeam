/**
 * Record CRUD Tests: tests/records.test.js
 * * Integration tests for all record routes (/record)
 * using Jest and Supertest.
 * * IMPORTANT: Ensures that ALL CRUD operations require authentication
 * and check ownership (ownerId).
 */

const request = require('supertest');
const app = require('../server'); // Assumes 'server.js' exports the Express app
const { 
    MOCK_USER_ID, 
    MOCK_OTHER_ID, 
    MOCK_RECORD_ID,
    NEW_RECORD_PAYLOAD,
    NEW_USER_PAYLOAD, // Add this payload in mockData.js
    LOGIN_PAYLOAD, // Add this payload in mockData.js
    UPDATED_USER_PAYLOAD, // Add this payload in mockData.js
    UPDATED_RECORD_PAYLOAD 
} = require('./mockdata');

// --- Mongoose Model Mock ---
// Simulates the Mongoose Model interface for the Record entity
const Record = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

// Setup mock for the create route
Record.create.mockImplementation((data) => ({
    _id: MOCK_RECORD_ID,
    ownerId: MOCK_USER_ID,
    ...data
}));

// Mock for the update route
Record.findByIdAndUpdate.mockImplementation((id, data) => ({
    _id: id,
    ownerId: MOCK_USER_ID,
    ...data
}));


// --- Authentication Middleware Mock ---
// Reuses the isAuthenticated mock (already used in other tests)
jest.mock('../middleware/authenticate', () => ({
    isAuthenticated: (req, res, next) => {
        // If the global authentication cookie is present
        if (global.authCookie) { 
            req.session = { userId: MOCK_USER_ID };
            next();
        } else {
            res.status(401).json({ message: 'User must be authenticated.' });
        }
    },
}));


describe('Record API Integration Tests', () => {

    beforeAll(() => {
        if (!global.authCookie) {
            console.warn("WARNING: global.authCookie not set. Ensure authentication setup is correct.");
        }
    });

    // =========================================================================
    // 1. POST /record (CREATE)
    // =========================================================================
    describe('POST /record', () => {
        it('should create a new record for an authenticated user (201)', async () => {
            Record.create.mockResolvedValueOnce({
                    _id: MOCK_RECORD_ID,
                    ownerId: MOCK_USER_ID,
                    ...NEW_RECORD_PAYLOAD
            });
            
            const response = await request(app)
                .post('/record')
                .set('Cookie', global.authCookie)
                .send(NEW_RECORD_PAYLOAD);

            expect(response.statusCode).toBe(201);
            expect(response.body.title).toBe(NEW_RECORD_PAYLOAD.title);
            expect(response.body.ownerId).toBe(MOCK_USER_ID);
        });

        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app)
                .post('/record')
                .send(NEW_RECORD_PAYLOAD);

            expect(response.statusCode).toBe(401);
        });

        it('should return 400 if required fields are missing (Validation)', async () => {
            const response = await request(app)
                .post('/record')
                .set('Cookie', global.authCookie)
                .send({ title: '', description: 'test' }); 

            expect(response.statusCode).toBe(400); 
        });
    });

    // =========================================================================
    // 2. GET /record (READ ALL)
    // =========================================================================
    describe('GET /record', () => {
        it('should return all records belonging to the authenticated user (200)', async () => {
            // Simulates the controller calling Record.find({ ownerId: MOCK_USER_ID })
            Record.find.mockResolvedValueOnce([
                { _id: MOCK_RECORD_ID, title: 'Record 1', ownerId: MOCK_USER_ID }
            ]);

            const response = await request(app)
                .get('/record')
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].ownerId).toBe(MOCK_USER_ID);
        });

        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app)
                .get('/record');

            expect(response.statusCode).toBe(401);
        });
    });

    // =========================================================================
    // 3. GET /record/:id (READ SINGLE)
    // =========================================================================
    describe('GET /record/:id', () => {
        it('should return a single record by ID if user is owner (200)', async () => {
            const mockRecord = { 
                _id: MOCK_RECORD_ID, 
                title: 'Project X', 
                ownerId: MOCK_USER_ID 
            };
            Record.findById.mockResolvedValueOnce(mockRecord);

            const response = await request(app)
                .get(`/record/${MOCK_RECORD_ID}`)
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(200);
            expect(response.body.title).toBe('Project X');
            expect(response.body.ownerId).toBe(MOCK_USER_ID);
        });
        
        it('should return 403 if the record belongs to another user (Authorization Check)', async () => {
            const mockForeignRecord = { 
                _id: MOCK_RECORD_ID, 
                title: 'Foreign Project', 
                ownerId: MOCK_OTHER_ID // Another user's ID
            };
            Record.findById.mockResolvedValueOnce(mockForeignRecord);
            
            const response = await request(app)
                .get(`/record/${MOCK_RECORD_ID}`)
                .set('Cookie', global.authCookie); 
                
            expect(response.statusCode).toBe(403);
        });
    });

    // =========================================================================
    // 4. PUT /record/:id (UPDATE)
    // =========================================================================
    describe('PUT /record/:id', () => {
        it('should update the record for the owner (200)', async () => {
            // 1. Simulates the search (findById) for ownerId check
            const mockRecord = { 
                _id: MOCK_RECORD_ID, 
                ownerId: MOCK_USER_ID, 
                toString: () => MOCK_USER_ID 
            };
            Record.findById.mockResolvedValueOnce(mockRecord);
            
            // 2. Simulates the update (findByIdAndUpdate)
            Record.findByIdAndUpdate.mockResolvedValueOnce({
                    _id: MOCK_RECORD_ID,
                    ownerId: MOCK_USER_ID,
                    ...UPDATED_RECORD_PAYLOAD
            });
            
            const response = await request(app)
                .put(`/record/${MOCK_RECORD_ID}`)
                .set('Cookie', global.authCookie)
                .send(UPDATED_RECORD_PAYLOAD);

            expect(response.statusCode).toBe(200);
            expect(response.body.title).toBe(UPDATED_RECORD_PAYLOAD.title);
        });

        it('should return 403 if the user is not the owner', async () => {
            // Simulates the search returning an object from another user
            const mockForeignRecord = { 
                _id: MOCK_RECORD_ID, 
                ownerId: MOCK_OTHER_ID, 
                toString: () => MOCK_OTHER_ID 
            };
            Record.findById.mockResolvedValueOnce(mockForeignRecord);
            
            const response = await request(app)
                .put(`/record/${MOCK_RECORD_ID}`)
                .set('Cookie', global.authCookie)
                .send(UPDATED_RECORD_PAYLOAD);

            expect(response.statusCode).toBe(403);
        });
    });

    // =========================================================================
    // 5. DELETE /record/:id (DELETE)
    // =========================================================================
    describe('DELETE /record/:id', () => {
        it('should delete the record for the owner (204)', async () => {
            // 1. Simulates the search (findById) for ownerId check
            const mockRecord = { 
                _id: MOCK_RECORD_ID, 
                ownerId: MOCK_USER_ID, 
                toString: () => MOCK_USER_ID 
            };
            Record.findById.mockResolvedValueOnce(mockRecord);
            
            // 2. Simulates the delete (findByIdAndDelete)
            Record.findByIdAndDelete.mockResolvedValueOnce(true);

            const response = await request(app)
                .delete(`/record/${MOCK_RECORD_ID}`)
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(204);
        });

        it('should return 403 if the user is not the owner', async () => {
            // Simulates the search returning an object from another user
            const mockForeignRecord = { 
                _id: MOCK_RECORD_ID, 
                ownerId: MOCK_OTHER_ID, 
                toString: () => MOCK_OTHER_ID 
            };
            Record.findById.mockResolvedValueOnce(mockForeignRecord);
            
            const response = await request(app)
                .delete(`/record/${MOCK_RECORD_ID}`)
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(403);
        });
    });
});