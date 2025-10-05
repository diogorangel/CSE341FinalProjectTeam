// controllers/categories.js
const Category = require('../models/category');

// =========================================================================
// POST /category - CREATE: Creates a new category
// =========================================================================
exports.createCategory = async (req, res) => {
    // #swagger.tags = ['Categories']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'Name of the new category. Requires authentication.',
        required: true,
        schema: { $ref: "#/definitions/CategoryCreate" }
    } */
    /* #swagger.responses[201] = { description: 'Category successfully created.' } */
    /* #swagger.responses[400] = { description: 'Name is required.' } */
    /* #swagger.responses[409] = { description: 'Category already exists.' } */
    
    const { name } = req.body;
    const ownerId = req.session.userId; // ID of the logged-in user

    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }
    if (!ownerId) {
         return res.status(401).json({ message: 'User must be authenticated.' });
    }

    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(409).json({ message: 'Category already exists.' });
        }

        const newCategory = new Category({ name, ownerId });
        await newCategory.save();

        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category.', error: error.message });
    }
};

// =========================================================================
// GET /category - READ: Returns all categories
// =========================================================================
exports.getAllCategories = async (req, res) => {
    // #swagger.tags = ['Categories']
    /* #swagger.responses[200] = { 
        description: 'List of all categories.',
        schema: [{ name: 'Music', ownerId: '60a7d5b1...' }]
    } */

    try {
        const categories = await Category.find({});
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving categories.', error: error.message });
    }
};

// =========================================================================
// GET /category/:id - READ: Returns a single specific category
// =========================================================================
exports.getSingleCategory = async (req, res) => {
    // #swagger.tags = ['Categories']
    /* #swagger.parameters['id'] = { description: 'Category ID.' } */
    /* #swagger.responses[200] = { description: 'Category found.' } */
    /* #swagger.responses[404] = { description: 'Category not found.' } */

    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving category.', error: error.message });
    }
};

// =========================================================================
// PUT /category/:id - UPDATE: Updates a category
// =========================================================================
exports.updateCategory = async (req, res) => {
    // #swagger.tags = ['Categories']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['id'] = { description: 'Category ID.' } */
    /* #swagger.parameters['body'] = { ... } */
    /* #swagger.responses[200] = { description: 'Category successfully updated.' } */
    /* #swagger.responses[403] = { description: 'Unauthorized. Only the owner can update.' } */
    /* #swagger.responses[404] = { description: 'Category not found.' } */

    const { name } = req.body;
    const categoryId = req.params.id;
    const currentUserId = req.session.userId;

    try {
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Authorization: Only the creator of the category can update it
        if (category.ownerId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized. Only the owner can update this category.' });
        }
        
        // Update only the name
        if (name) {
            category.name = name;
            await category.save();
        } else {
            return res.status(400).json({ message: 'Category name is required for update.' });
        }
        
        res.status(200).json({ message: 'Category updated successfully.' });

    } catch (error) {
        res.status(500).json({ message: 'Error updating category.', error: error.message });
    }
};

// =========================================================================
// DELETE /category/:id - DELETE: Removes a category
// =========================================================================
exports.deleteCategory = async (req, res) => {
    // #swagger.tags = ['Categories']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['id'] = { description: 'Category ID.' } */
    /* #swagger.responses[204] = { description: 'Category removed (No Content).' } */
    /* #swagger.responses[403] = { description: 'Unauthorized. Only the owner can delete.' } */
    /* #swagger.responses[404] = { description: 'Category not found.' } */

    const categoryId = req.params.id;
    const currentUserId = req.session.userId;

    try {
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Authorization: Only the creator of the category can delete
        if (category.ownerId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized. Only the owner can delete this category.' });
        }
        
        // Delete the category
        await Category.findByIdAndDelete(categoryId);

        // NOTE: In a real project, you would need to remove the categoryId from all related Records.

        res.status(204).send(); // 204 No Content for successful deletion

    } catch (error) {
        res.status(500).json({ message: 'Error deleting category.', error: error.message });
    }
};