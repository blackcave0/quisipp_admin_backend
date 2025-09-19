require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
// node-cron implementation
const cron = require("node-cron");
const https = require("https");

const connectDB = require("./config/database");
const { validateCloudinaryConfig } = require("./config/cloudinary");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
// const businessOwnerRoutes = require("./routes/businessOwnerRoutes");
const app = express();

// Trust proxy - required for rate limiting behind reverse proxy
app.set("trust proxy", 1);
app.use(helmet());

const allowedOrigins = [
  "https://quisipp-admin.vercel.app",
  "https://quisipp.com",
  "https://www.quisipp.com",
  "http://localhost:5173",
  "http://localhost:5001"
  // "http://172.27.110.104:5173",
]; // ✅ No slash at end

// Middleware
app.use(
  cors({
    // origin: ["http://localhost:5173", "http://localhost:5001"],
    // origin: "*",
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    // origin: "http://localhost:5173", // For local development only
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Validate Cloudinary configuration
try {
  validateCloudinaryConfig();
  console.log("Cloudinary configuration validated successfully");
} catch (error) {
  console.error("Cloudinary configuration error:", error.message);
  console.log(
    "Product image upload will not work without proper Cloudinary configuration"
  );
}

// Connect to MongoDB
connectDB();

// Routes
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// Auth Routes
app.use("/api/auth", authRoutes);

// Cron job to delete expired tokens every hour - TODO: Move this to a separate file

const job = cron.schedule('*/5 * * * *', () => {
  console.log('Ping server every minute 5 minutes ');
  const url = "https://quisipp-admin-backend.onrender.com/health";
  https
    .get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`Ping successful at ${new Date().toISOString()}`);
      } else {
        console.error(
          `Ping failed with status code: ${
            res.statusCode
          } at ${new Date().toISOString()}`
        );
      }
    })
    .on("error", (err) => {
      console.error(
        `Error during ping: ${err.message} at ${new Date().toISOString()}`
      );
    });
})
job.start();
// Product Routes
app.use("/api", productRoutes);

// app.use("/api/business-owner", businessOwnerRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
