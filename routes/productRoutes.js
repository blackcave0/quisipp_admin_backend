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
  createMultipleAdminProducts,
  deleteMultipleAdminProducts,
  getAdminProductCustomWeights,
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
  // uploadRateLimit,
  adminAuth,
  uploadToMemory.array("productImages", 20),
  createAdminProduct
);

// Get all admin products with search and filters
router.get("/admin/products", searchRateLimit, adminAuth, getAdminProducts);

// Rate limiting for bulk operations
const bulkOperationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 bulk operations per 5 minutes
  message: {
    success: false,
    message: "Too many bulk operations, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bulk create multiple products (Admin only) - MUST come before /:id routes
router.post(
  "/admin/products/bulk",
  bulkOperationRateLimit,
  adminAuth,
  createMultipleAdminProducts
);

// Bulk delete multiple products (Admin only) - MUST come before /:id routes
router.delete(
  "/admin/products/bulk",
  bulkOperationRateLimit,
  adminAuth,
  deleteMultipleAdminProducts
);

// Get single admin product by ID
router.get("/admin/products/:id", adminAuth, getAdminProductById);

// Get custom weights for a specific admin product
router.get(
  "/admin/products/:id/custom-weights",
  adminAuth,
  getAdminProductCustomWeights
);

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
    { value: "vegetables & fruits", label: "Vegetables & Fruits" },
    { value: "atta, rice & dal", label: "Atta, Rice & Dal" },
    { value: "oil & ghee", label: "Oil & Ghee" },
    { value: "spices & herbs", label: "Spices & Herbs" },
    { value: "dairy, bread & eggs", label: "Dairy, Bread & Eggs" },
    { value: "bakery & biscuits", label: "Bakery & Biscuits" },
    { value: "dry fruits & cereals", label: "Dry Fruits & Cereals" },
    { value: "chicken , meat & fish", label: "Chicken, Meat & Fish" },
    { value: "beverages & soft drinks", label: "Beverages & Soft Drinks" },
    { value: "household & cleaning", label: "Household & Cleaning" },
    { value: "personal care", label: "Personal Care" },
    { value: "baby care & diapers", label: "Baby Care & Diapers" },
    { value: "pet care", label: "Pet Care" },
    { value: "other", label: "Other" },
  ];

  res.status(200).json({
    success: true,
    categories,
  });
});

// Get custom weight units
router.get("/custom-weight-units", (req, res) => {
  const customWeightUnits = [
    { value: "gm", label: "Grams (gm)" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "ltr", label: "Liters (ltr)" },
    { value: "pieces", label: "Pieces" },
    { value: "pack", label: "Pack" },
    { value: "bottle", label: "Bottle" },
    { value: "box", label: "Box" },
    { value: "other", label: "Other" },
  ];

  res.status(200).json({
    success: true,
    customWeightUnits,
  });
});

// Get weight options
router.get("/weight-options", (req, res) => {
  const weightOptions = [
    { value: "25gm", label: "25 gm" },
    { value: "50gm", label: "50 gm" },
    { value: "100gm", label: "100 gm" },
    { value: "150gm", label: "150 gm" },
    { value: "200gm", label: "200 gm" },
    { value: "250gm", label: "250 gm" },
    { value: "300gm", label: "300 gm" },
    { value: "350gm", label: "350 gm" },
    { value: "400gm", label: "400 gm" },
    { value: "500gm", label: "500 gm" },
    { value: "600gm", label: "600 gm" },
    { value: "700gm", label: "700 gm" },
    { value: "750gm", label: "750 gm" },
    { value: "800gm", label: "800 gm" },
    { value: "900gm", label: "900 gm" },
    { value: "1kg", label: "1 kg" },
    { value: "1.5kg", label: "1.5 kg" },
    { value: "2kg", label: "2 kg" },
    { value: "2.5kg", label: "2.5 kg" },
    { value: "3kg", label: "3 kg" },
    { value: "3.5kg", label: "3.5 kg" },
    { value: "4kg", label: "4 kg" },
    { value: "5kg", label: "5 kg" },
    { value: "6kg", label: "6 kg" },
    { value: "7kg", label: "7 kg" },
    { value: "8kg", label: "8 kg" },
    { value: "9kg", label: "9 kg" },
    { value: "10kg", label: "10 kg" },
    { value: "50ml", label: "50 ml" },
    { value: "100ml", label: "100 ml" },
    { value: "150ml", label: "150 ml" },
    { value: "200ml", label: "200 ml" },
    { value: "250ml", label: "250 ml" },
    { value: "300ml", label: "300 ml" },
    { value: "350ml", label: "350 ml" },
    { value: "400ml", label: "400 ml" },
    { value: "450ml", label: "450 ml" },
    { value: "500ml", label: "500 ml" },
    { value: "550ml", label: "550 ml" },
    { value: "600ml", label: "600 ml" },
    { value: "650ml", label: "650 ml" },
    { value: "700ml", label: "700 ml" },
    { value: "750ml", label: "750 ml" },
    { value: "800ml", label: "800 ml" },
    { value: "850ml", label: "850 ml" },
    { value: "900ml", label: "900 ml" },
    { value: "950ml", label: "950 ml" },
    { value: "1ltr", label: "1 ltr" },
    { value: "1.5ltr", label: "1.5 ltr" },
    { value: "2ltr", label: "2 ltr" },
    { value: "2.5ltr", label: "2.5 ltr" },
    { value: "3ltr", label: "3 ltr" },
    { value: "3.5ltr", label: "3.5 ltr" },
    { value: "4ltr", label: "4 ltr" },
    { value: "5ltr", label: "5 ltr" },
    { value: "6ltr", label: "6 ltr" },
    { value: "7ltr", label: "7 ltr" },
    { value: "8ltr", label: "8 ltr" },
    { value: "9ltr", label: "9 ltr" },
    { value: "10ltr", label: "10 ltr" },
    { value: "custom", label: "Custom Weight/Volume" },
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
