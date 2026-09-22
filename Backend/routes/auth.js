const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
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
// RATE LIMITERS
// ============================================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        success: false,
        error: "Too many login attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: "Too many OTP requests. Please try again later.",
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

// Hash OTP / reset token
const hashOtp = (value) => {
    return crypto
        .createHash("sha256")
        .update(value)
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
    user.otpHash = null;
    user.otpExpires = null;
    user.otpPurpose = null;
    user.otpAttempts = 0;
};

// ============================================================
// BREVO EMAIL FUNCTION
// ============================================================

const sendOtpEmail = async ({
    email,
    otp,
    purpose = "signup",
}) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            throw new Error(
                "Brevo API configuration is missing"
            );
        }

        if (!process.env.GMAIL_USER) {
            throw new Error(
                "Sender email configuration is missing"
            );
        }

        let subject = "iNotebook - Verify your email";

        if (purpose === "forgot-password") {
            subject = "iNotebook - Password Reset OTP";
        }

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2 style="color: #6366f1;">iNotebook.</h2>

                <p>Your OTP is:</p>

                <div style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #4f46e5;
                    margin: 20px 0;
                ">
                    ${otp}
                </div>

                <p>
                    This OTP is valid for
                    <strong>10 minutes</strong>.
                </p>

                <p>
                    If you did not request this OTP,
                    please ignore this email.
                </p>

                <hr>

                <p style="color: #777; font-size: 12px;">
                    This is an automated email from iNotebook.
                </p>
            </div>
        `;

        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",

                headers: {
                    accept: "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json",
                },

                body: JSON.stringify({
                    sender: {
                        name: "iNotebook.",
                        email: process.env.GMAIL_USER,
                    },

                    to: [
                        {
                            email: email,
                        },
                    ],

                    subject,
                    htmlContent,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(
                "BREVO EMAIL ERROR:",
                data
            );

            throw new Error(
                data.message ||
                "Brevo email sending failed"
            );
        }

        console.log(
            "BREVO EMAIL SENT SUCCESSFULLY:",
            data.messageId
        );

        return data;

    } catch (error) {
        console.error(
            "BREVO OTP EMAIL ERROR:",
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

            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

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
            // PASSWORD CONFIRMATION
            // ------------------------------------------------

            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: "Passwords do not match",
                });
            }

            // ------------------------------------------------
            // NORMALIZE EMAIL + PHONE
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
            // CHECK EXISTING EMAIL
            // ------------------------------------------------

            let user = await User.findOne({
                email: normalizedEmail,
            });

            if (user && user.emailVerified) {
                return res.status(400).json({
                    success: false,
                    error:
                        "An account with this email already exists",
                });
            }

            // ------------------------------------------------
            // CHECK EXISTING PHONE
            // ------------------------------------------------

            const phoneUser = await User.findOne({
                phone: normalizedPhone,
            });

            if (
                phoneUser &&
                (
                    !user ||
                    phoneUser._id.toString() !==
                    user._id.toString()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "This phone number is already registered.",
                });
            }

            // ------------------------------------------------
            // GENERATE OTP
            // ------------------------------------------------

            const otp = generateOtp();

            const otpHash = hashOtp(otp);

            const otpExpires = new Date(
                Date.now() + 10 * 60 * 1000
            );

            // ------------------------------------------------
            // HASH PASSWORD
            // ------------------------------------------------

            const salt = await bcrypt.genSalt(10);

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    salt
                );

            // ------------------------------------------------
            // CREATE OR UPDATE UNVERIFIED USER
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
            // SAVE USER + OTP DEBUG
            // ------------------------------------------------

            try {

                console.log(
                    "OTP BEFORE SAVE DEBUG:",
                    {
                        email: user.email,

                        userId:
                            user._id.toString(),

                        otpHashExists:
                            !!user.otpHash,

                        otpHashLength:
                            user.otpHash
                                ? user.otpHash.length
                                : 0,

                        otpExpires:
                            user.otpExpires,

                        otpPurpose:
                            user.otpPurpose,

                        otpAttempts:
                            user.otpAttempts,
                    }
                );

                await user.save();

                console.log(
                    "OTP AFTER SAVE DEBUG:",
                    {
                        email: user.email,

                        userId:
                            user._id.toString(),

                        otpHashExists:
                            !!user.otpHash,

                        otpHashLength:
                            user.otpHash
                                ? user.otpHash.length
                                : 0,

                        otpExpires:
                            user.otpExpires,

                        otpPurpose:
                            user.otpPurpose,

                        otpAttempts:
                            user.otpAttempts,
                    }
                );

                // ------------------------------------------------
                // MONGOOSE DATABASE CHECK
                // ------------------------------------------------

                const dbUser =
                    await User.findById(
                        user._id
                    ).lean();

                console.log(
                    "OTP DIRECT DB CHECK:",
                    {
                        email:
                            dbUser
                                ? dbUser.email
                                : null,

                        userId:
                            dbUser
                                ? dbUser._id.toString()
                                : null,

                        otpHashExists:
                            dbUser
                                ? !!dbUser.otpHash
                                : false,

                        otpHashLength:
                            dbUser &&
                            dbUser.otpHash
                                ? dbUser.otpHash.length
                                : 0,

                        otpExpires:
                            dbUser
                                ? dbUser.otpExpires
                                : null,

                        otpPurpose:
                            dbUser
                                ? dbUser.otpPurpose
                                : null,

                        otpAttempts:
                            dbUser
                                ? dbUser.otpAttempts
                                : null,
                    }
                );

                // ------------------------------------------------
                // RAW MONGODB CHECK
                // ------------------------------------------------

                const rawDbUser =
                    await User.collection.findOne({
                        _id: user._id,
                    });

                console.log(
                    "OTP RAW MONGODB CHECK:",
                    {
                        email:
                            rawDbUser
                                ? rawDbUser.email
                                : null,

                        userId:
                            rawDbUser
                                ? rawDbUser._id.toString()
                                : null,

                        otpHashExists:
                            rawDbUser
                                ? !!rawDbUser.otpHash
                                : false,

                        otpHashLength:
                            rawDbUser &&
                            rawDbUser.otpHash
                                ? rawDbUser.otpHash.length
                                : 0,

                        otpExpires:
                            rawDbUser
                                ? rawDbUser.otpExpires
                                : null,

                        otpPurpose:
                            rawDbUser
                                ? rawDbUser.otpPurpose
                                : null,

                        otpAttempts:
                            rawDbUser
                                ? rawDbUser.otpAttempts
                                : null,
                    }
                );

            } catch (saveError) {

                // Duplicate email / phone

                if (saveError.code === 11000) {

                    const duplicateField =
                        Object.keys(
                            saveError.keyPattern || {}
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
            // SEND OTP USING BREVO
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
            // SUCCESS
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

            if (error.code === 11000) {

                const duplicateField =
                    Object.keys(
                        error.keyPattern || {}
                    )[0];

                return res.status(400).json({
                    success: false,

                    error:
                        duplicateField === "phone"
                            ? "This phone number is already registered."
                            : duplicateField === "email"
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

            // ------------------------------------------------
            // DEBUG
            // ------------------------------------------------

            console.log(
                "OTP VERIFY DEBUG:",
                {
                    email: normalizedEmail,

                    userFound:
                        !!user,

                    userId:
                        user
                            ? user._id.toString()
                            : null,

                    otpHashExists:
                        user
                            ? !!user.otpHash
                            : false,

                    otpHashLength:
                        user &&
                        user.otpHash
                            ? user.otpHash.length
                            : 0,

                    otpExpires:
                        user
                            ? user.otpExpires
                            : null,

                    otpPurpose:
                        user
                            ? user.otpPurpose
                            : null,

                    otpAttempts:
                        user
                            ? user.otpAttempts
                            : null,
                }
            );

            // ------------------------------------------------
            // USER CHECK
            // ------------------------------------------------

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error:
                        "User not found",
                });
            }

            // ------------------------------------------------
            // OTP EXISTS
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
            // OTP PURPOSE
            // ------------------------------------------------

            if (
                user.otpPurpose !==
                purpose
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid OTP purpose.",
                });
            }

            // ------------------------------------------------
            // OTP EXPIRY
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
            // OTP ATTEMPTS
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
            // COMPARE OTP
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
            // OTP VERIFIED - SIGNUP
            // ------------------------------------------------

            if (
                purpose === "signup"
            ) {

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
            // OTP VERIFIED - FORGOT PASSWORD
            // ------------------------------------------------

            if (
                purpose ===
                "forgot-password"
            ) {

                const resetToken =
                    createPasswordResetToken();

                user.passwordResetToken =
                    hashOtp(resetToken);

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

                    resetToken,
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
            // GENERATE NEW OTP
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
                purpose;

            user.otpAttempts = 0;

            await user.save();

            console.log(
                "RESEND OTP SAVED DEBUG:",
                {
                    email:
                        user.email,

                    userId:
                        user._id.toString(),

                    otpHashExists:
                        !!user.otpHash,

                    otpHashLength:
                        user.otpHash
                            ? user.otpHash.length
                            : 0,

                    otpExpires:
                        user.otpExpires,

                    otpPurpose:
                        user.otpPurpose,
                }
            );

            // ------------------------------------------------
            // SEND OTP
            // ------------------------------------------------

            try {

                await sendOtpEmail({
                    email:
                        normalizedEmail,

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

            if (!user.emailVerified) {
                return res.status(403).json({
                    success: false,
                    requiresVerification: true,
                    error:
                        "Please verify your email before login.",
                });
            }

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

            const token =
                createToken(user._id);

            try {

                await Activity.create({
                    user: user._id,
                    action: "login",
                    message:
                        "User logged in",
                });

            } catch (activityError) {

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

            const { email } =
                req.body;

            const normalizedEmail =
                email.toLowerCase().trim();

            const user =
                await User.findOne({
                    email: normalizedEmail,
                });

            if (!user) {
                return res.status(200).json({
                    success: true,
                    message:
                        "If an account exists with this email, an OTP has been sent.",
                });
            }

            // ------------------------------------------------
            // GENERATE OTP
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

            console.log(
                "FORGOT PASSWORD OTP SAVED DEBUG:",
                {
                    email:
                        user.email,

                    userId:
                        user._id.toString(),

                    otpHashExists:
                        !!user.otpHash,

                    otpHashLength:
                        user.otpHash
                            ? user.otpHash.length
                            : 0,

                    otpExpires:
                        user.otpExpires,

                    otpPurpose:
                        user.otpPurpose,
                }
            );

            // ------------------------------------------------
            // SEND OTP
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
                hashOtp(resetToken);

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

            const salt =
                await bcrypt.genSalt(10);

            user.password =
                await bcrypt.hash(
                    newPassword,
                    salt
                );

            user.passwordResetToken =
                null;

            user.passwordResetExpires =
                null;

            await user.save();

            try {

                await Activity.create({
                    user: user._id,

                    action:
                        "password_reset",

                    message:
                        "Password reset successfully",
                });

            } catch (activityError) {

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

            } catch (activityError) {

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

            try {

                await Activity.deleteMany({
                    user: user._id,
                });

            } catch (activityError) {

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

                    action: "logout",

                    message:
                        "User logged out",
                });

            } catch (activityError) {

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