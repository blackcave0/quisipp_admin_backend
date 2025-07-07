const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Import controllers
const {
  createAdminProduct,
  getAdminProducts,
  getAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
} = require("../controllers/productController");

const {
  searchAvailableProducts,
  adoptAdminProduct,
  getAdoptedProducts,
  updateAdoptedProduct,
  removeAdoptedProduct,
} = require("../controllers/businessOwnerProductController");

// Import middleware
const adminAuth = require("../middleware/adminAuth");
const businessOwnerAuth = require("../middleware/businessOwnerAuth");
const { uploadToMemory } = require("../config/cloudinary");

// Rate limiting for upload endpoints
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 upload requests per windowMs
  message: {
    success: false,
    message: "Too many upload attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 search requests per minute
  message: {
    success: false,
    message: "Too many search requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ======================
// ADMIN PRODUCT ROUTES
// ======================

// Create new product (Admin only)
router.post(
  "/admin/products",
  uploadRateLimit,
  adminAuth,
  uploadToMemory.array("productImages", 20),
  createAdminProduct
);

// Get all admin products with search and filters
router.get("/admin/products", searchRateLimit, adminAuth, getAdminProducts);

// Get single admin product by ID
router.get("/admin/products/:id", adminAuth, getAdminProductById);

// Update admin product
router.put("/admin/products/:id", adminAuth, updateAdminProduct);

// Delete admin product (soft delete)
router.delete("/admin/products/:id", adminAuth, deleteAdminProduct);

// ======================
// BUSINESS OWNER ROUTES
// ======================

// Search available products for adoption
router.get(
  "/business-owner/products/search",
  searchRateLimit,
  businessOwnerAuth,
  searchAvailableProducts
);

// Adopt admin product
router.post(
  "/business-owner/products/adopt/:productId",
  businessOwnerAuth,
  adoptAdminProduct
);

// Get business owner's adopted products
router.get(
  "/business-owner/products/adopted",
  searchRateLimit,
  businessOwnerAuth,
  getAdoptedProducts
);

// Update adopted product (stock status, quantity, selected weight)
router.put(
  "/business-owner/products/adopted/:productId",
  businessOwnerAuth,
  updateAdoptedProduct
);

// Remove adopted product
router.delete(
  "/business-owner/products/adopted/:productId",
  businessOwnerAuth,
  removeAdoptedProduct
);

// ======================
// PUBLIC ROUTES (for categories, etc.)
// ======================

// Get product categories
router.get("/categories", (req, res) => {
  const categories = [
    { value: "oil", label: "Oil & Lubricants" },
    { value: "soap", label: "Soap & Detergents" },
    { value: "book", label: "Books & Stationery" },
    { value: "grocery", label: "Grocery & Food" },
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing & Fashion" },
    { value: "home", label: "Home & Garden" },
    { value: "other", label: "Other" },
  ];

  res.status(200).json({
    success: true,
    categories,
  });
});

// Get weight options
router.get("/weight-options", (req, res) => {
  const weightOptions = [
    { value: "100gm", label: "100 grams" },
    { value: "200gm", label: "200 grams" },
    { value: "250gm", label: "250 grams" },
    { value: "300gm", label: "300 grams" },
    { value: "500gm", label: "500 grams" },
    { value: "1kg", label: "1 kilogram" },
    { value: "2kg", label: "2 kilograms" },
    { value: "5kg", label: "5 kilograms" },
    { value: "custom", label: "Custom Weight" },
  ];

  res.status(200).json({
    success: true,
    weightOptions,
  });
});

// Health check for product service
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Product service is running",
    timestamp: new Date().toISOString(),
  });
});

// Test Cloudinary configuration
router.get("/test-cloudinary", (req, res) => {
  const { validateCloudinaryConfig } = require("../config/cloudinary");

  try {
    validateCloudinaryConfig();
    res.status(200).json({
      success: true,
      message: "Cloudinary configuration is valid",
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not set",
        api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
        api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cloudinary configuration error",
      error: error.message,
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error("Product routes error:", error);

  // Handle Multer errors
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large. Maximum size is 5MB per image.",
    });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many files. Maximum 20 images allowed.",
    });
  }

  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Use "productImages" field name.',
    });
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  // Handle cast errors (invalid ObjectId)
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = router;
