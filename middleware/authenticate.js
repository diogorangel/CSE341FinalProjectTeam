// middleware/isAuthenticated.js
// Note: I renamed the file from authenticate.js to isAuthenticated.js 
// for consistency with the function name, as seen in the routes/users.js update.

const isAuthenticated = (req, res, next) => {
    // 1. AUTHENTICATION CHECK (Is the user logged in?)
    if (!req.session.userId) {
        // HTTP 401 Unauthorized
        return res.status(401).send('Access Denied. Please log in.');
    }

    // 2. AUTHORIZATION CHECK (For PUT and DELETE on /user/:id)
    // Check if a user ID is provided in the URL parameters.
    const requestedUserId = req.params.id;
    
    // If an ID is present in the route and the request is PUT or DELETE, 
    // we must ensure the requested ID matches the session ID.
    if (requestedUserId && (req.method === 'PUT' || req.method === 'DELETE')) {
        
        // Ensure the ID in the URL matches the ID stored in the session
        if (requestedUserId !== req.session.userId) {
            // HTTP 403 Forbidden
            // The user is logged in (Authenticated), but is trying to access someone else's resource (Not Authorized).
            return res.status(403).send('Forbidden. You can only modify or delete your own account.');
        }
    }

    // If no ID was provided in the URL, or if the IDs matched, proceed.
    next();
};

module.exports = { isAuthenticated };