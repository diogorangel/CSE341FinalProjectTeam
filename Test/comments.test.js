/**
 * Comment CRUD Tests: tests/comments.test.js
 * * Integration tests for all comment routes (/comment)
 * using Jest and Supertest.
 * * NOTE: These tests simulate authentication and authorization by ownerId,
 * ensuring only the author can edit/delete their comments.
 */

const request = require('supertest');
const app = require('../server'); // Assumes 'server.js' exports the Express app
const { 
    MOCK_USER_ID, 
    MOCK_OTHER_ID, 
    MOCK_RECORD_ID, 
    MOCK_COMMENT_ID,
    MOCK_OTHER_COMMENT_ID, // ID of a comment from another author
    NEW_COMMENT_PAYLOAD, 
    UPDATED_COMMENT_PAYLOAD 
} = require('./mockdata');

// --- Mongoose Model Mock ---
// Simulates the Mongoose Model interface for the Comment entity
const Comment = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};

// Setup Mock for create route
Comment.create.mockImplementation((data) => ({
    _id: MOCK_COMMENT_ID,
  authorId: MOCK_USER_ID,
  ...data
}));

// Mock para a rota de atualização
Comment.findByIdAndUpdate.mockImplementation((id, data) => ({
  _id: id,
  authorId: MOCK_USER_ID,
  ...data
}));


// --- Mock do Middleware de Autenticação ---
// Simula o comportamento do seu isAuthenticated
jest.mock('../middleware/authenticate', () => ({
  isAuthenticated: (req, res, next) => {
    // Se o cookie de autenticação global estiver presente (simulando login bem-sucedido)
    if (global.authCookie) { 
      // Simula a injeção do ID do usuário logado na requisição (usado pelo controlador como authorId)
      req.session = { userId: MOCK_USER_ID };
      req.user = { _id: MOCK_USER_ID }; // Simula a injeção do Passport/Auth
      next();
    } else {
      // Se não houver cookie, retorna 401 Unauthorized
      res.status(401).json({ message: 'User must be authenticated.' });
    }
  },
}));


