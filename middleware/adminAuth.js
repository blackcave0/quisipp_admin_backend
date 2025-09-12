const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // check if the user is an admin
    const user = await User.findById(decoded.id);
    // console.log(user.role);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. User not found." 
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin privileges required." 
      });
    }

    // add the user to the request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. Invalid token." 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. Token expired." 
      });
    }

    console.error("Error in adminAuth middleware:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

module.exports = adminAuth;
