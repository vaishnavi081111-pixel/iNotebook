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
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    // Force IPv4 on Render
    family: 4,

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
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

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

  return `${name.substring(0, 2)}***@${domain}`;
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
  const transporter = createMailTransporter();

  const isSignup = purpose === "signup";

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
      .isLength({
        min: 6,
        max: 6,
      })
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
      const errors =
        validationResult(req);

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
      const errors =
        validationResult(req);

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

      const hashedOtp =
        hashOtp(otp);

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
      const errors =
        validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      // --------------------------------------------------------
      // SUPPORT BOTH identifier AND OLD email FIELD
      // --------------------------------------------------------

      const identifier = (
        req.body.identifier ||
        req.body.email ||
        ""
      ).trim();

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
        user =
          await User.findOne({
            email:
              identifier.toLowerCase(),
          });
      } else {
        const phone =
          normalizePhone(
            identifier
          );

        if (!phone) {
          return res.status(400).json({
            error:
              "Please enter a valid email or Indian phone number.",
          });
        }

        user =
          await User.findOne({
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
        message:
          "Login successful.",

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
      const errors =
        validationResult(req);

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
        user =
          await User.findOne({
            email:
              identifier.toLowerCase(),
          });
      } else {
        const phone =
          normalizePhone(
            identifier
          );

        if (!phone) {
          return res.status(400).json({
            error:
              "Please enter a valid email or Indian phone number.",
          });
        }

        user =
          await User.findOne({
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

      const hashedOtp =
        hashOtp(otp);

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
      const errors =
        validationResult(req);

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

      const errors =
        validationResult(req);

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
      const errors =
        validationResult(req);

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