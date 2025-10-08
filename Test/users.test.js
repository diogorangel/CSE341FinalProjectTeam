// Ensure all necessary dependencies (like User, bcrypt, request, app)
// are defined or imported at the top of the file.

// Example Mocks and setup (Assume these are at the top of the actual file)
/*
jest.mock('../models/User'); 
jest.mock('bcrypt'); 
const request = require('supertest');
const app = require('../server'); // Your Express app
const User = require('../models/User');
const bcrypt = require('bcrypt');
const MOCK_USER_ID = '651f62b7812c3f4e5a6b7c8e';
const MOCK_HASHED_PASSWORD = 'hashedpasswordmock';
*/

// =========================================================================
// Test Suite: User Login
// =========================================================================
describe('User Login (POST /user/login)', () => {
    // Define the mockUser with the structure that Mongoose.findOne should return.
    const mockUser = { 
        _id: MOCK_USER_ID, 
        username: 'testuser', 
        password: MOCK_HASHED_PASSWORD,
        // It's crucial to mock the password verification function (typically bcrypt.compare is used)
        // and the toJSON function (if Mongoose uses it to serialize the response)
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Set up the bcrypt mock to succeed by default
        bcrypt.compare.mockResolvedValue(true); 
    });

    it('should log in a user successfully, set session, and return 200', async () => {
        // 1. Arrange: Set up the mock to find the user
        User.findOne.mockResolvedValue(mockUser); 

        // 2. Act: Make the login request
        const res = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser',
                password: 'correctpassword' // Will be compared against MOCK_HASHED_PASSWORD
            }); 
        
        // 3. Assert: Verify the result
        expect(res.statusCode).toEqual(200);
        // The response body should contain useful information, such as the ID
        expect(res.body).toHaveProperty('userId', MOCK_USER_ID); 
        expect(res.body).toHaveProperty('message', 'Login successful'); // Assuming you return a success message
        
        // Verify if the user lookup and password comparison occurred
        expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' });
        expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', MOCK_HASHED_PASSWORD);

        // **Session Test (Supertest):** Verify if the session was created/the cookie was sent.
        // The presence of 'connect.sid' indicates the session was successfully established.
        expect(res.headers['set-cookie']).toBeDefined();
        const sessionCookie = res.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
        expect(sessionCookie).toBeDefined();

        // Note: The actual session test (req.session.userId) happens inside the controller mock,
        // but Supertest verifies if the server sent the cookie.
    });

    it('should return 401 for incorrect password', async () => {
        // Mock finding the user
        User.findOne.mockResolvedValue(mockUser); 
        // Mock to simulate password comparison failure
        bcrypt.compare.mockResolvedValue(false); 

        const res = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser',
                password: 'wrongpassword'
            }); 
        
        // Check 401 status for unauthorized
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message', 'Incorrect username or password.'); 
        expect(res.headers['set-cookie']).toBeUndefined(); // Should not set a cookie
    });

    it('should return 401 if the username is not found', async () => {
        // Mock not finding the user
        User.findOne.mockResolvedValue(null); 

        const res = await request(app)
            .post('/user/login')
            .send({
                username: 'nonexistent',
                password: 'anypassword'
            }); 
        
        // Check 401 status
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message', 'Incorrect username or password.'); 
        // Password comparison should NOT be called if the user is not found
        expect(bcrypt.compare).not.toHaveBeenCalled(); 
        expect(res.headers['set-cookie']).toBeUndefined(); // Should not set a cookie
    });
    
    it('should return 422 for invalid input (missing field)', async () => {
        // 1. Act: Make the request without the 'password' field
        const res = await request(app)
            .post('/user/login')
            .send({
                username: 'testuser'
                // password is intentionally missing
            }); 
        
        // 2. Assert: Check 422 (Unprocessable Entity) or 400 (Bad Request) status, 
        // depending on your schema validation (joi/express-validator)
        // Adding this test to validate the schema defined in Swagger
        expect(res.statusCode).toBeGreaterThanOrEqual(400); 
        expect(res.statusCode).toBeLessThan(500); 
        // You can be more specific if you have a schema validator
        // expect(res.body).toHaveProperty('message', expect.stringContaining('required')); 
        expect(User.findOne).not.toHaveBeenCalled();
    });
});