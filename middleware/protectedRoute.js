// const logger = require("../config/logger");

/**
 * Middleware to protect admin routes with API key
 * Checks for admin key in X-Admin-Key header or adminKey query parameter
 */
exports.protectWithKey = (req, res, next) => {
  try {
    // Get admin key from header or query parameter
    const adminKey = req.headers["x-admin-key"] || req.query.adminKey;

    // Check if admin key is provided
    if (!adminKey) {
      console.log(`Admin route access attempt without key from IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: "Admin key is required to access this route",
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

    // Log successful admin access
    console.log(`Admin route accessed successfully from IP: ${req.ip}`);

    // Key is valid, proceed to next middleware
    next();
  } catch (error) {
    console.log(`Protected route middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
