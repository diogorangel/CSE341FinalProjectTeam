const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories');
const { isAuthenticated } = require('../middleware/authenticate'); // Middleware to check if user is logged in

// =========================================================================
// PUBLIC ACCESS ROUTES (READ) - Accessible by anyone
// =========================================================================

// GET / - READ: Retrieve all categories
// #swagger.tags = ['Categories']
// #swagger.summary = 'Retrieves a list of all categories.'
router.get('/', categoriesController.getAllCategories);

// GET /{id} - READ: Retrieve a single category by ID
// #swagger.tags = ['Categories']
// #swagger.summary = 'Retrieves a single category by its ID.'
router.get('/:id', categoriesController.getSingleCategory);


// =========================================================================
// AUTHENTICATED ACCESS ROUTES (CREATE, UPDATE, DELETE) - Requires Session
// =========================================================================

// POST / - CREATE: Creates a new category (Requires authentication)
// #swagger.tags = ['Categories']
// #swagger.summary = 'Creates a new category. Authentication required.'
// #swagger.security = [{ "SessionCookie": [] }]
router.post('/', isAuthenticated, categoriesController.createCategory);

// PUT /{id} - UPDATE: Updates a category by ID (Requires authentication)
// #swagger.tags = ['Categories']
// #swagger.summary = 'Updates an existing category by its ID. Authentication required.'
// #swagger.security = [{ "SessionCookie": [] }]
router.put('/:id', isAuthenticated, categoriesController.updateCategory);

// DELETE /{id} - DELETE: Removes a category by ID (Requires authentication)
// #swagger.tags = ['Categories']
// #swagger.summary = 'Deletes a category by its ID. Authentication required.'
// #swagger.security = [{ "SessionCookie": [] }]
router.delete('/:id', isAuthenticated, categoriesController.deleteCategory);

module.exports = router;