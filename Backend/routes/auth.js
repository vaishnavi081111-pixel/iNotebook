// const express = require("express");
// const { body, validationResult } = require("express-validator");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const rateLimit = require("express-rate-limit");
// const nodemailer = require("nodemailer");

// const User = require("../models/User");
// const Activity = require("../models/Activity");
// const fetchuser = require("../middleware/fetchuser");

// const router = express.Router();

// // ============================================================
// // CONFIGURATION
// // ============================================================

// const JWT_SECRET =
//     process.env.JWT_SECRET || "inotebook-secret-key";

// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_APP_PASSWORD,
//     },
// });
// // ============================================================
// // RATE LIMITERS
// // ============================================================

// const loginLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 15,
//     message: {
//         success: false,
//         error: "Too many login attempts. Please try again later.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// const otpSendLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 10,
//     message: {
//         success: false,
//         error: "Too many OTP requests. Please try again later.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// const otpVerifyLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 15,
//     message: {
//         success: false,
//         error: "Too many OTP verification attempts. Please try again later.",
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// // ============================================================
// // HELPER FUNCTIONS
// // ============================================================

// // Create JWT token
// const createToken = (userId) => {
//     return jwt.sign(
//         { user: { id: userId } },
//         JWT_SECRET,
//         { expiresIn: "7d" }
//     );
// };

// // Password reset token
// const createPasswordResetToken = () => {
//     return crypto.randomBytes(32).toString("hex");
// };

// // Generate 6-digit OTP
// const generateOtp = () => {
//     return crypto.randomInt(100000, 1000000).toString();
// };

// // Hash OTP
// const hashOtp = (otp) => {
//     return crypto
//         .createHash("sha256")
//         .update(otp)
//         .digest("hex");
// };

// // Normalize Indian phone number
// const normalizePhone = (phone) => {
//     if (!phone) return "";

//     const value = phone
//         .replace(/\s+/g, "")
//         .replace(/-/g, "");

//     if (/^[6-9]\d{9}$/.test(value)) {
//         return `+91${value}`;
//     }

//     if (/^91[6-9]\d{9}$/.test(value)) {
//         return `+${value}`;
//     }

//     if (/^\+91[6-9]\d{9}$/.test(value)) {
//         return value;
//     }

//     return value;
// };

// // Check email
// const isEmail = (value) => {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
// };

// // Mask email
// const maskEmail = (email) => {
//     if (!email) return "";

//     const parts = email.split("@");

//     if (parts.length !== 2) {
//         return email;
//     }

//     const name = parts[0];
//     const domain = parts[1];

//     if (name.length <= 2) {
//         return `${name[0] || "*"}***@${domain}`;
//     }

//     return `${name.substring(0, 2)}***@${domain}`;
// };

// // Mask phone
// const maskPhone = (phone) => {
//     if (!phone) return "";

//     const digits = phone.replace(/\D/g, "");

//     if (digits.length < 4) {
//         return "****";
//     }

//     return `******${digits.slice(-4)}`;
// };

// // Clear OTP information
// const clearOtp = (user) => {
//     user.otpHash = undefined;
//     user.otpExpires = undefined;
//     user.otpPurpose = undefined;
//     user.otpAttempts = 0;
// };

// // ============================================================
// // RESEND EMAIL FUNCTION
// // ============================================================

// const sendOtpEmail = async ({
//     email,
//     otp,
//     purpose = "signup",
// }) => {
// if (
//     !process.env.GMAIL_USER ||
//     !process.env.GMAIL_APP_PASSWORD
// ) {
//     throw new Error(
//         "Gmail email configuration is missing"
//     );
// }

//     const isSignup = purpose === "signup";

//     const subject = isSignup
//         ? "iNotebook - Verify Your Email"
//         : "iNotebook - Password Reset OTP";

//     const heading = isSignup
//         ? "Verify Your Email"
//         : "Reset Your Password";

//     const message = isSignup
//         ? "Use the OTP below to verify your iNotebook account."
//         : "Use the OTP below to reset your iNotebook password.";

//     try {
//     const info = await transporter.sendMail({
//         from: `"iNotebook." <${process.env.GMAIL_USER}>`,

//         to: email,

//         subject,

//         html: `
//                     <!DOCTYPE html>
//                     <html>
//                     <head>
//                         <meta charset="UTF-8">
//                         <meta
//                             name="viewport"
//                             content="width=device-width, initial-scale=1.0"
//                         >
//                         <title>${subject}</title>
//                     </head>

//                     <body style="
//                         margin: 0;
//                         padding: 0;
//                         background-color: #f5f3ff;
//                         font-family: Arial, Helvetica, sans-serif;
//                     ">

//                         <div style="
//                             max-width: 600px;
//                             margin: 40px auto;
//                             padding: 0 20px;
//                         ">

//                             <div style="
//                                 background: #ffffff;
//                                 border-radius: 18px;
//                                 padding: 40px;
//                                 box-shadow:
//                                     0 10px 35px
//                                     rgba(0,0,0,0.08);
//                             ">

//                                 <div style="
//                                     text-align: center;
//                                     margin-bottom: 30px;
//                                 ">

//                                     <h1 style="
//                                         margin: 0;
//                                         color: #6366f1;
//                                         font-size: 32px;
//                                     ">
//                                         iNotebook.
//                                     </h1>

//                                 </div>

//                                 <h2 style="
//                                     color: #222222;
//                                     margin-bottom: 15px;
//                                 ">
//                                     ${heading}
//                                 </h2>

//                                 <p style="
//                                     color: #555555;
//                                     font-size: 16px;
//                                     line-height: 1.6;
//                                 ">
//                                     ${message}
//                                 </p>

//                                 <div style="
//                                     margin: 30px 0;
//                                     padding: 25px;
//                                     background: #eef2ff;
//                                     border-radius: 14px;
//                                     text-align: center;
//                                 ">

//                                     <p style="
//                                         margin: 0 0 10px;
//                                         color: #666666;
//                                         font-size: 14px;
//                                     ">
//                                         Your OTP
//                                     </p>

//                                     <div style="
//                                         color: #4f46e5;
//                                         font-size: 38px;
//                                         font-weight: bold;
//                                         letter-spacing: 8px;
//                                     ">
//                                         ${otp}
//                                     </div>

//                                 </div>

//                                 <p style="
//                                     color: #666666;
//                                     font-size: 14px;
//                                     line-height: 1.6;
//                                 ">
//                                     This OTP is valid for 10 minutes.
//                                 </p>

//                                 <p style="
//                                     color: #999999;
//                                     font-size: 13px;
//                                     line-height: 1.6;
//                                     margin-top: 25px;
//                                 ">
//                                     If you did not request this OTP,
//                                     you can safely ignore this email.
//                                 </p>

//                                 <hr style="
//                                     border: none;
//                                     border-top: 1px solid #eeeeee;
//                                     margin: 30px 0;
//                                 ">

//                                 <p style="
//                                     text-align: center;
//                                     color: #aaaaaa;
//                                     font-size: 12px;
//                                     margin: 0;
//                                 ">
//                                     © ${new Date().getFullYear()}
//                                     iNotebook.
//                                     All rights reserved.
//                                 </p>

//                             </div>

//                         </div>

//                     </body>
//                     </html>
//                 `,
//                   });
        
//         console.log(
//             "GMAIL EMAIL SENT SUCCESSFULLY:",
//             info.messageId
//         );

//         return info;

//     } catch (error) {
//         console.error(
//             "GMAIL OTP EMAIL ERROR:",
//             error
//         );