describe('Comment API Integration Tests', () => {

  beforeAll(() => {
    if (!global.authCookie) {
      console.warn("WARNING: global.authCookie not set. Ensure authentication setup is correct.");
    }
  });

  // =========================================================================
  // 1. POST /comment (CREATE)
  // =========================================================================
  describe('POST /comment', () => {
    it('should create a new comment for an authenticated user (201)', async () => {
      Comment.create.mockResolvedValueOnce({
          _id: MOCK_COMMENT_ID,
          authorId: MOCK_USER_ID,
          ...NEW_COMMENT_PAYLOAD
      });
      
      const response = await request(app)
        .post('/comment')
        .set('Cookie', global.authCookie) // Requer autenticação
        .send(NEW_COMMENT_PAYLOAD);

      expect(response.statusCode).toBe(201);
      expect(response.body.text).toBe(NEW_COMMENT_PAYLOAD.text);
      expect(response.body.authorId).toBe(MOCK_USER_ID);
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .post('/comment')
        .send(NEW_COMMENT_PAYLOAD); // Sem cookie

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 if text or recordId is missing (Validation)', async () => {
      const response = await request(app)
        .post('/comment')
        .set('Cookie', global.authCookie)
        .send({ recordId: MOCK_RECORD_ID, text: '' }); 

      expect(response.statusCode).toBe(400); 
    });
  });

  // =========================================================================
  // 2. GET /comment/ (READ ALL)
  // =========================================================================
  describe('GET /comment', () => {
    it('should return all comments (requires authentication in routes.js) (200)', async () => {
      // Simula o controlador retornando uma lista de todos os comentários
      Comment.find.mockResolvedValueOnce([
        { _id: MOCK_COMMENT_ID, text: 'Comment 1', authorId: MOCK_USER_ID, recordId: MOCK_RECORD_ID },
        { _id: MOCK_OTHER_COMMENT_ID, text: 'Comment 2', authorId: MOCK_OTHER_ID, recordId: MOCK_RECORD_ID }
      ]);

      const response = await request(app)
        .get('/comment')
        .set('Cookie', global.authCookie);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  // =========================================================================
  // 3. GET /comment/:id (READ SINGLE)
  // =========================================================================
  describe('GET /comment/:id', () => {
    it('should return a single comment by ID (200)', async () => {
      const mockComment = { 
        _id: MOCK_COMMENT_ID, 
        text: 'Found it!', 
        authorId: MOCK_USER_ID, 
        recordId: MOCK_RECORD_ID 
      };
      Comment.findById.mockResolvedValueOnce(mockComment);

      const response = await request(app)
        .get(`/comment/${MOCK_COMMENT_ID}`)
        .set('Cookie', global.authCookie);

      expect(response.statusCode).toBe(200);
      expect(response.body.text).toBe('Found it!');
    });

    it('should return 404 if the comment is not found', async () => {
      Comment.findById.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .get(`/comment/${MOCK_OTHER_ID}`)
        .set('Cookie', global.authCookie);
        
      expect(response.statusCode).toBe(404);
    });
  });

  // =========================================================================
  // 4. GET /comment/record/:recordId (READ BY RECORD)
  // =========================================================================
  describe('GET /comment/record/:recordId', () => {
    it('should return all comments associated with a specific record ID (200)', async () => {
      // Simula o controlador chamando Comment.find({ recordId: MOCK_RECORD_ID })
      Comment.find.mockResolvedValueOnce([
        { _id: MOCK_COMMENT_ID, text: 'Comment A', authorId: MOCK_USER_ID, recordId: MOCK_RECORD_ID },
        { _id: MOCK_OTHER_COMMENT_ID, text: 'Comment B', authorId: MOCK_OTHER_ID, recordId: MOCK_RECORD_ID }
      ]);

      const response = await request(app)
        .get(`/comment/record/${MOCK_RECORD_ID}`)
        .set('Cookie', global.authCookie);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body.every(c => c.recordId === MOCK_RECORD_ID)).toBe(true);
    });
  });

  // =========================================================================
  // 5. PUT /comment/:id (UPDATE)
  // =========================================================================
  describe('PUT /comment/:id', () => {
    it('should update the comment for the author (200)', async () => {
      // 1. Simula a busca (findById) para checagem de autor
      const mockComment = { 
        _id: MOCK_COMMENT_ID, 
        text: 'Old Text', 
        authorId: MOCK_USER_ID, 
        toString: () => MOCK_USER_ID 
      };
      Comment.findById.mockResolvedValueOnce(mockComment);
      
      // 2. Simula o update (findByIdAndUpdate)
      Comment.findByIdAndUpdate.mockResolvedValueOnce({
          _id: MOCK_COMMENT_ID,
          authorId: MOCK_USER_ID,
          ...UPDATED_COMMENT_PAYLOAD
      });
      
      const response = await request(app)
        .put(`/comment/${MOCK_COMMENT_ID}`)
        .set('Cookie', global.authCookie)
        .send(UPDATED_COMMENT_PAYLOAD);

      expect(response.statusCode).toBe(200);
      expect(response.body.text).toBe(UPDATED_COMMENT_PAYLOAD.text);
    });

    it('should return 403 if the user is not the author', async () => {
      // Simula a busca retornando um objeto de outro autor
      const mockForeignComment = { 
        _id: MOCK_COMMENT_ID, 
        text: 'Foreign Comment', 
        authorId: MOCK_OTHER_ID, 
        toString: () => MOCK_OTHER_ID 
      };
      Comment.findById.mockResolvedValueOnce(mockForeignComment);
      
      const response = await request(app)
        .put(`/comment/${MOCK_COMMENT_ID}`)
        .set('Cookie', global.authCookie) // Nosso MOCK_USER_ID está logado
        .send(UPDATED_COMMENT_PAYLOAD);

      expect(response.statusCode).toBe(403);
    });
  });

  // =========================================================================
  // 6. DELETE /comment/:id (DELETE)
  // =========================================================================
  describe('DELETE /comment/:id', () => {
    it('should delete the comment for the author (204)', async () => {
      // 1. Simula a busca (findById) para checagem de autor
      const mockComment = { 
        _id: MOCK_COMMENT_ID, 
        authorId: MOCK_USER_ID, 
        toString: () => MOCK_USER_ID 
      };
      Comment.findById.mockResolvedValueOnce(mockComment);
      
      // 2. Simula o delete (findByIdAndDelete)
      Comment.findByIdAndDelete.mockResolvedValueOnce(true);

      const response = await request(app)
        .delete(`/comment/${MOCK_COMMENT_ID}`)
        .set('Cookie', global.authCookie);

      expect(response.statusCode).toBe(204);
    });

    it('should return 403 if the user is not the author', async () => {
      // Simula a busca retornando um objeto de outro autor
      const mockForeignComment = { 
        _id: MOCK_COMMENT_ID, 
        authorId: MOCK_OTHER_ID, 
        toString: () => MOCK_OTHER_ID 
      };
      Comment.findById.mockResolvedValueOnce(mockForeignComment);
      
      const response = await request(app)
        .delete(`/comment/${MOCK_COMMENT_ID}`)
        .set('Cookie', global.authCookie);

      expect(response.statusCode).toBe(403);
    });
  });
});