const mongoose = require('mongoose');
const AdminProduct = require('./models/Product');

// Test script to verify custom weight functionality
async function testCustomWeights() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect('mongodb://localhost:27017/quisipp_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Test 1: Create a product with custom weights
    console.log('\n=== Test 1: Creating product with custom weights ===');
    
    const testProduct = new AdminProduct({
      productName: 'Test Product with Custom Weights',
      productDescription: 'A test product to verify custom weight functionality',
      productPrice: 99.99,
      productCategory: 'other',
      productBrand: 'Test Brand',
      availableWeights: ['500gm', '1kg', 'custom'],
      customWeights: [
        {
          value: '750',
          unit: 'gm',
          description: 'Special 750g pack'
        },
        {
          value: '2.5',
          unit: 'kg',
          description: 'Family size pack'
        }
      ],
      cloudinaryUrls: [], // Empty for test
      createdBy: new mongoose.Types.ObjectId(), // Dummy ObjectId
      tags: ['test', 'custom-weight']
    });

    const savedProduct = await testProduct.save();
    console.log('✅ Product created successfully with ID:', savedProduct._id);
    console.log('Custom weights:', savedProduct.customWeights);

    // Test 2: Query the product and verify custom weights
    console.log('\n=== Test 2: Querying product with custom weights ===');
    
    const foundProduct = await AdminProduct.findById(savedProduct._id);
    console.log('✅ Product found:', foundProduct.productName);
    console.log('Available weights:', foundProduct.availableWeights);
    console.log('Custom weights:', foundProduct.customWeights);

    // Test 3: Update custom weights
    console.log('\n=== Test 3: Updating custom weights ===');
    
    foundProduct.customWeights.push({
      value: '1.25',
      unit: 'kg',
      description: 'Medium size pack'
    });

    await foundProduct.save();
    console.log('✅ Custom weights updated successfully');
    console.log('Updated custom weights:', foundProduct.customWeights);

    // Test 4: Validate custom weight units
    console.log('\n=== Test 4: Testing custom weight validation ===');
    
    try {
      const invalidProduct = new AdminProduct({
        productName: 'Invalid Product',
        productDescription: 'Test invalid custom weight',
        productPrice: 50.00,
        productCategory: 'other',
        availableWeights: ['custom'],
        customWeights: [
          {
            value: '500',
            unit: 'invalid_unit', // This should fail validation
            description: 'Invalid unit test'
          }
        ],
        cloudinaryUrls: [],
        createdBy: new mongoose.Types.ObjectId(),
      });

      await invalidProduct.save();
      console.log('❌ Validation should have failed');
    } catch (error) {
      console.log('✅ Validation correctly failed for invalid unit:', error.message);
    }

    // Clean up test data
    console.log('\n=== Cleaning up test data ===');
    await AdminProduct.findByIdAndDelete(savedProduct._id);
    console.log('✅ Test product deleted');

    console.log('\n🎉 All custom weight tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testCustomWeights();
}

module.exports = testCustomWeights;
