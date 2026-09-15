// const express = require("express");
// const {
//   body,
//   validationResult,
// } = require("express-validator");

// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");
// const rateLimit = require("express-rate-limit");

// const User = require("../models/User");
// const Activity = require("../models/Activity");
// const fetchuser = require("../middleware/fetchuser");

// const router = express.Router();

// /* ============================================================
//    EMAIL CONFIGURATION
//    ============================================================ */

// const createMailTransporter = () => {
//   if (
//     !process.env.EMAIL_USER ||
//     !process.env.EMAIL_APP_PASSWORD
//   ) {
//     return null;
//   }

//   return nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_APP_PASSWORD,
//     },
//   });
// };


// /* ============================================================
//    RATE LIMITERS
//    ============================================================ */

// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 15,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     error:
//       "Too many login attempts. Please try again later.",
//   },
// });

// const otpSendLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     error:
//       "Too many OTP requests. Please try again later.",
//   },
// });

// const otpVerifyLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 15,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     error:
//       "Too many OTP verification attempts. Please try again later.",
//   },
// });


// /* ============================================================
//    HELPER FUNCTIONS
//    ============================================================ */

// // Normal JWT used after login/signup
// const createToken = (userId) => {
//   return jwt.sign(
//     {
//       user: {
//         id: userId,
//       },
//     },
//     process.env.JWT_SECRET
//   );
// };


// // Short-lived token after forgot-password OTP verification
// const createPasswordResetToken = (userId) => {
//   return jwt.sign(
//     {
//       user: {
//         id: userId,
//       },
//       purpose: "password-reset",
//     },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: "10m",
//     }
//   );
// };


// // Generate six-digit OTP
// const generateOtp = () => {
//   return crypto
//     .randomInt(100000, 1000000)
//     .toString();
// };


// // Hash OTP before storing it
// const hashOtp = (otp) => {
//   return crypto
//     .createHash("sha256")
//     .update(otp)
//     .digest("hex");
// };


// // Normalize Indian phone number
// const normalizePhone = (phone) => {
//   if (!phone) {
//     return null;
//   }

//   let value = String(phone)
//     .trim()
//     .replace(/[\s()-]/g, "");

//   // 10 digit Indian number
//   if (/^\d{10}$/.test(value)) {
//     return `+91${value}`;
//   }

//   // +91XXXXXXXXXX
//   if (/^\+91\d{10}$/.test(value)) {
//     return value;
//   }

//   return null;
// };


// // Check email
// const isEmail = (value) => {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
//     value
//   );
// };


// // Mask email for UI
// const maskEmail = (email) => {
//   if (!email) {
//     return "";
//   }

//   const parts = email.split("@");

//   if (parts.length !== 2) {
//     return "your email";
//   }

//   const name = parts[0];
//   const domain = parts[1];

//   if (name.length <= 2) {
//     return `${name[0]}***@${domain}`;
//   }

//   return `${name.slice(0, 2)}***@${domain}`;
// };


// // Mask phone
// const maskPhone = (phone) => {
//   if (!phone) {
//     return "";
//   }

//   const digits = phone.replace(/\D/g, "");

//   if (digits.length < 4) {
//     return "****";
//   }

//   return `******${digits.slice(-4)}`;
// };


// // Clear OTP data
// const clearOtp = (user) => {
//   user.otp = null;
//   user.otpExpiry = null;
//   user.otpPurpose = null;
//   user.otpAttempts = 0;
// };


// /* ============================================================
//    SEND OTP EMAIL
//    ============================================================ */

// const sendOtpEmail = async (
//   email,
//   otp,
//   purpose
// ) => {
//   const transporter =
//     createMailTransporter();

//   if (!transporter) {
//     throw new Error(
//       "Email service is not configured."
//     );
//   }

//   let subject = "";
//   let title = "";
//   let description = "";

//   if (purpose === "signup") {
//     subject =
//       "Verify your iNotebook account";

//     title =
//       "Verify Your iNotebook Account";

//     description =
//       "Use the OTP below to verify your email address and complete your iNotebook account registration.";
//   } else {
//     subject =
//       "Reset your iNotebook password";

//     title =
//       "Reset Your Password";

//     description =
//       "Use the OTP below to verify your identity and reset your iNotebook password.";
//   }

//   const html = `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//       </head>

//       <body
//         style="
//           margin:0;
//           padding:0;
//           background:#f5f7fb;
//           font-family:Arial,Helvetica,sans-serif;
//         "
//       >
//         <div
//           style="
//             max-width:600px;
//             margin:40px auto;
//             background:#ffffff;
//             border-radius:16px;
//             overflow:hidden;
//             box-shadow:0 8px 30px rgba(0,0,0,0.08);
//           "
//         >

//           <div
//             style="
//               background:#6366f1;
//               padding:28px;
//               text-align:center;
//             "
//           >
//             <h1
//               style="
//                 margin:0;
//                 color:#ffffff;
//                 font-size:28px;
//               "
//             >
//               iNotebook
//             </h1>

//             <p
//               style="
//                 margin:8px 0 0;
//                 color:#eef2ff;
//                 font-size:14px;
//               "
//             >
//               Your notebook on the cloud
//             </p>
//           </div>

//           <div style="padding:35px 30px;">

//             <h2
//               style="
//                 margin-top:0;
//                 color:#111827;
//                 font-size:23px;
//               "
//             >
//               ${title}
//             </h2>

//             <p
//               style="
//                 color:#4b5563;
//                 line-height:1.7;
//                 font-size:15px;
//               "
//             >
//               ${description}
//             </p>

//             <div
//               style="
//                 margin:30px 0;
//                 padding:22px;
//                 background:#f3f4ff;
//                 border-radius:12px;
//                 text-align:center;
//               "
//             >
//               <p
//                 style="
//                   margin:0 0 8px;
//                   color:#6b7280;
//                   font-size:13px;
//                 "
//               >
//                 Your OTP
//               </p>

//               <div
//                 style="
//                   font-size:34px;
//                   font-weight:700;
//                   letter-spacing:8px;
//                   color:#4f46e5;
//                 "
//               >
//                 ${otp}
//               </div>
//             </div>

//             <p
//               style="
//                 color:#6b7280;
//                 font-size:14px;
//                 line-height:1.6;
//               "
//             >
//               This OTP is valid for
//               <strong>5 minutes</strong>.
//               Do not share this OTP with anyone.
//             </p>

//             <p
//               style="
//                 color:#6b7280;
//                 font-size:14px;
//                 line-height:1.6;
//               "
//             >
//               If you did not request this, you can safely
//               ignore this email.
//             </p>

//           </div>

//           <div
//             style="
//               padding:20px 30px;
//               background:#f9fafb;
//               text-align:center;
//               color:#9ca3af;
//               font-size:12px;
//             "
//           >
//             © ${new Date().getFullYear()} iNotebook
//           </div>

//         </div>
//       </body>
//     </html>
//   `;

//   await transporter.sendMail({
//     from: `"iNotebook" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject,
//     html,
//   });
// };


// /* ============================================================
//    CREATE USER
//    POST /api/auth/createUser
//    ============================================================ */

