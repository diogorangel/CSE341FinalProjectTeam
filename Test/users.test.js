const request = require('supertest');
const mongoose = require('mongoose'); 

// =========================================================================
// CRITICAL: MOCK DEPENDENCIES (Define Mocks before App import)
// =========================================================================

// Mock bcryptjs to prevent it from crashing the test environment
jest.mock('bcryptjs');
const bcrypt = require('bcryptjs'); 

// Mock express-session to ensure req.session is available and functions correctly
jest.mock('express-session', () => {
    return jest.fn(() => (req, res, next) => {
        // Ensures req.session exists with a mock destroy method and an object structure
        req.session = req.session || {
            destroy: jest.fn(cb => cb(null)), 
        };
        next();
    });
});

// Mock Mongoose Models (Must be manually defined to ensure static methods and constructor)
// Mock the entire module to control its structure
jest.mock('../models/user', () => {
    // Define the mock User class/constructor
    const MockUser = jest.fn(data => ({
        ...data,
        // Mock the instance save method right here to return the expected saved object structure
        save: jest.fn().mockResolvedValue({ 
            _id: '60a7d5b1b4a6c4c0f8e9a2b3', // Use a consistent mock ID
            username: data.username,
            password: data.password 
        }),
    }));

    // Add static methods to the mock constructor
    MockUser.findOne = jest.fn();
    MockUser.findById = jest.fn();
    MockUser.findByIdAndUpdate = jest.fn();
    MockUser.findByIdAndDelete = jest.fn();
    MockUser.find = jest.fn();

    // Ensure the prototype functions are also tracked if the controller uses them
    MockUser.prototype.save = MockUser.prototype.save || jest.fn();
    
    return MockUser;
});

// Mock Record Model (Needed because the controller imports it)
jest.mock('../models/record', () => ({
    deleteMany: jest.fn(),
}));

// Now import everything, ensuring the models and middleware are mocked before the app loads them
const User = require('../models/user');
const Record = require('../models/record');
const app = require('../server'); // Import app last


// =========================================================================
// Setup/Teardown: Connect to the DB once before all tests, disconnect after
// =========================================================================
beforeAll(async () => {
    // Only connect if not already connected. 
    if (mongoose.connection.readyState === 0) {
        // Assumes MONGODB_URI is available in the test environment (e.g., via .env setup)
        await mongoose.connect(process.env.MONGODB_URI); 
    }
});

afterAll(async () => {
    // Close the MongoDB connection after all tests are finished
    await mongoose.connection.close();
});

// =========================================================================
// Test Suite: User Registration
// =========================================================================
describe('User Registration', () => {
    
    // Define a known hashed value for mocking
    const MOCK_HASHED_PASSWORD = 'mocked_hashed_string';
    const MOCK_USER_ID = '60a7d5b1b4a6c4c0f8e9a2b3';

    // Clear mocks before each test to ensure fresh mock settings
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user successfully (Status 201)', async () => {
        // Mock 1: User does not exist
        User.findOne.mockResolvedValue(null);
        
        // Mock 2: Ensure bcrypt.hash returns a predictable string
        bcrypt.hash.mockResolvedValue(MOCK_HASHED_PASSWORD);

        // We need to ensure that the mocked save method returns an object 
        // that the controller can use for req.session.userId.
        // The mock defined globally now handles this for us.
        
        const res = await request(app)
            .post('/user/register')
            .send({
                username: 'testuser27',
                password: 'password1234'
            }); 
        
        // Verify Mocks were called correctly
        expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser27' });
        
        // Verify that the controller returned 201
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('userId', MOCK_USER_ID);
    });

    it('should return 409 if the username already exists', async () => {
        // Mock 1: User already exists
        const existingUser = { _id: 'existingId', username: 'existinguser', password: 'oldhash' };
        User.findOne.mockResolvedValue(existingUser);

        // Mock 2: Still need to mock bcrypt.hash just in case, but it shouldn't be called here.
        bcrypt.hash.mockResolvedValue(MOCK_HASHED_PASSWORD);

        const res = await request(app)
            .post('/user/register')
            .send({
                username: 'existinguser',
                password: 'password123'
            }); 
        
        // Verify Mocks were called correctly
        expect(User.findOne).toHaveBeenCalledWith({ username: 'existinguser' });
        expect(User).not.toHaveBeenCalled(); // User constructor shouldn't be called

        // Verify that the controller returned 409
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('message', 'User already exists.'); 
    });
});
// =========================================================================