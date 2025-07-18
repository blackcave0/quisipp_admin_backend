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
  // Discount fields
  discountType: {
    type: String,
    enum: ["percentage", "fixed", "none"],
    default: "none",
  },
  discountValue: {
    type: Number,
    min: 0,
    default: 0,
  },
  discountStartDate: {
    type: Date,
  },
  discountEndDate: {
    type: Date,
  },
  discountedPrice: {
    type: Number,
    min: 0,
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
        "25gm",
        "50gm",
        "100gm",
        "150gm",
        "200gm",
        "250gm",
        "300gm",
        "350gm",
        "400gm",
        "500gm",
        "600gm",
        "700gm",
        "750gm",
        "800gm",
        "900gm",
        "1kg",
        "1.5kg",
        "2kg",
        "2.5kg",
        "3kg",
        "3.5kg",
        "4kg",
        "5kg",
        "6kg",
        "7kg",
        "8kg",
        "9kg",
        "10kg",
        "custom",
        "50ml",
        "100ml",
        "150ml",
        "200ml",
        "250ml",
        "300ml",
        "350ml",
        "400ml",
        "450ml",
        "500ml",
        "550ml",
        "600ml",
        "650ml",
        "700ml",
        "750ml",
        "800ml",
        "850ml",
        "900ml",
        "950ml",
        "1ltr",
        "1.5ltr",
        "2ltr",
        "2.5ltr",
        "3ltr",
        "3.5ltr",
        "4ltr",
        "5ltr",
        "6ltr",
        "7ltr",
        "8ltr",
        "9ltr",
        "10ltr",
        "custom",
      ],
    },
  ],
  selectedWeight: {
    type: String,
    enum: [
      "25gm",
      "50gm",
      "100gm",
      "150gm",
      "200gm",
      "250gm",
      "300gm",
      "350gm",
      "400gm",
      "500gm",
      "600gm",
      "700gm",
      "750gm",
      "800gm",
      "900gm",
      "1kg",
      "1.5kg",
      "2kg",
      "2.5kg",
      "3kg",
      "3.5kg",
      "4kg",
      "5kg",
      "6kg",
      "7kg",
      "8kg",
      "9kg",
      "10kg",
      "custom",
      "50ml",
      "100ml",
      "150ml",
      "200ml",
      "250ml",
      "300ml",
      "350ml",
      "400ml",
      "450ml",
      "500ml",
      "550ml",
      "600ml",
      "650ml",
      "700ml",
      "750ml",
      "800ml",
      "850ml",
      "900ml",
      "950ml",
      "1ltr",
      "1.5ltr",
      "2ltr",
      "2.5ltr",
      "3ltr",
      "3.5ltr",
      "4ltr",
      "5ltr",
      "6ltr",
      "7ltr",
      "8ltr",
      "9ltr",
      "10ltr",
      "custom",
    ],
  },
  productWeight: {
    type: String,
    enum: [
      "25gm",
      "50gm",
      "100gm",
      "150gm",
      "200gm",
      "250gm",
      "300gm",
      "350gm",
      "400gm",
      "500gm",
      "600gm",
      "700gm",
      "750gm",
      "800gm",
      "900gm",
      "1kg",
      "1.5kg",
      "2kg",
      "2.5kg",
      "3kg",
      "3.5kg",
      "4kg",
      "5kg",
      "6kg",
      "7kg",
      "8kg",
      "9kg",
      "10kg",
      "custom",
      "50ml",
      "100ml",
      "150ml",
      "200ml",
      "250ml",
      "300ml",
      "350ml",
      "400ml",
      "450ml",
      "500ml",
      "550ml",
      "600ml",
      "650ml",
      "700ml",
      "750ml",
      "800ml",
      "850ml",
      "900ml",
      "950ml",
      "1ltr",
      "1.5ltr",
      "2ltr",
      "2.5ltr",
      "3ltr",
      "3.5ltr",
      "4ltr",
      "5ltr",
      "6ltr",
      "7ltr",
      "8ltr",
      "9ltr",
      "10ltr",
      "custom",
    ],
  },
  customProductWeight: {
    type: String,
  },
  // Enhanced custom weight support for adopted products
  customWeightDetails: {
    value: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      enum: [
        "gm",
        "kg",
        "ml",
        "ltr",
        "pieces",
        "pack",
        "bottle",
        "box",
        "other",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
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
