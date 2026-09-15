
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  useHistory,
  useLocation,
} from "react-router-dom";

const Navbar = ({
  darkMode,
  toggleDarkMode,
}) => {
  const navigate = useHistory();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const profileRef = useRef(null);

  const previousPathRef = useRef(
  sessionStorage.getItem("inotebookPreviousPath") || "/"
);

  /* ==========================================================
     GET LOGGED-IN USER
  ========================================================== */

  const getUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/getUser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        }
      );

      const json = await response.json();

      if (response.ok) {
        setUser(json);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("NAVBAR USER ERROR:", error);
      setUser(null);
    }
  };

  /* ==========================================================
     LOAD USER
  ========================================================== */

  useEffect(() => {
    getUser();
  }, [location.pathname]);

  /* ==========================================================
     CLOSE PROFILE ON OUTSIDE CLICK
  ========================================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* ==========================================================
     CLOSE MOBILE MENU ON ROUTE CHANGE
  ========================================================== */

  useEffect(() => {
  const previousPath = sessionStorage.getItem(
    "inotebookCurrentPath"
  );

  if (
    previousPath &&
    previousPath !== location.pathname
  ) {
    sessionStorage.setItem(
      "inotebookPreviousPath",
      previousPath
    );

    previousPathRef.current = previousPath;
  }

  sessionStorage.setItem(
    "inotebookCurrentPath",
    location.pathname
  );

  setMobileOpen(false);
  setProfileOpen(false);
}, [location.pathname]);
  /* ==========================================================
     PREVENT BODY SCROLL WHEN MOBILE MENU IS OPEN
  ========================================================== */

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [mobileOpen]);

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("resetToken");

    setUser(null);
    setProfileOpen(false);
    setMobileOpen(false);

    navigate.push("/login");
  };

  /* ==========================================================
     USER INITIAL
  ========================================================== */

  const getInitial = () => {
    if (!user?.name) {
      return "U";
    }

    return user.name
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  /* ==========================================================
     USER NAME
  ========================================================== */

  const getUserName = () => {
    if (!user?.name) {
      return "User";
    }

    return user.name;
  };

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const goTo = (path) => {
    setProfileOpen(false);
    setMobileOpen(false);

    navigate.push(path);
  };

  /* ==========================================================
     MOBILE BACK
  ========================================================== */

const handleMobileBack = () => {
  setProfileOpen(false);
  setMobileOpen(false);

  const previousPath =
    sessionStorage.getItem(
      "inotebookPreviousPath"
    );

  if (
    previousPath &&
    previousPath !== location.pathname
  ) {
    navigate.push(previousPath);
  } else {
    navigate.push("/");
  }
};
  /* ==========================================================
     SHOULD SHOW MOBILE BACK BUTTON
  ========================================================== */

  const shouldShowBackButton =
    location.pathname !== "/" &&
    location.pathname !== "/dashboard" &&
    location.pathname !== "/login" &&
    location.pathname !== "/signup" &&
    location.pathname !== "/verify-otp" &&
    location.pathname !== "/forgot-password" &&
    location.pathname !== "/reset-password";

  /* ==========================================================
     LOGIN STATUS
  ========================================================== */

  const isLoggedIn = Boolean(
    localStorage.getItem("token")
  );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <nav className="main-navbar">
      <div className="navbar-container">

        {/* ==================================================
            MOBILE BACK BUTTON
        ================================================== */}

        {isLoggedIn && shouldShowBackButton && (
          <button
            type="button"
            className="mobile-back-btn"
            onClick={handleMobileBack}
            aria-label="Go back"
            title="Go back"
          >
            <i className="fa-solid fa-arrow-left"></i>

            <span>
              Back
            </span>
          </button>
        )}

        {/* ==================================================
            BRAND
        ================================================== */}

        <button
          type="button"
          className="navbar-brand"
          onClick={() =>
            isLoggedIn
              ? goTo("/")
              : goTo("/login")
          }
          aria-label="Go to dashboard"
        >
          <span className="navbar-brand-icon">
            <i className="fa-solid fa-book-open"></i>
          </span>

          <span className="navbar-brand-text">
            iNotebook
          </span>
        </button>

        {/* ==================================================
            DESKTOP NAVIGATION
        ================================================== */}

        {isLoggedIn && (
          <div className="navbar-nav-links">

            {/* DASHBOARD */}

            <NavLink
              exact
              to="/"
              className="nav-link"
              activeClassName="active"
            >
              <i className="fa-solid fa-house"></i>

              <span>
                Dashboard
              </span>
            </NavLink>

            {/* MY NOTES */}

            <NavLink
              to="/notes"
              className="nav-link"
              activeClassName="active"
            >
              <i className="fa-regular fa-note-sticky"></i>

              <span>
                My Notes
              </span>
            </NavLink>

            {/* AI ASSISTANT */}

            <button
              type="button"
              className={`nav-link ai-nav-link ${
                location.pathname === "/ai"
                  ? "active"
                  : ""
              }`}
              onClick={() => goTo("/ai")}
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>

              <span>
                AI Assistant
              </span>

              <span className="ai-new-badge">
                AI
              </span>
            </button>

            {/* AI HISTORY */}

            <button
              type="button"
              className={`nav-link ai-history-nav-link ${
                location.pathname === "/ai-history"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                goTo("/ai-history")
              }
            >
              <i className="fa-solid fa-clock-rotate-left"></i>

              <span>
                AI History
              </span>
            </button>

            {/* ACTIVITY */}

            <NavLink
              to="/recent-activity"
              className="nav-link"
              activeClassName="active"
            >
              <i className="fa-solid fa-chart-line"></i>

              <span>
                Activity
              </span>
            </NavLink>

          </div>
        )}

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div className="navbar-right">

          {/* ==================================================
              THEME BUTTON
          ================================================== */}

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            aria-label="Toggle dark mode"
          >
            <i
              className={
                darkMode
                  ? "fa-solid fa-sun"
                  : "fa-solid fa-moon"
              }
            ></i>
          </button>

          {/* ==================================================
              DESKTOP LOGGED OUT
          ================================================== */}

          {!isLoggedIn && (
            <>
              <button
                type="button"
                className="navbar-login-btn"
                onClick={() =>
                  goTo("/login")
                }
              >
                Login
              </button>

              <button
                type="button"
                className="navbar-get-started-btn"
                onClick={() =>
                  goTo("/signup")
                }
              >
                Get Started
              </button>
            </>
          )}

          {/* ==================================================
              DESKTOP PROFILE
          ================================================== */}

          {isLoggedIn && (
            <div
              className="navbar-profile"
              ref={profileRef}
            >

              {/* PROFILE TRIGGER */}

              <button
                type="button"
                className={`profile-trigger ${
                  profileOpen ? "open" : ""
                }`}
                onClick={() =>
                  setProfileOpen(
                    (previous) => !previous
                  )
                }
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
              >
                <span className="profile-avatar">
                  {getInitial()}
                </span>

                <span className="profile-name">
                  {getUserName()}
                </span>

                <i
                  className={`fa-solid fa-chevron-down profile-chevron ${
                    profileOpen
                      ? "rotate"
                      : ""
                  }`}
                ></i>
              </button>

              {/* ==================================================
                  DESKTOP PROFILE DROPDOWN
              ================================================== */}

              {profileOpen && (
                <div className="profile-dropdown">

                  {/* PROFILE HEADER */}

                  <div className="profile-dropdown-header">

                    <div className="profile-dropdown-avatar">
                      {getInitial()}
                    </div>

                    <div>
                      <strong>
                        {getUserName()}
                      </strong>

                      <span>
                        {user?.email ||
                          "iNotebook user"}
                      </span>
                    </div>

                  </div>

                  <div className="profile-dropdown-divider"></div>

                  {/* ACCOUNT */}

                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() =>
                      goTo("/account")
                    }
                  >
                    <i className="fa-regular fa-user"></i>

                    <span>
                      Account
                    </span>
                  </button>

                  {/* AI HISTORY */}

                  <button
                    type="button"
                    className={`profile-dropdown-item ${
                      location.pathname ===
                      "/ai-history"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      goTo("/ai-history")
                    }
                  >
                    <i className="fa-solid fa-clock-rotate-left"></i>

                    <span>
                      AI History
                    </span>
                  </button>

                  {/* RECENT ACTIVITY */}

                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() =>
                      goTo(
                        "/recent-activity"
                      )
                    }
                  >
                    <i className="fa-solid fa-chart-line"></i>

                    <span>
                      Recent Activity
                    </span>
                  </button>

                  {/* SETTINGS */}

                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() =>
                      goTo("/settings")
                    }
                  >
                    <i className="fa-solid fa-gear"></i>

                    <span>
                      Settings
                    </span>
                  </button>

                  <div className="profile-dropdown-divider"></div>

                  {/* LOGOUT */}

                  <button
                    type="button"
                    className="profile-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>

                    <span>
                      Logout
                    </span>
                  </button>

                </div>
              )}

            </div>
          )}

          {/* ==================================================
              MOBILE MENU BUTTON
          ================================================== */}

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() =>
              setMobileOpen(
                (previous) => !previous
              )
            }
            aria-label={
              mobileOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={mobileOpen}
          >
            <i
              className={
                mobileOpen
                  ? "fa-solid fa-xmark"
                  : "fa-solid fa-bars"
              }
            ></i>
          </button>

        </div>
      </div>

      {/* ====================================================
          MOBILE MENU
      ==================================================== */}

      {mobileOpen && (
        <div className="mobile-navbar-menu">

          {/* ==================================================
              MOBILE PROFILE HEADER
          ================================================== */}

          {isLoggedIn && (
            <div className="mobile-profile-header">

              <div className="mobile-profile-avatar">
                {getInitial()}
              </div>

              <div className="mobile-profile-info">

                <strong>
                  {getUserName()}
                </strong>

                <span>
                  {user?.email ||
                    "iNotebook user"}
                </span>

              </div>

            </div>
          )}

          {/* ==================================================
              LOGGED IN MOBILE MENU
          ================================================== */}

          {isLoggedIn ? (
            <>

              {/* DASHBOARD */}

              <button
                type="button"
                className={`mobile-nav-link ${
                  location.pathname === "/"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goTo("/")
                }
              >
                <i className="fa-solid fa-house"></i>

                <span>
                  Dashboard
                </span>
              </button>

              {/* NOTES */}

              <button
                type="button"
                className={`mobile-nav-link ${
                  location.pathname === "/notes"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goTo("/notes")
                }
              >
                <i className="fa-regular fa-note-sticky"></i>

                <span>
                  My Notes
                </span>
              </button>

              {/* AI ASSISTANT */}

              <button
                type="button"
                className={`mobile-nav-link ${
                  location.pathname === "/ai"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goTo("/ai")
                }
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>

                <span>
                  AI Assistant
                </span>

                <span className="ai-new-badge">
                  AI
                </span>
              </button>

              {/* AI HISTORY */}

              <button
                type="button"
                className={`mobile-nav-link ${
                  location.pathname ===
                  "/ai-history"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goTo("/ai-history")
                }
              >
                <i className="fa-solid fa-clock-rotate-left"></i>

                <span>
                  AI History
                </span>
              </button>

              {/* RECENT ACTIVITY */}

              <button
                type="button"
                className={`mobile-nav-link ${
                  location.pathname ===
                  "/recent-activity"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goTo(
                    "/recent-activity"
                  )
                }
              >
                <i className="fa-solid fa-chart-line"></i>

                <span>
                  Recent Activity
                </span>
              </button>

              <div className="mobile-nav-divider"></div>

              {/* ACCOUNT */}

              <button
                type="button"
                className={`mobile-nav-link ${
                  location.pathname === "/account"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goTo("/account")
                }
              >
                <i className="fa-regular fa-user"></i>

                <span>
                  My Account
                </span>
              </button>

              {/* SETTINGS */}

              <button
                type="button"
                className={`mobile-nav-link ${
                  location.pathname === "/settings"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  goTo("/settings")
                }
              >
                <i className="fa-solid fa-gear"></i>

                <span>
                  Settings
                </span>
              </button>

              <div className="mobile-nav-divider"></div>

              {/* LOGOUT */}

              <button
                type="button"
                className="mobile-nav-link mobile-logout-link"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket"></i>

                <span>
                  Logout
                </span>
              </button>

            </>
          ) : (

            /* ==================================================
               LOGGED OUT MOBILE MENU
            ================================================== */

            <>
              {/* LOGIN */}

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() =>
                  goTo("/login")
                }
              >
                <i className="fa-solid fa-right-to-bracket"></i>

                <span>
                  Login
                </span>
              </button>

              {/* GET STARTED */}

              <button
                type="button"
                className="mobile-nav-link"
                onClick={() =>
                  goTo("/signup")
                }
              >
                <i className="fa-solid fa-user-plus"></i>

                <span>
                  Get Started
                </span>
              </button>
            </>
          )}

        </div>
      )}
    </nav>
  );
};

export default Navbar;

