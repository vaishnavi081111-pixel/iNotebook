import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";

const Signup = ({ showAlert }) => {
  const history = useHistory();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    cpassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    /* =========================
       FRONTEND VALIDATION
       ========================= */

    if (name.length < 3) {
      showAlert(
        "Name must be at least 3 characters.",
        "danger"
      );
      return;
    }

    if (!email) {
      showAlert(
        "Please enter your email address.",
        "danger"
      );
      return;
    }

    if (!phone) {
      showAlert(
        "Please enter your phone number.",
        "danger"
      );
      return;
    }

    // Indian phone number validation
    const phoneDigits = phone.replace(/\D/g, "");

    let validPhone = false;

    if (phoneDigits.length === 10) {
      validPhone = true;
    }

    if (
      phoneDigits.length === 12 &&
      phoneDigits.startsWith("91")
    ) {
      validPhone = true;
    }

    if (!validPhone) {
      showAlert(
        "Please enter a valid 10-digit Indian phone number.",
        "danger"
      );
      return;
    }

    if (formData.password.length < 6) {
      showAlert(
        "Password must be at least 6 characters.",
        "danger"
      );
      return;
    }

    if (formData.password !== formData.cpassword) {
      showAlert(
        "Passwords do not match.",
        "danger"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://inotebook-dw4s.onrender.com/api/auth/createUser",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            phone,
            password: formData.password,
            confirmPassword: formData.cpassword,
          }),
        }
      );

      const json = await response.json();

      console.log("SIGNUP RESPONSE:", json);

      if (response.ok) {
        showAlert(
          "OTP sent to your email. Please verify your account.",
          "success"
        );

        /*
         * IMPORTANT:
         * Backend verifyOtp expects EMAIL.
         *
         * DO NOT use userId here.
         */

        history.push(
          `/verify-otp?email=${encodeURIComponent(
            email
          )}&purpose=signup`
        );
      } else {
        showAlert(
          json.error ||
            json.message ||
            json.errors?.[0]?.msg ||
            "Unable to create account.",
          "danger"
        );
      }
    } catch (error) {
      console.error("SIGNUP ERROR:", error);

      showAlert(
        "Unable to connect to server. Please make sure the backend is running.",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-background">
        <div className="auth-glow auth-glow-one"></div>
        <div className="auth-glow auth-glow-two"></div>
      </div>

      <div className="auth-container">

        <div className="auth-card signup-card">

          {/* HEADER */}

          <div className="auth-header">

            <div className="auth-icon">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>

            <span className="section-eyebrow">
              GET STARTED
            </span>

            <h1>Create your workspace</h1>

            <p>
              Start capturing ideas, managing notes and
              working smarter with iNotebook.
            </p>

          </div>

          {/* SIGNUP FORM */}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* NAME */}

            <div className="form-group">

              <label htmlFor="signup-name">
                Full name
              </label>

              <div className="input-wrapper">

                <i className="fa-regular fa-user"></i>

                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="signup-email">
                Email address
              </label>

              <div className="input-wrapper">

                <i className="fa-regular fa-envelope"></i>

                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

              </div>

              <span className="form-hint">
                OTP will be sent to this email.
              </span>

            </div>

            {/* PHONE */}

            <div className="form-group">

              <label htmlFor="signup-phone">
                Phone number
              </label>

              <div className="input-wrapper">

                <i className="fa-solid fa-phone"></i>

                <input
                  id="signup-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  autoComplete="tel"
                  maxLength="13"
                  required
                />

              </div>

              <span className="form-hint">
                Enter your 10-digit Indian phone number.
              </span>

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="input-wrapper">

                <i className="fa-solid fa-lock"></i>

                <input
                  id="signup-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <i
                    className={
                      showPassword
                        ? "fa-regular fa-eye-slash"
                        : "fa-regular fa-eye"
                    }
                  ></i>
                </button>

              </div>

              <span className="form-hint">
                Use at least 6 characters.
              </span>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="signup-confirm-password">
                Confirm password
              </label>

              <div className="input-wrapper">

                <i className="fa-solid fa-shield-halved"></i>

                <input
                  id="signup-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="cpassword"
                  value={formData.cpassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <i
                    className={
                      showConfirmPassword
                        ? "fa-regular fa-eye-slash"
                        : "fa-regular fa-eye"
                    }
                  ></i>
                </button>

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  Sending OTP...
                </>
              ) : (
                <>
                  Create account
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}

            </button>

          </form>

          {/* DIVIDER */}

          <div className="auth-divider">
            <span>
              your ideas, organized
            </span>
          </div>

          {/* FOOTER */}

          <div className="auth-footer">

            <p>
              Already have an account?
              <Link to="/login">
                {" "}
                Sign in
              </Link>
            </p>

          </div>

        </div>

        {/* TRUST BADGES */}

        <div className="auth-trust">

          <span>
            <i className="fa-solid fa-shield-halved"></i>
            Secure account
          </span>

          <span>
            <i className="fa-solid fa-sparkles"></i>
            AI-powered workspace
          </span>

          <span>
            <i className="fa-solid fa-cloud"></i>
            Your notes, your space
          </span>

        </div>

      </div>

    </div>
  );
};

export default Signup;