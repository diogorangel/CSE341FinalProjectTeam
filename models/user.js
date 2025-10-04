// models/user.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: { // Password HASHED!
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);