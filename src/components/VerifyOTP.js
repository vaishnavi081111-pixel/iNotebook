import React, { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";

const VerifyOTP = ({ showAlert }) => {
  const history = useHistory();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);

  // Backend expects EMAIL
  const email = queryParams.get("email");
  const purpose = queryParams.get("purpose") || "signup";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  /*
   * =========================
   * CHECK EMAIL
   * =========================
   */

  useEffect(() => {
    if (!email) {
      showAlert(
        "Invalid verification request.",
        "danger"
      );

      history.replace("/signup");
    }
  }, [email, history, showAlert]);

  /*
   * =========================
   * COUNTDOWN TIMER
   * =========================
   */

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  /*
   * =========================
   * OTP INPUT
   * =========================
   */

  const handleOtpChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setOtp(value);
  };

  /*
   * =========================
   * VERIFY OTP
   * =========================
   */

  const handleVerify = async (event) => {
    event.preventDefault();

    // Prevent duplicate requests
    if (loading) {
      return;
    }

    if (otp.length !== 6) {
      showAlert(
        "Please enter the complete 6-digit OTP.",
        "danger"
      );
      return;
    }

    if (!email) {
      showAlert(
        "Email is missing. Please start the verification again.",
        "danger"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://inotebook-dw4s.onrender.com/api/auth/verifyOtp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
            purpose,
          }),
        }
      );

      const json = await response.json();

      console.log("VERIFY OTP RESPONSE:", json);

      /*
       * =========================
       * SUCCESS
       * =========================
       */

      if (response.ok && json.success) {
        /*
         * SIGNUP
         */

        if (purpose === "signup") {
          if (json.authToken) {
            localStorage.setItem(
              "token",
              json.authToken
            );
          }

          showAlert(
            "Email verified successfully! You can now login.",
            "success"
          );

          history.replace("/login");

          return;
        }

        /*
         * FORGOT PASSWORD
         */

        if (purpose === "forgot-password") {
          if (json.resetToken) {
            sessionStorage.setItem(
              "passwordResetToken",
              json.resetToken
            );
          }

          showAlert(
            "OTP verified. Create your new password.",
            "success"
          );

          history.replace("/reset-password");

          return;
        }
      }

      /*
       * =========================
       * BACKEND ERROR
       * =========================
       */

      showAlert(
        json.error ||
          json.message ||
          "Invalid OTP. Please try again.",
        "danger"
      );
    } catch (error) {
      console.error(
        "VERIFY OTP ERROR:",
        error
      );

      showAlert(
        "Unable to connect to server. Please try again.",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================
   * RESEND OTP
   * =========================
   */

  const resendOtp = async () => {
    if (countdown > 0 || resending) {
      return;
    }

    if (!email) {
      showAlert(
        "Email is missing. Please start again.",
        "danger"
      );
      return;
    }

    setResending(true);

    try {
      const response = await fetch(
        "https://inotebook-dw4s.onrender.com/api/auth/resendOtp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            purpose,
          }),
        }
      );

      const json = await response.json();

      console.log(
        "RESEND OTP RESPONSE:",
        json
      );

      if (response.ok && json.success) {
        setCountdown(60);
        setOtp("");

        showAlert(
          "A new OTP has been sent to your email.",
          "success"
        );
      } else {
        showAlert(
          json.error ||
            json.message ||
            "Unable to resend OTP.",
          "danger"
        );
      }
    } catch (error) {
      console.error(
        "RESEND OTP ERROR:",
        error
      );

      showAlert(
        "Unable to connect to server.",
        "danger"
      );
    } finally {
      setResending(false);
    }
  };

  /*
   * =========================
   * UI
   * =========================
   */

  return (
    <div className="auth-page">

      <div className="auth-background">
        <div className="auth-glow auth-glow-one"></div>
        <div className="auth-glow auth-glow-two"></div>
      </div>

      <div className="auth-container">

        <div className="auth-card">

          {/* HEADER */}

          <div className="auth-header">

            <div className="auth-icon">
              <i className="fa-solid fa-envelope-circle-check"></i>
            </div>

            <span className="section-eyebrow">
              VERIFY EMAIL
            </span>

            <h1>Enter your OTP</h1>

            <p>
              We sent a 6-digit verification code
              to your email address.
            </p>

          </div>

          {/* OTP FORM */}

          <form
            onSubmit={handleVerify}
            className="auth-form"
          >

            <div className="form-group">

              <label htmlFor="otp">
                Verification code
              </label>

              <div className="input-wrapper">

                <i className="fa-solid fa-key"></i>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  autoFocus
                  disabled={loading}
                />

              </div>

              <span className="form-hint">
                The OTP is valid for 10 minutes.
              </span>

            </div>

            {/* VERIFY BUTTON */}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={
                loading ||
                otp.length !== 6
              }
            >

              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <i className="fa-solid fa-check"></i>
                </>
              )}

            </button>

          </form>

          {/* RESEND OTP */}

          <div className="otp-resend-section">

            {countdown > 0 ? (
              <p>
                Resend OTP in{" "}
                <strong>
                  {countdown}s
                </strong>
              </p>
            ) : (
              <button
                type="button"
                className="otp-resend-btn"
                onClick={resendOtp}
                disabled={resending}
              >
                {resending
                  ? "Sending..."
                  : "Resend OTP"}
              </button>
            )}

          </div>

          {/* DIVIDER */}

          <div className="auth-divider">
            <span>
              secure verification
            </span>
          </div>

          {/* FOOTER */}

          <div className="auth-footer">

            <p>
              Entered the wrong account?

              <Link to="/signup">
                {" "}
                Create another account
              </Link>
            </p>

          </div>

        </div>

        {/* TRUST BADGES */}

        <div className="auth-trust">

          <span>
            <i className="fa-solid fa-shield-halved"></i>
            Secure verification
          </span>

          <span>
            <i className="fa-solid fa-envelope"></i>
            Email protected
          </span>

          <span>
            <i className="fa-solid fa-lock"></i>
            Your account is safe
          </span>

        </div>

      </div>

    </div>
  );
};

export default VerifyOTP;