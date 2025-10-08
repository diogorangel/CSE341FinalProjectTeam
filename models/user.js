// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Needed for password comparison
const Schema = mongoose.Schema;

const userSchema = new Schema({
    // Standard local authentication fields
    username: {
        type: String,
        // CRITICAL FIX: username must be optional if we rely on Google's displayName
        // or if we want accounts without a specific local username.
        required: false, 
        unique: true,
        sparse: true // Ensures index works correctly when field is null
    },
    password: { // Password HASHED!
        type: String,
        // CRITICAL FIX: The password is NOT required if the user logs in via Google.
        required: false 
    },
    // Field for Google OAuth
    googleId: {
        type: String,
        required: false, // Only required for Google accounts
        unique: true,
        sparse: true // Allows multiple null values for non-Google users
    },
    email: { // Often needed for Google sign-in and recovery
        type: String,
        required: true, // Making email required, as Google always provides it (or local sign up)
        unique: true,
        sparse: true 
    }
}, {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true 
});

// =========================================================================
// Custom Method for Password Verification (Used during local login)
// =========================================================================

/**
 * Compares a given plain-text password with the stored hashed password.
 * @param {string} candidatePassword - The plain-text password provided by the user.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
    // If the user doesn't have a password (e.g., Google login only), always return false 
    // for local login attempts, even if the password field is null.
    if (!this.password) {
        return false;
    }
    // Use bcrypt to compare the plain-text password with the stored hash
    return bcrypt.compare(candidatePassword, this.password);
};

// NOTE: A pre('save') hook for hashing passwords would typically be added here,
// but it is being handled in the controller file for simplicity in this setup.
// If you implement a pre-save hook, you must ensure it does NOT run 
// when the password field is null (for Google login accounts).

module.exports = mongoose.model('User', userSchema);
