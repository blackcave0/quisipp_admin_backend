const mongoose = require("mongoose");

// Product Schema
const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    index: true, // Enables search by name
  },
  productDescription: {
    type: String,
    required: true,
  },
  productPrice: {
    type: Number,
    required: true,
  },
  productImages: [
    {
      imageUrl: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },
  ],
  cloudinaryUrls: [
    {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
      folder: {
        type: String,
        required: true,
      },
    },
  ],
  productCategory: {
    type: String,
    required: true,
    enum: [
      "oil",
      "soap",
      "book",
      "grocery",
      "electronics",
      "clothing",
      "home",
      "other",
    ],
  },
  productQuantity: {
    type: Number,
    default: 0,
  },
  productBrand: {
    type: String,
  },
  productStatus: {
    type: String,
    enum: ["available", "out of stock"],
    default: "available",
  },
  stockStatus: {
    type: String,
    enum: ["inStock", "outOfStock"],
    default: "inStock",
  },
  availableWeights: [
    {
      type: String,
      enum: [
        "100gm",
        "200gm",
        "250gm",
        "300gm",
        "500gm",
        "1kg",
        "2kg",
        "5kg",
        "custom",
      ],
    },
  ],
  selectedWeight: {
    type: String,
    enum: [
      "100gm",
      "200gm",
      "250gm",
      "300gm",
      "500gm",
      "1kg",
      "2kg",
      "5kg",
      "custom",
    ],
  },
  productWeight: {
    type: String,
    enum: [
      "100gm",
      "200gm",
      "250gm",
      "300gm",
      "500gm",
      "1kg",
      "2kg",
      "5kg",
      "custom",
    ],
  },
  customProductWeight: {
    type: String,
  },
  adminCreated: {
    type: Boolean,
    default: false,
  },
  originalProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  adoptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  productRating: {
    type: Number,
    default: 0,
  },
  productReviews: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      review: String,
    },
  ],
  productCreatedAt: {
    type: Date,
    default: Date.now,
  },
  productUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  businessOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true, // For querying by owner
  },
  businessOwnerPhone: {
    type: String,
  },
  businessOwnerEmail: {
    type: String,
  },
  businessOwnerAddress: {
    type: String,
  },
  uploaded: {
    type: Boolean,
    default: false, // Checkbox to indicate if uploaded
  },
  priceChecked: {
    type: Boolean,
    default: false, // Checkbox for price check
  },
});

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "business-owner"], required: true },
  products: [productSchema],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
