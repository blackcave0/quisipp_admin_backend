const AdminProduct = require("../models/Product");
const User = require("../models/User");
const {
  uploadMultipleImages,
  deleteMultipleImages,
} = require("../config/cloudinary");

// Admin: Create new product
const createAdminProduct = async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      productPrice,
      productCategory,
      productBrand,
      availableWeights,
      tags,
    } = req.body;

    // Validate required fields
    if (
      !productName ||
      !productDescription ||
      !productPrice ||
      !productCategory
    ) {
      return res.status(400).json({
        success: false,
        message: "Product name, description, price, and category are required",
      });
    }

    // Validate price
    if (isNaN(productPrice) || productPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Product price must be a valid positive number",
      });
    }

    // Validate category
    const validCategories = [
      "oil",
      "soap",
      "book",
      "grocery",
      "electronics",
      "clothing",
      "home",
      "other",
    ];
    if (!validCategories.includes(productCategory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product category",
      });
    }

    // Validate images
    if (!req.files || req.files.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Minimum 10 product images are required",
      });
    }

    if (req.files.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 product images are allowed",
      });
    }

    // Validate available weights
    const validWeights = [
      "100gm",
      "200gm",
      "250gm",
      "300gm",
      "500gm",
      "1kg",
      "2kg",
      "5kg",
      "custom",
    ];
    const weightsArray = Array.isArray(availableWeights)
      ? availableWeights
      : [availableWeights];
    const invalidWeights = weightsArray.filter(
      (weight) => !validWeights.includes(weight)
    );

    if (invalidWeights.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid weight options: ${invalidWeights.join(", ")}`,
      });
    }

    try {
      // Upload images to Cloudinary
      console.log(
        `Uploading ${req.files.length} images for category: ${productCategory}`
      );
      const uploadedImages = await uploadMultipleImages(
        req.files,
        productCategory
      );
      console.log(
        "Upload results:",
        uploadedImages.map((img) => ({ url: img.url, folder: img.folder }))
      );

      // Create product
      const newProduct = new AdminProduct({
        productName: productName.trim(),
        productDescription: productDescription.trim(),
        productPrice: parseFloat(productPrice),
        productCategory,
        productBrand: productBrand ? productBrand.trim() : undefined,
        availableWeights: weightsArray,
        cloudinaryUrls: uploadedImages,
        createdBy: req.user.id,
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : tags.split(",").map((tag) => tag.trim())
          : [],
      });

      console.log(
        "About to save product with cloudinaryUrls:",
        newProduct.cloudinaryUrls
      );
      const savedProduct = await newProduct.save();

      // Populate creator info
      await savedProduct.populate("createdBy", "email role");

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: savedProduct,
      });
    } catch (uploadError) {
      console.error("Error uploading images:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload product images",
        error: uploadError.message,
      });
    }
  } catch (error) {
    console.error("Error creating admin product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all admin products with search and filters
const getAdminProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      brand,
      weights,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const options = {
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      brand,
      weights: weights
        ? Array.isArray(weights)
          ? weights
          : weights.split(",")
        : undefined,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === "desc" ? -1 : 1,
    };

    const products = await AdminProduct.searchProducts(search, options);
    const totalProducts = await AdminProduct.countDocuments({
      isActive: true,
      ...(category && category !== "all" ? { productCategory: category } : {}),
    });

    const totalPages = Math.ceil(totalProducts / options.limit);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: options.page,
        totalPages,
        totalProducts,
        hasNextPage: options.page < totalPages,
        hasPrevPage: options.page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single admin product by ID
const getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AdminProduct.findById(id).populate(
      "createdBy",
      "email role"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product is no longer available",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching admin product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update admin product
const updateAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find product and verify ownership
    const product = await AdminProduct.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user is the creator or an admin
    if (
      product.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this product",
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      "productName",
      "productDescription",
      "productPrice",
      "productBrand",
      "availableWeights",
      "tags",
      "isActive",
    ];

    const updateData = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Update timestamps
    updateData.updatedAt = new Date();

    const updatedProduct = await AdminProduct.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "email role");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating admin product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete admin product
const deleteAdminProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AdminProduct.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user is the creator or an admin
    if (
      product.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this product",
      });
    }

    // Delete images from Cloudinary
    if (product.cloudinaryUrls && product.cloudinaryUrls.length > 0) {
      const publicIds = product.cloudinaryUrls.map((img) => img.publicId);
      try {
        await deleteMultipleImages(publicIds);
      } catch (cloudinaryError) {
        console.error(
          "Error deleting images from Cloudinary:",
          cloudinaryError
        );
        // Continue with product deletion even if image deletion fails
      }
    }

    // Soft delete - mark as inactive instead of removing
    await AdminProduct.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createAdminProduct,
  getAdminProducts,
  getAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
};
