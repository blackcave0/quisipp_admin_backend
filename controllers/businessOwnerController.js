const axios = require("axios");
const { BASE_URL, BASE_URL_PROD } = require("../config/api");

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
    const businessOwner = await axios.post(
      `${BASE_URL_PROD}/business-owner/login`,
      req.body
    );
    
    if (businessOwner.data.success === true) {
      res.status(200).json({
        success: true,
        message: "Business owner logged in successfully",
        businessOwner: businessOwner.data.data,
      });
    }
    else if (businessOwner.data.success === false) {
      res.status(400).json({
        success: false,
        message: businessOwner.data.message,
      });
    }
  } catch (error) {
    // Check if it's an axios error with response
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || "Login failed",
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};



// get all business owners
const getAllBusinesOwners = async (req, res) => {
  try {
    // Get all users with role "business-owner" from the database
    const businessOwners = await axios.get(
      `${BASE_URL_PROD}/admin/all-business-owners`,
      {
        headers: {
          "x-admin-key": process.env.ADMIN_KEY,
        },
      }
    );

    if (businessOwners.data) {
      res.status(200).json({
        success: true,
        message: "Business owners fetched successfully",
        businessOwners: businessOwners.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No business owners found",
      });
    }
  } catch (error) {
    console.log("Error in getAllBusinesOwners", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
    const businessOwner = await axios.put(
      `${BASE_URL_PROD}/admin/update-business-owner/${req.params.id}`,
      req.body,
      {
        headers: {
          "x-admin-key": process.env.ADMIN_KEY,
        },
      }
    );

    if (businessOwner.data.success === true) {
      res.status(200).json({
        success: true,
        message: "Business owner updated successfully",
        businessOwner: businessOwner.data,
      });
    }
    else if (businessOwner.data.success === false) {
      res.status(400).json({
        success: false,
        message: businessOwner.data.message,
      });
    }
    else {
      res.status(404).json({
        success: false,
        message: "Business owner not found",
      });
    }
  } catch (error) {
    console.log("Error in updateBusinessOwner", error);
    res.status(500).json({
      success: false,
      message: "Internal server error business owner",
    });
  }
};
module.exports = {
  createBusinessOwner,
  getAllBusinesOwners,
  createPasswordForBusinessOwner,
  updateBusinessOwner,
  loginBusinessOwner,
};
