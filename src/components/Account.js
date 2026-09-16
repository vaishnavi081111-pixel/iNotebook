// import React, { useEffect, useState } from "react";
// import { useHistory } from "react-router-dom";

// const Account = ({ showAlert }) => {
//   const history = useHistory();

//   const [user, setUser] = useState({
//     name: "",
//     email: "",
//   });

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [editMode, setEditMode] = useState(false);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//   });

//   const host = "https://inotebook-dw4s.onrender.com";

//   // ============================================================
//   // GET USER
//   // ============================================================

//   useEffect(() => {
//     const getUser = async () => {
//       const token = localStorage.getItem("token");

//       if (!token) {
//         history.push("/login");
//         return;
//       }

//       try {
//         const response = await fetch(
//           `${host}/api/auth/getUser`,
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               "auth-token": token,
//             },
//           }
//         );

//         const json = await response.json();

//         if (response.ok) {
//           setUser({
//             name: json.name || "",
//             email: json.email || "",
//           });

//           setFormData({
//             name: json.name || "",
//             email: json.email || "",
//           });
//         } else {
//           showAlert(
//             json.error || "Unable to load account",
//             "danger"
//           );
//         }
//       } catch (error) {
//         console.error("GET USER ERROR:", error);

//         showAlert(
//           "Unable to connect to server",
//           "danger"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     getUser();
//   }, [history, showAlert]);

//   // ============================================================
//   // HANDLE INPUT
//   // ============================================================

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   // ============================================================
//   // EDIT
//   // ============================================================

//   const startEditing = () => {
//     setFormData({
//       name: user.name,
//       email: user.email,
//     });

//     setEditMode(true);
//   };

//   // ============================================================
//   // CANCEL
//   // ============================================================

//   const cancelEditing = () => {
//     setFormData({
//       name: user.name,
//       email: user.email,
//     });

//     setEditMode(false);
//   };

//   // ============================================================
//   // UPDATE PROFILE
//   // ============================================================

//   const updateProfile = async (e) => {
//     e.preventDefault();

//     if (saving) return;

//     const name = formData.name.trim();
//     const email = formData.email.trim().toLowerCase();

//     if (!name) {
//       showAlert(
//         "Name cannot be empty",
//         "danger"
//       );
//       return;
//     }

//     if (name.length < 3) {
//       showAlert(
//         "Name must be at least 3 characters",
//         "danger"
//       );
//       return;
//     }

//     if (!email) {
//       showAlert(
//         "Email cannot be empty",
//         "danger"
//       );
//       return;
//     }

//     setSaving(true);

//     try {
//       const response = await fetch(
//         `${host}/api/auth/updateProfile`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             "auth-token": localStorage.getItem("token"),
//           },
//           body: JSON.stringify({
//             name,
//             email,
//           }),
//         }
//       );

//       const json = await response.json();

//       if (response.ok) {
//         setUser({
//           name: json.name,
//           email: json.email,
//         });

//         setFormData({
//           name: json.name,
//           email: json.email,
//         });

//         setEditMode(false);

//         showAlert(
//           "Profile updated successfully!",
//           "success"
//         );
//       } else {
//         showAlert(
//           json.error ||
//             json.errors?.[0]?.msg ||
//             "Unable to update profile",
//           "danger"
//         );
//       }
//     } catch (error) {
//       console.error(
//         "UPDATE PROFILE ERROR:",
//         error
//       );

//       showAlert(
//         "Unable to connect to server",
//         "danger"
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ============================================================
//   // LOADING
//   // ============================================================

//   if (loading) {
//     return (
//       <div className="account-page">
//         <div className="account-loading">
//           <span className="spinner-border"></span>

//           <p>Loading your account...</p>
//         </div>
//       </div>
//     );
//   }

//   // ============================================================
//   // ACCOUNT PAGE
//   // ============================================================

//   return (
//     <div className="account-page">

//       {/* HEADER */}

//       <div className="page-heading">
//         <span className="section-eyebrow">
//           YOUR ACCOUNT
//         </span>

//         <h1>My Account</h1>

//         <p>
//           Manage your personal information and
//           account details.
//         </p>
//       </div>

//       {/* ACCOUNT CARD */}

//       <section className="account-card">

//         <div className="account-card-top">

//           <div className="account-avatar">
//             {user.name
//               ? user.name
//                   .charAt(0)
//                   .toUpperCase()
//               : "U"}
//           </div>

//           <div className="account-user-heading">
//             <h2>{user.name}</h2>

//             <p>{user.email}</p>

//             <span className="account-status">
//               <i className="fa-solid fa-circle"></i>
//               Active account
//             </span>
//           </div>