// router.post(
//   "/createUser",
//   otpSendLimiter,

//   [
//     body("name")
//       .trim()
//       .isLength({ min: 3 })
//       .withMessage(
//         "Name must be at least 3 characters"
//       ),

//     body("email")
//       .trim()
//       .isEmail()
//       .withMessage(
//         "Enter a valid email"
//       ),

//     body("phone")
//       .trim()
//       .notEmpty()
//       .withMessage(
//         "Phone number is required"
//       ),

//     body("password")
//       .isLength({ min: 5 })
//       .withMessage(
//         "Password must be at least 5 characters"
//       ),

//     body("confirmPassword")
//       .optional()
//       .custom((value, { req }) => {
//         if (
//           value !== undefined &&
//           value !== req.body.password
//         ) {
//           throw new Error(
//             "Passwords do not match"
//           );
//         }

//         return true;
//       }),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       const name =
//         req.body.name.trim();

//       const email =
//         req.body.email
//           .trim()
//           .toLowerCase();

//       const phone =
//         normalizePhone(
//           req.body.phone
//         );

//       const password =
//         req.body.password;


//       if (!phone) {
//         return res.status(400).json({
//           error:
//             "Enter a valid Indian phone number. Example: 9876543210",
//         });
//       }


//       // Check existing email
//       const emailUser =
//         await User.findOne({
//           email,
//         });


//       // Check existing phone
//       const phoneUser =
//         await User.findOne({
//           phone,
//         });


//       /*
//         Already verified email
//       */

//       if (
//         emailUser &&
//         emailUser.phoneVerified === true
//       ) {
//         return res.status(400).json({
//           error:
//             "An account with this email already exists.",
//         });
//       }


//       /*
//         Existing verified phone
//       */

//       if (
//         phoneUser &&
//         phoneUser._id.toString() !==
//           emailUser?._id?.toString()
//       ) {
//         return res.status(400).json({
//           error:
//             "An account with this phone number already exists.",
//         });
//       }


//       /*
//         Hash password
//       */

//       const salt =
//         await bcrypt.genSalt(10);

//       const hashedPassword =
//         await bcrypt.hash(
//           password,
//           salt
//         );


//       /*
//         Generate OTP
//       */

//       const otp =
//         generateOtp();

//       const otpHash =
//         hashOtp(otp);

//       const otpExpiry =
//         new Date(
//           Date.now() +
//           5 * 60 * 1000
//         );


//       let user;


//       /*
//         Existing unverified account
//       */

//       if (
//         emailUser &&
//         emailUser.phoneVerified === false
//       ) {
//         user = emailUser;

//         user.name = name;
//         user.email = email;
//         user.phone = phone;
//         user.password =
//           hashedPassword;

//         user.phoneVerified = false;

//         user.otp = otpHash;
//         user.otpExpiry =
//           otpExpiry;
//         user.otpPurpose =
//           "signup";
//         user.otpAttempts = 0;

//         await user.save();
//       } else {
//         /*
//           New account
//         */

//         user = await User.create({
//           name,
//           email,
//           phone,
//           password:
//             hashedPassword,

//           emailVerified: false,
//           phoneVerified: false,

//           otp: otpHash,
//           otpExpiry:
//             otpExpiry,
//           otpPurpose:
//             "signup",
//           otpAttempts: 0,
//         });
//       }


//       /*
//         Send email OTP
//       */

//       try {
//         await sendOtpEmail(
//           email,
//           otp,
//           "signup"
//         );
//       } catch (emailError) {
//         console.error(
//           "SIGNUP EMAIL ERROR:",
//           emailError.message
//         );

//         clearOtp(user);

//         await user.save();

//         return res.status(503).json({
//           error:
//             "Unable to send OTP. Please check your Gmail email configuration.",
//         });
//       }


//       return res.json({
//         success: true,
//         requiresOtp: true,
//         userId: user.id,
//         maskedEmail:
//           maskEmail(email),
//         maskedPhone:
//           maskPhone(phone),
//         message:
//           "OTP sent successfully to your email.",
//       });

//     } catch (error) {
//       console.error(
//         "CREATE USER ERROR:",
//         error
//       );

//       if (error.code === 11000) {
//         return res.status(400).json({
//           error:
//             "An account with this email or phone number already exists.",
//         });
//       }

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    VERIFY OTP
//    POST /api/auth/verifyOtp
//    ============================================================ */

// router.post(
//   "/verifyOtp",
//   otpVerifyLimiter,

//   [
//     body("userId")
//       .notEmpty()
//       .withMessage(
//         "User ID is required"
//       ),

//     body("otp")
//       .matches(/^\d{6}$/)
//       .withMessage(
//         "OTP must be exactly 6 digits"
//       ),

//     body("purpose")
//       .isIn([
//         "signup",
//         "forgot-password",
//       ])
//       .withMessage(
//         "Invalid OTP purpose"
//       ),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       const {
//         userId,
//         otp,
//         purpose,
//       } = req.body;


//       const user =
//         await User.findById(
//           userId
//         );


//       if (!user) {
//         return res.status(404).json({
//           error:
//             "User not found.",
//         });
//       }


//       /*
//         OTP exists?
//       */

//       if (
//         !user.otp ||
//         !user.otpExpiry ||
//         !user.otpPurpose
//       ) {
//         return res.status(400).json({
//           error:
//             "No active OTP found. Please request a new OTP.",
//         });
//       }


//       /*
//         Correct purpose?
//       */

//       if (
//         user.otpPurpose !==
//         purpose
//       ) {
//         return res.status(400).json({
//           error:
//             "This OTP is not valid for this request.",
//         });
//       }


//       /*
//         Attempts
//       */

//       if (
//         user.otpAttempts >= 5
//       ) {
//         clearOtp(user);

//         await user.save();

//         return res.status(429).json({
//           error:
//             "Too many incorrect OTP attempts. Please request a new OTP.",
//         });
//       }


//       /*
//         Expiry
//       */

//       if (
//         new Date() >
//         new Date(
//           user.otpExpiry
//         )
//       ) {
//         clearOtp(user);

//         await user.save();

//         return res.status(400).json({
//           error:
//             "OTP has expired. Please request a new OTP.",
//         });
//       }


//       /*
//         Compare OTP
//       */

//       const incomingOtpHash =
//         hashOtp(otp);


//       if (
//         incomingOtpHash !==
//         user.otp
//       ) {
//         user.otpAttempts += 1;

//         await user.save();

//         const remaining =
//           Math.max(
//             0,
//             5 -
//               user.otpAttempts
//           );

//         return res.status(400).json({
//           error:
//             `Incorrect OTP. ${remaining} attempt(s) remaining.`,
//         });
//       }


//       /*
//         SIGNUP
//       */

//       if (
//         purpose === "signup"
//       ) {
//         user.phoneVerified =
//           true;

//         user.emailVerified =
//           true;

//         clearOtp(user);

//         await user.save();


//         await Activity.create({
//           user: user.id,
//           action:
//             "signup_verified",
//           message:
//             "Your email was verified and your iNotebook account was created.",
//         });


//         const authToken =
//           createToken(
//             user.id
//           );


