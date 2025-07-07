const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
const connectDB = async () => {
  try {
    // Check if MongoDB URI is defined
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(MONGODB_URI);

    console.log(`MongoDB connected successfully ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    console.log(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
