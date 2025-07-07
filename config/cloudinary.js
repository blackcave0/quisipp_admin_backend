const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const sharp = require("sharp");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage for different product categories
const createCloudinaryStorage = (category) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `quisipp/products/${category}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        { width: 800, height: 800, crop: "limit", quality: "auto:good" },
        { fetch_format: "auto" },
      ],
      public_id: (req, file) => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        return `${category}_${timestamp}_${randomString}`;
      },
    },
  });
};

// Memory storage for image processing before upload
const memoryStorage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      ),
      false
    );
  }
};

// Create multer upload middleware with memory storage
const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 20, // Maximum 20 files
  },
});

// Function to optimize and upload image to Cloudinary
const optimizeAndUploadImage = async (
  buffer,
  filename,
  category,
  options = {}
) => {
  try {
    // Optimize image using Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    const folderPath = `quisipp/products/${category}`;

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: `${category}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 15)}`,
          transformation: [
            { width: 800, height: 800, crop: "limit", quality: "auto:good" },
            { fetch_format: "auto" },
          ],
          ...options,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              folder: result.folder || folderPath, // Ensure folder is always set
              originalName: filename,
              size: result.bytes,
              format: result.format,
              width: result.width,
              height: result.height,
            });
          }
        }
      );

      uploadStream.end(optimizedBuffer);
    });
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
};

// Function to upload multiple images
const uploadMultipleImages = async (files, category) => {
  const uploadPromises = files.map((file) =>
    optimizeAndUploadImage(file.buffer, file.originalname, category)
  );

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    // If any upload fails, clean up successful uploads
    const successfulUploads = results.filter(
      (result) => result && result.publicId
    );
    if (successfulUploads.length > 0) {
      await deleteMultipleImages(
        successfulUploads.map((upload) => upload.publicId)
      );
    }
    throw error;
  }
};

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Function to delete multiple images
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error("Error deleting multiple images from Cloudinary:", error);
    throw error;
  }
};

// Function to get image details
const getImageDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error("Error getting image details from Cloudinary:", error);
    throw error;
  }
};

// Function to generate image transformations
const generateImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    ...transformations,
    secure: true,
  });
};

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const requiredEnvVars = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Cloudinary environment variables: ${missingVars.join(
        ", "
      )}`
    );
  }

  return true;
};

module.exports = {
  cloudinary,
  createCloudinaryStorage,
  uploadToMemory,
  optimizeAndUploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getImageDetails,
  generateImageUrl,
  validateCloudinaryConfig,
};