//         return res.json({
//           success: true,
//           authToken,
//           message:
//             "Email verified successfully. Welcome to iNotebook!",
//         });
//       }


//       /*
//         FORGOT PASSWORD
//       */

//       if (
//         purpose ===
//         "forgot-password"
//       ) {
//         clearOtp(user);

//         await user.save();


//         const resetToken =
//           createPasswordResetToken(
//             user.id
//           );


//         return res.json({
//           success: true,
//           resetToken,
//           message:
//             "OTP verified successfully. You can now create a new password.",
//         });
//       }


//       return res.status(400).json({
//         error:
//           "Invalid OTP request.",
//       });

//     } catch (error) {
//       console.error(
//         "VERIFY OTP ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    RESEND OTP
//    POST /api/auth/resendOtp
//    ============================================================ */

// router.post(
//   "/resendOtp",
//   otpSendLimiter,

//   [
//     body("userId")
//       .notEmpty()
//       .withMessage(
//         "User ID is required"
//       ),

//     body("purpose")
//       .isIn([
//         "signup",
//         "forgot-password",
//       ])
//       .withMessage(
//         "Invalid OTP purpose"
//       ),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       const {
//         userId,
//         purpose,
//       } = req.body;


//       const user =
//         await User.findById(
//           userId
//         );


//       if (!user) {
//         return res.status(404).json({
//           error:
//             "User not found.",
//         });
//       }


//       if (
//         purpose === "signup" &&
//         user.emailVerified === true
//       ) {
//         return res.status(400).json({
//           error:
//             "This email is already verified.",
//         });
//       }


//       const otp =
//         generateOtp();

//       const otpHash =
//         hashOtp(otp);

//       const otpExpiry =
//         new Date(
//           Date.now() +
//           5 * 60 * 1000
//         );


//       user.otp =
//         otpHash;

//       user.otpExpiry =
//         otpExpiry;

//       user.otpPurpose =
//         purpose;

//       user.otpAttempts = 0;


//       await user.save();


//       try {
//         await sendOtpEmail(
//           user.email,
//           otp,
//           purpose
//         );
//       } catch (emailError) {
//         console.error(
//           "RESEND OTP EMAIL ERROR:",
//           emailError.message
//         );

//         clearOtp(user);

//         await user.save();

//         return res.status(503).json({
//           error:
//             "Unable to send OTP. Please check your email configuration.",
//         });
//       }


//       return res.json({
//         success: true,
//         maskedEmail:
//           maskEmail(
//             user.email
//           ),
//         message:
//           "A new OTP has been sent to your email.",
//       });

//     } catch (error) {
//       console.error(
//         "RESEND OTP ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    LOGIN
//    POST /api/auth/login

//    Supports:
//    Email
//    OR
//    Phone number
//    ============================================================ */

// router.post(
//   "/login",
//   loginLimiter,

//   [
//     body("password")
//       .exists()
//       .withMessage(
//         "Password cannot be blank"
//       ),

//     body("identifier")
//       .optional()
//       .trim(),

//     body("email")
//       .optional()
//       .trim(),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       /*
//         New frontend:
//         identifier

//         Old frontend:
//         email

//         Both supported.
//       */

//       const identifier = (
//         req.body.identifier ||
//         req.body.email ||
//         ""
//       ).trim();


//       const password =
//         req.body.password;


//       if (!identifier) {
//         return res.status(400).json({
//           error:
//             "Enter your email or phone number.",
//         });
//       }


//       if (!password) {
//         return res.status(400).json({
//           error:
//             "Password cannot be blank.",
//         });
//       }


//       let user = null;


//       /*
//         EMAIL LOGIN
//       */

//       if (
//         isEmail(identifier)
//       ) {
//         user =
//           await User.findOne({
//             email:
//               identifier.toLowerCase(),
//           });
//       }

//       /*
//         PHONE LOGIN
//       */

//       else {
//         const phone =
//           normalizePhone(
//             identifier
//           );

//         if (!phone) {
//           return res.status(400).json({
//             error:
//               "Enter a valid email or Indian phone number.",
//           });
//         }

//         user =
//           await User.findOne({
//             phone,
//           });
//       }


//       if (!user) {
//         return res.status(400).json({
//           error:
//             "Please try to login with correct credentials.",
//         });
//       }


//       /*
//         Password check
//       */

//       const passwordCompare =
//         await bcrypt.compare(
//           password,
//           user.password
//         );


//       if (!passwordCompare) {
//         return res.status(400).json({
//           error:
//             "Please try to login with correct credentials.",
//         });
//       }


//       /*
//         New account must verify email.
//       */

//       if (
//         user.email &&
//         user.emailVerified === false
//       ) {
//         return res.status(403).json({
//           error:
//             "Please verify your email before logging in.",
//           code:
//             "EMAIL_NOT_VERIFIED",
//           userId:
//             user.id,
//           maskedEmail:
//             maskEmail(
//               user.email
//             ),
//         });
//       }


//       /*
//         Create token
//       */

//       const authToken =
//         createToken(
//           user.id
//         );


//       /*
//         Activity
//       */

//       await Activity.create({
//         user: user.id,
//         action: "login",
//         message:
//           "You logged into your iNotebook account.",
//       });


//       return res.json({
//         authToken,
//       });

//     } catch (error) {
//       console.error(
//         "LOGIN ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    FORGOT PASSWORD
//    POST /api/auth/forgotPassword

//    User can enter:
//    Email OR Phone

//    OTP goes to registered email.
//    ============================================================ */

// router.post(
//   "/forgotPassword",
//   otpSendLimiter,

//   [
//     body("identifier")
//       .trim()
//       .notEmpty()
//       .withMessage(
//         "Email or phone number is required"
//       ),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       const identifier =
//         req.body.identifier.trim();


//       let user = null;


//       /*
//         Find by email
//       */

//       if (
//         isEmail(identifier)
//       ) {
//         user =
//           await User.findOne({
//             email:
//               identifier.toLowerCase(),
//           });
//       }

//       /*
//         Find by phone
//       */

//       else {
//         const phone =
//           normalizePhone(
//             identifier
//           );

//         if (!phone) {
//           return res.status(400).json({
//             error:
//               "Enter a valid email or Indian phone number.",
//           });
//         }

//         user =
//           await User.findOne({
//             phone,
//           });
//       }


//       /*
//         Don't reveal account existence
//       */

//       if (!user) {
//         return res.json({
//           success: true,
//           requiresOtp: false,
//           message:
//             "If an account exists with this information, an OTP will be sent to the registered email.",
//         });
//       }


//       /*
//         Email must exist and be verified
//       */

//       if (
//         !user.email ||
//         user.emailVerified !== true
//       ) {
//         return res.json({
//           success: true,
//           requiresOtp: false,
//           message:
//             "If your account has a verified email address, an OTP will be sent.",
//         });
//       }


//       /*
//         Generate OTP
//       */

//       const otp =
//         generateOtp();

//       const otpHash =
//         hashOtp(otp);

//       const otpExpiry =
//         new Date(
//           Date.now() +
//           5 * 60 * 1000
//         );


//       user.otp =
//         otpHash;

//       user.otpExpiry =
//         otpExpiry;

//       user.otpPurpose =
//         "forgot-password";

