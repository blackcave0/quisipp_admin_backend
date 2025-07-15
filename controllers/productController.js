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
      customWeights: rawCustomWeights,
      discountType,
      discountValue,
      discountStartDate,
      discountEndDate,
      tags,
    } = req.body;

    // Parse custom weights if it's a JSON string (from FormData)
    let customWeights = [];
    if (rawCustomWeights) {
      try {
        customWeights =
          typeof rawCustomWeights === "string"
            ? JSON.parse(rawCustomWeights)
            : rawCustomWeights;

        // Ensure it's an array
        if (!Array.isArray(customWeights)) {
          customWeights = [];
        }
      } catch (error) {
        console.error("Error parsing custom weights:", error);
        return res.status(400).json({
          success: false,
          message: "Invalid custom weights format",
        });
      }
    }

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
    ];
    const weightsArray = Array.isArray(availableWeights)
      ? availableWeights
      : availableWeights
      ? [availableWeights]
      : [];

    const invalidWeights = weightsArray.filter(
      (weight) => !validWeights.includes(weight)
    );

    if (invalidWeights.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid weight options: ${invalidWeights.join(", ")}`,
      });
    }

    // Validate custom weights if "custom" is selected
    let processedCustomWeights = [];
    if (weightsArray.includes("custom")) {
      // Only require custom weights if they're not provided or empty
      if (
        !customWeights ||
        !Array.isArray(customWeights) ||
        customWeights.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Custom weight details are required when 'custom' is selected",
        });
      }

      // Validate each custom weight entry
      for (const customWeight of customWeights) {
        if (!customWeight.value || !customWeight.unit) {
          return res.status(400).json({
            success: false,
            message: "Custom weight value and unit are required",
          });
        }

        // Validate unit
        const validUnits = [
          "gm",
          "kg",
          "ml",
          "ltr",
          "pieces",
          "pack",
          "bottle",
          "box",
          "other",
        ];
        if (!validUnits.includes(customWeight.unit)) {
          return res.status(400).json({
            success: false,
            message: `Invalid custom weight unit: ${customWeight.unit}`,
          });
        }

        processedCustomWeights.push({
          value: customWeight.value.trim(),
          unit: customWeight.unit,
          description: customWeight.description
            ? customWeight.description.trim()
            : "",
        });
      }
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
      // console.log(
      //   "Upload results:",
      //   uploadedImages.map((img) => ({ url: img.url, folder: img.folder }))
      // );

      // Filter out "custom" from availableWeights before saving
      const filteredWeights = weightsArray.filter(
        (weight) => weight !== "custom"
      );

      // Calculate discounted price
      let calculatedDiscountedPrice = parseFloat(productPrice);
      const parsedDiscountValue = discountValue ? parseFloat(discountValue) : 0;

      if (discountType && discountType !== "none" && parsedDiscountValue > 0) {
        if (discountType === "percentage") {
          if (parsedDiscountValue > 100) {
            return res.status(400).json({
              success: false,
              message: "Percentage discount cannot exceed 100%",
            });
          }
          calculatedDiscountedPrice =
            parseFloat(productPrice) -
            (parseFloat(productPrice) * parsedDiscountValue) / 100;
        } else if (discountType === "fixed") {
          if (parsedDiscountValue >= parseFloat(productPrice)) {
            return res.status(400).json({
              success: false,
              message:
                "Fixed discount cannot be greater than or equal to product price",
            });
          }
          calculatedDiscountedPrice =
            parseFloat(productPrice) - parsedDiscountValue;
        }
      }

      // Validate discount dates
      if (discountStartDate && discountEndDate) {
        if (new Date(discountStartDate) >= new Date(discountEndDate)) {
          return res.status(400).json({
            success: false,
            message: "Discount start date must be before end date",
          });
        }
      }

      // Create product
      const newProduct = new AdminProduct({
        productName: productName.trim(),
        productDescription: productDescription.trim(),
        productPrice: parseFloat(productPrice),
        productCategory,
        productBrand: productBrand ? productBrand.trim() : undefined,
        availableWeights: filteredWeights,
        customWeights: processedCustomWeights,
        discountType: discountType || "none",
        discountValue: parsedDiscountValue,
        discountStartDate: discountStartDate
          ? new Date(discountStartDate)
          : undefined,
        discountEndDate: discountEndDate
          ? new Date(discountEndDate)
          : undefined,
        discountedPrice: calculatedDiscountedPrice,
        cloudinaryUrls: uploadedImages,
        createdBy: req.user.id,
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : tags.split(",").map((tag) => tag.trim())
          : [],
      });

      // console.log(
      //   "About to save product with cloudinaryUrls:",
      //   newProduct.cloudinaryUrls
      // );
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
      "customWeights",
      "discountType",
      "discountValue",
      "discountStartDate",
      "discountEndDate",
      "tags",
      "isActive",
    ];

    const updateData = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Validate custom weights if being updated and "custom" is in availableWeights
    if (updates.customWeights !== undefined) {
      const weightsToCheck =
        updates.availableWeights || product.availableWeights;
      if (weightsToCheck.includes("custom")) {
        if (!Array.isArray(updates.customWeights)) {
          return res.status(400).json({
            success: false,
            message: "Custom weights must be an array",
          });
        }

        // Validate each custom weight entry
        const validUnits = [
          "gm",
          "kg",
          "ml",
          "ltr",
          "pieces",
          "pack",
          "bottle",
          "box",
          "other",
        ];
        for (const customWeight of updates.customWeights) {
          if (!customWeight.value || !customWeight.unit) {
            return res.status(400).json({
              success: false,
              message: "Custom weight value and unit are required",
            });
          }

          if (!validUnits.includes(customWeight.unit)) {
            return res.status(400).json({
              success: false,
              message: `Invalid custom weight unit: ${customWeight.unit}`,
            });
          }
        }
      }
    }

    // Filter out "custom" from availableWeights if being updated
    if (
      updateData.availableWeights &&
      Array.isArray(updateData.availableWeights)
    ) {
      updateData.availableWeights = updateData.availableWeights.filter(
        (weight) => weight !== "custom"
      );
    }

    // Handle discount calculations
    if (
      updateData.discountType !== undefined ||
      updateData.discountValue !== undefined ||
      updateData.productPrice !== undefined
    ) {
      const currentPrice = updateData.productPrice || product.productPrice;
      const discountType = updateData.discountType || product.discountType;
      const discountValue = updateData.discountValue || product.discountValue;

      if (discountType === "none" || !discountValue || discountValue === 0) {
        updateData.discountedPrice = currentPrice;
      } else if (discountType === "percentage") {
        if (discountValue > 100) {
          return res.status(400).json({
            success: false,
            message: "Percentage discount cannot exceed 100%",
          });
        }
        updateData.discountedPrice =
          currentPrice - (currentPrice * discountValue) / 100;
      } else if (discountType === "fixed") {
        if (discountValue >= currentPrice) {
          return res.status(400).json({
            success: false,
            message:
              "Fixed discount cannot be greater than or equal to product price",
          });
        }
        updateData.discountedPrice = currentPrice - discountValue;
      }
    }

    // Validate discount dates
    if (updateData.discountStartDate && updateData.discountEndDate) {
      if (
        new Date(updateData.discountStartDate) >=
        new Date(updateData.discountEndDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Discount start date must be before end date",
        });
      }
    }

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

// Bulk create multiple products
const createMultipleAdminProducts = async (req, res) => {
  try {
    const { products } = req.body;

    // Validate input
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required and cannot be empty",
      });
    }

    if (products.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 products can be created at once",
      });
    }

    const validCategories = [
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
    ];

    const validWeights = [
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
    ];

    const results = {
      successful: [],
      failed: [],
      totalProcessed: products.length,
    };

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];

      try {
        // Validate required fields
        if (
          !productData.productName ||
          !productData.productDescription ||
          !productData.productPrice ||
          !productData.productCategory
        ) {
          results.failed.push({
            index: i + 1,
            productName: productData.productName || "Unknown",
            error:
              "Product name, description, price, and category are required",
          });
          continue;
        }

        // Validate field lengths
        if (productData.productName.trim().length > 100) {
          results.failed.push({
            index: i + 1,
            productName: productData.productName,
            error: "Product name must be 100 characters or less",
          });
          continue;
        }

        if (productData.productDescription.trim().length > 1000) {
          results.failed.push({
            index: i + 1,
            productName: productData.productName,
            error: "Product description must be 1000 characters or less",
          });
          continue;
        }

        if (
          productData.productBrand &&
          productData.productBrand.trim().length > 50
        ) {
          results.failed.push({
            index: i + 1,
            productName: productData.productName,
            error: "Product brand must be 50 characters or less",
          });
          continue;
        }

        // Validate price
        const price = parseFloat(productData.productPrice);
        if (isNaN(price) || price < 0) {
          results.failed.push({
            index: i + 1,
            productName: productData.productName,
            error: "Product price must be a valid positive number",
          });
          continue;
        }

        // Validate category
        if (!validCategories.includes(productData.productCategory)) {
          results.failed.push({
            index: i + 1,
            productName: productData.productName,
            error: "Invalid product category",
          });
          continue;
        }

        // Validate weights if provided
        let weightsArray = [];
        if (productData.availableWeights) {
          weightsArray = Array.isArray(productData.availableWeights)
            ? productData.availableWeights
            : [productData.availableWeights];

          const invalidWeights = weightsArray.filter(
            (weight) => !validWeights.includes(weight)
          );
          if (invalidWeights.length > 0) {
            results.failed.push({
              index: i + 1,
              productName: productData.productName,
              error: `Invalid weight options: ${invalidWeights.join(", ")}`,
            });
            continue;
          }
        }

        // Filter out "custom" from availableWeights before saving
        const filteredWeights = weightsArray.filter(
          (weight) => weight !== "custom"
        );

        // Create product (without images for bulk creation)
        const newProduct = new AdminProduct({
          productName: productData.productName.trim(),
          productDescription: productData.productDescription.trim(),
          productPrice: price,
          productCategory: productData.productCategory,
          productBrand: productData.productBrand
            ? productData.productBrand.trim()
            : undefined,
          availableWeights: filteredWeights,
          cloudinaryUrls: [], // No images in bulk creation
          createdBy: req.user.id,
          tags: productData.tags
            ? Array.isArray(productData.tags)
              ? productData.tags
              : productData.tags.split(",").map((tag) => tag.trim())
            : [],
        });

        const savedProduct = await newProduct.save();
        await savedProduct.populate("createdBy", "email role");

        results.successful.push({
          index: i + 1,
          productId: savedProduct._id,
          productName: savedProduct.productName,
          productCategory: savedProduct.productCategory,
        });
      } catch (error) {
        console.error(`Error creating product ${i + 1}:`, error);
        results.failed.push({
          index: i + 1,
          productName: productData.productName || "Unknown",
          error: error.message || "Failed to create product",
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk creation completed. ${results.successful.length} products created successfully, ${results.failed.length} failed.`,
      results,
    });
  } catch (error) {
    console.error("Error in bulk product creation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during bulk creation",
      error: error.message,
    });
  }
};