//         throw error;
//     }
// };
// // ============================================================
// // CREATE USER
// // POST /api/auth/createUser
// // ============================================================

// router.post(
//     "/createUser",

//     [
//         body("name")
//             .trim()
//             .notEmpty()
//             .withMessage("Name is required")
//             .isLength({ min: 2 })
//             .withMessage(
//                 "Name must be at least 2 characters"
//             ),

//         body("email")
//             .trim()
//             .isEmail()
//             .withMessage(
//                 "Please enter a valid email"
//             )
//             .normalizeEmail(),

//         body("phone")
//             .trim()
//             .notEmpty()
//             .withMessage(
//                 "Phone number is required"
//             ),

//         body("password")
//             .isLength({ min: 6 })
//             .withMessage(
//                 "Password must be at least 6 characters"
//             ),

//         body("confirmPassword")
//             .notEmpty()
//             .withMessage(
//                 "Please confirm your password"
//             ),
//     ],

//     async (req, res) => {
//         try {
//             const errors = validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const {
//                 name,
//                 email,
//                 phone,
//                 password,
//                 confirmPassword,
//             } = req.body;

//             // ------------------------------------------------
//             // Password confirmation
//             // ------------------------------------------------

//             if (password !== confirmPassword) {
//                 return res.status(400).json({
//                     success: false,
//                     error: "Passwords do not match",
//                 });
//             }

//             // ------------------------------------------------
//             // Normalize email and phone
//             // ------------------------------------------------

//             const normalizedEmail =
//                 email.toLowerCase().trim();

//             const normalizedPhone =
//                 normalizePhone(phone);

//             if (!isEmail(normalizedEmail)) {
//                 return res.status(400).json({
//                     success: false,
//                     error: "Invalid email address",
//                 });
//             }

//             if (
//                 !/^\+91[6-9]\d{9}$/.test(
//                     normalizedPhone
//                 )
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Please enter a valid Indian phone number",
//                 });
//             }

//             // ------------------------------------------------
//             // Check existing email
//             // ------------------------------------------------

//             let user = await User.findOne({
//                 email: normalizedEmail,
//             });

//             // Verified account already exists
//             if (user && user.emailVerified) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "An account with this email already exists",
//                 });
//             }

//             // ------------------------------------------------
//             // Check existing phone
//             // ------------------------------------------------

//             const phoneUser = await User.findOne({
//                 phone: normalizedPhone,
//             });

//             // Phone belongs to another user
//             if (
//                 phoneUser &&
//                 (!user ||
//                     phoneUser._id.toString() !==
//                         user._id.toString())
//             ) {
//                 // Verified account
//                 if (phoneUser.emailVerified) {
//                     return res.status(400).json({
//                         success: false,
//                         error:
//                             "An account with this phone number already exists",
//                     });
//                 }

//                 // Unverified account belonging
//                 // to another email
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "This phone number is already associated with an unverified account. Please use the email used during the original signup.",
//                 });
//             }

//             // ------------------------------------------------
//             // Hash password
//             // ------------------------------------------------

//             const salt =
//                 await bcrypt.genSalt(10);

//             const hashedPassword =
//                 await bcrypt.hash(
//                     password,
//                     salt
//                 );

//             // ------------------------------------------------
//             // Generate OTP
//             // ------------------------------------------------

//             const otp = generateOtp();

//             const otpHash =
//                 hashOtp(otp);

//             const otpExpires =
//                 new Date(
//                     Date.now() +
//                     10 * 60 * 1000
//                 );

//             // ------------------------------------------------
//             // Create / update user
//             // ------------------------------------------------

//             if (!user) {
//                 user = new User({
//                     name: name.trim(),
//                     email: normalizedEmail,
//                     phone: normalizedPhone,
//                     password: hashedPassword,

//                     emailVerified: false,
//                     phoneVerified: false,

//                     otpHash,
//                     otpExpires,
//                     otpPurpose: "signup",
//                     otpAttempts: 0,
//                 });
//             } else {
//                 // Existing unverified account
//                 user.name = name.trim();
//                 user.phone = normalizedPhone;
//                 user.password = hashedPassword;

//                 user.emailVerified = false;
//                 user.phoneVerified = false;

//                 user.otpHash = otpHash;
//                 user.otpExpires = otpExpires;
//                 user.otpPurpose = "signup";
//                 user.otpAttempts = 0;
//             }

//             // ------------------------------------------------
//             // Save user
//             // ------------------------------------------------

//             try {
//                 await user.save();

//             } catch (saveError) {
//                 console.error(
//                     "CREATE USER SAVE ERROR:",
//                     saveError
//                 );

//                 // MongoDB duplicate key
//                 if (saveError.code === 11000) {
//                     const duplicateField =
//                         Object.keys(
//                             saveError.keyPattern ||
//                             {}
//                         )[0];

//                     if (
//                         duplicateField ===
//                         "phone"
//                     ) {
//                         return res.status(400).json({
//                             success: false,
//                             error:
//                                 "This phone number is already registered.",
//                         });
//                     }

//                     if (
//                         duplicateField ===
//                         "email"
//                     ) {
//                         return res.status(400).json({
//                             success: false,
//                             error:
//                                 "This email is already registered.",
//                         });
//                     }

//                     return res.status(400).json({
//                         success: false,
//                         error:
//                             "An account with these details already exists.",
//                     });
//                 }

//                 throw saveError;
//             }

//             // ------------------------------------------------
//             // Send OTP using Resend
//             // ------------------------------------------------

//             try {
//                 await sendOtpEmail({
//                     email: normalizedEmail,
//                     otp,
//                     purpose: "signup",
//                 });

//             } catch (emailError) {
//                 console.error(
//                     "SIGNUP OTP EMAIL ERROR:",
//                     emailError
//                 );

//                 return res.status(503).json({
//                     success: false,
//                     error:
//                         "Unable to send OTP email. Please try again later.",
//                 });
//             }

//             // ------------------------------------------------
//             // Success
//             // ------------------------------------------------

//             return res.status(201).json({
//                 success: true,
//                 requiresOtp: true,
//                 message:
//                     "Account created. OTP sent to your email.",
//                 email:
//                     maskEmail(
//                         normalizedEmail
//                     ),
//                 phone:
//                     maskPhone(
//                         normalizedPhone
//                     ),
//             });

//         } catch (error) {
//             console.error(
//                 "CREATE USER ERROR:",
//                 error
//             );

//             // Extra duplicate-key protection
//             if (error.code === 11000) {
//                 const duplicateField =
//                     Object.keys(
//                         error.keyPattern ||
//                         {}
//                     )[0];

//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         duplicateField ===
//                         "phone"
//                             ? "This phone number is already registered."
//                             : duplicateField ===
//                               "email"
//                             ? "This email is already registered."
//                             : "An account with these details already exists.",
//                 });
//             }

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // VERIFY OTP
// // POST /api/auth/verifyOtp
// // ============================================================

// router.post(
//     "/verifyOtp",
//     otpVerifyLimiter,

//     [
//         body("email")
//             .trim()
//             .isEmail()
//             .withMessage(
//                 "Valid email is required"
//             )
//             .normalizeEmail(),

//         body("otp")
//             .trim()
//             .isLength({
//                 min: 6,
//                 max: 6,
//             })
//             .withMessage(
//                 "OTP must be 6 digits"
//             ),

//         body("purpose")
//             .optional()
//             .isIn([
//                 "signup",
//                 "forgot-password",
//             ])
//             .withMessage(
//                 "Invalid OTP purpose"
//             ),
//     ],

