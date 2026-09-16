
import React, { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";

const VerifyOTP = ({ showAlert }) => {
  const history = useHistory();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);

  const userId = queryParams.get("userId");
  const purpose = queryParams.get("purpose") || "signup";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!userId) {
      showAlert(
        "Invalid verification request.",
        "danger"
      );

      history.replace("/signup");
    }
  }, [userId, history, showAlert]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (event) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setOtp(value);
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (otp.length !== 6) {
      showAlert(
        "Please enter the complete 6-digit OTP.",
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
            userId,
            otp,
            purpose,
          }),
        }
      );

      const json = await response.json();

      console.log("VERIFY OTP RESPONSE:", json);

      if (response.ok) {
        /*
         * SIGNUP OTP
         */

        if (purpose === "signup") {
          if (json.authToken) {
            localStorage.setItem(
              "token",
              json.authToken
            );
          }

          showAlert(
            "Email verified successfully! Welcome to iNotebook.",
            "success"
          );

          history.replace("/");
          return;
        }

        /*
         * FORGOT PASSWORD OTP
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

  const resendOtp = async () => {
    if (countdown > 0 || resending) {
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
            userId,
            purpose,
          }),
        }
      );

      const json = await response.json();

      console.log("RESEND OTP RESPONSE:", json);

      if (response.ok) {
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

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-glow auth-glow-one"></div>
        <div className="auth-glow auth-glow-two"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">

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
                />
              </div>

              <span className="form-hint">
                The OTP is valid for 5 minutes.
              </span>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading || otp.length !== 6}
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

          <div className="auth-divider">
            <span>secure verification</span>
          </div>

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