//           {!editMode && (
//             <button
//               type="button"
//               className="account-edit-btn"
//               onClick={startEditing}
//             >
//               <i className="fa-solid fa-pen"></i>
//               Edit Profile
//             </button>
//           )}

//         </div>

//         <div className="account-divider"></div>

//         {/* PROFILE DETAILS */}

//         {!editMode ? (
//           <div className="account-details">

//             <div className="account-detail-item">

//               <div className="account-detail-icon">
//                 <i className="fa-solid fa-user"></i>
//               </div>

//               <div>
//                 <span>Full Name</span>
//                 <strong>{user.name}</strong>
//               </div>

//             </div>

//             <div className="account-detail-item">

//               <div className="account-detail-icon">
//                 <i className="fa-solid fa-envelope"></i>
//               </div>

//               <div>
//                 <span>Email Address</span>
//                 <strong>{user.email}</strong>
//               </div>

//             </div>

//           </div>
//         ) : (

//           /* EDIT FORM */

//           <form
//             className="account-edit-form"
//             onSubmit={updateProfile}
//           >

//             <div className="account-input-group">

//               <label>
//                 Full Name
//               </label>

//               <div className="account-input-wrapper">

//                 <i className="fa-solid fa-user"></i>

//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter your name"
//                   disabled={saving}
//                 />

//               </div>

//             </div>

//             <div className="account-input-group">

//               <label>
//                 Email Address
//               </label>

//               <div className="account-input-wrapper">

//                 <i className="fa-solid fa-envelope"></i>

//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="Enter your email"
//                   disabled={saving}
//                 />

//               </div>

//             </div>

//             <div className="account-form-actions">

//               <button
//                 type="button"
//                 className="account-cancel-btn"
//                 onClick={cancelEditing}
//                 disabled={saving}
//               >
//                 Cancel
//               </button>

//               <button
//                 type="submit"
//                 className="account-save-btn"
//                 disabled={saving}
//               >
//                 {saving ? (
//                   <>
//                     <span className="spinner-border spinner-border-sm me-2"></span>
//                     Saving...
//                   </>
//                 ) : (
//                   <>
//                     <i className="fa-solid fa-check me-2"></i>
//                     Save Changes
//                   </>
//                 )}
//               </button>

//             </div>

//           </form>
//         )}

//       </section>

//       {/* QUICK ACTIONS */}

//       <section className="account-quick-actions">

//         <button
//           type="button"
//           onClick={() => history.push("/")}
//           className="account-quick-card"
//         >
//           <div className="account-quick-icon">
//             <i className="fa-solid fa-note-sticky"></i>
//           </div>

//           <div>
//             <strong>My Notes</strong>
//             <span>
//               View and manage your notes
//             </span>
//           </div>

//           <i className="fa-solid fa-chevron-right"></i>
//         </button>

//         <button
//           type="button"
//           onClick={() =>
//             history.push("/recent-activity")
//           }
//           className="account-quick-card"
//         >
//           <div className="account-quick-icon">
//             <i className="fa-solid fa-clock-rotate-left"></i>
//           </div>

//           <div>
//             <strong>Recent Activity</strong>
//             <span>
//               See your latest account activity
//             </span>
//           </div>

//           <i className="fa-solid fa-chevron-right"></i>
//         </button>

//         <button
//           type="button"
//           onClick={() =>
//             history.push("/settings")
//           }
//           className="account-quick-card"
//         >
//           <div className="account-quick-icon">
//             <i className="fa-solid fa-gear"></i>
//           </div>

//           <div>
//             <strong>Settings</strong>
//             <span>
//               Manage preferences and security
//             </span>
//           </div>

//           <i className="fa-solid fa-chevron-right"></i>
//         </button>

//       </section>

//     </div>
//   );
// };

// export default Account;

import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