//     async (req, res) => {
//         try {
//             const errors =
//                 validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const {
//                 email,
//                 otp,
//                 purpose = "signup",
//             } = req.body;

//             const normalizedEmail =
//                 email.toLowerCase().trim();

//             const user =
//                 await User.findOne({
//                     email: normalizedEmail,
//                 });

//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     error: "User not found",
//                 });
//             }

//             if (
//                 !user.otpHash ||
//                 !user.otpExpires
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "No active OTP found. Please request a new OTP.",
//                 });
//             }

//             if (
//                 user.otpPurpose !==
//                 purpose
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Invalid OTP purpose",
//                 });
//             }

//             if (
//                 new Date() >
//                 user.otpExpires
//             ) {
//                 clearOtp(user);

//                 await user.save();

//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "OTP has expired. Please request a new OTP.",
//                 });
//             }

//             if (
//                 (user.otpAttempts || 0) >= 5
//             ) {
//                 clearOtp(user);

//                 await user.save();

//                 return res.status(429).json({
//                     success: false,
//                     error:
//                         "Too many incorrect attempts. Please request a new OTP.",
//                 });
//             }

//             const incomingOtpHash =
//                 hashOtp(otp);

//             if (
//                 incomingOtpHash !==
//                 user.otpHash
//             ) {
//                 user.otpAttempts =
//                     (user.otpAttempts || 0) +
//                     1;

//                 await user.save();

//                 return res.status(400).json({
//                     success: false,
//                     error: "Invalid OTP",
//                     attemptsRemaining:
//                         Math.max(
//                             0,
//                             5 -
//                                 user.otpAttempts
//                         ),
//                 });
//             }

//             // ------------------------------------------------
//             // SIGNUP OTP
//             // ------------------------------------------------

//             if (purpose === "signup") {
//                 user.emailVerified = true;

//                 if (user.phone) {
//                     user.phoneVerified =
//                         true;
//                 }

//                 clearOtp(user);

//                 await user.save();

//                 try {
//                     await Activity.create({
//                         user: user._id,
//                         action:
//                             "account_created",
//                         message:
//                             "Account created and email verified",
//                     });
//                 } catch (
//                     activityError
//                 ) {
//                     console.error(
//                         "ACTIVITY ERROR:",
//                         activityError
//                     );
//                 }

//                 const token =
//                     createToken(
//                         user._id
//                     );

//                 return res.status(200).json({
//                     success: true,
//                     message:
//                         "Email verified successfully",
//                     token,
//                     user: {
//                         id: user._id,
//                         name: user.name,
//                         email: user.email,
//                         phone: user.phone,
//                     },
//                 });
//             }

//             // ------------------------------------------------
//             // FORGOT PASSWORD OTP
//             // ------------------------------------------------

//             if (
//                 purpose ===
//                 "forgot-password"
//             ) {
//                 const resetToken =
//                     createPasswordResetToken();

//                 user.passwordResetToken =
//                     crypto
//                         .createHash(
//                             "sha256"
//                         )
//                         .update(
//                             resetToken
//                         )
//                         .digest("hex");

//                 user.passwordResetExpires =
//                     new Date(
//                         Date.now() +
//                             15 *
//                                 60 *
//                                 1000
//                     );

//                 clearOtp(user);

//                 await user.save();

//                 return res.status(200).json({
//                     success: true,
//                     message:
//                         "OTP verified. You can now reset your password.",
//                     resetToken,
//                 });
//             }

//             return res.status(400).json({
//                 success: false,
//                 error:
//                     "Invalid OTP purpose",
//             });

//         } catch (error) {
//             console.error(
//                 "VERIFY OTP ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // RESEND OTP
// // POST /api/auth/resendOtp
// // ============================================================

// router.post(
//     "/resendOtp",
//     otpSendLimiter,

//     [
//         body("email")
//             .trim()
//             .isEmail()
//             .withMessage(
//                 "Valid email is required"
//             )
//             .normalizeEmail(),

//         body("purpose")
//             .optional()
//             .isIn([
//                 "signup",
//                 "forgot-password",
//             ])
//             .withMessage(
//                 "Invalid OTP purpose"
//             ),
//     ],

//     async (req, res) => {
//         try {
//             const errors =
//                 validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const {
//                 email,
//                 purpose = "signup",
//             } = req.body;

//             const normalizedEmail =
//                 email.toLowerCase().trim();

//             const user =
//                 await User.findOne({
//                     email: normalizedEmail,
//                 });

//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     error: "User not found",
//                 });
//             }

//             if (
//                 purpose === "signup" &&
//                 user.emailVerified
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Email is already verified",
//                 });
//             }

//             if (
//                 purpose ===
//                     "forgot-password" &&
//                 !user.emailVerified
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Please verify your email before resetting your password.",
//                 });
//             }

//             const otp =
//                 generateOtp();

//             user.otpHash =
//                 hashOtp(otp);

//             user.otpExpires =
//                 new Date(
//                     Date.now() +
//                         10 *
//                             60 *
//                             1000
//                 );

//             user.otpPurpose =
//                 purpose;

//             user.otpAttempts = 0;

//             await user.save();

//             try {
//                 await sendOtpEmail({
//                     email:
//                         normalizedEmail,
//                     otp,
//                     purpose,
//                 });

//             } catch (
//                 emailError
//             ) {
//                 console.error(
//                     "RESEND OTP EMAIL ERROR:",
//                     emailError
//                 );

//                 return res.status(503).json({
//                     success: false,
//                     error:
//                         "Unable to send OTP email. Please try again later.",
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 message:
//                     "New OTP sent successfully",
//                 email:
//                     maskEmail(
//                         normalizedEmail
//                     ),
//             });

//         } catch (error) {
//             console.error(
//                 "RESEND OTP ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // LOGIN
// // POST /api/auth/login
// // ============================================================

// router.post(
//     "/login",
//     loginLimiter,

//     [
//         body("identifier")
//             .trim()
//             .notEmpty()
//             .withMessage(
//                 "Email or phone is required"
//             ),

//         body("password")
//             .notEmpty()
//             .withMessage(
//                 "Password is required"
//             ),
//     ],

//     async (req, res) => {
//         try {
//             const errors =
//                 validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const {
//                 identifier,
//                 password,
//             } = req.body;

//             const value =
//                 identifier.trim();

//             let user;

//             if (isEmail(value)) {
//                 user =
//                     await User.findOne({
//                         email:
//                             value.toLowerCase(),
//                     });
//             } else {
//                 const normalizedPhone =
//                     normalizePhone(
//                         value
//                     );

//                 user =
//                     await User.findOne({
//                         phone:
//                             normalizedPhone,
//                     });
//             }

//             if (!user) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Invalid email/phone or password",
//                 });
//             }

//             const passwordMatch =
//                 await bcrypt.compare(
//                     password,
//                     user.password
//                 );

//             if (!passwordMatch) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Invalid email/phone or password",
//                 });
//             }

//             if (!user.emailVerified) {
//                 return res.status(403).json({
//                     success: false,
//                     requiresOtp: true,
//                     error:
//                         "Please verify your email before login.",
//                     email:
//                         maskEmail(
//                             user.email
//                         ),
//                 });
//             }

//             const token =
//                 createToken(
//                     user._id
//                 );

//             try {
//                 await Activity.create({
//                     user: user._id,
//                     action: "login",
//                     message:
//                         "User logged in",
//                 });
//             } catch (
//                 activityError
//             ) {
//                 console.error(
//                     "ACTIVITY ERROR:",
//                     activityError
//                 );
//             }

