/**
 * Auth Integration Tests: tests/auth.test.js
 * * * Goal: Test the registration routes (POST /user/register),
 * login (POST /user/login) and logout (GET /user/logout).
 * * Crucial: Capture and store the authentication cookie (connect.sid)
 * in 'global.authCookie' for use in other protected integration tests.
 */

const request = require('supertest');
const app = require('../server');
const bcrypt = require('bcryptjs');

// 1. DATA IMPORT (Required for the test)
const { 
    MOCK_USER_ID, 
    LOGIN_PAYLOAD, 
    NEW_USER_PAYLOAD,
    MOCK_HASHED_PASSWORD 
} = require('./mockdata'); 

// 2. Mock for the Mongoose User Model
const User = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((user) => ({ 
        _id: MOCK_USER_ID, 
        ...user,
        save: jest.fn().mockResolvedValue({ _id: MOCK_USER_ID, ...user })
    })),
};


// 3. BCRYPT MOCK FIX: Using a function to ensure the mock is accessible
// This block ensures MOCK_HASHED_PASSWORD is accessible during Jest hoisting.
jest.mock('bcryptjs', () => {
    // Access the imported value (which can be read in this scope)
    let HASHED_PASSWORD_VALUE = MOCK_HASHED_PASSWORD || 'default-mock-hash'; 
    
    return {
        compare: jest.fn(),
        // Sets the hash value to be used by the simulated controller
        hash: jest.fn().mockResolvedValue(HASHED_PASSWORD_VALUE) 
    };
});

// Stores the session cookie for global use in other tests
global.authCookie = null; 

// =========================================================================
// Test Suite: User Registration
// =========================================================================
describe('User Registration (POST /user/register)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Simulates that the user does not exist yet for registration
        User.findOne.mockResolvedValue(null); 
    });

    it('should successfully register a new user and return 201', async () => {
        
        // Simulates user creation with the mocked ID
        User.create.mockImplementationOnce((data) => ({
            _id: MOCK_USER_ID,
            ...data,
            save: jest.fn().mockResolvedValue({ _id: MOCK_USER_ID, ...data })
        }));

        const res = await request(app)
            .post('/user/register')
            .send(NEW_USER_PAYLOAD); 
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id', MOCK_USER_ID);
        expect(res.body).toHaveProperty('email', NEW_USER_PAYLOAD.email);
        expect(bcrypt.hash).toHaveBeenCalled();
        expect(User.create).toHaveBeenCalled();
    });

    it('should return 409 if the email is already in use', async () => {
        // Simulates that the user already exists
        User.findOne.mockResolvedValue({ email: NEW_USER_PAYLOAD.email }); 

        const res = await request(app)
            .post('/user/register')
            .send(NEW_USER_PAYLOAD); 
        
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('message', 'Email is already registered.');
        expect(bcrypt.hash).not.toHaveBeenCalled(); // Should not attempt to hash if validation fails
    });

    it('should return 400 for invalid registration data', async () => {
        const res = await request(app)
            .post('/user/register')
            .send({ email: 'invalid-email', password: 'short' }); 
        
        expect(res.statusCode).toEqual(400);
    });
});

// =========================================================================
// Test Suite: User Login
// =========================================================================
describe('User Login (POST /user/login)', () => {
    const mockUser = { 
        _id: MOCK_USER_ID, 
        email: LOGIN_PAYLOAD.email, 
        password: MOCK_HASHED_PASSWORD, // Password should be the simulated hashed value
        // Simulated instance methods, if used by the controller
        toJSON: () => ({ _id: MOCK_USER_ID, email: LOGIN_PAYLOAD.email })
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Set bcrypt.compare to succeed by default (simulate correct password)
        bcrypt.compare.mockResolvedValue(true); 
    });

    it('should log in a user successfully, return 200, and set global.authCookie', async () => {
        User.findOne.mockResolvedValue(mockUser); 

        const res = await request(app)
            .post('/user/login')
            .send(LOGIN_PAYLOAD); 
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('userId', MOCK_USER_ID);
        expect(User.findOne).toHaveBeenCalledWith({ email: LOGIN_PAYLOAD.email });
        expect(bcrypt.compare).toHaveBeenCalled();

        // CAPTURE THE SESSION COOKIE
        const setCookie = res.headers['set-cookie'];
        expect(setCookie).toBeDefined();

        // Assume the first cookie is connect.sid
        const sessionCookie = setCookie.find(cookie => cookie.startsWith('connect.sid'));
        global.authCookie = sessionCookie; 

        // Confirm the cookie was stored for global use
        expect(global.authCookie).not.toBeNull();
    });

    it('should return 401 for incorrect password', async () => {
        User.findOne.mockResolvedValue(mockUser); 
        bcrypt.compare.mockResolvedValue(false); // Simulate incorrect password

        const res = await request(app)
            .post('/user/login')
            .send({ ...LOGIN_PAYLOAD, password: 'wrongpassword' }); 
        
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message', 'Incorrect email or password.'); 
    });

    it('should return 401 if the email is not found', async () => {
        User.findOne.mockResolvedValue(null); 

        const res = await request(app)
            .post('/user/login')
            .send(LOGIN_PAYLOAD); 
        
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message', 'Incorrect email or password.'); 
        expect(bcrypt.compare).not.toHaveBeenCalled(); 
    });
});

// =========================================================================
// Test Suite: User Logout
// =========================================================================
describe('User Logout (GET /user/logout)', () => {

    it('should destroy the session and return 200', async () => {
        // Sends the previously captured cookie
        const res = await request(app)
            .get('/user/logout')
            .set('Cookie', global.authCookie); 

        expect(res.statusCode).toEqual(200);
        expect(res.headers['set-cookie']).toBeDefined();
        
        // Checks if the session cookie was cleared/expired
        const clearedCookie = res.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
        expect(clearedCookie).toContain('Max-Age=0'); 
    });
    
    // Optional: Test the unprotected route without cookie
    it('should return 200 even if no active session exists', async () => {
        const res = await request(app).get('/user/logout');
        expect(res.statusCode).toEqual(200);
    });
});
