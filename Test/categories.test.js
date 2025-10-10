/**
 * Category CRUD Tests: tests/categories.test.js
 * * Integration tests for all category routes (/category)
 * using Jest and Supertest.
 * * IMPORTANT: These tests depend on the global.authCookie variable
 * being set after a successful login (simulated in auth.test.js)
 */

const request = require('supertest');
const app = require('../server'); // Assumes 'server.js' exports the Express app
const { MOCK_USER_ID, MOCK_CATEGORY_ID, NEW_CATEGORY_PAYLOAD, UPDATED_CATEGORY_PAYLOAD } = require('./mockdata');

// Mongoose Model Mock (Replace this with your real Mongoose mock)
const Category = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

// Setup Mock for create route
Category.create.mockImplementation((data) => ({
    _id: MOCK_CATEGORY_ID,
    ownerId: MOCK_USER_ID,
    ...data
}));

// Mock for update route (returns the updated object)
Category.findByIdAndUpdate.mockImplementation((id, data) => ({
    _id: id,
    ownerId: MOCK_USER_ID,
    ...data
}));

// Mocks to simulate Express Session authentication
// This simulates the 'isAuthenticated' middleware injecting userId into the session
jest.mock('../middleware/authenticate', () => ({
    isAuthenticated: (req, res, next) => {
        // For POST, PUT, DELETE, simulates an authenticated user
        if (global.authCookie) { 
            // Simulates injecting the user ID into the session after login
            req.session = { userId: MOCK_USER_ID };
            next();
        } else {
            res.status(401).json({ message: 'User must be authenticated.' });
        }
    },
}));