//       user.otpAttempts = 0;


//       await user.save();


//       /*
//         Send OTP email
//       */

//       try {
//         await sendOtpEmail(
//           user.email,
//           otp,
//           "forgot-password"
//         );
//       } catch (emailError) {
//         console.error(
//           "FORGOT PASSWORD EMAIL ERROR:",
//           emailError.message
//         );

//         clearOtp(user);

//         await user.save();

//         return res.status(503).json({
//           error:
//             "Unable to send OTP right now. Please check your Gmail configuration.",
//         });
//       }


//       return res.json({
//         success: true,
//         requiresOtp: true,
//         userId:
//           user.id,
//         maskedEmail:
//           maskEmail(
//             user.email
//           ),
//         message:
//           "OTP sent successfully to your registered email.",
//       });

//     } catch (error) {
//       console.error(
//         "FORGOT PASSWORD ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    RESET PASSWORD
//    POST /api/auth/ResetPassword
//    ============================================================ */

// router.post(
//   "/ResetPassword",

//   [
//     body("resetToken")
//       .notEmpty()
//       .withMessage(
//         "Password reset token is required"
//       ),

//     body("newPassword")
//       .isLength({ min: 5 })
//       .withMessage(
//         "New password must be at least 5 characters"
//       ),

//     body("confirmPassword")
//       .notEmpty()
//       .withMessage(
//         "Confirm password is required"
//       )
//       .custom((value, { req }) => {
//         if (
//           value !==
//           req.body.newPassword
//         ) {
//           throw new Error(
//             "Passwords do not match"
//           );
//         }

//         return true;
//       }),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       const {
//         resetToken,
//         newPassword,
//       } = req.body;


//       /*
//         Verify reset token
//       */

//       let decoded;

//       try {
//         decoded =
//           jwt.verify(
//             resetToken,
//             process.env.JWT_SECRET
//           );
//       } catch (tokenError) {
//         return res.status(400).json({
//           error:
//             "Password reset session has expired. Please request a new OTP.",
//         });
//       }


//       /*
//         Correct token purpose
//       */

//       if (
//         decoded.purpose !==
//         "password-reset"
//       ) {
//         return res.status(400).json({
//           error:
//             "Invalid password reset token.",
//         });
//       }


//       const user =
//         await User.findById(
//           decoded.user.id
//         );


//       if (!user) {
//         return res.status(404).json({
//           error:
//             "User not found.",
//         });
//       }


//       /*
//         Hash new password
//       */

//       const salt =
//         await bcrypt.genSalt(10);

//       const hashedPassword =
//         await bcrypt.hash(
//           newPassword,
//           salt
//         );


//       user.password =
//         hashedPassword;


//       clearOtp(user);


//       await user.save();


//       /*
//         Activity
//       */

//       await Activity.create({
//         user: user.id,
//         action:
//           "password_reset",
//         message:
//           "Your password was reset successfully.",
//       });


//       return res.json({
//         success: true,
//         message:
//           "Password reset successfully. You can now login with your new password.",
//       });

//     } catch (error) {
//       console.error(
//         "RESET PASSWORD ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    GET USER
//    POST /api/auth/getUser
//    ============================================================ */

// router.post(
//   "/getUser",
//   fetchuser,

//   async (req, res) => {
//     try {
//       const user =
//         await User.findById(
//           req.user.id
//         ).select(
//           "-password -otp -otpExpiry -otpPurpose -otpAttempts"
//         );


//       if (!user) {
//         return res.status(404).json({
//           error:
//             "User not found",
//         });
//       }


//       return res.json(user);

//     } catch (error) {
//       console.error(
//         "GET USER ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    UPDATE PROFILE
//    PUT /api/auth/updateProfile
//    ============================================================ */

// router.put(
//   "/updateProfile",
//   fetchuser,

//   [
//     body("name")
//       .trim()
//       .isLength({ min: 3 })
//       .withMessage(
//         "Name must be at least 3 characters"
//       ),

//     body("email")
//       .trim()
//       .isEmail()
//       .withMessage(
//         "Enter a valid email"
//       ),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       const name =
//         req.body.name.trim();

//       const email =
//         req.body.email
//           .trim()
//           .toLowerCase();


//       const existingUser =
//         await User.findOne({
//           email,
//           _id: {
//             $ne: req.user.id,
//           },
//         });


//       if (existingUser) {
//         return res.status(400).json({
//           error:
//             "This email is already in use",
//         });
//       }


//       const updatedUser =
//         await User.findByIdAndUpdate(
//           req.user.id,
//           {
//             name,
//             email,
//           },
//           {
//             new: true,
//             runValidators: true,
//           }
//         ).select("-password");


//       if (!updatedUser) {
//         return res.status(404).json({
//           error:
//             "User not found",
//         });
//       }


//       await Activity.create({
//         user: req.user.id,
//         action:
//           "profile_updated",
//         message:
//           "Your profile information was updated.",
//       });


//       return res.json(
//         updatedUser
//       );

//     } catch (error) {
//       console.error(
//         "UPDATE PROFILE ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    CHANGE PASSWORD
//    PUT /api/auth/changePassword
//    ============================================================ */

// router.put(
//   "/changePassword",
//   fetchuser,

//   [
//     body("currentPassword")
//       .exists()
//       .withMessage(
//         "Current password is required"
//       ),

//     body("newPassword")
//       .isLength({ min: 5 })
//       .withMessage(
//         "New password must be at least 5 characters"
//       ),
//   ],

//   async (req, res) => {
//     const errors =
//       validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//       });
//     }

//     try {
//       const {
//         currentPassword,
//         newPassword,
//       } = req.body;


//       const user =
//         await User.findById(
//           req.user.id
//         );


//       if (!user) {
//         return res.status(404).json({
//           error:
//             "User not found",
//         });
//       }


//       /*
//         Check current password
//       */

//       const isCorrect =
//         await bcrypt.compare(
//           currentPassword,
//           user.password
//         );


//       if (!isCorrect) {
//         return res.status(400).json({
//           error:
//             "Current password is incorrect",
//         });
//       }


//       /*
//         New password must be different
//       */

//       const samePassword =
//         await bcrypt.compare(
//           newPassword,
//           user.password
//         );


//       if (samePassword) {
//         return res.status(400).json({
//           error:
//             "New password must be different from your current password.",
//         });
//       }


//       /*
//         Hash password
//       */

//       const salt =
//         await bcrypt.genSalt(10);

//       const hashedPassword =
//         await bcrypt.hash(
//           newPassword,
//           salt
//         );


//       user.password =
//         hashedPassword;


//       await user.save();


//       await Activity.create({
//         user: req.user.id,
//         action:
//           "password_changed",
//         message:
//           "Your account password was changed successfully.",
//       });


//       return res.json({
//         success: true,
//         message:
//           "Password changed successfully",
//       });

//     } catch (error) {
//       console.error(
//         "CHANGE PASSWORD ERROR:",
//         error
//       );

//       return res.status(500).json({
//         error:
//           "Internal server error",
//       });
//     }
//   }
// );


// /* ============================================================
//    EXPORT
//    ============================================================ */

// module.exports = router;


