const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Business owner only authentication middleware
 * No admin key validation required - only JWT token validation
 */
const businessOwnerOnlyAuth = async (req, res, next) => {
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

    // Find the user and check if they are a business owner
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. User not found." 
      });
    }

    if (user.role !== "business-owner") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Business owner privileges required." 
      });
    }

    console.log(`Business owner route accessed successfully from IP: ${req.ip}`);

    // Add the user to the request object
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

    console.error("Error in businessOwnerOnlyAuth middleware:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

module.exports = businessOwnerOnlyAuth;