const Account = ({ showAlert }) => {
  const history = useHistory();

  // ============================================================
  // USER STATE
  // ============================================================

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // ============================================================
  // FORM STATE
  // ============================================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // ============================================================
  // UI STATE
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const host = "https://inotebook-dw4s.onrender.com";

  // ============================================================
  // NORMALIZE PHONE
  // ============================================================

  const normalizePhone = (value) => {
    if (!value) {
      return "";
    }

    let phone = value.replace(/\s+/g, "");

    // 9876543210
    if (/^[6-9]\d{9}$/.test(phone)) {
      return `+91${phone}`;
    }

    // +919876543210
    if (/^\+91[6-9]\d{9}$/.test(phone)) {
      return phone;
    }

    // 919876543210
    if (/^91[6-9]\d{9}$/.test(phone)) {
      return `+${phone}`;
    }

    return null;
  };

  // ============================================================
  // GET USER
  // ============================================================

  useEffect(() => {
    const getUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        history.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${host}/api/auth/getUser`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "auth-token": token,
            },
          }
        );

        const json = await response.json();

        console.log("GET USER RESPONSE:", json);

        if (response.ok) {
          const userData = {
            name: json.name || "",
            email: json.email || "",
            phone: json.phone || "",
          };

          setUser(userData);
          setFormData(userData);
        } else {
          showAlert(
            json.error ||
              json.message ||
              "Unable to load account.",
            "danger"
          );
        }
      } catch (error) {
        console.error(
          "GET USER ERROR:",
          error
        );

        showAlert(
          "Unable to connect to server.",
          "danger"
        );
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [history, showAlert]);

  // ============================================================
  // HANDLE INPUT CHANGE
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // START EDITING
  // ============================================================

  const startEditing = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });

    setEditMode(true);
  };

  // ============================================================
  // CANCEL EDITING
  // ============================================================

  const cancelEditing = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });

    setEditMode(false);
  };

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  const updateProfile = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    // ----------------------------------------------------------
    // CLEAN DATA
    // ----------------------------------------------------------

    const name = formData.name.trim();

    const email = formData.email
      .trim()
      .toLowerCase();

    const phoneInput = formData.phone.trim();

    // ----------------------------------------------------------
    // NAME VALIDATION
    // ----------------------------------------------------------

    if (!name) {
      showAlert(
        "Name cannot be empty.",
        "warning"
      );
      return;
    }

    if (name.length < 3) {
      showAlert(
        "Name must be at least 3 characters.",
        "warning"
      );
      return;
    }

    // ----------------------------------------------------------
    // EMAIL VALIDATION
    // ----------------------------------------------------------

    if (!email) {
      showAlert(
        "Email cannot be empty.",
        "warning"
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showAlert(
        "Please enter a valid email address.",
        "warning"
      );
      return;
    }

    // ----------------------------------------------------------
    // PHONE VALIDATION
    // ----------------------------------------------------------

    if (!phoneInput) {
      showAlert(
        "Phone number cannot be empty.",
        "warning"
      );
      return;
    }

    const normalizedPhone =
      normalizePhone(phoneInput);

    if (!normalizedPhone) {
      showAlert(
        "Please enter a valid Indian phone number.",
        "warning"
      );
      return;
    }

    // ----------------------------------------------------------
    // START SAVING
    // ----------------------------------------------------------

    setSaving(true);

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        history.push("/login");
        return;
      }

      // --------------------------------------------------------
      // API REQUEST
      // --------------------------------------------------------

      const response = await fetch(
        `${host}/api/auth/updateProfile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },

          body: JSON.stringify({
            name,
            email,
            phone: normalizedPhone,
          }),
        }
      );

      const json = await response.json();

      console.log(
        "UPDATE PROFILE RESPONSE:",
        json
      );

      // --------------------------------------------------------
      // ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        showAlert(
          json.error ||
            json.message ||
            json.errors?.[0]?.msg ||
            "Unable to update profile.",
          "danger"
        );

        return;
      }

      // --------------------------------------------------------
      // UPDATED USER
      // --------------------------------------------------------

      const updatedUser = {
        name: json.name || name,
        email: json.email || email,
        phone:
          json.phone ||
          normalizedPhone,
      };

      setUser(updatedUser);

      setFormData(updatedUser);

      setEditMode(false);

      // --------------------------------------------------------
      // SUCCESS MESSAGE
      // --------------------------------------------------------

      showAlert(
        "Profile updated successfully!",
        "success"
      );
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      showAlert(
        "Unable to connect to server. Please try again.",
        "danger"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <div className="account-page">
        <div className="account-loading">
          <span className="spinner-border"></span>

          <p>
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ACCOUNT PAGE
  // ============================================================

  return (
    <div className="account-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-heading">
        <span className="section-eyebrow">
          YOUR ACCOUNT
        </span>

        <h1>My Account</h1>

        <p>
          Manage your personal information and
          account details.
        </p>
      </div>

      {/* ======================================================
          MAIN ACCOUNT CARD
      ====================================================== */}

      <section className="account-card">

        {/* ====================================================
            ACCOUNT TOP
        ==================================================== */}

        <div className="account-card-top">

          {/* AVATAR */}

          <div className="account-avatar">
            {user.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </div>

          {/* USER INFORMATION */}

          <div className="account-user-heading">

            <h2>
              {user.name || "User"}
            </h2>

            <p>
              {user.email || "No email"}
            </p>

            {user.phone && (
              <p className="account-phone-preview">
                <i className="fa-solid fa-phone"></i>{" "}
                {user.phone}
              </p>
            )}

            <span className="account-status">
              <i className="fa-solid fa-circle"></i>
              Active account
            </span>

          </div>

          {/* EDIT BUTTON */}

          {!editMode && (
            <button
              type="button"
              className="account-edit-btn"
              onClick={startEditing}
            >
              <i className="fa-solid fa-pen"></i>

              Edit Profile
            </button>
          )}

        </div>

        {/* ====================================================
            DIVIDER
        ==================================================== */}

        <div className="account-divider"></div>

        {/* ====================================================
            VIEW MODE
        ==================================================== */}

        {!editMode ? (
          <div className="account-details">

            {/* FULL NAME */}

            <div className="account-detail-item">

              <div className="account-detail-icon">
                <i className="fa-solid fa-user"></i>
              </div>

              <div>
                <span>
                  Full Name
                </span>

                <strong>
                  {user.name || "Not available"}
                </strong>
              </div>

            </div>

            {/* EMAIL */}

            <div className="account-detail-item">

              <div className="account-detail-icon">
                <i className="fa-solid fa-envelope"></i>
              </div>

              <div>
                <span>
                  Email Address
                </span>

                <strong>
                  {user.email || "Not available"}
                </strong>
              </div>

            </div>

            {/* PHONE */}

            <div className="account-detail-item">

              <div className="account-detail-icon">
                <i className="fa-solid fa-phone"></i>
              </div>

              <div>
                <span>
                  Phone Number
                </span>

                <strong>
                  {user.phone || "Not available"}
                </strong>
              </div>

            </div>

          </div>
        ) : (

          /* ==================================================
             EDIT MODE
          ================================================== */

          <form
            className="account-edit-form"
            onSubmit={updateProfile}
          >

            {/* =================================================
                NAME
            ================================================= */}

            <div className="account-input-group">

              <label htmlFor="account-name">
                Full Name
              </label>

              <div className="account-input-wrapper">

                <i className="fa-solid fa-user"></i>

                <input
                  id="account-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={saving}
                />

              </div>

            </div>

            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="account-input-group">

              <label htmlFor="account-email">
                Email Address
              </label>

              <div className="account-input-wrapper">

                <i className="fa-solid fa-envelope"></i>

                <input
                  id="account-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  disabled={saving}
                />

              </div>

            </div>

            {/* =================================================
                PHONE
            ================================================= */}

            <div className="account-input-group">

              <label htmlFor="account-phone">
                Phone Number
              </label>

              <div className="account-input-wrapper">

                <i className="fa-solid fa-phone"></i>

                <input
                  id="account-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  autoComplete="tel"
                  maxLength={13}
                  disabled={saving}
                />

              </div>

              <span className="form-hint">
                Indian mobile number only
              </span>

            </div>

            {/* =================================================
                FORM ACTIONS
            ================================================= */}

            <div className="account-form-actions">

              {/* CANCEL */}

              <button
                type="button"
                className="account-cancel-btn"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>

              {/* SAVE */}

              <button
                type="submit"
                className="account-save-btn"
                disabled={saving}
              >

                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>

                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check me-2"></i>

                    Save Changes
                  </>
                )}

              </button>

            </div>

          </form>
        )}

      </section>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="account-quick-actions">

        {/* MY NOTES */}

        <button
          type="button"
          onClick={() =>
            history.push("/notes")
          }
          className="account-quick-card"
        >

          <div className="account-quick-icon">
            <i className="fa-solid fa-note-sticky"></i>
          </div>

          <div>
            <strong>
              My Notes
            </strong>

            <span>
              View and manage your notes
            </span>
          </div>

          <i className="fa-solid fa-chevron-right"></i>

        </button>

        {/* RECENT ACTIVITY */}

        <button
          type="button"
          onClick={() =>
            history.push("/recent-activity")
          }
          className="account-quick-card"
        >

          <div className="account-quick-icon">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>

          <div>
            <strong>
              Recent Activity
            </strong>

            <span>
              See your latest account activity
            </span>
          </div>

          <i className="fa-solid fa-chevron-right"></i>

        </button>

        {/* SETTINGS */}

        <button
          type="button"
          onClick={() =>
            history.push("/settings")
          }
          className="account-quick-card"
        >

          <div className="account-quick-icon">
            <i className="fa-solid fa-gear"></i>
          </div>

          <div>
            <strong>
              Settings
            </strong>

            <span>
              Manage preferences and security
            </span>
          </div>

          <i className="fa-solid fa-chevron-right"></i>

        </button>

      </section>

    </div>
  );
};

export default Account;