//             return res.status(200).json({
//                 success: true,
//                 token,
//                 user: {
//                     id: user._id,
//                     name: user.name,
//                     email: user.email,
//                     phone: user.phone,
//                 },
//             });

//         } catch (error) {
//             console.error(
//                 "LOGIN ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // FORGOT PASSWORD
// // POST /api/auth/forgotPassword
// // ============================================================

// router.post(
//     "/forgotPassword",
//     otpSendLimiter,

//     [
//         body("identifier")
//             .trim()
//             .notEmpty()
//             .withMessage(
//                 "Email or phone is required"
//             ),
//     ],

//     async (req, res) => {
//         try {
//             const errors =
//                 validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const {
//                 identifier,
//             } = req.body;

//             const value =
//                 identifier.trim();

//             let user;

//             if (isEmail(value)) {
//                 user =
//                     await User.findOne({
//                         email:
//                             value.toLowerCase(),
//                     });
//             } else {
//                 user =
//                     await User.findOne({
//                         phone:
//                             normalizePhone(
//                                 value
//                             ),
//                     });
//             }

//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     error:
//                         "No account found with these details.",
//                 });
//             }

//             if (!user.emailVerified) {
//                 return res.status(403).json({
//                     success: false,
//                     error:
//                         "Please verify your email before resetting your password.",
//                 });
//             }

//             const otp =
//                 generateOtp();

//             user.otpHash =
//                 hashOtp(otp);

//             user.otpExpires =
//                 new Date(
//                     Date.now() +
//                         10 *
//                             60 *
//                             1000
//                 );

//             user.otpPurpose =
//                 "forgot-password";

//             user.otpAttempts = 0;

//             await user.save();

//             try {
//                 await sendOtpEmail({
//                     email: user.email,
//                     otp,
//                     purpose:
//                         "forgot-password",
//                 });

//             } catch (
//                 emailError
//             ) {
//                 console.error(
//                     "FORGOT PASSWORD EMAIL ERROR:",
//                     emailError
//                 );

//                 return res.status(503).json({
//                     success: false,
//                     error:
//                         "Unable to send OTP email. Please try again later.",
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 requiresOtp: true,
//                 message:
//                     "Password reset OTP sent to your email.",
//                 email:
//                     maskEmail(
//                         user.email
//                     ),
//             });

//         } catch (error) {
//             console.error(
//                 "FORGOT PASSWORD ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // RESET PASSWORD
// // POST /api/auth/ResetPassword
// // ============================================================

// router.post(
//     "/ResetPassword",

//     [
//         body("resetToken")
//             .trim()
//             .notEmpty()
//             .withMessage(
//                 "Reset token is required"
//             ),

//         body("newPassword")
//             .isLength({ min: 6 })
//             .withMessage(
//                 "New password must be at least 6 characters"
//             ),
//     ],

//     async (req, res) => {
//         try {
//             const errors =
//                 validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const {
//                 resetToken,
//                 newPassword,
//             } = req.body;

//             const hashedResetToken =
//                 crypto
//                     .createHash(
//                         "sha256"
//                     )
//                     .update(
//                         resetToken
//                     )
//                     .digest("hex");

//             const user =
//                 await User.findOne({
//                     passwordResetToken:
//                         hashedResetToken,

//                     passwordResetExpires:
//                         {
//                             $gt: new Date(),
//                         },
//                 });

//             if (!user) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Invalid or expired reset token.",
//                 });
//             }

//             const salt =
//                 await bcrypt.genSalt(10);

//             const hashedPassword =
//                 await bcrypt.hash(
//                     newPassword,
//                     salt
//                 );

//             user.password =
//                 hashedPassword;

//             user.passwordResetToken =
//                 undefined;

//             user.passwordResetExpires =
//                 undefined;

//             await user.save();

//             try {
//                 await Activity.create({
//                     user: user._id,
//                     action:
//                         "password_reset",
//                     message:
//                         "Password reset successfully",
//                 });
//             } catch (
//                 activityError
//             ) {
//                 console.error(
//                     "ACTIVITY ERROR:",
//                     activityError
//                 );
//             }

//             return res.status(200).json({
//                 success: true,
//                 message:
//                     "Password reset successfully. You can now login.",
//             });

//         } catch (error) {
//             console.error(
//                 "RESET PASSWORD ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // GET USER
// // POST /api/auth/getUser
// // Login required
// // ============================================================

// router.post(
//     "/getUser",
//     fetchuser,

//     async (req, res) => {
//         try {
//             const user =
//                 await User.findById(
//                     req.user.id
//                 ).select(
//                     "-password -otpHash -otpExpires -otpPurpose -otpAttempts -passwordResetToken -passwordResetExpires"
//                 );

//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     error:
//                         "User not found",
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 user,
//             });

//         } catch (error) {
//             console.error(
//                 "GET USER ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // UPDATE PROFILE
// // PUT /api/auth/updateProfile
// // Login required
// // ============================================================

// router.put(
//     "/updateProfile",
//     fetchuser,

//     [
//         body("name")
//             .optional()
//             .trim()
//             .isLength({ min: 2 })
//             .withMessage(
//                 "Name must be at least 2 characters"
//             ),

//         body("email")
//             .optional()
//             .trim()
//             .isEmail()
//             .withMessage(
//                 "Invalid email"
//             )
//             .normalizeEmail(),

//         body("phone")
//             .optional()
//             .trim(),
//     ],

//     async (req, res) => {
//         try {
//             const errors =
//                 validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const user =
//                 await User.findById(
//                     req.user.id
//                 );

//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     error:
//                         "User not found",
//                 });
//             }

//             const {
//                 name,
//                 email,
//                 phone,
//             } = req.body;

//             // ------------------------------------------------
//             // Update name
//             // ------------------------------------------------

//             if (name !== undefined) {
//                 user.name =
//                     name.trim();
//             }

//             // ------------------------------------------------
//             // Update email
//             // ------------------------------------------------

//             if (email !== undefined) {
//                 const normalizedEmail =
//                     email
//                         .toLowerCase()
//                         .trim();

//                 if (
//                     !isEmail(
//                         normalizedEmail
//                     )
//                 ) {
//                     return res.status(400).json({
//                         success: false,
//                         error:
//                             "Invalid email",
//                     });
//                 }

//                 const existingEmail =
//                     await User.findOne({
//                         email:
//                             normalizedEmail,
//                         _id: {
//                             $ne:
//                                 user._id,
//                         },
//                     });

//                 if (existingEmail) {
//                     return res.status(400).json({
//                         success: false,
//                         error:
//                             "Email is already in use",
//                     });
//                 }

//                 user.email =
//                     normalizedEmail;
//             }

//             // ------------------------------------------------
//             // Update phone
//             // ------------------------------------------------

//             if (phone !== undefined) {
//                 const normalizedPhone =
//                     normalizePhone(
//                         phone
//                     );

//                 if (
//                     !/^\+91[6-9]\d{9}$/.test(
//                         normalizedPhone
//                     )
//                 ) {
//                     return res.status(400).json({
//                         success: false,
//                         error:
//                             "Please enter a valid Indian phone number",
//                     });
//                 }

//                 const existingPhone =
//                     await User.findOne({
//                         phone:
//                             normalizedPhone,
//                         _id: {
//                             $ne:
//                                 user._id,
//                         },
//                     });

//                 if (existingPhone) {
//                     return res.status(400).json({
//                         success: false,
//                         error:
//                             "Phone number is already in use",
//                     });
//                 }

