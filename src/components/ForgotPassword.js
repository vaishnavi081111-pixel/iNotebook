
import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";

const ForgotPassword = ({ showAlert }) => {
  const history = useHistory();

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const value = identifier.trim();

    if (!value) {
      showAlert(
        "Please enter your email or phone number.",
        "danger"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://inotebook-dw4s.onrender.com/api/auth/forgotPassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: value,
          }),
        }
      );

      const json = await response.json();

      console.log(
        "FORGOT PASSWORD RESPONSE:",
        json
      );

      if (response.ok) {
        if (json.requiresOtp && json.userId) {
          showAlert(
            "OTP sent to your registered email.",
            "success"
          );

          history.push(
            `/verify-otp?userId=${json.userId}&purpose=forgot-password`
          );

          return;
        }

        showAlert(
          json.message ||
            "If an account exists, an OTP will be sent to the registered email.",
          "info"
        );
      } else {
        showAlert(
          json.error ||
            json.message ||
            "Unable to process your request.",
          "danger"
        );
      }
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
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
              <i className="fa-solid fa-key"></i>
            </div>

            <span className="section-eyebrow">
              ACCOUNT RECOVERY
            </span>

            <h1>Forgot your password?</h1>

            <p>
              Enter your registered email or phone
              number and we'll send you an OTP.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >
            <div className="form-group">
              <label htmlFor="forgot-identifier">
                Email or phone number
              </label>

              <div className="input-wrapper">
                <i className="fa-solid fa-user-lock"></i>

                <input
                  id="forgot-identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(
                      event.target.value
                    )
                  }
                  placeholder="Email or 9876543210"
                  autoComplete="username"
                  required
                />
              </div>

              <span className="form-hint">
                OTP will be sent to your registered
                email address.
              </span>
            </div>

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
                  Send OTP
                  <i className="fa-solid fa-paper-plane"></i>
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>secure account recovery</span>
          </div>

          <div className="auth-footer">
            <p>
              Remember your password?
              <Link to="/login">
                {" "}
                Back to login
              </Link>
            </p>

            <p>
              Don't have an account?
              <Link to="/signup">
                {" "}
                Create account
              </Link>
            </p>
          </div>

        </div>

        <div className="auth-trust">
          <span>
            <i className="fa-solid fa-shield-halved"></i>
            Secure recovery
          </span>

          <span>
            <i className="fa-solid fa-envelope"></i>
            Email OTP
          </span>

          <span>
            <i className="fa-solid fa-lock"></i>
            Protected account
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

