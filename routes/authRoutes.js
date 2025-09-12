const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { registerAdmin, loginAdmin } = require("../controllers/adminController");
const {
  createBusinessOwner,
  getAllBusinesOwners,
  createPasswordForBusinessOwner,
  updateBusinessOwner,
  loginBusinessOwner,
} = require("../controllers/businessOwnerController");
const {
  getAllDeliveryPersons,
  createDeliveryPerson,
  updateDeliveryPerson,
} = require("../controllers/deliveryPersonController");
const adminAuth = require("../middleware/adminAuth");
const { protectWithKey } = require("../middleware/protectedRoute");
const businessOwnerOnlyAuth = require("../middleware/businessOwnerOnlyAuth");

// Rate limiting for business owner operations that call external APIs
const businessOwnerApiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute for external API calls
  message: {
    success: false,
    message: "Too many requests to external service, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for login attempts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register Admin
router.post("/register", registerAdmin);

// Login Admin
router.post("/login", loginRateLimit, loginAdmin);

// Create Business Owner
router.post("/create-business-owner", createBusinessOwner);

// Get All Business Owners (with rate limiting for external API calls)
// Admin access only - requires admin key
router.get(
  "/all-business-owners",
  businessOwnerApiRateLimit,
  protectWithKey,
  getAllBusinesOwners
);

// Update Business Owner (with rate limiting for external API calls)
// Admin access only - requires admin key
router.put(
  "/update-business-owner/:id",
  businessOwnerApiRateLimit,
  protectWithKey,
  updateBusinessOwner
);

// Get All Delivery Persons
router.get(
  "/all-delivery-persons",
  businessOwnerApiRateLimit,
  protectWithKey,
  getAllDeliveryPersons
);

// Create Delivery Person
router.post(
    "/create-delivery-person",
    businessOwnerApiRateLimit,
    protectWithKey,
    createDeliveryPerson
);

// Update Delivery Person
router.put(
    "/update-delivery-person/:id",
    businessOwnerApiRateLimit,
    protectWithKey,
    updateDeliveryPerson
);

// Login Business Owner (with rate limiting for external API calls)
router.post("/business-owner-login", loginRateLimit, loginBusinessOwner);

// Business Owner Profile Routes (no admin key required)
// Get business owner's own profile
router.get("/business-owner/profile", businessOwnerOnlyAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Business owner profile accessed successfully",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Update business owner's own profile (no admin key required)
router.put("/business-owner/profile", businessOwnerOnlyAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Business owner profile update endpoint - implementation needed",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