describe('Category API Integration Tests', () => {

    // Sanity Test: Ensures the authentication cookie exists
    beforeAll(() => {
        if (!global.authCookie) {
            console.warn("WARNING: global.authCookie not set. Run auth.test.js first.");
            // If no cookie, success tests will be skipped
        }
    });

    // =========================================================================
    // 1. POST /category (CREATE)
    // =========================================================================
    describe('POST /category', () => {
        it('should create a new category for an authenticated user (201)', async () => {
            // Simulates Mongoose (controller calls Category.create)
            
            const response = await request(app)
                .post('/category')
                .set('Cookie', global.authCookie) // Sends the authentication cookie
                .send(NEW_CATEGORY_PAYLOAD);

            expect(response.statusCode).toBe(201);
            expect(response.body.name).toBe(NEW_CATEGORY_PAYLOAD.name);
            expect(response.body.ownerId).toBe(MOCK_USER_ID);
        });

        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app)
                .post('/category')
                .send(NEW_CATEGORY_PAYLOAD); // No cookie

            expect(response.statusCode).toBe(401);
        });

        it('should return 400 if category name is missing', async () => {
            const response = await request(app)
                .post('/category')
                .set('Cookie', global.authCookie)
                .send({ name: '' });

            expect(response.statusCode).toBe(400);
        });
    });

    // =========================================================================
    // 2. GET /category (READ ALL)
    // =========================================================================
    describe('GET /category', () => {
        it('should return all categories for the authenticated user (200)', async () => {
            // Simulates Mongoose (controller calls Category.find({ ownerId: MOCK_USER_ID }))
            Category.find.mockResolvedValueOnce([{ _id: MOCK_CATEGORY_ID, name: 'Work', ownerId: MOCK_USER_ID }]);

            const response = await request(app)
                .get('/category')
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].name).toBe('Work');
        });

        it('should return 401 if user is not authenticated', async () => {
            // Temporarily removes the cookie to test 401
            const oldCookie = global.authCookie;
            global.authCookie = null; 

            const response = await request(app)
                .get('/category');

            expect(response.statusCode).toBe(401);
            
            // Restores the cookie
            global.authCookie = oldCookie;
        });
    });

    // =========================================================================
    // 3. GET /category/:id (READ SINGLE)
    // =========================================================================
    describe('GET /category/:id', () => {
        it('should return a single category by ID (200)', async () => {
            const mockCategory = { 
                _id: MOCK_CATEGORY_ID, 
                name: 'Personal', 
                ownerId: MOCK_USER_ID 
            };
            // Simulates Mongoose (controller calls Category.findById(id))
            Category.findById.mockResolvedValueOnce(mockCategory);

            const response = await request(app)
                .get(`/category/${MOCK_CATEGORY_ID}`)
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(200);
            expect(response.body.name).toBe('Personal');
        });
        
        // Test for 404 Not Found (Category does not exist)
        it('should return 404 if the category is not found', async () => {
            Category.findById.mockResolvedValueOnce(null);
            
            const response = await request(app)
                .get(`/category/${MOCK_OTHER_ID}`)
                .set('Cookie', global.authCookie);
                
            expect(response.statusCode).toBe(404);
        });

        // Test for 403 Forbidden (Not the owner, but controller should be tested)
        it('should return 403 if the category belongs to another user', async () => {
            const mockForeignCategory = { 
                _id: MOCK_CATEGORY_ID, 
                name: 'Foreign', 
                ownerId: MOCK_OTHER_ID // Another user's ID
            };
            Category.findById.mockResolvedValueOnce(mockForeignCategory);
            
            const response = await request(app)
                .get(`/category/${MOCK_CATEGORY_ID}`)
                .set('Cookie', global.authCookie); // Our MOCK_USER_ID is logged in
                
            expect(response.statusCode).toBe(403);
        });
    });

    // =========================================================================
    // 4. PUT /category/:id (UPDATE)
    // =========================================================================
    describe('PUT /category/:id', () => {
        it('should update the category for the owner (200)', async () => {
            // Simulates Mongoose (controller should first fetch and check owner)
            const mockCategory = { 
                _id: MOCK_CATEGORY_ID, 
                name: 'Old Name', 
                ownerId: MOCK_USER_ID, 
                toString: () => MOCK_USER_ID 
            };
            
            Category.findById.mockResolvedValueOnce(mockCategory);
            
            // Category.findByIdAndUpdate is mocked to return the updated object
            
            const response = await request(app)
                .put(`/category/${MOCK_CATEGORY_ID}`)
                .set('Cookie', global.authCookie)
                .send(UPDATED_CATEGORY_PAYLOAD);

            expect(response.statusCode).toBe(200);
            expect(response.body.name).toBe(UPDATED_CATEGORY_PAYLOAD.name);
        });

        it('should return 403 if the user is not the owner', async () => {
            const mockForeignCategory = { 
                _id: MOCK_CATEGORY_ID, 
                name: 'Foreign', 
                ownerId: MOCK_OTHER_ID, 
                toString: () => MOCK_OTHER_ID // Another user's ID
            };
            Category.findById.mockResolvedValueOnce(mockForeignCategory);
            
            const response = await request(app)
                .put(`/category/${MOCK_CATEGORY_ID}`)
                .set('Cookie', global.authCookie) // Our MOCK_USER_ID is logged in
                .send(UPDATED_CATEGORY_PAYLOAD);

            expect(response.statusCode).toBe(403);
        });
    });

    // =========================================================================
    // 5. DELETE /category/:id (DELETE)
    // =========================================================================
    describe('DELETE /category/:id', () => {
        it('should delete the category for the owner (204)', async () => {
            // Simulates Mongoose (controller should fetch and check owner)
            const mockCategory = { 
                _id: MOCK_CATEGORY_ID, 
                name: 'Old Name', 
                ownerId: MOCK_USER_ID, 
                toString: () => MOCK_USER_ID 
            };
            
            Category.findById.mockResolvedValueOnce(mockCategory);
            Category.findByIdAndDelete.mockResolvedValueOnce(true);

            const response = await request(app)
                .delete(`/category/${MOCK_CATEGORY_ID}`)
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(204);
        });

        it('should return 403 if the user is not the owner', async () => {
            const mockForeignCategory = { 
                _id: MOCK_CATEGORY_ID, 
                name: 'Foreign', 
                ownerId: MOCK_OTHER_ID, 
                toString: () => MOCK_OTHER_ID 
            };
            Category.findById.mockResolvedValueOnce(mockForeignCategory);
            
            const response = await request(app)
                .delete(`/category/${MOCK_CATEGORY_ID}`)
                .set('Cookie', global.authCookie);

            expect(response.statusCode).toBe(403);
        });
    });
});
