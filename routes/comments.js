const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/comments');
const { isAuthenticated } = require('../middleware/authenticate'); // Assuming middleware is named isAuthenticated

// --- Public/Read Access ---
// NEW: GET /comment/ - READ: Returns ALL comments (independent of Record)
router.get('/', commentsController.getAllComments); 

// GET /comment/{id} - READ: Returns a single specific comment
router.get('/:id', commentsController.getSingleComment);

// GET /comment/record/:recordId - READ: Returns all comments for a Record
router.get('/record/:recordId', commentsController.getCommentsByRecord);


// --- Authenticated Access (Requires Session Cookie) ---
// POST /comment - CREATE: Creates a new comment
router.post('/', isAuthenticated, commentsController.createComment);
// PUT /comment/{id} - UPDATE: Updates a comment (Author only)
router.put('/:id', isAuthenticated, commentsController.updateComment);
// DELETE /comment/{id} - DELETE: Removes a comment (Author only)
router.delete('/:id', isAuthenticated, commentsController.deleteComment);

module.exports = router;
