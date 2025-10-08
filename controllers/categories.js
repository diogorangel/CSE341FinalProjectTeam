//controllers/categories.js
const Category = require('../models/category');
const Record = require('../models/record'); // Needed for cascading delete/update

// =========================================================================
// POST /category - CREATE: Creates a new category (Requires authentication)
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
    /* #swagger.responses[201] = { description: 'Category successfully created.', schema: { $ref: "#/definitions/Category" } } */
    /* #swagger.responses[400] = { description: 'Name is required.' } */
    /* #swagger.responses[409] = { description: 'Category name already exists for this user.' } */
    
    const { name } = req.body;
    const ownerId = req.session.userId; // ID do usuário logado (garantido por isAuthenticated)

    // A validação de autenticação é feita pelo middleware isAuthenticated.
    // Se o middleware for ignorado, o ownerId será undefined, e a verificação 401 abaixo é útil.
    if (!ownerId) {
        return res.status(401).json({ message: 'User must be authenticated.' });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Category name is required and must be a valid string.' });
    }

    try {
        // 1. Consistency: Check for existing category name *only for this user*
        const existingCategory = await Category.findOne({ name: name.trim(), ownerId });
        if (existingCategory) {
            return res.status(409).json({ message: 'Category name already exists for this user.' });
        }

        const newCategory = new Category({ name: name.trim(), ownerId });
        await newCategory.save();

        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category.', error: error.message });
    }
};

// =========================================================================
// GET /category - READ: Returns all categories (PUBLICLY ACCESSIBLE)
// FIX: Changed logic to return all categories OR filter by user if authenticated.
// This matches the routes file which does NOT require isAuthenticated here.
// =========================================================================
exports.getAllCategories = async (req, res) => {
    // #swagger.tags = ['Categories']
    /* #swagger.responses[200] = { 
        description: 'List of all categories. If authenticated, only shows user-owned categories.',
        schema: [{ name: 'Music', ownerId: '60a7d5b1...' }]
    } */
    /* #swagger.responses[500] = { description: 'Internal server error.' } */

    const currentUserId = req.session.userId;
    let filter = {};

    // If the user is authenticated, we filter the list to show ONLY their categories.
    // If they are NOT authenticated, we show all categories (if there are public ones).
    // Given the current model structure (ownerId is mandatory), the simplest logic is to only show owned categories when logged in.
    if (currentUserId) {
         filter.ownerId = currentUserId;
    }
    
    // NOTE: Since the route is public access, we must decide what unauthenticated users see. 
    // Assuming we only show categories that belong to a user, unauthenticated users see nothing.
    // To maintain security, we will only show categories if the user is logged in.
    // If you need truly public categories, you must adjust your Category model (e.g., add isPublic: true).
    
    if (!currentUserId) {
        // If not logged in and we don't support public categories, we return an empty array.
        // If we want to strictly follow the route being public, we return all categories.
        // Choosing to return all categories for now, but in a secure app, this would be restricted.
        // For simplicity and to match the route definition (no isAuthenticated), we return all.
        filter = {}; // Show all categories from all users
    }

    try {
        // Filter categories based on the user ID (if authenticated) or none (if unauthenticated/public)
        const categories = await Category.find(filter);
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving categories.', error: error.message });
    }
};

// =========================================================================
// GET /category/:id - READ: Returns a single specific category (PUBLICLY ACCESSIBLE)
// FIX: Removed mandatory authentication check. Category must exist.
// =========================================================================
exports.getSingleCategory = async (req, res) => {
    // #swagger.tags = ['Categories']
    /* #swagger.parameters['id'] = { description: 'Category ID.' } */
    /* #swagger.responses[200] = { description: 'Category found.', schema: { $ref: "#/definitions/Category" } } */
    /* #swagger.responses[404] = { description: 'Category not found.' } */

    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        
        // No authorization check here because the route is defined as public in routes/categories.js.
        // Any user (authenticated or not) can view the category if they have the ID.

        res.status(200).json(category);
    } catch (error) {
        // Check for invalid ID format (Mongoose CastError)
        if (error.name === 'CastError') {
             return res.status(404).json({ message: 'Category not found with the given ID.' });
        }
        res.status(500).json({ message: 'Error retrieving category.', error: error.message });
    }
};

// =========================================================================
// PUT /category/:id - UPDATE: Updates a category (Owner only, requires authentication)
// =========================================================================
exports.updateCategory = async (req, res) => {
    // #swagger.tags = ['Categories']
    // #swagger.security = [{ "SessionCookie": [] }]
    /* #swagger.parameters['id'] = { description: 'Category ID.' } */
    /* #swagger.parameters['body'] = {
        in: 'body',
        description: 'New name for the category.',
        required: true,
        schema: { $ref: "#/definitions/CategoryCreate" }
    } */
    /* #swagger.responses[200] = { description: 'Category successfully updated.', schema: { $ref: "#/definitions/Category" } } */
    /* #swagger.responses[400] = { description: 'Category name is required for update.' } */
    /* #swagger.responses[403] = { description: 'Unauthorized. Only the owner can update.' } */
    /* #swagger.responses[404] = { description: 'Category not found.' } */

    const { name } = req.body;
    const categoryId = req.params.id;
    const currentUserId = req.session.userId;
    
    // Authorization check is handled by isAuthenticated middleware, but we check the owner.
    if (!currentUserId) {
        return res.status(401).json({ message: 'User must be authenticated.' });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Category name is required for update.' });
    }

    try {
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Authorization: Only the creator of the category can update it
        if (category.ownerId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized. Only the owner can update this category.' });
        }
        
        // 4. Check for duplicate name for this user before updating
        const existingCategoryWithNewName = await Category.findOne({ name: name.trim(), ownerId: currentUserId });
        if (existingCategoryWithNewName && existingCategoryWithNewName._id.toString() !== categoryId) {
             return res.status(409).json({ message: 'Another category with this name already exists for this user.' });
        }

        // Perform the update
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { name: name.trim() },
            { new: true, runValidators: true }
        );
        
        res.status(200).json(updatedCategory);

    } catch (error) {
        if (error.name === 'CastError') {
             return res.status(404).json({ message: 'Category not found with the given ID.' });
        }
        res.status(500).json({ message: 'Error updating category.', error: error.message });
    }
};

// =========================================================================
// DELETE /category/:id - DELETE: Removes a category (Owner only, requires authentication)
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

    if (!currentUserId) {
        return res.status(401).json({ message: 'User must be authenticated.' });
    }

    try {
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Authorization: Only the creator of the category can delete
        if (category.ownerId.toString() !== currentUserId) {
            return res.status(403).json({ message: 'Unauthorized. Only the owner can delete this category.' });
        }
        
        // Cascading Delete: Update all records that use this category to null or an 'Uncategorized' default
        // Assuming your Record model has a field 'categoryId'
        await Record.updateMany(
            { categoryId: categoryId },
            { $unset: { categoryId: "" } } // Removes the field, or set to null if preferred
        );
        
        // Delete the category
        await Category.findByIdAndDelete(categoryId);

        res.status(204).send(); // 204 No Content for successful deletion

    } catch (error) {
        if (error.name === 'CastError') {
             return res.status(404).json({ message: 'Category not found with the given ID.' });
        }
        res.status(500).json({ message: 'Error deleting category.', error: error.message });
    }
};
