const AdminProduct = require('../models/Product');
const User = require('../models/User');

// Business Owner: Search available products
const searchAvailableProducts = async (req, res) => {
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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      brand,
      weights: weights ? (Array.isArray(weights) ? weights : weights.split(',')) : undefined,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    const products = await AdminProduct.searchProducts(search, options);
    const totalProducts = await AdminProduct.countDocuments({ 
      isActive: true,
      ...(category && category !== 'all' ? { productCategory: category } : {})
    });

    const totalPages = Math.ceil(totalProducts / options.limit);

    // Get business owner's adopted products to mark which ones are already adopted
    const businessOwner = await User.findById(req.user.id);
    const adoptedProductIds = businessOwner.products
      .filter(product => product.originalProductId)
      .map(product => product.originalProductId.toString());

    // Add adoption status to products
    const productsWithAdoptionStatus = products.map(product => ({
      ...product.toObject(),
      isAdopted: adoptedProductIds.includes(product._id.toString())
    }));

    res.status(200).json({
      success: true,
      products: productsWithAdoptionStatus,
      pagination: {
        currentPage: options.page,
        totalPages,
        totalProducts,
        hasNextPage: options.page < totalPages,
        hasPrevPage: options.page > 1
      }
    });

  } catch (error) {
    console.error('Error searching available products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Business Owner: Adopt admin product
const adoptAdminProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      selectedWeights,
      stockStatus = 'inStock',
      productQuantity = 0
    } = req.body;

    // Validate required fields
    if (!selectedWeights || !Array.isArray(selectedWeights) || selectedWeights.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one weight option must be selected'
      });
    }

    // Find the admin product
    const adminProduct = await AdminProduct.findById(productId);
    if (!adminProduct || !adminProduct.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or no longer available'
      });
    }

    // Validate selected weights are available
    const invalidWeights = selectedWeights.filter(weight => 
      !adminProduct.availableWeights.includes(weight)
    );
    
    if (invalidWeights.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid weight selections: ${invalidWeights.join(', ')}`
      });
    }

    // Get business owner details
    const businessOwner = await User.findById(req.user.id);
    if (!businessOwner) {
      return res.status(404).json({
        success: false,
        message: 'Business owner not found'
      });
    }

    // Check if product is already adopted
    const existingAdoption = businessOwner.products.find(
      product => product.originalProductId && product.originalProductId.toString() === productId
    );

    if (existingAdoption) {
      return res.status(400).json({
        success: false,
        message: 'Product has already been adopted'
      });
    }

    // Create adopted products for each selected weight
    const adoptedProducts = selectedWeights.map(weight => ({
      productName: adminProduct.productName,
      productDescription: adminProduct.productDescription,
      productPrice: adminProduct.productPrice,
      productCategory: adminProduct.productCategory,
      productBrand: adminProduct.productBrand,
      productImages: adminProduct.cloudinaryUrls.map(img => ({
        imageUrl: img.url,
        publicId: img.publicId
      })),
      cloudinaryUrls: adminProduct.cloudinaryUrls,
      availableWeights: adminProduct.availableWeights,
      selectedWeight: weight,
      productQuantity: parseInt(productQuantity),
      stockStatus,
      adminCreated: false,
      originalProductId: adminProduct._id,
      adoptedBy: businessOwner._id,
      businessOwner: businessOwner._id,
      businessOwnerPhone: businessOwner.phoneNumber,
      businessOwnerEmail: businessOwner.email,
      businessOwnerAddress: businessOwner.businessAddress || businessOwner.address,
      productCreatedAt: new Date(),
      productUpdatedAt: new Date()
    }));

    // Add adopted products to business owner's products array
    businessOwner.products.push(...adoptedProducts);
    await businessOwner.save();

    // Update adoption count in admin product
    await AdminProduct.findByIdAndUpdate(
      productId,
      { $inc: { adoptionCount: selectedWeights.length } }
    );

    res.status(201).json({
      success: true,
      message: `Product adopted successfully with ${selectedWeights.length} weight option(s)`,
      adoptedProducts: adoptedProducts.map(product => ({
        ...product,
        _id: businessOwner.products[businessOwner.products.length - selectedWeights.indexOf(product.selectedWeight) - 1]._id
      }))
    });

  } catch (error) {
    console.error('Error adopting admin product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Business Owner: Get adopted products
const getAdoptedProducts = async (req, res) => {
  try {
    const {
      category,
      stockStatus,
      search,
      page = 1,
      limit = 20,
      sortBy = 'productCreatedAt',
      sortOrder = 'desc'
    } = req.query;

    const businessOwner = await User.findById(req.user.id);
    if (!businessOwner) {
      return res.status(404).json({
        success: false,
        message: 'Business owner not found'
      });
    }

    let adoptedProducts = businessOwner.products.filter(product => product.originalProductId);

    // Apply filters
    if (category && category !== 'all') {
      adoptedProducts = adoptedProducts.filter(product => product.productCategory === category);
    }

    if (stockStatus && stockStatus !== 'all') {
      adoptedProducts = adoptedProducts.filter(product => product.stockStatus === stockStatus);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      adoptedProducts = adoptedProducts.filter(product =>
        product.productName.toLowerCase().includes(searchTerm) ||
        (product.productBrand && product.productBrand.toLowerCase().includes(searchTerm)) ||
        product.productDescription.toLowerCase().includes(searchTerm)
      );
    }

    // Sort products
    adoptedProducts.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = adoptedProducts.slice(startIndex, endIndex);

    const totalProducts = adoptedProducts.length;
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      products: paginatedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching adopted products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Business Owner: Update adopted product
const updateAdoptedProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stockStatus, productQuantity, selectedWeight } = req.body;

    const businessOwner = await User.findById(req.user.id);
    if (!businessOwner) {
      return res.status(404).json({
        success: false,
        message: 'Business owner not found'
      });
    }

    const productIndex = businessOwner.products.findIndex(
      product => product._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your adopted products'
      });
    }

    const product = businessOwner.products[productIndex];

    // Only allow updates to specific fields
    if (stockStatus !== undefined) {
      if (!['inStock', 'outOfStock'].includes(stockStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid stock status'
        });
      }
      product.stockStatus = stockStatus;
    }

    if (productQuantity !== undefined) {
      if (isNaN(productQuantity) || productQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Product quantity must be a valid non-negative number'
        });
      }
      product.productQuantity = parseInt(productQuantity);
    }

    if (selectedWeight !== undefined) {
      if (!product.availableWeights.includes(selectedWeight)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid weight selection'
        });
      }
      product.selectedWeight = selectedWeight;
    }

    product.productUpdatedAt = new Date();
    await businessOwner.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: businessOwner.products[productIndex]
    });

  } catch (error) {
    console.error('Error updating adopted product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Business Owner: Remove adopted product
const removeAdoptedProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const businessOwner = await User.findById(req.user.id);
    if (!businessOwner) {
      return res.status(404).json({
        success: false,
        message: 'Business owner not found'
      });
    }

    const productIndex = businessOwner.products.findIndex(
      product => product._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your adopted products'
      });
    }

    const removedProduct = businessOwner.products[productIndex];
    businessOwner.products.splice(productIndex, 1);
    await businessOwner.save();

    // Update adoption count in admin product
    if (removedProduct.originalProductId) {
      await AdminProduct.findByIdAndUpdate(
        removedProduct.originalProductId,
        { $inc: { adoptionCount: -1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Product removed successfully'
    });

  } catch (error) {
    console.error('Error removing adopted product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  searchAvailableProducts,
  adoptAdminProduct,
  getAdoptedProducts,
  updateAdoptedProduct,
  removeAdoptedProduct
};
