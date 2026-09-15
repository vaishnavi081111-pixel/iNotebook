
const jwt = require('jsonwebtoken');

const fetchuser = (req, res, next) => {

    // Get the user from the JWT token
    // and add user information to req object
    const token = req.header('auth-token');

    // If token is not provided
    if (!token) {
        return res.status(401).send({
            error: "Please authenticate using a valid token"
        });
    }

    try {

        // Verify JWT token using secret from .env
        const data = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Add user information to request
        req.user = data.user;

        // Continue to next middleware/route
        next();

    } catch (error) {

        res.status(401).send({
            error: "Please authenticate using a valid token"
        });

    }
};

module.exports = fetchuser;

