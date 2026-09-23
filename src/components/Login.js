
import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";

const Login = ({ showAlert }) => {
  const history = useHistory();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const identifier = formData.identifier.trim();
    const password = formData.password;

    if (!identifier) {
      showAlert(
        "Please enter your email or phone number.",
        "danger"
      );
      return;
    }

    if (!password) {
      showAlert("Please enter your password.", "danger");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://inotebook-dw4s.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: identifier.trim().toLowerCase(),
            password,
          }),
        }
      );

      const json = await response.json();

      console.log("LOGIN RESPONSE:", json);

      if (response.ok) {
        if (json.authToken) {
          localStorage.setItem("token", json.authToken);
        }

        showAlert(
          "Login successful. Welcome back!",
          "success"
        );

        history.push("/");
        return;
      }

      if (json.code === "EMAIL_NOT_VERIFIED") {
        showAlert(
          "Please verify your email first.",
          "warning"
        );

        if (json.userId) {
          history.push(
            `/verify-otp?userId=${json.userId}&purpose=signup`
          );
        }

        return;
      }

      showAlert(
        json.error ||
          json.message ||
          "Invalid login credentials.",
        "danger"
      );
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      showAlert(
        "Unable to connect to server. Please make sure the backend is running.",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-background">
        <div className="auth-glow auth-glow-one"></div>
        <div className="auth-glow auth-glow-two"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">

          {/* HEADER */}
          <div className="auth-header">
            <div className="auth-icon">
              <i className="fa-solid fa-right-to-bracket"></i>
            </div>

            <span className="section-eyebrow">
              WELCOME BACK
            </span>

            <h1>
              Sign in to <span>iNotebook</span>
            </h1>

            <p>
              Access your notes, ideas and workspace
              from anywhere.
            </p>
          </div>

          {/* LOGIN FORM */}
          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* EMAIL / PHONE */}
            <div className="form-group">
              <label htmlFor="login-identifier">
                Email or phone number
              </label>

              <div className="input-wrapper">
                <i className="fa-solid fa-user input-icon"></i>

                <input
                  id="login-identifier"
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Enter email or phone number"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="login-password">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="input-wrapper">
                <i className="fa-solid fa-lock input-icon"></i>

                <input
                  id="login-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previousValue) => !previousValue
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
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="auth-divider">
            <span>your ideas, organized</span>
          </div>

          {/* SIGN UP */}
          <div className="auth-footer">
            <p>
              Don't have an account?
              <Link to="/signup">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* TRUST INFORMATION */}
        <div className="auth-trust">
          <span>
            <i className="fa-solid fa-shield-halved"></i>
            Secure login
          </span>

          <span>
            <i className="fa-solid fa-cloud"></i>
            Cloud synced
          </span>

          <span>
            <i className="fa-solid fa-lock"></i>
            Private workspace
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
