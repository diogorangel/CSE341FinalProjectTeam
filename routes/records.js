// routes/records.js
const express = require('express');
const router = express.Router();
const recordsController = require('../controllers/records');
const { isAuthenticated } = require('../middleware/authenticate'); 

// All CRUD routes are protected by the isAuthenticated middleware
router.post('/', isAuthenticated, recordsController.createRecord);
router.get('/', isAuthenticated, recordsController.getAllRecords);
router.get('/:id', isAuthenticated, recordsController.getSingleRecord);
router.put('/:id', isAuthenticated, recordsController.updateRecord);
router.delete('/:id', isAuthenticated, recordsController.deleteRecord);

module.exports = router;