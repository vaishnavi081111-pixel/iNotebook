import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";

const ResetPassword = ({ showAlert }) => {
  const history = useHistory();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const resetToken = sessionStorage.getItem(
    "passwordResetToken"
  );

  /* =====================================================
     CHECK RESET TOKEN
     ===================================================== */

  useEffect(() => {
    if (!resetToken) {
      showAlert(
        "Your password reset session has expired. Please request a new OTP.",
        "warning"
      );

      history.replace("/forgot-password");
    }
  }, [resetToken, history, showAlert]);

  /* =====================================================
     RESET PASSWORD
     ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      showAlert(
        "Please fill both password fields.",
        "warning"
      );
      return;
    }

    if (password.length < 5) {
      showAlert(
        "Password must be at least 5 characters.",
        "warning"
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert(
        "Passwords do not match.",
        "warning"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://inotebook-dw4s.onrender.com/api/auth/ResetPassword",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            resetToken,
            newPassword: password,
            confirmPassword,
          }),
        }
      );

      const json = await response.json();

      console.log(
        "RESET PASSWORD RESPONSE:",
        json
      );

      if (!response.ok) {
        showAlert(
          json.error ||
            json.message ||
            "Unable to reset password.",
          "danger"
        );

        return;
      }

      /* Remove used reset token */
      sessionStorage.removeItem(
        "passwordResetToken"
      );

      showAlert(
        "Password reset successfully! Please login.",
        "success"
      );

      setTimeout(() => {
        history.push("/login");
      }, 1000);
    } catch (error) {
      console.error(
        "RESET PASSWORD ERROR:",
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

  /* =====================================================
     NO RESET TOKEN
     ===================================================== */

  if (!resetToken) {
    return null;
  }

  /* =====================================================
     UI
     ===================================================== */

  return (
    <div className="auth-page">

      <div className="auth-background">
        <div className="auth-glow auth-glow-one"></div>
        <div className="auth-glow auth-glow-two"></div>
      </div>

      <div className="auth-container">

        <div className="auth-card reset-password-card">

          {/* HEADER */}

          <div className="auth-header">

            <div className="auth-icon">
              <i className="fa-solid fa-lock"></i>
            </div>

            <span className="section-eyebrow">
              PASSWORD RESET
            </span>

            <h1>Create a new password</h1>

            <p>
              Choose a strong password to protect
              your iNotebook account.
            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* NEW PASSWORD */}

            <div className="form-group">

              <label htmlFor="reset-password">
                New password
              </label>

              <div className="input-wrapper">

                <i className="fa-solid fa-lock"></i>

                <input
                  id="reset-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
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
                Use at least 5 characters.
              </span>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="reset-confirm-password">
                Confirm new password
              </label>

              <div className="input-wrapper">

                <i className="fa-solid fa-shield-halved"></i>

                <input
                  id="reset-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
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
                  Updating password...
                </>
              ) : (
                <>
                  Update password
                  <i className="fa-solid fa-check"></i>
                </>
              )}

            </button>

          </form>

          {/* DIVIDER */}

          <div className="auth-divider">
            <span>secure password recovery</span>
          </div>

          {/* FOOTER */}

          <div className="auth-footer">

            <p>
              Remember your password?
              <Link to="/login">
                {" "}
                Back to login
              </Link>
            </p>

          </div>

        </div>

        {/* TRUST */}

        <div className="auth-trust">

          <span>
            <i className="fa-solid fa-shield-halved"></i>
            Secure password
          </span>

          <span>
            <i className="fa-solid fa-lock"></i>
            Protected account
          </span>

          <span>
            <i className="fa-solid fa-circle-check"></i>
            Ready to login
          </span>

        </div>

      </div>

    </div>
  );
};

export default ResetPassword;