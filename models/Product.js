const mongoose = require("mongoose");

// Admin Product Schema - for products created by admin
const adminProductSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    productDescription: {
      type: String,
      required: true,
      trim: true,
    },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
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
    productCategory: {
      type: String,
      required: true,
      enum: [
        "vegetables & fruits",
        "atta, rice & dal",
        "oil & ghee",
        "spices & herbs",
        "dairy, bread & eggs",
        "bakery & biscuits",
        "dry fruits & cereals",
        "chicken , meat & fish",
        "beverages & soft drinks",
        "household & cleaning",
        "personal care",
        "baby care & diapers",
        "pet care",
        "other",
      ],
      index: true,
    },
    productBrand: {
      type: String,
      trim: true,
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
        required: true,
      },
    ],
    // Custom weight/volume values when "custom" is selected
    customWeights: [
      {
        value: {
          type: String,
          required: true,
          trim: true,
        },
        unit: {
          type: String,
          required: true,
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
          required: false,
          default: function () {
            return `quisipp/products/${
              this.parent().productCategory || "other"
            }`;
          },
        },
        originalName: {
          type: String,
        },
        size: {
          type: Number,
        },
        format: {
          type: String,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    adoptionCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    searchKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add text index for search functionality
adminProductSchema.index({
  productName: "text",
  productDescription: "text",
  productBrand: "text",
  tags: "text",
  searchKeywords: "text",
});

// Virtual for adopted products
adminProductSchema.virtual("adoptedProducts", {
  ref: "User",
  localField: "_id",
  foreignField: "products.originalProductId",
});

// Pre-save middleware to generate search keywords
adminProductSchema.pre("save", function (next) {
  if (
    this.isModified("productName") ||
    this.isModified("productDescription") ||
    this.isModified("productBrand")
  ) {
    const keywords = [];

    // Add product name words
    if (this.productName) {
      keywords.push(...this.productName.toLowerCase().split(/\s+/));
    }

    // Add brand words
    if (this.productBrand) {
      keywords.push(...this.productBrand.toLowerCase().split(/\s+/));
    }

    // Add category
    if (this.productCategory) {
      keywords.push(this.productCategory.toLowerCase());
    }

    // Remove duplicates and empty strings
    this.searchKeywords = [
      ...new Set(keywords.filter((keyword) => keyword.length > 0)),
    ];
  }
  next();
});

// Static method to search products
adminProductSchema.statics.searchProducts = function (query, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    brand,
    weights,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = -1,
  } = options;

  const searchQuery = { isActive: true };

  // Text search
  if (query && query.trim()) {
    searchQuery.$text = { $search: query.trim() };
  }

  // Category filter
  if (category && category !== "all") {
    searchQuery.productCategory = category;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.productPrice = {};
    if (minPrice !== undefined) searchQuery.productPrice.$gte = minPrice;
    if (maxPrice !== undefined) searchQuery.productPrice.$lte = maxPrice;
  }

  // Brand filter
  if (brand) {
    searchQuery.productBrand = new RegExp(brand, "i");
  }

  // Weight filter
  if (weights && weights.length > 0) {
    searchQuery.availableWeights = { $in: weights };
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };

  // Add text score for text search
  if (query && query.trim()) {
    sort.score = { $meta: "textScore" };
  }

  return this.find(searchQuery)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("createdBy", "email role");
};

const AdminProduct = mongoose.model("AdminProduct", adminProductSchema);

module.exports = AdminProduct;
