import React, { useState } from "react";

const Settings = ({
  darkMode,
  toggleDarkMode,
  showAlert,
}) => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (!passwords.currentPassword) {
      showAlert(
        "Enter your current password.",
        "danger"
      );
      return;
    }

    if (passwords.newPassword.length < 5) {
      showAlert(
        "New password must be at least 5 characters.",
        "danger"
      );
      return;
    }

    if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {
      showAlert(
        "New passwords do not match.",
        "danger"
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "https://inotebook-dw4s.onrender.com/api/auth/changePassword",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem(
              "token"
            ),
          },
          body: JSON.stringify({
            currentPassword:
              passwords.currentPassword,

            newPassword:
              passwords.newPassword,

            confirmPassword:
              passwords.confirmPassword,
          }),
        }
      );

      const json = await response.json();

      if (response.ok) {
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        showAlert(
          "Password changed successfully!",
          "success"
        );
      } else {
        showAlert(
          json.error ||
            "Unable to change password.",
          "danger"
        );
      }
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      showAlert(
        "Unable to connect to server.",
        "danger"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">

      <div className="page-heading">

        <div>
          <span className="page-eyebrow">
            PREFERENCES
          </span>

          <h2>Settings</h2>

          <p>
            Customize your iNotebook
            experience.
          </p>
        </div>

        <div className="page-heading-icon">
          <i className="fa-solid fa-gear"></i>
        </div>

      </div>

      <div className="settings-grid">

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <i className="fa-solid fa-palette"></i>
            </div>

            <div>
              <h3>Appearance</h3>

              <p>
                Choose how iNotebook looks.
              </p>
            </div>

          </div>

          <div className="settings-row">

            <div>
              <strong>
                Dark Mode
              </strong>

              <span>
                Use a darker interface
                for comfortable viewing.
              </span>
            </div>

            <button
              type="button"
              className={`settings-switch ${
                darkMode ? "active" : ""
              }`}
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              aria-pressed={darkMode}
            >
              <span></span>
            </button>

          </div>

        </div>

        <div className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <i className="fa-solid fa-lock"></i>
            </div>

            <div>
              <h3>
                Change Password
              </h3>

              <p>
                Keep your account secure.
              </p>
            </div>

          </div>

          <form onSubmit={changePassword}>

            <div className="mb-3">

              <label
                htmlFor="currentPassword"
                className="form-label"
              >
                Current Password
              </label>

              <input
                type="password"
                className="form-control modern-input"
                id="currentPassword"
                name="currentPassword"
                placeholder="Enter your current password"
                autoComplete="current-password"
                value={
                  passwords.currentPassword
                }
                onChange={onChange}
                disabled={saving}
                required
              />

            </div>

            <div className="mb-3">

              <label
                htmlFor="newPassword"
                className="form-label"
              >
                New Password
              </label>

              <input
                type="password"
                className="form-control modern-input"
                id="newPassword"
                name="newPassword"
                placeholder="Enter a new password"
                autoComplete="new-password"
                value={
                  passwords.newPassword
                }
                onChange={onChange}
                disabled={saving}
                required
              />

            </div>

            <div className="mb-4">

              <label
                htmlFor="confirmPassword"
                className="form-label"
              >
                Confirm New Password
              </label>

              <input
                type="password"
                className="form-control modern-input"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                value={
                  passwords.confirmPassword
                }
                onChange={onChange}
                disabled={saving}
                required
              />

            </div>

            <button
              type="submit"
              className="settings-save-btn"
              disabled={saving}
            >

              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>

                  Updating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-key me-2"></i>
                  Change Password
                </>
              )}

            </button>

          </form>

        </div>

      </div>

    </div>
  );
};

export default Settings;