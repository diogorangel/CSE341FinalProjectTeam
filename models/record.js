// models/record.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recordSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: String,
    email: String,
    // ownerId: Links the record to the authenticated user (Authorization)
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // models/record.js (Add categoryId field)
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false // Optional
    }
});

module.exports = mongoose.model('Record', recordSchema);