// Bulk delete multiple products
const deleteMultipleAdminProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product IDs array is required and cannot be empty",
      });
    }

    if (productIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Maximum 100 products can be deleted at once",
      });
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: productIds.length,
    };

    // Process each product deletion
    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];

      try {
        const product = await AdminProduct.findById(productId);

        if (!product) {
          results.failed.push({
            productId,
            error: "Product not found",
          });
          continue;
        }

        // Check if user is the creator or an admin
        if (
          product.createdBy.toString() !== req.user.id &&
          req.user.role !== "admin"
        ) {
          results.failed.push({
            productId,
            productName: product.productName,
            error: "Not authorized to delete this product",
          });
          continue;
        }

        // Delete images from Cloudinary if they exist
        if (product.cloudinaryUrls && product.cloudinaryUrls.length > 0) {
          const publicIds = product.cloudinaryUrls.map((img) => img.publicId);
          try {
            await deleteMultipleImages(publicIds);
          } catch (cloudinaryError) {
            console.error(
              `Error deleting images for product ${productId}:`,
              cloudinaryError
            );
            // Continue with product deletion even if image deletion fails
          }
        }

        // Soft delete - mark as inactive
        await AdminProduct.findByIdAndUpdate(productId, { isActive: false });

        results.successful.push({
          productId,
          productName: product.productName,
        });
      } catch (error) {
        console.error(`Error deleting product ${productId}:`, error);
        results.failed.push({
          productId,
          error: error.message || "Failed to delete product",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk deletion completed. ${results.successful.length} products deleted successfully, ${results.failed.length} failed.`,
      results,
    });
  } catch (error) {
    console.error("Error in bulk product deletion:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during bulk deletion",
      error: error.message,
    });
  }
};

// Get custom weights for a specific admin product
const getAdminProductCustomWeights = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AdminProduct.findById(id);

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
      customWeights: product.customWeights || [],
      hasCustomWeights: product.availableWeights.includes("custom"),
    });
  } catch (error) {
    console.error("Error fetching product custom weights:", error);
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
  createMultipleAdminProducts,
  deleteMultipleAdminProducts,
  getAdminProductCustomWeights,
};
