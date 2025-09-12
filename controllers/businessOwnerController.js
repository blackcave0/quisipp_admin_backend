const axios = require("axios");
const { BASE_URL, BASE_URL_PROD } = require("../config/api");
const { retryWithBackoff, handleApiError } = require("../utils/retryUtils");

// Register a new business owner
const createBusinessOwner = async (req, res) => {
  try {
    // const response =
  } catch (error) {
    console.log("Error in createBusinessOwner", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// login business owner
const loginBusinessOwner = async (req, res) => {
  try {
    const businessOwner = await retryWithBackoff(async () => {
      return await axios.post(
        `${BASE_URL_PROD}/business-owner/login`,
        req.body
      );
    });

    if (businessOwner.data.success === true) {
      res.status(200).json({
        success: true,
        message: "Business owner logged in successfully",
        businessOwner: businessOwner.data.data,
      });
    } else if (businessOwner.data.success === false) {
      res.status(400).json({
        success: false,
        message: businessOwner.data.message,
      });
    }
  } catch (error) {
    handleApiError(error, res, "Login failed");
  }
};

// get all business owners
const getAllBusinesOwners = async (req, res) => {
  try {
    // Get all users with role "business-owner" from the database with retry logic
    const businessOwners = await retryWithBackoff(async () => {
      return await axios.get(`${BASE_URL_PROD}/admin/all-business-owners`, {
        headers: {
          "x-admin-key": process.env.ADMIN_KEY,
        },
      });
    });

    // console.log(businessOwners.data);

    if (businessOwners.data) {
      // filter out the only business owners data
      const ownersArray = Array.isArray(businessOwners.data.data)
        ? businessOwners.data.data
        : [];
      const filterDataByRole = ownersArray.map((owner) => {
        const { deliveryPartnerDetails, ...rest } = owner;
        return rest;
      });
      res.status(200).json({
        success: true,
        message: "Business owners fetched successfully",
        // businessOwners: businessOwners.data,
        businessOwners: filterDataByRole,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No business owners found",
      });
    }
  } catch (error) {
    handleApiError(error, res, "Failed to fetch business owners");
  }
};

// [##TODO : remove this function] create password for business owner
const createPasswordForBusinessOwner = async (req, res) => {
  try {
    const businessOwners = await axios.get(
      `${BASE_URL_PROD}/auth/all-business-owners`
    );

    const data = businessOwners.data.findAndUpdate(
      { phoneNumber: req.body.phoneNumber },
      { password: req.body.password },
      { new: true }
    );

    if (data) {
      res.status(200).json({
        success: true,
        message: "Password created successfully",
        data: data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Business owner not found",
      });
    }
  } catch (error) {
    console.log("Error in createPasswordForBusinessOwner", error);
    res.status(500).json({
      success: false,
      message: "Internal server error business owner",
    });
  }
};

// update business owner
const updateBusinessOwner = async (req, res) => {
  try {
    console.log("Updating business owner with ID:", req.params.id);
    console.log("Update data:", req.body);
    console.log(
      "External API URL:",
      `${BASE_URL_PROD}/admin/update-business-owner/${req.params.id}`
    );
    console.log("Admin key configured:", !!process.env.ADMIN_KEY);

    const businessOwner = await retryWithBackoff(async () => {
      return await axios.put(
        `${BASE_URL_PROD}/admin/update-business-owner/${req.params.id}`,
        req.body,
        {
          headers: {
            "x-admin-key": process.env.ADMIN_KEY,
          },
          timeout: 10000, // 10 second timeout
        }
      );
    });

    console.log("External API response status:", businessOwner.status);
    console.log("External API response data:", businessOwner.data);

    if (businessOwner.data.success === true) {
      res.status(200).json({
        success: true,
        message: "Business owner updated successfully",
        businessOwner:
          businessOwner.data.businessOwner ||
          businessOwner.data.data ||
          businessOwner.data,
      });
    } else if (businessOwner.data.success === false) {
      res.status(400).json({
        success: false,
        message: businessOwner.data.message,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Business owner not found",
      });
    }
  } catch (error) {
    console.error("Error in updateBusinessOwner:", error);

    // More detailed error logging
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    handleApiError(error, res, "Failed to update business owner");
  }
};
module.exports = {
  createBusinessOwner,
  getAllBusinesOwners,
  createPasswordForBusinessOwner,
  updateBusinessOwner,
  loginBusinessOwner,
};