//                 user.phone =
//                     normalizedPhone;
//             }

//             await user.save();

//             try {
//                 await Activity.create({
//                     user: user._id,
//                     action:
//                         "profile_updated",
//                     message:
//                         "Profile updated successfully",
//                 });
//             } catch (
//                 activityError
//             ) {
//                 console.error(
//                     "ACTIVITY ERROR:",
//                     activityError
//                 );
//             }

//             return res.status(200).json({
//                 success: true,
//                 message:
//                     "Profile updated successfully",
//                 user: {
//                     id: user._id,
//                     name: user.name,
//                     email: user.email,
//                     phone: user.phone,
//                 },
//             });

//         } catch (error) {
//             console.error(
//                 "UPDATE PROFILE ERROR:",
//                 error
//             );

//             // Duplicate protection
//             if (error.code === 11000) {
//                 const duplicateField =
//                     Object.keys(
//                         error.keyPattern ||
//                         {}
//                     )[0];

//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         duplicateField ===
//                         "phone"
//                             ? "Phone number is already in use"
//                             : duplicateField ===
//                               "email"
//                             ? "Email is already in use"
//                             : "This information is already in use",
//                 });
//             }

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // CHANGE PASSWORD
// // PUT /api/auth/changePassword
// // Login required
// // ============================================================

// router.put(
//     "/changePassword",
//     fetchuser,

//     [
//         body("currentPassword")
//             .notEmpty()
//             .withMessage(
//                 "Current password is required"
//             ),

//         body("newPassword")
//             .isLength({ min: 6 })
//             .withMessage(
//                 "New password must be at least 6 characters"
//             ),

//         body("confirmPassword")
//             .notEmpty()
//             .withMessage(
//                 "Please confirm your new password"
//             ),
//     ],

//     async (req, res) => {
//         try {
//             const errors =
//                 validationResult(req);

//             if (!errors.isEmpty()) {
//                 return res.status(400).json({
//                     success: false,
//                     errors: errors.array(),
//                 });
//             }

//             const {
//                 currentPassword,
//                 newPassword,
//                 confirmPassword,
//             } = req.body;

//             if (
//                 newPassword !==
//                 confirmPassword
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "New passwords do not match",
//                 });
//             }

//             const user =
//                 await User.findById(
//                     req.user.id
//                 );

//             if (!user) {
//                 return res.status(404).json({
//                     success: false,
//                     error:
//                         "User not found",
//                 });
//             }

//             const currentPasswordMatch =
//                 await bcrypt.compare(
//                     currentPassword,
//                     user.password
//                 );

//             if (!currentPasswordMatch) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "Current password is incorrect",
//                 });
//             }

//             const samePassword =
//                 await bcrypt.compare(
//                     newPassword,
//                     user.password
//                 );

//             if (samePassword) {
//                 return res.status(400).json({
//                     success: false,
//                     error:
//                         "New password must be different from the current password",
//                 });
//             }

//             const salt =
//                 await bcrypt.genSalt(10);

//             const hashedPassword =
//                 await bcrypt.hash(
//                     newPassword,
//                     salt
//                 );

//             user.password =
//                 hashedPassword;

//             await user.save();

//             try {
//                 await Activity.create({
//                     user: user._id,
//                     action:
//                         "password_changed",
//                     message:
//                         "Password changed successfully",
//                 });
//             } catch (
//                 activityError
//             ) {
//                 console.error(
//                     "ACTIVITY ERROR:",
//                     activityError
//                 );
//             }

//             return res.status(200).json({
//                 success: true,
//                 message:
//                     "Password changed successfully",
//             });

//         } catch (error) {
//             console.error(
//                 "CHANGE PASSWORD ERROR:",
//                 error
//             );

//             return res.status(500).json({
//                 success: false,
//                 error:
//                     "Internal server error",
//             });
//         }
//     }
// );

// // ============================================================
// // EXPORT ROUTER
// // ============================================================

// module.exports = router;


const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const User = require("../models/User");
const Activity = require("../models/Activity");
const fetchuser = require("../middleware/fetchuser");

const router = express.Router();

// ============================================================
// CONFIGURATION
// ============================================================

const JWT_SECRET =
    process.env.JWT_SECRET || "inotebook-secret-key";

// ============================================================
// GMAIL CONFIGURATION
// ============================================================

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// ============================================================
// RATE LIMITERS
// ============================================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        success: false,
        error:
            "Too many login attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error:
            "Too many OTP requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        success: false,
        error:
            "Too many OTP verification attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Create JWT token
