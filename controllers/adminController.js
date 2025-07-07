const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../helper/authHelper");
const User = require("../models/User");

// Register a new admin
const registerAdmin = async (req, res) => {
  try {
    // get email and password from request body
    const { email, password, adminSecret } = req.body;

    // check if email, password and admin secret are provided
    if (!email || !password || !adminSecret) {
      return res.status(400).json({ message: "Email, password and admin secret are required" });
    }

    // verify admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid admin secret. Registration not allowed." });
    }

    // check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // hash password
    const hashedPassword = await hashPassword(password);

    // create new admin
    const newAdmin = new User({
      email,
      password: hashedPassword,
      role: "admin",
    });
    await newAdmin.save();

    // return success response (without password)
    const adminResponse = {
      _id: newAdmin._id,
      email: newAdmin.email,
      role: newAdmin.role,
    };
    res.status(201).json({ message: "Admin registered successfully", admin: adminResponse });
  } catch (error) {
    console.error("Error in registerAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // check if admin exists
    const admin = await User.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // verify admin role
    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    
    // compare password
    const isPasswordCorrect = await comparePassword(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "8h" } // 8 hours
    );

    // save token to cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    // return success response
    res.status(200).json({ 
      message: "Admin logged in successfully", 
      token, 
      admin: {
        _id: admin._id,
        email: admin.email,
        role: admin.role,
      } 
    });

  } catch (error) {
    console.error("Error in loginAdmin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { registerAdmin, loginAdmin };