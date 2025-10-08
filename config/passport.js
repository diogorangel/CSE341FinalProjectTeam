const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user'); // Your Mongoose user model

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID, // Your Client ID from .env
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Your Client Secret from .env
        callbackURL: "/auth/google/callback", // The endpoint Google redirects to
        
        // Defines the data requested from the user's Google account
        scope: ['profile', 'email'] 
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Extract the primary email and display name from the Google profile
            const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
            const username = profile.displayName || (email ? email.split('@')[0] : 'google-user');

            // 1. Check if a user with this Google ID already exists
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // User found, proceed with authentication
                return done(null, user); 
            }
            
            // 2. If not found by Google ID, check if a user with the same email already exists (Local user linking)
            // This prevents duplicate accounts if a user signs up locally and then tries Google OAuth.
            user = await User.findOne({ email: email });

            if (user) {
                // Existing user found by email. Link the Google ID to the existing account and save.
                user.googleId = profile.id;
                // Note: We don't overwrite the existing username/password if they exist
                await user.save();
                return done(null, user);
            }

            // 3. Create a new user account
            const newUser = await User.create({
                googleId: profile.id,
                username: username,
                email: email
                // Note: No password is set for social login accounts
            });
            done(null, newUser);
            
        } catch (err) {
            console.error("Error during Google OAuth process:", err);
            // Pass the error back to Passport
            done(err, null);
        }
    })
);

// --- Session Management ---

// Serializes the user ID to store in the session cookie
passport.serializeUser((user, done) => {
    // We store only the MongoDB user ID in the session
    done(null, user.id);
});

// Deserializes the user object from the ID stored in the session cookie
passport.deserializeUser(async (id, done) => {
    try {
        // Find the user object based on the ID stored in the session
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// This file must be imported and executed in your server.js or app.js file 
// to ensure the Google strategy and serialization functions are registered.
module.exports = passport;