const express = require("express");
const router = express.Router();

const {
  body,
  validationResult,
} = require("express-validator");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const User = require("../models/User");
const Activity = require("../models/Activity");
const fetchuser = require("../middleware/fetchuser");

// ============================================================
// ENVIRONMENT
// ============================================================

const JWT_SECRET =
  process.env.JWT_SECRET || "your_super_secret_jwt_key";

// ============================================================
// EMAIL TRANSPORTER
// ============================================================

const createMailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// ============================================================
// RATE LIMITERS
// ============================================================

// Login protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,

  message: {
    error:
      "Too many login attempts. Please try again after 15 minutes.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// OTP sending protection
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  message: {
    error:
      "Too many OTP requests. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// OTP verification protection
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,

  message: {
    error:
      "Too many OTP verification attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// HELPER - CREATE JWT
// ============================================================

const createToken = (userId) => {
  return jwt.sign(
    {
      user: {
        id: userId,
      },
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ============================================================
// HELPER - CREATE PASSWORD RESET TOKEN
// ============================================================

const createPasswordResetToken = (userId) => {
  return jwt.sign(
    {
      user: {
        id: userId,
      },

      purpose: "password-reset",
    },

    JWT_SECRET,

    {
      expiresIn: "10m",
    }
  );
};

// ============================================================
// HELPER - GENERATE OTP
// ============================================================

const generateOtp = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

// ============================================================
// HELPER - HASH OTP
// ============================================================

const hashOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

// ============================================================
// HELPER - NORMALIZE PHONE
// ============================================================

const normalizePhone = (phone) => {
  if (!phone) {
    return null;
  }

  let value = phone
    .toString()
    .trim()
    .replace(/\s+/g, "");

  // Remove hyphens
  value = value.replace(/-/g, "");

  // 9876543210
  if (/^[6-9]\d{9}$/.test(value)) {
    return `+91${value}`;
  }

  // 919876543210
  if (/^91[6-9]\d{9}$/.test(value)) {
    return `+${value}`;
  }

  // +919876543210
  if (/^\+91[6-9]\d{9}$/.test(value)) {
    return value;
  }

  return null;
};

// ============================================================
// HELPER - CHECK EMAIL
// ============================================================

const isEmail = (value) => {
  if (!value) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
};

// ============================================================
// HELPER - MASK EMAIL
// ============================================================

const maskEmail = (email) => {
  if (!email || !email.includes("@")) {
    return "";
  }

  const parts = email.split("@");

  const name = parts[0];
  const domain = parts[1];

  if (name.length <= 2) {
    return `${name.charAt(0)}***@${domain}`;
  }

  return `${name.substring(
    0,
    2
  )}***@${domain}`;
};

// ============================================================
// HELPER - MASK PHONE
// ============================================================

const maskPhone = (phone) => {
  if (!phone) {
    return "";
  }

  const value = phone.toString();

  if (value.length < 4) {
    return "******";
  }

  return `******${value.slice(-4)}`;
};

// ============================================================
// HELPER - CLEAR OTP
// ============================================================

const clearOtp = (user) => {
  user.otp = null;
  user.otpExpiry = null;
  user.otpPurpose = null;
  user.otpAttempts = 0;
};

// ============================================================
// HELPER - SEND OTP EMAIL
// ============================================================

const sendOtpEmail = async ({
  email,
  otp,
  purpose = "signup",
}) => {
  const transporter =
    createMailTransporter();

  const isSignup =
    purpose === "signup";

  const title = isSignup
    ? "Verify your iNotebook account"
    : "Reset your iNotebook password";

  const description = isSignup
    ? "Use the OTP below to verify your email address and activate your iNotebook account."
    : "Use the OTP below to verify your identity and reset your iNotebook password.";

  const subject = isSignup
    ? "Your iNotebook verification OTP"
    : "Your iNotebook password reset OTP";

  await transporter.sendMail({
    from: `"iNotebook" <${process.env.EMAIL_USER}>`,

    to: email,

    subject,

    html: `
      <!DOCTYPE html>

      <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${title}</title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f6f7fb;
          font-family:Arial,Helvetica,sans-serif;
        "
      >

        <div
          style="
            max-width:600px;
            margin:40px auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 40px rgba(0,0,0,0.08);
          "
        >

          <div
            style="
              background:linear-gradient(
                135deg,
                #6366f1,
                #8b7cff
              );
              padding:32px;
              text-align:center;
              color:white;
            "
          >

            <h1
              style="
                margin:0;
                font-size:28px;
              "
            >
              iNotebook
            </h1>

            <p
              style="
                margin:8px 0 0;
                opacity:0.9;
              "
            >
              Your notes. Your workspace.
            </p>

          </div>

          <div
            style="
              padding:40px 32px;
              color:#171725;
            "
          >

            <h2
              style="
                margin-top:0;
                font-size:22px;
              "
            >
              ${title}
            </h2>

            <p
              style="
                color:#646579;
                line-height:1.6;
              "
            >
              ${description}
            </p>

            <div
              style="
                margin:30px 0;
                padding:22px;
                background:#f3f1ff;
                border-radius:16px;
                text-align:center;
              "
            >

              <div
                style="
                  color:#646579;
                  font-size:13px;
                  margin-bottom:8px;
                  text-transform:uppercase;
                  letter-spacing:1px;
                "
              >
                Your OTP
              </div>

              <div
                style="
                  font-size:38px;
                  font-weight:bold;
                  letter-spacing:8px;
                  color:#6366f1;
                "
              >
                ${otp}
              </div>

            </div>

            <p
              style="
                color:#646579;
                font-size:14px;
                line-height:1.6;
              "
            >
              This OTP is valid for
              <strong>10 minutes</strong>.
              Do not share this code with anyone.
            </p>

            <p
              style="
                color:#9698aa;
                font-size:13px;
                margin-top:30px;
              "
            >
              If you did not request this,
              you can safely ignore this email.
            </p>

          </div>

          <div
            style="
              padding:20px 32px;
              background:#fafaff;
              text-align:center;
              color:#9698aa;
              font-size:12px;
            "
          >
            © ${new Date().getFullYear()}
            iNotebook. All rights reserved.
          </div>

        </div>

      </body>
      </html>
    `,
  });
};

// ============================================================
// CREATE USER / SIGNUP
// POST /api/auth/createUser
// ============================================================

router.post(
  "/createUser",

  otpSendLimiter,

  [
    body("name")
      .trim()
      .isLength({ min: 3 })
      .withMessage(
        "Name must be at least 3 characters"
      ),

    body("email")
      .trim()
      .isEmail()
      .withMessage(
        "Please enter a valid email address"
      ),

    body("phone")
      .trim()
      .notEmpty()
      .withMessage(
        "Phone number is required"
      ),

    body("password")
      .isLength({ min: 5 })
      .withMessage(
        "Password must be at least 5 characters"
      ),

    body("confirmPassword")
      .notEmpty()
      .withMessage(
        "Please confirm your password"
      ),
  ],

  async (req, res) => {
    try {
      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      // --------------------------------------------------------
      // GET DATA
      // --------------------------------------------------------

      const name = req.body.name.trim();

      const email = req.body.email
        .trim()
        .toLowerCase();

      const phone = normalizePhone(
        req.body.phone
      );

      const password = req.body.password;

      const confirmPassword =
        req.body.confirmPassword;

      // --------------------------------------------------------
      // PHONE VALIDATION
      // --------------------------------------------------------

      if (!phone) {
        return res.status(400).json({
          error:
            "Please enter a valid Indian phone number.",
        });
      }

      // --------------------------------------------------------
      // PASSWORD MATCH
      // --------------------------------------------------------

      if (password !== confirmPassword) {
        return res.status(400).json({
          error: "Passwords do not match.",
        });
      }

      // --------------------------------------------------------
      // CHECK EMAIL
      // --------------------------------------------------------

      const existingEmail =
        await User.findOne({
          email,
        });

      // --------------------------------------------------------
      // CHECK PHONE
      // --------------------------------------------------------

      const existingPhone =
        await User.findOne({
          phone,
        });

      // --------------------------------------------------------
      // EXISTING VERIFIED EMAIL
      // --------------------------------------------------------

      if (
        existingEmail &&
        existingEmail.emailVerified
      ) {
        return res.status(400).json({
          error:
            "An account with this email already exists.",
        });
      }

      // --------------------------------------------------------
      // EXISTING VERIFIED PHONE
      // --------------------------------------------------------

      if (
        existingPhone &&
        existingPhone.emailVerified
      ) {
        return res.status(400).json({
          error:
            "An account with this phone number already exists.",
        });
      }

      // --------------------------------------------------------
      // PHONE BELONGS TO DIFFERENT ACCOUNT
      // --------------------------------------------------------

      if (
        existingPhone &&
        existingEmail &&
        existingPhone._id.toString() !==
          existingEmail._id.toString()
      ) {
        return res.status(400).json({
          error:
            "This phone number is already associated with another account.",
        });
      }

      // --------------------------------------------------------
      // HASH PASSWORD
      // --------------------------------------------------------

      const salt =
        await bcrypt.genSalt(10);

      const hashedPassword =
        await bcrypt.hash(
          password,
          salt
        );

      // --------------------------------------------------------
      // GENERATE OTP
      // --------------------------------------------------------

      const otp = generateOtp();

      const hashedOtp = hashOtp(otp);

      const otpExpiry = new Date(
        Date.now() + 10 * 60 * 1000
      );

      // --------------------------------------------------------
      // CREATE / UPDATE USER
      // --------------------------------------------------------

      let user;

      if (existingEmail) {
        user = existingEmail;

        user.name = name;
        user.phone = phone;
        user.password = hashedPassword;
        user.otp = hashedOtp;
        user.otpExpiry = otpExpiry;
        user.otpPurpose = "signup";
        user.otpAttempts = 0;
        user.emailVerified = false;
      } else {
        user = new User({
          name,
          email,
          phone,
          password: hashedPassword,

          emailVerified: false,
          phoneVerified: false,

          otp: hashedOtp,
          otpExpiry,

          otpPurpose: "signup",
          otpAttempts: 0,
        });
      }

      await user.save();

      // --------------------------------------------------------
      // SEND EMAIL OTP
      // --------------------------------------------------------

      try {
        await sendOtpEmail({
          email: user.email,
          otp,
          purpose: "signup",
        });
      } catch (emailError) {
        console.error(
          "SEND SIGNUP OTP ERROR:",
          emailError
        );

        clearOtp(user);

        await user.save();

        return res.status(500).json({
          error:
            "Unable to send OTP email. Please check your email configuration.",
        });
      }

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.status(201).json({
        success: true,

        requiresOtp: true,

        message:
          "Account created. OTP sent to your email.",

        userId: user._id,

        email: maskEmail(user.email),

        phone: maskPhone(user.phone),
      });
    } catch (error) {
      console.error(
        "CREATE USER ERROR:",
        error
      );

      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          return res.status(400).json({
            error:
              "This email address is already registered.",
          });
        }

        if (error.keyPattern?.phone) {
          return res.status(400).json({
            error:
              "This phone number is already registered.",
          });
        }
      }

      return res.status(500).json({
        error: "Internal server error",
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
    body("userId")
      .notEmpty()
      .withMessage("User ID is required"),

    body("otp")
      .trim()
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage(
        "OTP must be a 6-digit number"
      ),

    body("purpose")
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
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const {
        userId,
        otp,
        purpose,
      } = req.body;

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      // --------------------------------------------------------
      // OTP EXISTS
      // --------------------------------------------------------

      if (
        !user.otp ||
        !user.otpExpiry ||
        !user.otpPurpose
      ) {
        return res.status(400).json({
          error:
            "No active OTP found. Please request a new OTP.",
        });
      }

      // --------------------------------------------------------
      // OTP PURPOSE
      // --------------------------------------------------------

      if (user.otpPurpose !== purpose) {
        return res.status(400).json({
          error:
            "This OTP is not valid for this action.",
        });
      }

      // --------------------------------------------------------
      // MAX ATTEMPTS
      // --------------------------------------------------------

      if (user.otpAttempts >= 5) {
        clearOtp(user);

        await user.save();

        return res.status(400).json({
          error:
            "Too many incorrect OTP attempts. Please request a new OTP.",
        });
      }

      // --------------------------------------------------------
      // OTP EXPIRY
      // --------------------------------------------------------

      if (
        new Date() >
        new Date(user.otpExpiry)
      ) {
        clearOtp(user);

        await user.save();

        return res.status(400).json({
          error:
            "OTP has expired. Please request a new OTP.",
        });
      }

      // --------------------------------------------------------
      // CHECK OTP
      // --------------------------------------------------------

      const hashedInputOtp =
        hashOtp(otp);

      if (
        hashedInputOtp !== user.otp
      ) {
        user.otpAttempts += 1;

        await user.save();

        return res.status(400).json({
          error:
            "Incorrect OTP. Please try again.",
          attemptsRemaining:
            Math.max(
              0,
              5 - user.otpAttempts
            ),
        });
      }

      // --------------------------------------------------------
      // SIGNUP OTP
      // --------------------------------------------------------

      if (purpose === "signup") {
        user.emailVerified = true;

        /*
         * Current application uses email OTP as the
         * signup verification mechanism.
         *
         * We keep phoneVerified true here so the
         * existing phone-login/signup flow remains
         * compatible with your current system.
         */

        user.phoneVerified = true;

        clearOtp(user);

        await user.save();

        // ------------------------------------------------------
        // ACTIVITY
        // ------------------------------------------------------

        await Activity.create({
          user: user._id,

          action: "signup",

          message:
            "Created and verified iNotebook account",

          date: new Date(),
        });

        // ------------------------------------------------------
        // JWT
        // ------------------------------------------------------

        const authToken =
          createToken(user._id);

        return res.json({
          success: true,

          message:
            "Account verified successfully.",

          authToken,

          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
          },
        });
      }

      // --------------------------------------------------------
      // FORGOT PASSWORD OTP
      // --------------------------------------------------------

      if (
        purpose ===
        "forgot-password"
      ) {
        clearOtp(user);

        await user.save();

        const resetToken =
          createPasswordResetToken(
            user._id
          );

        return res.json({
          success: true,

          message:
            "OTP verified successfully.",

          resetToken,
        });
      }

      return res.status(400).json({
        error: "Invalid OTP purpose.",
      });
    } catch (error) {
      console.error(
        "VERIFY OTP ERROR:",
        error
      );

      return res.status(500).json({
        error: "Internal server error",
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
    body("userId")
      .notEmpty()
      .withMessage("User ID is required"),

    body("purpose")
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
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const {
        userId,
        purpose,
      } = req.body;

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      // --------------------------------------------------------
      // FORGOT PASSWORD MUST HAVE VERIFIED EMAIL
      // --------------------------------------------------------

      if (
        purpose ===
          "forgot-password" &&
        !user.emailVerified
      ) {
        return res.status(400).json({
          error:
            "Your email is not verified.",
        });
      }

      // --------------------------------------------------------
      // GENERATE NEW OTP
      // --------------------------------------------------------

      const otp = generateOtp();

      const hashedOtp = hashOtp(otp);

      user.otp = hashedOtp;

      user.otpExpiry = new Date(
        Date.now() + 10 * 60 * 1000
      );

      user.otpPurpose = purpose;

      user.otpAttempts = 0;

      await user.save();

      // --------------------------------------------------------
      // SEND EMAIL
      // --------------------------------------------------------

      try {
        await sendOtpEmail({
          email: user.email,
          otp,
          purpose,
        });
      } catch (emailError) {
        console.error(
          "RESEND OTP EMAIL ERROR:",
          emailError
        );

        clearOtp(user);

        await user.save();

        return res.status(500).json({
          error:
            "Unable to send OTP email.",
        });
      }

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        success: true,

        message:
          "A new OTP has been sent to your email.",

        email: maskEmail(
          user.email
        ),
      });
    } catch (error) {
      console.error(
        "RESEND OTP ERROR:",
        error
      );

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// LOGIN
// POST /api/auth/login
// Supports Email OR Phone
// ============================================================

router.post(
  "/login",

  loginLimiter,

  [
    body("identifier")
      .optional()
      .trim(),

    body("email")
      .optional()
      .trim(),

    body("password")
      .notEmpty()
      .withMessage(
        "Password is required"
      ),
  ],

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      // --------------------------------------------------------
      // SUPPORT BOTH identifier AND OLD email FIELD
      // --------------------------------------------------------

      const identifier =
        (
          req.body.identifier ||
          req.body.email ||
          ""
        )
          .trim();

      const password =
        req.body.password;

      if (!identifier) {
        return res.status(400).json({
          error:
            "Email or phone number is required.",
        });
      }

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      let user;

      if (isEmail(identifier)) {
        user = await User.findOne({
          email: identifier.toLowerCase(),
        });
      } else {
        const phone =
          normalizePhone(identifier);

        if (!phone) {
          return res.status(400).json({
            error:
              "Please enter a valid email or Indian phone number.",
          });
        }

        user = await User.findOne({
          phone,
        });
      }

      // --------------------------------------------------------
      // USER NOT FOUND
      // --------------------------------------------------------

      if (!user) {
        return res.status(401).json({
          error:
            "Invalid email/phone or password.",
        });
      }

      // --------------------------------------------------------
      // PASSWORD
      // --------------------------------------------------------

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          error:
            "Invalid email/phone or password.",
        });
      }

      // --------------------------------------------------------
      // EMAIL VERIFICATION
      // --------------------------------------------------------

      if (!user.emailVerified) {
        return res.status(403).json({
          error:
            "Please verify your email with OTP before logging in.",

          requiresVerification: true,

          userId: user._id,

          email: maskEmail(
            user.email
          ),
        });
      }

      // --------------------------------------------------------
      // CREATE TOKEN
      // --------------------------------------------------------

      const authToken =
        createToken(user._id);

      // --------------------------------------------------------
      // ACTIVITY
      // --------------------------------------------------------

      await Activity.create({
        user: user._id,

        action: "login",

        message:
          "Logged into iNotebook",

        date: new Date(),
      });

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        success: true,

        authToken,

        message: "Login successful.",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
        },
      });
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// FORGOT PASSWORD
// POST /api/auth/forgotPassword
// Supports Email OR Phone
// ============================================================

router.post(
  "/forgotPassword",

  otpSendLimiter,

  [
    body("identifier")
      .trim()
      .notEmpty()
      .withMessage(
        "Email or phone number is required"
      ),
  ],

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const identifier =
        req.body.identifier.trim();

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      let user;

      if (isEmail(identifier)) {
        user = await User.findOne({
          email:
            identifier.toLowerCase(),
        });
      } else {
        const phone =
          normalizePhone(identifier);

        if (!phone) {
          return res.status(400).json({
            error:
              "Please enter a valid email or Indian phone number.",
          });
        }

        user = await User.findOne({
          phone,
        });
      }

      // --------------------------------------------------------
      // USER NOT FOUND
      // --------------------------------------------------------

      if (!user) {
        return res.status(404).json({
          error:
            "No account found with these details.",
        });
      }

      // --------------------------------------------------------
      // EMAIL MUST BE VERIFIED
      // --------------------------------------------------------

      if (!user.emailVerified) {
        return res.status(400).json({
          error:
            "Please verify your account before resetting the password.",
        });
      }

      // --------------------------------------------------------
      // GENERATE OTP
      // --------------------------------------------------------

      const otp = generateOtp();

      const hashedOtp = hashOtp(otp);

      user.otp = hashedOtp;

      user.otpExpiry = new Date(
        Date.now() + 10 * 60 * 1000
      );

      user.otpPurpose =
        "forgot-password";

      user.otpAttempts = 0;

      await user.save();

      // --------------------------------------------------------
      // SEND OTP
      // --------------------------------------------------------

      try {
        await sendOtpEmail({
          email: user.email,
          otp,
          purpose:
            "forgot-password",
        });
      } catch (emailError) {
        console.error(
          "FORGOT PASSWORD EMAIL ERROR:",
          emailError
        );

        clearOtp(user);

        await user.save();

        return res.status(500).json({
          error:
            "Unable to send OTP email.",
        });
      }

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        success: true,

        requiresOtp: true,

        message:
          "OTP sent to your registered email.",

        userId: user._id,

        email: maskEmail(
          user.email
        ),

        phone: maskPhone(
          user.phone
        ),
      });
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// RESET PASSWORD
// POST /api/auth/ResetPassword
// ============================================================

router.post(
  "/ResetPassword",

  [
    body("resetToken")
      .notEmpty()
      .withMessage(
        "Reset token is required"
      ),

    body("newPassword")
      .isLength({ min: 5 })
      .withMessage(
        "Password must be at least 5 characters"
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
          errors: errors.array(),
        });
      }

      const {
        resetToken,
        newPassword,
        confirmPassword,
      } = req.body;

      // --------------------------------------------------------
      // PASSWORD MATCH
      // --------------------------------------------------------

      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          error:
            "Passwords do not match.",
        });
      }

      // --------------------------------------------------------
      // VERIFY RESET TOKEN
      // --------------------------------------------------------

      let decoded;

      try {
        decoded =
          jwt.verify(
            resetToken,
            JWT_SECRET
          );
      } catch (tokenError) {
        return res.status(400).json({
          error:
            "Password reset session has expired. Please request a new OTP.",
        });
      }

      // --------------------------------------------------------
      // CHECK TOKEN PURPOSE
      // --------------------------------------------------------

      if (
        decoded.purpose !==
        "password-reset"
      ) {
        return res.status(400).json({
          error:
            "Invalid password reset token.",
        });
      }

      const userId =
        decoded.user?.id;

      if (!userId) {
        return res.status(400).json({
          error:
            "Invalid password reset token.",
        });
      }

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      // --------------------------------------------------------
      // HASH NEW PASSWORD
      // --------------------------------------------------------

      const salt =
        await bcrypt.genSalt(10);

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          salt
        );

      user.password =
        hashedPassword;

      clearOtp(user);

      await user.save();

      // --------------------------------------------------------
      // ACTIVITY
      // --------------------------------------------------------

      await Activity.create({
        user: user._id,

        action: "password-reset",

        message:
          "Reset account password",

        date: new Date(),
      });

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        success: true,

        message:
          "Password reset successfully.",
      });
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// GET USER
// POST /api/auth/getUser
// Login required
// ============================================================

