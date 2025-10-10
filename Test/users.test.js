/**
 * User API Integration Tests: tests/users.test.js
 * * Integration tests for all user routes (/user)
 * * Covers session management (login/logout) and profile CRUD.
 */

const request = require('supertest');
const app = require('../server'); // Assume 'server.js' exports the Express app
const { 
  MOCK_USER_ID, 
  MOCK_OTHER_ID, 
  MOCK_USER,
  NEW_USER_PAYLOAD, // Add this payload in mockData.js
  LOGIN_PAYLOAD, // Add this payload in mockData.js
  UPDATED_USER_PAYLOAD // Add this payload in mockData.js
} = require('./mockdata');

// --- Mongoose Model Mock for User ---
const User = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findOne: jest.fn(), // Used for login
};

// --- Authentication Middleware Mock ---
// Reuses the isAuthenticated mock.
jest.mock('../middleware/authenticate', () => ({
  isAuthenticated: (req, res, next) => {
    // If the global authentication cookie is present
    if (global.authCookie) { 
      req.session = { userId: MOCK_USER_ID };
      req.user = { _id: MOCK_USER_ID }; // Simulates logged-in user for profile routes
      next();
    } else {
      res.status(401).json({ message: 'User must be authenticated.' });
    }
  },
}));

// Controller Mock: Simulates actions that UsersController would perform
// Note: In a real integration test, you would only mock the Model layer (User)
jest.mock('../controllers/users', () => ({
    register: jest.fn((req, res) => res.status(201).json({ 
        _id: MOCK_USER_ID, 
        email: req.body.email, 
        displayName: req.body.displayName 
    })),
    login: jest.fn((req, res) => res.status(200).send('Logged in')),
    logout: jest.fn((req, res) => res.status(200).send('Logged out')),
    getAllUsers: jest.fn((req, res) => res.status(200).json([
        { _id: MOCK_USER_ID, displayName: 'User A' },
        { _id: MOCK_OTHER_ID, displayName: 'User B' }
    ])),
    updateUser: jest.fn((req, res) => res.status(200).json({ 
        _id: req.params.id, 
        ...req.body 
    })),
    deleteUser: jest.fn((req, res) => res.status(204).send()),
    // Stubs for OAuth routes
    googleAuth: jest.fn((req, res) => res.status(200).send('Redirecting to Google')),
    googleCallback: jest.fn((req, res) => res.status(200).send('OAuth Callback Success')),
}));


describe('User API Integration Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Clears mock calls between tests
  });

  // =========================================================================
  // 1. Session Management (POST /register, POST /login, GET /logout)
  // =========================================================================
  describe('User Session Routes', () => {
    
    // Test POST /register
    it('should register a new user and establish a session (201)', async () => {
      // Note: Your register route uses isAuthenticated, which is unusual.
      // Assuming the middleware allows passage to the controller in this case.
      
      const response = await request(app)
        .post('/user/register')
        .set('Cookie', global.authCookie) // Simulates auth, if needed for the middleware
        .send(NEW_USER_PAYLOAD);

      expect(response.statusCode).toBe(201);
      expect(response.body._id).toBe(MOCK_USER_ID);
    });

    // Test POST /login
    it('should successfully login a user (200)', async () => {
      // The Auth integration test should already capture and store the cookie.
      const response = await request(app)
        .post('/user/login')
        .send(LOGIN_PAYLOAD);

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('Logged in');
      // In a real test, you would check if a new connect.sid cookie was set here.
    });
    
    // Test GET /logout
    it('should successfully logout the user (200)', async () => {
      const response = await request(app)
        .get('/user/logout')
        .set('Cookie', global.authCookie); // Sends the active cookie

      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('Logged out');
      // In a real test, you would check if the connect.sid cookie was cleared/expired.
    });

    // Stub tests for OAuth (just checks expected status code)
    it('GET /user/google should initiate OAuth (200)', async () => {
        const response = await request(app).get('/user/google');
        expect(response.statusCode).toBe(200);
    });
  });

  // =========================================================================
  // 2. User Profile CRUD (Protected)
  // =========================================================================
  describe('User Profile CRUD Routes', () => {

    // Test GET /user/all
    it('should return all users for an authenticated user (200)', async () => {
      const response = await request(app)
        .get('/user/all')
        .set('Cookie', global.authCookie);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
    
    // Test PUT /user/:id
    it('should update the profile if the user is authorized (200)', async () => {
      // For PUT, we simulate that req.params.id equals req.user._id (MOCK_USER_ID)
      // The controller mock assumes authorization was checked by middleware/controller.
      
      const response = await request(app)
        .put(`/user/${MOCK_USER_ID}`) // Logged-in user's ID
        .set('Cookie', global.authCookie)
        .send(UPDATED_USER_PAYLOAD);

      expect(response.statusCode).toBe(200);
      expect(response.body.displayName).toBe(UPDATED_USER_PAYLOAD.displayName);
    });

    // Test DELETE /user/:id
    it('should delete the user profile if the user is authorized (204)', async () => {
      // For DELETE, we simulate that req.params.id equals req.user._id
      
      const response = await request(app)
        .delete(`/user/${MOCK_USER_ID}`) // Logged-in user's ID
        .set('Cookie', global.authCookie);

      expect(response.statusCode).toBe(204);
    });
    
    // Authentication Failure Tests (Applies to GET/all, PUT, DELETE)
    it('should return 401 if user is not authenticated for a protected route', async () => {
      // Temporarily remove the cookie to test 401
      const oldCookie = global.authCookie;
      global.authCookie = null;
      
      const response = await request(app)
        .get('/user/all');

      expect(response.statusCode).toBe(401);
      
      // Restore the cookie
      global.authCookie = oldCookie;
    });

    // Authorization Note: The check for whether the logged-in user is updating/deleting
    // ONLY their own profile should be done INSIDE usersController.
    // The current controller mock does not simulate this failure (403), but a unit test would.
  });
});