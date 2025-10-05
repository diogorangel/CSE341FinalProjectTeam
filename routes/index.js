// routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth')); // <-- OAuth Routes
router.use('/user', require('./users')); // <-- User Management
router.use('/record', require('./records')); // <-- Record CRUD
router.use('/categories', require('./category')); // <-- Category CRUD (NEW)
router.use('/comment', require('./comments')); // <-- Comment CRUD (NEW)

module.exports = router;