router.post(
  "/getUser",
  fetchuser,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        ).select(
          "-password -otp -otpExpiry -otpAttempts"
        );

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      return res.json(user);
    } catch (error) {
      console.error(
        "GET USER ERROR:",
        error
      );

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// UPDATE PROFILE
// PUT /api/auth/updateProfile
// Login required
// ============================================================

router.put(
  "/updateProfile",

  fetchuser,

  [
    body("name")
      .trim()
      .isLength({ min: 3 })
      .withMessage(
        "Name must be at least 3 characters"
      ),

    body("email")
      .trim()
      .isEmail()
      .withMessage(
        "Please enter a valid email"
      ),

    body("phone")
      .optional({ checkFalsy: true })
      .trim(),
  ],

  async (req, res) => {
    try {
      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const userId =
        req.user.id;

      // --------------------------------------------------------
      // CURRENT USER
      // --------------------------------------------------------

      const currentUser =
        await User.findById(userId);

      if (!currentUser) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      // --------------------------------------------------------
      // DATA
      // --------------------------------------------------------

      const name =
        req.body.name.trim();

      const email =
        req.body.email
          .trim()
          .toLowerCase();

      let phone =
        req.body.phone
          ? req.body.phone.trim()
          : currentUser.phone || null;

      // --------------------------------------------------------
      // NAME
      // --------------------------------------------------------

      if (!name) {
        return res.status(400).json({
          error:
            "Name cannot be empty.",
        });
      }

      if (name.length < 3) {
        return res.status(400).json({
          error:
            "Name must be at least 3 characters.",
        });
      }

      // --------------------------------------------------------
      // EMAIL
      // --------------------------------------------------------

      if (!email) {
        return res.status(400).json({
          error:
            "Email cannot be empty.",
        });
      }

      // --------------------------------------------------------
      // PHONE
      // --------------------------------------------------------

      if (phone) {
        phone =
          normalizePhone(phone);

        if (!phone) {
          return res.status(400).json({
            error:
              "Please enter a valid Indian phone number.",
          });
        }
      }

      // --------------------------------------------------------
      // DUPLICATE EMAIL
      // --------------------------------------------------------

      const existingEmailUser =
        await User.findOne({
          email,

          _id: {
            $ne: userId,
          },
        });

      if (existingEmailUser) {
        return res.status(400).json({
          error:
            "This email address is already registered with another account.",
        });
      }

      // --------------------------------------------------------
      // DUPLICATE PHONE
      // --------------------------------------------------------

      if (phone) {
        const existingPhoneUser =
          await User.findOne({
            phone,

            _id: {
              $ne: userId,
            },
          });

        if (existingPhoneUser) {
          return res.status(400).json({
            error:
              "This phone number is already registered with another account.",
          });
        }
      }

      // --------------------------------------------------------
      // CHECK EMAIL CHANGE
      // --------------------------------------------------------

      const emailChanged =
        currentUser.email !==
        email;

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      currentUser.name = name;

      currentUser.email = email;

      currentUser.phone = phone;

      /*
       * We intentionally keep the current
       * emailVerified state here so the
       * existing application flow doesn't
       * suddenly log users out after editing
       * their profile.
       */

      await currentUser.save();

      // --------------------------------------------------------
      // ACTIVITY
      // --------------------------------------------------------

      await Activity.create({
        user: userId,

        action: "profile-updated",

        message: emailChanged
          ? "Updated profile information and email address"
          : "Updated profile information",

        date: new Date(),
      });

      // --------------------------------------------------------
      // GET UPDATED USER
      // --------------------------------------------------------

      const updatedUser =
        await User.findById(
          userId
        ).select(
          "-password -otp -otpExpiry -otpAttempts"
        );

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        success: true,

        message:
          "Profile updated successfully.",

        name:
          updatedUser.name,

        email:
          updatedUser.email,

        phone:
          updatedUser.phone || "",

        user: updatedUser,
      });
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      // --------------------------------------------------------
      // DUPLICATE KEY
      // --------------------------------------------------------

      if (error.code === 11000) {
        if (
          error.keyPattern?.email
        ) {
          return res.status(400).json({
            error:
              "This email address is already registered.",
          });
        }

        if (
          error.keyPattern?.phone
        ) {
          return res.status(400).json({
            error:
              "This phone number is already registered.",
          });
        }
      }

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// CHANGE PASSWORD
// PUT /api/auth/changePassword
// Login required
// ============================================================

router.put(
  "/changePassword",

  fetchuser,

  [
    body("currentPassword")
      .notEmpty()
      .withMessage(
        "Current password is required"
      ),

    body("newPassword")
      .isLength({ min: 5 })
      .withMessage(
        "New password must be at least 5 characters"
      ),

    body("confirmPassword")
      .notEmpty()
      .withMessage(
        "Please confirm your new password"
      ),
  ],

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      // --------------------------------------------------------
      // MATCH
      // --------------------------------------------------------

      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          error:
            "New passwords do not match.",
        });
      }

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      // --------------------------------------------------------
      // CURRENT PASSWORD
      // --------------------------------------------------------

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!passwordMatch) {
        return res.status(400).json({
          error:
            "Current password is incorrect.",
        });
      }

      // --------------------------------------------------------
      // SAME PASSWORD
      // --------------------------------------------------------

      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );

      if (samePassword) {
        return res.status(400).json({
          error:
            "New password must be different from your current password.",
        });
      }

      // --------------------------------------------------------
      // HASH NEW PASSWORD
      // --------------------------------------------------------

      const salt =
        await bcrypt.genSalt(10);

      user.password =
        await bcrypt.hash(
          newPassword,
          salt
        );

      await user.save();

      // --------------------------------------------------------
      // ACTIVITY
      // --------------------------------------------------------

      await Activity.create({
        user: user._id,

        action: "password-changed",

        message:
          "Changed account password",

        date: new Date(),
      });

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        success: true,

        message:
          "Password changed successfully.",
      });
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;