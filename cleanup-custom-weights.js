const mongoose = require('mongoose');
const AdminProduct = require('./models/Product');

// Script to clean up existing products that have "custom" in availableWeights
async function cleanupCustomWeights() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quisipp_product', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');
    console.log('🧹 Starting cleanup of custom weights in availableWeights...\n');

    // Find all products that have "custom" in availableWeights
    const productsWithCustom = await AdminProduct.find({
      availableWeights: { $in: ["custom"] }
    });

    console.log(`📊 Found ${productsWithCustom.length} products with "custom" in availableWeights`);

    if (productsWithCustom.length === 0) {
      console.log('✅ No products need cleanup!');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Process each product
    for (const product of productsWithCustom) {
      try {
        console.log(`\n🔧 Processing product: ${product.productName} (ID: ${product._id})`);
        console.log(`   Current availableWeights: [${product.availableWeights.join(', ')}]`);
        console.log(`   Custom weights count: ${product.customWeights ? product.customWeights.length : 0}`);

        // Filter out "custom" from availableWeights
        const filteredWeights = product.availableWeights.filter(weight => weight !== "custom");
        
        // Update the product
        await AdminProduct.findByIdAndUpdate(product._id, {
          availableWeights: filteredWeights,
          updatedAt: new Date()
        });

        console.log(`   ✅ Updated availableWeights: [${filteredWeights.join(', ')}]`);
        updatedCount++;

      } catch (error) {
        console.error(`   ❌ Error updating product ${product._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📈 Cleanup Summary:`);
    console.log(`   ✅ Successfully updated: ${updatedCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);
    console.log(`   📊 Total processed: ${productsWithCustom.length} products`);

    // Verify the cleanup
    console.log('\n🔍 Verifying cleanup...');
    const remainingProducts = await AdminProduct.find({
      availableWeights: { $in: ["custom"] }
    });

    if (remainingProducts.length === 0) {
      console.log('✅ Cleanup successful! No products have "custom" in availableWeights anymore.');
    } else {
      console.log(`⚠️  Warning: ${remainingProducts.length} products still have "custom" in availableWeights.`);
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Show products with custom weights for verification
async function showProductsWithCustomWeights() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quisipp_product', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n📋 Products with custom weights:');
    
    const productsWithCustomWeights = await AdminProduct.find({
      customWeights: { $exists: true, $ne: [], $not: { $size: 0 } }
    }).select('productName availableWeights customWeights');

    if (productsWithCustomWeights.length === 0) {
      console.log('   No products have custom weights defined.');
    } else {
      productsWithCustomWeights.forEach((product, index) => {
        console.log(`\n   ${index + 1}. ${product.productName}`);
        console.log(`      Available Weights: [${product.availableWeights.join(', ')}]`);
        console.log(`      Custom Weights: ${product.customWeights.length} entries`);
        product.customWeights.forEach((cw, i) => {
          console.log(`        ${i + 1}. ${cw.value} ${cw.unit}${cw.description ? ` - ${cw.description}` : ''}`);
        });
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--show')) {
    await showProductsWithCustomWeights();
  } else {
    await cleanupCustomWeights();
    await showProductsWithCustomWeights();
  }
}

// Run the script
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  console.log('🚀 Custom Weights Cleanup Script');
  console.log('================================\n');
  
  main().catch(console.error);
}

module.exports = { cleanupCustomWeights, showProductsWithCustomWeights };
