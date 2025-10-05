// routes/categories.js
const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories');
const { isAuthenticated } = require('../middleware/authenticate'); // Assuming middleware is named isAuthenticated

// --- Public Access ---
// GET /category - READ: Returns all
router.get('/', categoriesController.getAllCategories);
// GET /category/{id} - READ: Returns a single specific
router.get('/:id', categoriesController.getSingleCategory);


// --- Authenticated Access (Requires Session Cookie) ---
// POST /category - CREATE: Creates a new category
router.post('/', isAuthenticated, categoriesController.createCategory);
// PUT /category/{id} - UPDATE: Updates a category (Owner only)
router.put('/:id', isAuthenticated, categoriesController.updateCategory);
// DELETE /category/{id} - DELETE: Removes a category (Owner only)
router.delete('/:id', isAuthenticated, categoriesController.deleteCategory);

module.exports = router;