const createToken = (userId) => {
    return jwt.sign(
        { user: { id: userId } },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Password reset token
const createPasswordResetToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

// Generate 6-digit OTP
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTP
const hashOtp = (otp) => {
    return crypto
        .createHash("sha256")
        .update(otp)
        .digest("hex");
};

// Normalize Indian phone number
const normalizePhone = (phone) => {
    if (!phone) return "";

    const value = phone
        .replace(/\s+/g, "")
        .replace(/-/g, "");

    if (/^[6-9]\d{9}$/.test(value)) {
        return `+91${value}`;
    }

    if (/^91[6-9]\d{9}$/.test(value)) {
        return `+${value}`;
    }

    if (/^\+91[6-9]\d{9}$/.test(value)) {
        return value;
    }

    return value;
};

// Check email
const isEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// Mask email
const maskEmail = (email) => {
    if (!email) return "";

    const parts = email.split("@");

    if (parts.length !== 2) {
        return email;
    }

    const name = parts[0];
    const domain = parts[1];

    if (name.length <= 2) {
        return `${name[0] || "*"}***@${domain}`;
    }

    return `${name.substring(0, 2)}***@${domain}`;
};

// Mask phone
const maskPhone = (phone) => {
    if (!phone) return "";

    const digits = phone.replace(/\D/g, "");

    if (digits.length < 4) {
        return "****";
    }

    return `******${digits.slice(-4)}`;
};

// Clear OTP information
const clearOtp = (user) => {
    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpPurpose = undefined;
    user.otpAttempts = 0;
};

// ============================================================
// GMAIL EMAIL FUNCTION
// ============================================================

const sendOtpEmail = async ({
    email,
    otp,
    purpose = "signup",
}) => {
    if (
        !process.env.GMAIL_USER ||
        !process.env.GMAIL_APP_PASSWORD
    ) {
        throw new Error(
            "Gmail email configuration is missing"
        );
    }

    const isSignup = purpose === "signup";

    const subject = isSignup
        ? "iNotebook - Verify Your Email"
        : "iNotebook - Password Reset OTP";

    const heading = isSignup
        ? "Verify Your Email"
        : "Reset Your Password";

    const message = isSignup
        ? "Use the OTP below to verify your iNotebook account."
        : "Use the OTP below to reset your iNotebook password.";

    try {
        const info = await transporter.sendMail({
            from: `"iNotebook." <${process.env.GMAIL_USER}>`,
            to: email,
            subject,

            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0"
                    >

                    <title>${subject}</title>
                </head>

                <body style="
                    margin: 0;
                    padding: 0;
                    background-color: #f5f3ff;
                    font-family: Arial, Helvetica, sans-serif;
                ">

                    <div style="
                        max-width: 600px;
                        margin: 40px auto;
                        padding: 0 20px;
                    ">

                        <div style="
                            background: #ffffff;
                            border-radius: 18px;
                            padding: 40px;
                            box-shadow:
                                0 10px 35px
                                rgba(0,0,0,0.08);
                        ">

                            <div style="
                                text-align: center;
                                margin-bottom: 30px;
                            ">

                                <h1 style="
                                    margin: 0;
                                    color: #6366f1;
                                    font-size: 32px;
                                ">
                                    iNotebook.
                                </h1>

                            </div>

                            <h2 style="
                                color: #222222;
                                margin-bottom: 15px;
                            ">
                                ${heading}
                            </h2>

                            <p style="
                                color: #555555;
                                font-size: 16px;
                                line-height: 1.6;
                            ">
                                ${message}
                            </p>

                            <div style="
                                margin: 30px 0;
                                padding: 25px;
                                background: #eef2ff;
                                border-radius: 14px;
                                text-align: center;
                            ">

                                <p style="
                                    margin: 0 0 10px;
                                    color: #666666;
                                    font-size: 14px;
                                ">
                                    Your OTP
                                </p>

                                <div style="
                                    color: #4f46e5;
                                    font-size: 38px;
                                    font-weight: bold;
                                    letter-spacing: 8px;
                                ">
                                    ${otp}
                                </div>

                            </div>

                            <p style="
                                color: #666666;
                                font-size: 14px;
                                line-height: 1.6;
                            ">
                                This OTP is valid for 10 minutes.
                            </p>

                            <p style="
                                color: #999999;
                                font-size: 13px;
                                line-height: 1.6;
                                margin-top: 25px;
                            ">
                                If you did not request this OTP,
                                you can safely ignore this email.
                            </p>

                            <hr style="
                                border: none;
                                border-top: 1px solid #eeeeee;
                                margin: 30px 0;
                            ">

                            <p style="
                                text-align: center;
                                color: #aaaaaa;
                                font-size: 12px;
                                margin: 0;
                            ">
                                © ${new Date().getFullYear()}
                                iNotebook.
                                All rights reserved.
                            </p>

                        </div>

                    </div>

                </body>
                </html>
            `,
        });

        console.log(
            "GMAIL EMAIL SENT SUCCESSFULLY:",
            info.messageId
        );

        return info;

    } catch (error) {
        console.error(
            "GMAIL OTP EMAIL ERROR:",
            error
        );

        throw error;
    }
};

// ============================================================
// CREATE USER
// POST /api/auth/createUser
// ============================================================

router.post(
    "/createUser",

    [
        body("name")
            .trim()
            .notEmpty()
            .withMessage("Name is required")
            .isLength({ min: 2 })
            .withMessage(
                "Name must be at least 2 characters"
            ),

        body("email")
            .trim()
            .isEmail()
            .withMessage(
                "Please enter a valid email"
            )
            .normalizeEmail(),

        body("phone")
            .trim()
            .notEmpty()
            .withMessage(
                "Phone number is required"
            ),

        body("password")
            .isLength({ min: 6 })
            .withMessage(
                "Password must be at least 6 characters"
            ),

        body("confirmPassword")
            .notEmpty()
            .withMessage(
                "Please confirm your password"
            ),
    ],

    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const {
                name,
                email,
                phone,
                password,
                confirmPassword,
            } = req.body;

            // ------------------------------------------------
            // Password confirmation
            // ------------------------------------------------

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: "Passwords do not match",
                });
            }

            // ------------------------------------------------
            // Normalize email and phone
            // ------------------------------------------------

            const normalizedEmail =
                email.toLowerCase().trim();

            const normalizedPhone =
                normalizePhone(phone);

            if (!isEmail(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid email address",
                });
            }

            if (
                !/^\+91[6-9]\d{9}$/.test(
                    normalizedPhone
                )
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Please enter a valid Indian phone number",
                });
            }

            // ------------------------------------------------
            // Check existing email
            // ------------------------------------------------

            let user = await User.findOne({
                email: normalizedEmail,
            });

            // Verified account already exists
            if (user && user.emailVerified) {
                return res.status(400).json({
                    success: false,
                    error:
                        "An account with this email already exists",
                });
            }

            // ------------------------------------------------
            // Check existing phone
            // ------------------------------------------------

            const phoneUser = await User.findOne({
                phone: normalizedPhone,
            });

            // Phone belongs to another user
            if (
                phoneUser &&
                (!user ||
                    phoneUser._id.toString() !==
                        user._id.toString())
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "This phone number is already registered.",
                });
            }

            // ------------------------------------------------
            // Generate OTP
            // ------------------------------------------------

            const otp = generateOtp();

            const otpHash = hashOtp(otp);

            const otpExpires =
                new Date(
                    Date.now() +
                        10 * 60 * 1000
                );

            // ------------------------------------------------
            // Hash password
            // ------------------------------------------------

            const salt =
                await bcrypt.genSalt(10);

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    salt
                );

            // ------------------------------------------------
            // Create or update unverified user
            // ------------------------------------------------

            if (!user) {
                user = new User({
                    name,
                    email: normalizedEmail,
                    phone: normalizedPhone,
                    password: hashedPassword,
                    emailVerified: false,
                    otpHash,
                    otpExpires,
                    otpPurpose: "signup",
                    otpAttempts: 0,
                });
            } else {
                user.name = name;
                user.phone = normalizedPhone;
                user.password = hashedPassword;
                user.emailVerified = false;
                user.otpHash = otpHash;
                user.otpExpires = otpExpires;
                user.otpPurpose = "signup";
                user.otpAttempts = 0;
            }

            // ------------------------------------------------
            // Save user
            // ------------------------------------------------

            try {
                await user.save();

            } catch (saveError) {

                // MongoDB duplicate key
                if (saveError.code === 11000) {
                    const duplicateField =
                        Object.keys(
                            saveError.keyPattern ||
                            {}
                        )[0];

                    if (
                        duplicateField ===
                        "phone"
                    ) {
                        return res.status(400).json({
                            success: false,
                            error:
                                "This phone number is already registered.",
                        });
                    }

                    if (
                        duplicateField ===
                        "email"
                    ) {
                        return res.status(400).json({
                            success: false,
                            error:
                                "This email is already registered.",
                        });
                    }

                    return res.status(400).json({
                        success: false,
                        error:
                            "An account with these details already exists.",
                    });
                }

                throw saveError;
            }

            // ------------------------------------------------
            // Send OTP using Gmail
            // ------------------------------------------------

            try {
                await sendOtpEmail({
                    email: normalizedEmail,
                    otp,
                    purpose: "signup",
                });

            } catch (emailError) {
                console.error(
                    "SIGNUP OTP EMAIL ERROR:",
                    emailError
                );

                return res.status(503).json({
                    success: false,
                    error:
                        "Unable to send OTP email. Please try again later.",
                });
            }

            // ------------------------------------------------
            // Success
            // ------------------------------------------------

            return res.status(201).json({
                success: true,
                requiresOtp: true,
                message:
                    "Account created. OTP sent to your email.",
                email:
                    maskEmail(
                        normalizedEmail
                    ),
                phone:
                    maskPhone(
                        normalizedPhone
                    ),
            });

        } catch (error) {
            console.error(
                "CREATE USER ERROR:",
                error
            );

            // Extra duplicate-key protection
            if (error.code === 11000) {
                const duplicateField =
                    Object.keys(
                        error.keyPattern ||
                        {}
                    )[0];

                return res.status(400).json({
                    success: false,
                    error:
                        duplicateField ===
                        "phone"
                            ? "This phone number is already registered."
                            : duplicateField ===
                              "email"
                            ? "This email is already registered."
                            : "An account with these details already exists.",
                });
            }

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// VERIFY OTP
// POST /api/auth/verifyOtp
// ============================================================

router.post(
    "/verifyOtp",
    otpVerifyLimiter,

    [
        body("email")
            .trim()
            .isEmail()
            .withMessage(
                "Valid email is required"
            )
            .normalizeEmail(),

        body("otp")
            .trim()
            .isLength({
                min: 6,
                max: 6,
            })
            .withMessage(
                "OTP must be 6 digits"
            ),

        body("purpose")
            .optional()
            .isIn([
                "signup",
                "forgot-password",
            ])
            .withMessage(
                "Invalid OTP purpose"
            ),
    ],

    async (req, res) => {
        try {
            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const {
                email,
                otp,
                purpose = "signup",
            } = req.body;

            const normalizedEmail =
                email.toLowerCase().trim();

            const user =
                await User.findOne({
                    email: normalizedEmail,
                });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }

            // ------------------------------------------------
            // Check OTP exists
            // ------------------------------------------------

            if (
                !user.otpHash ||
                !user.otpExpires
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "No active OTP found. Please request a new OTP.",
                });
            }

            // ------------------------------------------------
            // Check OTP purpose
            // ------------------------------------------------

            if (
                user.otpPurpose &&
                user.otpPurpose !== purpose
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid OTP purpose.",
                });
            }

            // ------------------------------------------------
            // Check OTP expiry
            // ------------------------------------------------

            if (
                new Date() >
                new Date(user.otpExpires)
            ) {
                clearOtp(user);
                await user.save();

                return res.status(400).json({
                    success: false,
                    error:
                        "OTP has expired. Please request a new OTP.",
                });
            }

            // ------------------------------------------------
            // Check attempts
            // ------------------------------------------------

            if (
                user.otpAttempts >= 5
            ) {
                clearOtp(user);
                await user.save();

                return res.status(429).json({
                    success: false,
                    error:
                        "Too many incorrect OTP attempts. Please request a new OTP.",
                });
            }

            // ------------------------------------------------
            // Compare OTP
            // ------------------------------------------------

            const hashedInputOtp =
                hashOtp(otp);

            if (
                hashedInputOtp !==
                user.otpHash
            ) {
                user.otpAttempts =
                    (user.otpAttempts || 0) + 1;

                await user.save();

                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid OTP.",
                    attemptsRemaining:
                        Math.max(
                            0,
                            5 -
                                user.otpAttempts
                        ),
                });
            }

            // ------------------------------------------------
            // OTP verified
            // ------------------------------------------------

            if (purpose === "signup") {
                user.emailVerified = true;

                clearOtp(user);

                await user.save();

                return res.status(200).json({
                    success: true,
                    message:
                        "Email verified successfully. You can now login.",
                });
            }

            // ------------------------------------------------
            // Forgot password OTP
            // ------------------------------------------------

            if (
                purpose ===
                "forgot-password"
            ) {
                user.passwordResetToken =
                    createPasswordResetToken();

                user.passwordResetExpires =
                    new Date(
                        Date.now() +
                            15 * 60 * 1000
                    );

                clearOtp(user);

                await user.save();

                return res.status(200).json({
                    success: true,
                    message:
                        "OTP verified successfully.",
                    resetToken:
                        user.passwordResetToken,
                });
            }

            return res.status(400).json({
                success: false,
                error:
                    "Invalid OTP purpose.",
            });

        } catch (error) {
            console.error(
                "VERIFY OTP ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);
// ============================================================
// RESEND OTP
// POST /api/auth/resendOtp
// ============================================================

router.post(
    "/resendOtp",
    otpSendLimiter,

    [
        body("email")
            .trim()
            .isEmail()
            .withMessage(
                "Valid email is required"
            )
            .normalizeEmail(),

        body("purpose")
            .optional()
            .isIn([
                "signup",
                "forgot-password",
            ])
            .withMessage(
                "Invalid OTP purpose"
            ),
    ],

    async (req, res) => {
        try {
            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const {
                email,
                purpose = "signup",
            } = req.body;

            const normalizedEmail =
                email.toLowerCase().trim();

            const user =
                await User.findOne({
                    email: normalizedEmail,
                });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error:
                        "No account found with this email.",
                });
            }

            // ------------------------------------------------
            // Signup OTP
            // ------------------------------------------------

            if (
                purpose === "signup" &&
                user.emailVerified
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "This email is already verified. Please login.",
                });
            }

            // ------------------------------------------------
            // Generate new OTP
            // ------------------------------------------------

            const otp = generateOtp();

            user.otpHash =
                hashOtp(otp);

            user.otpExpires =
                new Date(
                    Date.now() +
                        10 * 60 * 1000
                );

            user.otpPurpose = purpose;

            user.otpAttempts = 0;

            await user.save();

            // ------------------------------------------------
            // Send OTP
            // ------------------------------------------------

            try {
                await sendOtpEmail({
                    email: normalizedEmail,
                    otp,
                    purpose,
                });

            } catch (emailError) {
                console.error(
                    "RESEND OTP EMAIL ERROR:",
                    emailError
                );

                return res.status(503).json({
                    success: false,
                    error:
                        "Unable to send OTP email. Please try again later.",
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "A new OTP has been sent to your email.",
                email:
                    maskEmail(
                        normalizedEmail
                    ),
            });

        } catch (error) {
            console.error(
                "RESEND OTP ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================

router.post(
    "/login",
    loginLimiter,

    [
        body("email")
            .trim()
            .isEmail()
            .withMessage(
                "Please enter a valid email"
            )
            .normalizeEmail(),

        body("password")
            .notEmpty()
            .withMessage(
                "Password is required"
            ),
    ],

    async (req, res) => {
        try {
            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const {
                email,
                password,
            } = req.body;

            const normalizedEmail =
                email.toLowerCase().trim();

            const user =
                await User.findOne({
                    email: normalizedEmail,
                });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid email or password",
                });
            }

            // ------------------------------------------------
            // Email verification check
            // ------------------------------------------------

            if (!user.emailVerified) {
                return res.status(403).json({
                    success: false,
                    requiresVerification: true,
                    error:
                        "Please verify your email before login.",
                });
            }

            // ------------------------------------------------
            // Password check
            // ------------------------------------------------

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatch) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid email or password",
                });
            }

            // ------------------------------------------------
            // Create token
            // ------------------------------------------------

            const token =
                createToken(
                    user._id
                );

            // ------------------------------------------------
            // Activity
            // ------------------------------------------------

            try {
                await Activity.create({
                    user: user._id,
                    action: "login",
                    message:
                        "User logged in",
                });
            } catch (
                activityError
            ) {
                console.error(
                    "LOGIN ACTIVITY ERROR:",
                    activityError
                );
            }

            return res.status(200).json({
                success: true,
                token,

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
            });

        } catch (error) {
            console.error(
                "LOGIN ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// FORGOT PASSWORD
// POST /api/auth/forgotPassword
// ============================================================

router.post(
    "/forgotPassword",
    otpSendLimiter,

    [
        body("email")
            .trim()
            .isEmail()
            .withMessage(
                "Please enter a valid email"
            )
            .normalizeEmail(),
    ],

    async (req, res) => {
        try {
            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const {
                email,
            } = req.body;

            const normalizedEmail =
                email.toLowerCase().trim();

            const user =
                await User.findOne({
                    email: normalizedEmail,
                });

            // ------------------------------------------------
            // Don't reveal whether email exists
            // ------------------------------------------------

            if (!user) {
                return res.status(200).json({
                    success: true,
                    message:
                        "If an account exists with this email, an OTP has been sent.",
                });
            }

            // ------------------------------------------------
            // Generate OTP
            // ------------------------------------------------

            const otp =
                generateOtp();

            user.otpHash =
                hashOtp(otp);

            user.otpExpires =
                new Date(
                    Date.now() +
                        10 * 60 * 1000
                );

            user.otpPurpose =
                "forgot-password";

            user.otpAttempts = 0;

            await user.save();

            // ------------------------------------------------
            // Send reset OTP
            // ------------------------------------------------

            try {
                await sendOtpEmail({
                    email:
                        normalizedEmail,
                    otp,
                    purpose:
                        "forgot-password",
                });

            } catch (emailError) {
                console.error(
                    "FORGOT PASSWORD EMAIL ERROR:",
                    emailError
                );

                return res.status(503).json({
                    success: false,
                    error:
                        "Unable to send OTP email. Please try again later.",
                });
            }

            return res.status(200).json({
                success: true,
                requiresOtp: true,
                message:
                    "Password reset OTP sent to your email.",
                email:
                    maskEmail(
                        normalizedEmail
                    ),
            });

        } catch (error) {
            console.error(
                "FORGOT PASSWORD ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// RESET PASSWORD
// POST /api/auth/resetPassword
// ============================================================

router.post(
    "/resetPassword",

    [
        body("email")
            .trim()
            .isEmail()
            .withMessage(
                "Please enter a valid email"
            )
            .normalizeEmail(),

        body("resetToken")
            .trim()
            .notEmpty()
            .withMessage(
                "Reset token is required"
            ),

        body("newPassword")
            .isLength({ min: 6 })
            .withMessage(
                "Password must be at least 6 characters"
            ),

        body("confirmPassword")
            .notEmpty()
            .withMessage(
                "Please confirm your password"
            ),
    ],

    async (req, res) => {
        try {
            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const {
                email,
                resetToken,
                newPassword,
                confirmPassword,
            } = req.body;

            // ------------------------------------------------
            // Password confirmation
            // ------------------------------------------------

            if (
                newPassword !==
                confirmPassword
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Passwords do not match",
                });
            }

            const normalizedEmail =
                email.toLowerCase().trim();

            const hashedResetToken =
                crypto
                    .createHash(
                        "sha256"
                    )
                    .update(
                        resetToken
                    )
                    .digest("hex");

            const user =
                await User.findOne({
                    email:
                        normalizedEmail,
                    passwordResetToken:
                        hashedResetToken,
                    passwordResetExpires: {
                        $gt: new Date(),
                    },
                });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid or expired reset token.",
                });
            }

            // ------------------------------------------------
            // Hash new password
            // ------------------------------------------------

            const salt =
                await bcrypt.genSalt(10);

            user.password =
                await bcrypt.hash(
                    newPassword,
                    salt
                );

            // ------------------------------------------------
            // Clear reset token
            // ------------------------------------------------

            user.passwordResetToken =
                undefined;

            user.passwordResetExpires =
                undefined;

            await user.save();

            // ------------------------------------------------
            // Activity
            // ------------------------------------------------

            try {
                await Activity.create({
                    user: user._id,
                    action:
                        "password_reset",
                    message:
                        "Password reset successfully",
                });
            } catch (
                activityError
            ) {
                console.error(
                    "PASSWORD RESET ACTIVITY ERROR:",
                    activityError
                );
            }

            return res.status(200).json({
                success: true,
                message:
                    "Password reset successfully. You can now login.",
            });

        } catch (error) {
            console.error(
                "RESET PASSWORD ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);
// ============================================================
// GET USER
// GET /api/auth/getuser
// ============================================================

router.post(
    "/getuser",
    fetchuser,

    async (req, res) => {
        try {
            const userId =
                req.user.id;

            const user =
                await User.findById(
                    userId
                ).select(
                    "-password -otpHash -passwordResetToken"
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error:
                        "User not found",
                });
            }

            return res.status(200).json({
                success: true,
                user,
            });

        } catch (error) {
            console.error(
                "GET USER ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// CHANGE PASSWORD
// POST /api/auth/changePassword
// ============================================================

router.post(
    "/changePassword",
    fetchuser,

    [
        body("currentPassword")
            .notEmpty()
            .withMessage(
                "Current password is required"
            ),

        body("newPassword")
            .isLength({ min: 6 })
            .withMessage(
                "New password must be at least 6 characters"
            ),

        body("confirmPassword")
            .notEmpty()
            .withMessage(
                "Please confirm your new password"
            ),
    ],

    async (req, res) => {
        try {
            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const {
                currentPassword,
                newPassword,
                confirmPassword,
            } = req.body;

            if (
                newPassword !==
                confirmPassword
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Passwords do not match",
                });
            }

            const user =
                await User.findById(
                    req.user.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error:
                        "User not found",
                });
            }

            const passwordMatch =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );

            if (!passwordMatch) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Current password is incorrect",
                });
            }

            const salt =
                await bcrypt.genSalt(10);

            user.password =
                await bcrypt.hash(
                    newPassword,
                    salt
                );

            await user.save();

            try {
                await Activity.create({
                    user: user._id,
                    action:
                        "password_changed",
                    message:
                        "Password changed successfully",
                });
            } catch (
                activityError
            ) {
                console.error(
                    "ACTIVITY ERROR:",
                    activityError
                );
            }

            return res.status(200).json({
                success: true,
                message:
                    "Password changed successfully",
            });

        } catch (error) {
            console.error(
                "CHANGE PASSWORD ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// UPDATE PROFILE
// PUT /api/auth/updateProfile
// ============================================================

router.put(
    "/updateProfile",
    fetchuser,

    [
        body("name")
            .optional()
            .trim()
            .isLength({ min: 2 })
            .withMessage(
                "Name must be at least 2 characters"
            ),
    ],

    async (req, res) => {
        try {
            const errors =
                validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array(),
                });
            }

            const user =
                await User.findById(
                    req.user.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error:
                        "User not found",
                });
            }

            if (
                req.body.name !==
                undefined
            ) {
                user.name =
                    req.body.name.trim();
            }

            await user.save();

            return res.status(200).json({
                success: true,
                message:
                    "Profile updated successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
            });

        } catch (error) {
            console.error(
                "UPDATE PROFILE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// DELETE ACCOUNT
// DELETE /api/auth/deleteAccount
// ============================================================

router.delete(
    "/deleteAccount",
    fetchuser,

    async (req, res) => {
        try {
            const user =
                await User.findById(
                    req.user.id
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error:
                        "User not found",
                });
            }

            // Delete user's activity
            try {
                await Activity.deleteMany({
                    user: user._id,
                });
            } catch (
                activityError
            ) {
                console.error(
                    "DELETE ACTIVITY ERROR:",
                    activityError
                );
            }

            await User.findByIdAndDelete(
                user._id
            );

            return res.status(200).json({
                success: true,
                message:
                    "Account deleted successfully",
            });

        } catch (error) {
            console.error(
                "DELETE ACCOUNT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// LOGOUT
// POST /api/auth/logout
// ============================================================

router.post(
    "/logout",
    fetchuser,

    async (req, res) => {
        try {
            try {
                await Activity.create({
                    user: req.user.id,
                    action:
                        "logout",
                    message:
                        "User logged out",
                });
            } catch (
                activityError
            ) {
                console.error(
                    "LOGOUT ACTIVITY ERROR:",
                    activityError
                );
            }

            return res.status(200).json({
                success: true,
                message:
                    "Logged out successfully",
            });

        } catch (error) {
            console.error(
                "LOGOUT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    "Internal server error",
            });
        }
    }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;