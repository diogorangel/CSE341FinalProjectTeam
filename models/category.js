const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // The ID of the user who created the category
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // New Fields Added Below
    description: {
        type: String,
        trim: true,
        default: 'A user-defined category.'
    },
    colorHex: {
        type: String,
        default: '#CCCCCC', // Default gray color
        match: /^#([0-9A-F]{3}){1,2}$/i // Basic hex code validation
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    recordCount: {
        type: Number,
        default: 0
    }
}, {
    // Adds createdAt and updatedAt timestamps automatically
    timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);