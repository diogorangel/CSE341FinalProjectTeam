const Comment = require('../models/comment');

// =========================================================================
// POST /comment - CREATE: Creates a new comment
// Requires recordId and text in the body
// =========================================================================
exports.createComment = async (req, res) => {
    // #swagger.tags = ['Comments']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'Comment text and recordId. Requires authentication.',
        required: true,
        schema: { $ref: "#/definitions/CommentCreate" }
    } */
    /* #swagger.responses[201] = { description: 'Comment successfully created.' } */
    /* #swagger.responses[400] = { description: 'recordId and text are required.' } */

    const { recordId, text } = req.body;
    const ownerId = req.session.userId; // Author of the comment

    if (!recordId || !text) {
        return res.status(400).json({ message: 'recordId and text are required.' });
    }
    if (!ownerId) {
         return res.status(401).json({ message: 'User must be authenticated.' });
    }

    try {
        const newComment = new Comment({ recordId, ownerId, text });
        await newComment.save();

        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating comment.', error: error.message });
    }
};

// =========================================================================
// GET /comment/ - READ: Returns all comments (independent of Record)
// =========================================================================
exports.getAllComments = async (req, res) => {
    // #swagger.tags = ['Comments']
    /* #swagger.responses[200] = { description: 'List of all comments in the system.' } */
    
    try {
        // Busca todos os comentários e popula o username do autor
        const comments = await Comment.find({})
            .populate('ownerId', 'username'); 

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving all comments.', error: error.message });
    }
};

// =========================================================================
// GET /comment/record/:recordId - READ: Returns all comments for a specific Record
// =========================================================================
exports.getCommentsByRecord = async (req, res) => {
    // #swagger.tags = ['Comments']
    /* #swagger.parameters['recordId'] = { description: 'ID of the Record to list comments for.' } */
    /* #swagger.responses[200] = { description: 'List of comments for the Record.' } */

    try {
        // Find comments by recordId, and populate the owner's username
        const comments = await Comment.find({ recordId: req.params.recordId })
            .populate('ownerId', 'username'); 

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving comments.', error: error.message });
    }
};

// =========================================================================
// GET /comment/:id - READ: Returns a single specific comment
// =========================================================================
exports.getSingleComment = async (req, res) => {
    // #swagger.tags = ['Comments']
    /* #swagger.parameters['id'] = { description: 'Comment ID.' } */
    /* #swagger.responses[404] = { description: 'Comment not found.' } */

    try {
        const comment = await Comment.findById(req.params.id)
            .populate('ownerId', 'username'); 
            
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving comment.', error: error.message });
    }
};

// =========================================================================
// PUT /comment/:id - UPDATE: Updates a comment (only the author)
// =========================================================================
exports.updateComment = async (req, res) => {
    // #swagger.tags = ['Comments']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['id'] = { description: 'Comment ID.' } */
    /* #swagger.parameters['body'] = { ... } */
    /* #swagger.responses[403] = { description: 'Unauthorized. Only the author can update.' } */
    
    const { text } = req.body;
    const commentId = req.params.id;
    const currentUserId = req.session.userId;

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Authorization: Only the author of the comment can update it
        if (comment.ownerId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized. Only the author can update this comment.' });
        }
        
        // Update only the text
        if (text) {
            // Using findByIdAndUpdate for simplicity and direct update
            const updatedComment = await Comment.findByIdAndUpdate(
                commentId,
                { text },
                { new: true, runValidators: true }
            );

            res.status(200).json(updatedComment);
        } else {
            return res.status(400).json({ message: 'Comment text is required for update.' });
        }
        
    } catch (error) {
        res.status(500).json({ message: 'Error updating comment.', error: error.message });
    }
};

// =========================================================================
// DELETE /comment/:id - DELETE: Removes a comment (only the author)
// =========================================================================
exports.deleteComment = async (req, res) => {
    // #swagger.tags = ['Comments']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['id'] = { description: 'Comment ID.' } */
    /* #swagger.responses[204] = { description: 'Comment removed (No Content).' } */
    /* #swagger.responses[403] = { description: 'Unauthorized. Only the author can delete.' } */
    /* #swagger.responses[404] = { description: 'Comment not found.' } */

    const commentId = req.params.id;
    const currentUserId = req.session.userId;

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Authorization: Only the author of the comment can delete
        if (comment.ownerId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized. Only the author can delete this comment.' });
        }
        
        // Delete the comment
        await Comment.findByIdAndDelete(commentId);

        res.status(204).send();

    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment.', error: error.message });
    }
};