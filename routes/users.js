// routes/users.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');

router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.get('/logout', usersController.logout);

module.exports = router;