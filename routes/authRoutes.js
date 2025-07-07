const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin } = require("../controllers/adminController");
const { createBusinessOwner, getAllBusinesOwners, createPasswordForBusinessOwner, updateBusinessOwner, loginBusinessOwner } = require("../controllers/businessOwnerController");
const adminAuth = require("../middleware/adminAuth");
const { protectWithKey } = require("../middleware/protectedRoute");

// Register Admin
router.post("/register", registerAdmin);

// Login Admin
router.post("/login", loginAdmin);

// Create Business Owner
router.post("/create-business-owner", createBusinessOwner);

// Get All Business Owners
router.get("/all-business-owners", protectWithKey, getAllBusinesOwners);

// Update Business Owner
router.put("/update-business-owner/:id", protectWithKey, updateBusinessOwner);

// Login Business Owner
router.post("/business-owner-login", loginBusinessOwner);

module.exports = router;