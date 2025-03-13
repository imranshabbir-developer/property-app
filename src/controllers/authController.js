import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/UserModel.js";
import { sendEmail } from "../utils/email.js";
import { ApiError } from "../utils/apiError.js";
import { uploadProfilePicture } from "../config/multerConfig.js";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Register a new user
export const register = async (req, res, next) => {
  uploadProfilePicture(req, res, async (err) => {
    if (err) return next(new ApiError(400, err.message));

    try {
      const { firstName, lastName, email, password, phone, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, "Email already in use");
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Handle uploaded file (if exists)
      const profilePicture = req.file ? req.file.path : "";

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        profilePicture,
        verificationToken,
        verificationTokenExpiry,
      });

      await user.save();

      // Send verification email
      try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await sendEmail({
          to: user.email,
          subject: "Verify Your Email",
          text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
          html: `
          <!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 600px;
      background-color: #ffffff;
      padding: 20px;
      margin: auto;
      border-radius: 10px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #007bff;
      color: #ffffff;
      padding: 10px;
      font-size: 20px;
      font-weight: bold;
      border-radius: 10px 10px 0 0;
    }
    .content {
      padding: 20px;
      font-size: 16px;
      color: #333333;
    }
    .button {
      background-color: #007bff;
      color: #ffffff;
      padding: 12px 20px;
      text-decoration: none;
      font-weight: bold;
      border-radius: 5px;
      display: inline-block;
      margin-top: 15px;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Peasomy Property Booking Management System</div>
    <div class="content">
      <h2>🔑 Verify Your Email</h2>
      <p>Dear User,</p>
      <p>Thank you for registering with <strong>Peasomy</strong>! To complete your sign-up process and activate your account, please verify your email address by clicking the button below:</p>
      <a class="button" href="{{verificationUrl}}">✅ Verify Email</a>
      <p>If you did not create an account, please ignore this email.</p>
    </div>
    <div class="footer">
      &copy; 2025 Peasomy Property Booking Management System. All rights reserved.
    </div>
  </div>
</body>
</html>
`,
        });
      } catch (emailError) {
        console.error("❌ Error sending verification email:", emailError);
      }

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(201).json({
        status: "success",
        message: "User registered successfully. Please verify your email.",
        data: {
          user: user.getPublicProfile(),
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  });
};

// Login User
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, "Invalid email or password");
    }

    user.lastLogin = Date.now();
    await user.save();

    res.status(200).json({
      status: "success",
      data: { user: user.getPublicProfile(), token: generateToken(user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// Verify Email
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    // Update user
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};
