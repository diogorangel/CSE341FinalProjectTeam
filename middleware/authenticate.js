// middleware/authenticate.js
const isAuthenticated = (req, res, next) => {
    // Checks if the user ID is in the session (active session)
    if (req.session.userId) {
        next(); // User is authenticated, proceed to the controller
    } else {
        // HTTP 401 Unauthorized
        res.status(401).send('Access Denied. Please log in.');
    }
};

module.exports = { isAuthenticated };