import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

const RecentActivity = ({ showAlert }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchActivities = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/activity/recent",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        }
      );

      const json = await response.json();

      if (response.ok) {
        setActivities(
          Array.isArray(json) ? json : []
        );
      } else {
        showAlert(
          json.error || "Unable to load activity.",
          "danger"
        );
      }
    } catch (error) {
      console.error("ACTIVITY ERROR:", error);

      showAlert(
        "Unable to connect to server.",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const clearActivity = async () => {
    if (clearing) return;

    setClearing(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/activity/clear",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }
      );

      const json = await response.json();

      if (response.ok) {
        setActivities([]);
        setShowClearConfirm(false);

        showAlert(
          "Activity cleared successfully!",
          "success"
        );
      } else {
        showAlert(
          json.error || "Unable to clear activity.",
          "danger"
        );
      }
    } catch (error) {
      console.error(
        "CLEAR ACTIVITY ERROR:",
        error
      );

      showAlert(
        "Unable to connect to server.",
        "danger"
      );
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getIcon = (action) => {
    switch (action) {
      case "created":
        return "fa-solid fa-plus";

      case "updated":
        return "fa-solid fa-pen";

      case "deleted":
        return "fa-solid fa-trash";

      case "login":
        return "fa-solid fa-right-to-bracket";

      case "profile_updated":
        return "fa-solid fa-user-pen";

      case "password_changed":
        return "fa-solid fa-key";

      case "pinned":
        return "fa-solid fa-thumbtack";

      case "unpinned":
        return "fa-solid fa-thumbtack";

      default:
        return "fa-solid fa-clock-rotate-left";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Unknown time";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown time";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="activity-page">
        <div className="activity-container">
          <div className="activity-loading">
            <div className="spinner-border"></div>
            <p>Loading recent activity...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="activity-page">

        <div className="activity-container">

          {/* PAGE HEADER */}
          <header className="activity-page-header">
            <span className="activity-eyebrow">
              HISTORY
            </span>

            <h1>Recent Activity</h1>

            <p>
              See what you've been doing in iNotebook.
            </p>
          </header>

          {/* ACTIVITY SECTION */}
          <section
            className="activity-history-section"
            aria-labelledby="activity-history-title"
          >

            <div className="activity-section-header">

              <div className="activity-section-heading">
                <h2 id="activity-history-title">
                  Activity History
                </h2>

                <p>
                  Your latest account and note activities.
                </p>
              </div>

              {activities.length > 0 && (
                <button
                  type="button"
                  className="clear-activity-btn"
                  onClick={() =>
                    setShowClearConfirm(true)
                  }
                  aria-label="Clear activity history"
                >
                  <i className="fa-solid fa-trash"></i>
                  <span>Clear history</span>
                </button>
              )}

            </div>

            {/* EMPTY STATE */}
            {activities.length === 0 ? (

              <div className="activity-empty">

                <div className="activity-empty-icon">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>

                <h3>No activity yet</h3>

                <p>
                  Your recent account and note
                  activities will appear here.
                </p>

              </div>

            ) : (

              /* ACTIVITY LIST */
              <div className="activity-list">

                {activities.map(
                  (activity, index) => (

                    <article
                      className="activity-item"
                      key={
                        activity._id ||
                        `activity-${index}`
                      }
                    >

                      <div
                        className={`activity-icon activity-icon-${activity.action}`}
                        aria-hidden="true"
                      >
                        <i
                          className={getIcon(
                            activity.action
                          )}
                        ></i>
                      </div>

                      <div className="activity-content">

                        <p className="activity-message">
                          {activity.message}
                        </p>

                        <time
                          className="activity-time"
                          dateTime={
                            activity.date
                              ? new Date(
                                  activity.date
                                ).toISOString()
                              : undefined
                          }
                        >
                          {formatDate(activity.date)}
                        </time>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      </div>

      {/* CLEAR CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div
          className="activity-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !clearing
            ) {
              setShowClearConfirm(false);
            }
          }}
        >
          <div
            className="activity-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-history-title"
            aria-describedby="clear-history-description"
          >

            <div className="activity-confirm-icon">
              <i className="fa-solid fa-trash"></i>
            </div>

            <h2 id="clear-history-title">
              Clear activity history?
            </h2>

            <p id="clear-history-description">
              This will remove all activity records
              from your history.
            </p>

            <div className="activity-confirm-actions">

              <button
                type="button"
                className="activity-cancel-btn"
                onClick={() =>
                  setShowClearConfirm(false)
                }
                disabled={clearing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="activity-clear-confirm-btn"
                onClick={clearActivity}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Clearing...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash"></i>
                    Clear history
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default RecentActivity;