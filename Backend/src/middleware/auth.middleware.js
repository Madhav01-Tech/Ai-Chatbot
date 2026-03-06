import jwt from 'jsonwebtoken';

const authmiddleware = (req, res, next) => {
    // Try to get token from Authorization header first, then from cookies
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization) {
        // Extract token from "Bearer <token>"
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }
        const userId = decoded.userId;

        req.userId = userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }


}


export default authmiddleware;


