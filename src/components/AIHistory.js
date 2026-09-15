
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useHistory } from "react-router-dom";

const HOST = "http://localhost:5000";

const AIHistory = ({ showAlert }) => {
  const history = useHistory();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [clearing, setClearing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  // Custom confirmation modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    id: null,
  });

  /* ============================================================
     FETCH AI HISTORY
  ============================================================ */

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      history.push("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${HOST}/api/ai-history`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to fetch AI history."
        );
      }

      setItems(
        Array.isArray(data.history)
          ? data.history
          : []
      );
    } catch (error) {
      console.error(
        "FETCH AI HISTORY ERROR:",
        error
      );

      if (showAlert) {
        showAlert(
          error.message ||
            "Unable to load AI history.",
          "danger"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [history, showAlert]);

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /* ============================================================
     CLOSE CONFIRM MODAL WITH ESC
  ============================================================ */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setConfirmModal({
          open: false,
          type: null,
          id: null,
        });
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* ============================================================
     OPEN DELETE MODAL
  ============================================================ */

  const openDeleteModal = (id) => {
    if (!id || deletingId || clearing) {
      return;
    }

    setConfirmModal({
      open: true,
      type: "single",
      id,
    });
  };

  /* ============================================================
     OPEN CLEAR ALL MODAL
  ============================================================ */

  const openClearAllModal = () => {
    if (
      clearing ||
      deletingId ||
      items.length === 0
    ) {
      return;
    }

    setConfirmModal({
      open: true,
      type: "all",
      id: null,
    });
  };

  /* ============================================================
     CLOSE CONFIRM MODAL
  ============================================================ */

  const closeConfirmModal = () => {
    if (deletingId || clearing) {
      return;
    }

    setConfirmModal({
      open: false,
      type: null,
      id: null,
    });
  };

  /* ============================================================
     DELETE SINGLE HISTORY
  ============================================================ */

  const deleteHistory = async (id) => {
    if (!id || deletingId) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setDeletingId(id);

      const response = await fetch(
        `${HOST}/api/ai-history/${id}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to delete history."
        );
      }

      setItems((previousItems) =>
        previousItems.filter(
          (item) => item._id !== id
        )
      );

      if (expandedId === id) {
        setExpandedId(null);
      }

      setConfirmModal({
        open: false,
        type: null,
        id: null,
      });

      if (showAlert) {
        showAlert(
          "AI history deleted successfully.",
          "success"
        );
      }
    } catch (error) {
      console.error(
        "DELETE AI HISTORY ERROR:",
        error
      );

      if (showAlert) {
        showAlert(
          error.message ||
            "Unable to delete history.",
          "danger"
        );
      }
    } finally {
      setDeletingId("");
    }
  };

  /* ============================================================
     CLEAR ALL HISTORY
  ============================================================ */

  const clearAllHistory = async () => {
    if (
      clearing ||
      items.length === 0
    ) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setClearing(true);

      const response = await fetch(
        `${HOST}/api/ai-history`,
        {
          method: "DELETE",

          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to clear AI history."
        );
      }

      setItems([]);
      setExpandedId(null);

      setConfirmModal({
        open: false,
        type: null,
        id: null,
      });

      if (showAlert) {
        showAlert(
          "All AI history cleared.",
          "success"
        );
      }
    } catch (error) {
      console.error(
        "CLEAR AI HISTORY ERROR:",
        error
      );

      if (showAlert) {
        showAlert(
          error.message ||
            "Unable to clear AI history.",
          "danger"
        );
      }
    } finally {
      setClearing(false);
    }
  };

  /* ============================================================
     CONFIRM ACTION
  ============================================================ */

  const handleConfirmDelete = () => {
    if (
      confirmModal.type === "single" &&
      confirmModal.id
    ) {
      deleteHistory(confirmModal.id);
      return;
    }

    if (
      confirmModal.type === "all"
    ) {
      clearAllHistory();
    }
  };

  /* ============================================================
     FORMAT DATE
  ============================================================ */

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* ============================================================
     FORMAT ACTION
  ============================================================ */

  const formatAction = (action) => {
    if (!action) {
      return "AI Chat";
    }

    const actionMap = {
      chat: "AI Chat",
      summarize: "Summarize",
      explain: "Explain",
      mcq: "MCQ Generator",
      flashcards: "Flashcards",
      ask: "Ask About Notes",
      improve: "Improve Notes",
    };

    return (
      actionMap[action] ||
      action
        .replace(/-/g, " ")
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        )
    );
  };

  /* ============================================================
     GET ICON
  ============================================================ */

  const getActionIcon = (action) => {
    const icons = {
      chat: "fa-comments",
      summarize: "fa-compress-alt",
      explain: "fa-lightbulb",
      mcq: "fa-list-check",
      flashcards: "fa-layer-group",
      ask: "fa-circle-question",
      improve: "fa-wand-magic-sparkles",
    };

    return (
      icons[action] ||
      "fa-robot"
    );
  };

  /* ============================================================
     FILTER + SEARCH
  ============================================================ */

  const filteredItems = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        item.type === filter ||
        item.action === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        item.title,
        item.action,
        item.prompt,
        item.response,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        query
      );
    });
  }, [items, search, filter]);

  /* ============================================================
     TOGGLE ITEM
  ============================================================ */

  const toggleExpanded = (id) => {
    setExpandedId(
      (previousId) =>
        previousId === id
          ? null
          : id
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="ai-history-page">
      <div className="ai-history-container">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <section className="ai-history-header">

          <div className="ai-history-heading">

            <div className="ai-history-icon">
              <i className="fas fa-clock-rotate-left"></i>
            </div>

            <div>
              <span className="ai-history-eyebrow">
                AI ACTIVITY
              </span>

              <h1>AI History</h1>

              <p>
                View everything you've asked
                and done with iNotebook AI.
              </p>
            </div>

          </div>

          <div className="ai-history-header-actions">

            <button
              type="button"
              className="ai-history-back-btn"
              onClick={() =>
                history.push("/ai")
              }
            >
              <i className="fas fa-arrow-left"></i>
              Back to AI
            </button>

            {items.length > 0 && (
              <button
                type="button"
                className="ai-history-clear-btn"
                onClick={openClearAllModal}
                disabled={
                  clearing ||
                  Boolean(deletingId)
                }
              >
                <i className="fas fa-trash"></i>

                {clearing
                  ? "Clearing..."
                  : "Clear All"}
              </button>
            )}

          </div>

        </section>

        {/* ======================================================
            TOOLBAR
        ====================================================== */}

        {!loading &&
          items.length > 0 && (
            <section className="ai-history-toolbar">

              <div className="ai-history-search">

                <i className="fas fa-search"></i>

                <input
                  type="text"
                  placeholder="Search AI history..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}

              </div>

              <div className="ai-history-filters">

                <button
                  type="button"
                  className={
                    filter === "all"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter("all")
                  }
                >
                  All
                </button>

                <button
                  type="button"
                  className={
                    filter === "chat"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter("chat")
                  }
                >
                  Chats
                </button>

                <button
                  type="button"
                  className={
                    filter === "note-action"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      "note-action"
                    )
                  }
                >
                  Note Actions
                </button>

              </div>

            </section>
          )}

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading && (
          <section className="ai-history-state">

            <div className="ai-history-loader">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <h3>
              Loading AI history...
            </h3>

            <p>
              Getting your recent AI
              activity.
            </p>

          </section>
        )}

        {/* ======================================================
            EMPTY STATE
        ====================================================== */}

        {!loading &&
          items.length === 0 && (
            <section className="ai-history-empty">

              <div className="ai-history-empty-icon">
                <i className="fas fa-robot"></i>
              </div>

              <h2>
                No AI history yet
              </h2>

              <p>
                Your AI conversations and
                note actions will appear here
                automatically.
              </p>

              <button
                type="button"
                onClick={() =>
                  history.push("/ai")
                }
              >
                <i className="fas fa-sparkles"></i>
                Start using AI
              </button>

            </section>
          )}

        {/* ======================================================
            NO SEARCH RESULTS
        ====================================================== */}

        {!loading &&
          items.length > 0 &&
          filteredItems.length === 0 && (
            <section className="ai-history-empty compact">

              <div className="ai-history-empty-icon">
                <i className="fas fa-search"></i>
              </div>

              <h2>
                No matching history
              </h2>

              <p>
                Try another search or filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>

            </section>
          )}

        {/* ======================================================
            HISTORY LIST
        ====================================================== */}

        {!loading &&
          filteredItems.length > 0 && (
            <section className="ai-history-list">

              <div className="ai-history-list-top">

                <div>
                  <span>
                    YOUR AI ACTIVITY
                  </span>

                  <strong>
                    {filteredItems.length}{" "}
                    {filteredItems.length === 1
                      ? "item"
                      : "items"}
                  </strong>
                </div>

              </div>

              {filteredItems.map((item) => {

                const isExpanded =
                  expandedId ===
                  item._id;

                return (
                  <article
                    className={`ai-history-card ${
                      isExpanded
                        ? "expanded"
                        : ""
                    }`}
                    key={item._id}
                  >

                    {/* CARD TOP */}

                    <div className="ai-history-card-top">

                      <div className="ai-history-card-icon">
                        <i
                          className={`fas ${getActionIcon(
                            item.action
                          )}`}
                        ></i>
                      </div>

                      <div className="ai-history-card-main">

                        <div className="ai-history-card-title-row">

                          <h3>
                            {item.title ||
                              "AI Conversation"}
                          </h3>

                          <span
                            className={`ai-history-type ${
                              item.type ===
                              "note-action"
                                ? "note"
                                : "chat"
                            }`}
                          >
                            {formatAction(
                              item.action
                            )}
                          </span>

                        </div>

                        <span className="ai-history-date">
                          <i className="far fa-clock"></i>
                          {formatDate(
                            item.date ||
                              item.createdAt
                          )}
                        </span>

                      </div>

                      <div className="ai-history-card-actions">

                        <button
                          type="button"
                          className="ai-history-expand-btn"
                          onClick={() =>
                            toggleExpanded(
                              item._id
                            )
                          }
                          aria-label={
                            isExpanded
                              ? "Collapse"
                              : "Expand"
                          }
                        >
                          <i
                            className={`fas ${
                              isExpanded
                                ? "fa-chevron-up"
                                : "fa-chevron-down"
                            }`}
                          ></i>
                        </button>

                        <button
                          type="button"
                          className="ai-history-delete-btn"
                          onClick={() =>
                            openDeleteModal(
                              item._id
                            )
                          }
                          disabled={
                            deletingId ===
                              item._id ||
                            clearing
                          }
                          aria-label="Delete"
                        >
                          <i
                            className={`fas ${
                              deletingId ===
                              item._id
                                ? "fa-spinner fa-spin"
                                : "fa-trash"
                            }`}
                          ></i>
                        </button>

                      </div>

                    </div>

                    {/* PROMPT */}

                    <div className="ai-history-prompt">

                      <span>
                        <i className="fas fa-user"></i>
                        You
                      </span>

                      <p>
                        {item.prompt ||
                          "AI action performed on your notes."}
                      </p>

                    </div>

                    {/* RESPONSE */}

                    {isExpanded && (
                      <div className="ai-history-response">

                        <div className="ai-history-response-heading">

                          <span>
                            <i className="fas fa-robot"></i>
                            iNotebook AI
                          </span>

                          {item.noteCount >
                            0 && (
                            <small>
                              {item.noteCount}{" "}
                              {item.noteCount ===
                              1
                                ? "note"
                                : "notes"}{" "}
                              used
                            </small>
                          )}

                        </div>

                        <div className="ai-history-response-content">
                          {item.response ||
                            "No response saved."}
                        </div>

                      </div>
                    )}

                    {/* FOOTER */}

                    <div className="ai-history-card-footer">

                      <span>
                        <i className="fas fa-bolt"></i>

                        {item.type ===
                        "note-action"
                          ? "Note AI"
                          : "AI Assistant"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          toggleExpanded(
                            item._id
                          )
                        }
                      >
                        {isExpanded
                          ? "Hide response"
                          : "View response"}

                        <i
                          className={`fas ${
                            isExpanded
                              ? "fa-arrow-up"
                              : "fa-arrow-right"
                          }`}
                        ></i>
                      </button>

                    </div>

                  </article>
                );
              })}

            </section>
          )}

      </div>

      {/* ========================================================
          CUSTOM DELETE CONFIRMATION MODAL
      ======================================================== */}

      {confirmModal.open && (
        <div
          className="ai-history-confirm-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeConfirmModal();
            }
          }}
        >
          <div
            className="ai-history-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-history-confirm-title"
          >

            <div className="ai-history-confirm-icon">
              <i className="fas fa-trash"></i>
            </div>

            <div className="ai-history-confirm-content">

              <h2 id="ai-history-confirm-title">
                {confirmModal.type ===
                "all"
                  ? "Clear all AI history?"
                  : "Delete this AI history?"}
              </h2>

              <p>
                {confirmModal.type ===
                "all"
                  ? "This will permanently remove all your AI conversations and note actions. This action cannot be undone."
                  : "This AI conversation will be permanently deleted. This action cannot be undone."}
              </p>

            </div>

            <div className="ai-history-confirm-actions">

              <button
                type="button"
                className="ai-history-confirm-cancel"
                onClick={
                  closeConfirmModal
                }
                disabled={
                  deletingId ||
                  clearing
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="ai-history-confirm-delete"
                onClick={
                  handleConfirmDelete
                }
                disabled={
                  deletingId ||
                  clearing
                }
              >
                {deletingId ||
                clearing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    {confirmModal.type ===
                    "all"
                      ? "Clear All"
                      : "Delete"}
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  );
};

export default AIHistory;

