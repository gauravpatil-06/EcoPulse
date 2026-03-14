const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        // 🛡️ Security Check: Ensure user still exists in database
        // This handles cases where an admin deletes a user while they are logged in
        let userExists = await User.findById(req.user.id);
        if (!userExists) {
            userExists = await Admin.findById(req.user.id);
        }

        if (!userExists) {
            return res.status(401).json({ message: 'User account no longer exists. Please re-register.' });
        }

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
