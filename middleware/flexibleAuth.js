const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Flexible authentication middleware that allows both admin and business-owner access
 * Admin users require admin key validation, business-owner users do not
 */
const flexibleAuth = async (req, res, next) => {
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

    // Find the user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. User not found." 
      });
    }

    // Check if user has valid role
    if (user.role !== "admin" && user.role !== "business-owner") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Invalid user role." 
      });
    }

    // If user is admin, require admin key validation
    if (user.role === "admin") {
      const adminKey = req.headers["x-admin-key"] || req.query.adminKey;

      // Check if admin key is provided
      if (!adminKey) {
        console.log(`Admin route access attempt without key from IP: ${req.ip}`);
        return res.status(401).json({
          success: false,
          message: "Admin key is required for admin access",
        });
      }

      // Check if admin key is configured
      if (!process.env.ADMIN_KEY) {
        console.log("ADMIN_KEY environment variable is not configured");
        return res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
      }

      // Verify admin key
      if (adminKey !== process.env.ADMIN_KEY) {
        console.log(
          `Invalid admin key attempt from IP: ${
            req.ip
          }, Key: ${adminKey.substring(0, 4)}...`
        );
        return res.status(401).json({
          success: false,
          message: "Invalid admin key",
        });
      }

      console.log(`Admin route accessed successfully from IP: ${req.ip}`);
    } else {
      // Business owner access - no admin key required
      console.log(`Business owner route accessed successfully from IP: ${req.ip}`);
    }

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

    console.error("Error in flexibleAuth middleware:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

module.exports = flexibleAuth;