// Middleware to check if the user is authenticated.
// It is essential for all protected routes (e.g., Records and restricted user routes).
const isAuthenticated = (req, res, next) => {
    // 1. AUTHENTICATION Check (Does the session exist?)
    // The 'express-session' mock in users.test.js relies on req.session.userId
    if (!req.session || !req.session.userId) {
        // Returns 401 Unauthorized if the session is not active.
        return res.status(401).send('Access Denied. Please log in.');
    }

    const userIdInSession = req.session.userId;
    const requestedUserId = req.params.id;
    const requestedMethod = req.method;

    // 2. AUTHORIZATION Check (Only for PUT/DELETE routes on user resources)
    // If the route includes /:id parameter and the method is PUT or DELETE:
    if (requestedUserId && (requestedMethod === 'PUT' || requestedMethod === 'DELETE')) {
        // Check if the requested resource ID matches the logged-in user's ID.
        if (userIdInSession !== requestedUserId) {
            // Returns 403 Forbidden if the user tries to modify someone else's resource.
            return res.status(403).send('Forbidden. You can only modify or delete your own account.');
        }
    }

    // If passed authentication and (if applicable) authorization, proceed to the next handler (the controller).
    next();
};

// CRITICAL FIX: Export the function within an object so it can be destructured easily in the router.
module.exports = { isAuthenticated };
// Middleware to check if the user is authenticated.