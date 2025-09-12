const axios = require("axios");
const { BASE_URL, BASE_URL_PROD } = require("../config/api");
const { retryWithBackoff, handleApiError } = require("../utils/retryUtils");

// Get all delivery persons
const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPerson = await retryWithBackoff(async () => {
      return await axios.get(`${BASE_URL_PROD}/admin/all-business-owners`, {
        headers: {
          "x-admin-key": process.env.ADMIN_KEY,
        },
      });
    });

    if (deliveryPerson.data) {
      // filter out the only business owners data
      const ownersArray = Array.isArray(deliveryPerson.data.data)
        ? deliveryPerson.data.data
        : [];
      const filterDataByRole = ownersArray.map((owner) => {
        const { businessOwnerDetails, ...rest } = owner;
        return rest;
      });
      res.status(200).json({
        success: true,
        message: "Business owners fetched successfully",
        // deliveryPerson: deliveryPerson.data,
        deliveryPerson: filterDataByRole,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No business owners found",
      });
    }
  } catch (error) {
    handleApiError(error, res, "Failed to fetch delivery persons");
  }
};

// Create a new delivery person
const createDeliveryPerson = async (req, res) => {
  try {
    const response = await retryWithBackoff(async () => {
        return await axios.post(`${BASE_URL_PROD}/admin/create-delivery-person`, req.body, {
            headers: {
                "x-admin-key": process.env.ADMIN_KEY,
            },
        });
    });

    if (response.data.success) {
        res.status(201).json({
            success: true,
            message: "Delivery person created successfully",
            deliveryPerson: response.data.data,
        });
    } else {
        res.status(400).json({
            success: false,
            message: response.data.message || "Failed to create delivery person",
        });
    }
  } catch (error) {
    handleApiError(error, res, "Failed to create delivery person");
  }
};

// Update a delivery person
const updateDeliveryPerson = async (req, res) => {
  try {
    const deliveryPerson = await retryWithBackoff(async () => {
      return await axios.put(
        `${BASE_URL_PROD}/admin/update-delivery-person/${req.params.id}`,
        req.body,
        {
          headers: {
            "x-admin-key": process.env.ADMIN_KEY,
          },
        }
      );
    });

    if (deliveryPerson.data.success === true) {
      res.status(200).json({
        success: true,
        message: "Delivery person updated successfully",
        deliveryPerson: deliveryPerson.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Delivery person not found",
      });
    }
  } catch (error) {
    handleApiError(error, res, "Failed to update delivery person");
  }
};

module.exports = {
  getAllDeliveryPersons,
  createDeliveryPerson,
  updateDeliveryPerson,
};
