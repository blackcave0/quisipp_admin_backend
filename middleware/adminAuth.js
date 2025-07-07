const jwt = require("jsonwebtoken");
const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // check if the user is an admin
    const user = await User.findById(decoded.id);
    // console.log(user.role);
    if (!user || user.role !== "admin") {
      return res
        .status(401)
        .json({ message: "Access denied, only admins can access this route" });
    }

    // add the user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.log("Error in adminAuth", error);
    res.status(500).json({ message: "Internal server error adminAuth" });
  }
};

module.exports = adminAuth;
