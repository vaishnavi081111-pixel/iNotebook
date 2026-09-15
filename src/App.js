
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Alert from "./components/Alert";

import Home from "./components/Home";
import Notes from "./components/Notes";
import About from "./components/About";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Account from "./components/Account";
import Settings from "./components/Settings";
import RecentActivity from "./components/RecentActivity";

import VerifyOTP from "./components/VerifyOTP";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/Resetpassword";

import AIAssistant from "./components/AIAssistant";
import AIHistory from "./components/AIHistory";

import NoteState from "./context/notes/NoteState";

import "./App.css";


/* ============================================================
   PROTECTED ROUTE
============================================================ */

const ProtectedRoute = ({ children, ...rest }) => {
  const token = localStorage.getItem("token");

  return (
    <Route
      {...rest}
      render={() =>
        token ? children : <Redirect to="/login" />
      }
    />
  );
};


/* ============================================================
   PUBLIC ROUTE
============================================================ */

const PublicRoute = ({ children, ...rest }) => {
  const token = localStorage.getItem("token");

  return (
    <Route
      {...rest}
      render={() =>
        token ? <Redirect to="/" /> : children
      }
    />
  );
};


/* ============================================================
   APP
============================================================ */

function App() {

  /* ==========================================================
     DARK MODE
  ========================================================== */

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark"
    );
  });


  /* ==========================================================
     ALERT
  ========================================================== */

  const [alert, setAlert] = useState({
    msg: "",
    type: "",
  });


  const showAlert = (msg, type = "info") => {
    setAlert({
      msg,
      type,
    });

    setTimeout(() => {
      setAlert({
        msg: "",
        type: "",
      });
    }, 2500);
  };


  /* ==========================================================
     APPLY THEME
  ========================================================== */

  useEffect(() => {

    const theme = darkMode
      ? "dark"
      : "light";

    const root = document.documentElement;
    const body = document.body;

    /* Store theme */
    localStorage.setItem(
      "theme",
      theme
    );

    /* Root theme */
    root.setAttribute(
      "data-theme",
      theme
    );

    /* Body theme */
    body.setAttribute(
      "data-theme",
      theme
    );

    /* Body class */
    body.classList.toggle(
      "dark-mode",
      darkMode
    );

    body.classList.toggle(
      "light-mode",
      !darkMode
    );

  }, [darkMode]);


  /* ==========================================================
     TOGGLE DARK MODE
  ========================================================== */

  const toggleDarkMode = () => {

    setDarkMode(
      (previousMode) =>
        !previousMode
    );

  };


  /* ==========================================================
     APP UI
  ========================================================== */

  return (
    <Router>

      <div
        className={`app ${
          darkMode
            ? "dark-mode"
            : "light-mode"
        }`}
        data-theme={
          darkMode
            ? "dark"
            : "light"
        }
      >

        {/* ==================================================
            NAVBAR
        ================================================== */}

        <Navbar
          darkMode={darkMode}
          toggleDarkMode={
            toggleDarkMode
          }
          showAlert={showAlert}
        />


        {/* ==================================================
            GLOBAL ALERT
        ================================================== */}

        <Alert
          alert={alert}
        />


        {/* ==================================================
            NOTE CONTEXT
        ================================================== */}

        <NoteState>

          <main className="main-content">

            <Switch>

              {/* ==================================================
                  LOGIN
              ================================================== */}

              <PublicRoute exact path="/login">

                <Login
                  showAlert={
                    showAlert
                  }
                />

              </PublicRoute>


              {/* ==================================================
                  SIGNUP
              ================================================== */}

              <PublicRoute exact path="/signup">

                <Signup
                  showAlert={
                    showAlert
                  }
                />

              </PublicRoute>


              {/* ==================================================
                  VERIFY OTP
              ================================================== */}

              <Route
                exact
                path="/verify-otp"
              >

                <VerifyOTP
                  showAlert={
                    showAlert
                  }
                />

              </Route>


              {/* ==================================================
                  FORGOT PASSWORD
              ================================================== */}

              <Route
                exact
                path="/forgot-password"
              >

                <ForgotPassword
                  showAlert={
                    showAlert
                  }
                />

              </Route>


              {/* ==================================================
                  RESET PASSWORD
              ================================================== */}

              <Route
                exact
                path="/reset-password"
              >

                <ResetPassword
                  showAlert={
                    showAlert
                  }
                />

              </Route>


              {/* ==================================================
                  ABOUT
              ================================================== */}

              <Route
                exact
                path="/about"
              >

                <About />

              </Route>


              {/* ==================================================
                  DASHBOARD
              ================================================== */}

              <ProtectedRoute
                exact
                path={[
                  "/",
                  "/dashboard",
                ]}
              >

                <Home
                  showAlert={
                    showAlert
                  }
                />

              </ProtectedRoute>


              {/* ==================================================
                  NOTES
              ================================================== */}

              <ProtectedRoute
                exact
                path="/notes"
              >

                <Notes
                  showAlert={
                    showAlert
                  }
                />

              </ProtectedRoute>


              {/* ==================================================
                  ACCOUNT
              ================================================== */}

              <ProtectedRoute
                exact
                path="/account"
              >

                <Account
                  showAlert={
                    showAlert
                  }
                />

              </ProtectedRoute>


              {/* ==================================================
                  SETTINGS
              ================================================== */}

              <ProtectedRoute
                exact
                path="/settings"
              >

                <Settings
                  showAlert={
                    showAlert
                  }

                  darkMode={
                    darkMode
                  }

                  toggleDarkMode={
                    toggleDarkMode
                  }
                />

              </ProtectedRoute>


              {/* ==================================================
                  RECENT ACTIVITY
              ================================================== */}

              <ProtectedRoute
                exact
                path={[
                  "/recent-activity",
                  "/activity",
                ]}
              >

                <RecentActivity
                  showAlert={
                    showAlert
                  }
                />

              </ProtectedRoute>


              {/* ==================================================
                  AI ASSISTANT
              ================================================== */}

              <ProtectedRoute
                exact
                path="/ai"
              >

                <AIAssistant
                  showAlert={
                    showAlert
                  }
                />

              </ProtectedRoute>


              {/* ==================================================
                  AI HISTORY
              ================================================== */}

              <ProtectedRoute
                exact
                path="/ai-history"
              >

                <AIHistory
                  showAlert={
                    showAlert
                  }
                />

              </ProtectedRoute>


              {/* ==================================================
                  FALLBACK
              ================================================== */}

              <Route path="*">

                <Redirect
                  to={
                    localStorage.getItem(
                      "token"
                    )
                      ? "/"
                      : "/login"
                  }
                />

              </Route>

            </Switch>

          </main>

        </NoteState>

      </div>

    </Router>
  );
}

export default App;

