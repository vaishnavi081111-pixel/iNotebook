
import React, {
  useContext,
  useMemo,
} from "react";
import { useHistory } from "react-router-dom";
import noteContext from "../context/notes/noteContext";
import "./Home.css";

const Home = () => {
  const history = useHistory();
  const context = useContext(noteContext);

  const { notes } = context;

  /* ==========================================================
     SAFE NOTES
  ========================================================== */

  const safeNotes = useMemo(
    () => (Array.isArray(notes) ? notes : []),
    [notes]
  );

  /* ==========================================================
     STATS
  ========================================================== */

  const totalNotes = safeNotes.length;

  const pinnedNotes = useMemo(
    () =>
      safeNotes.filter(
        (note) => note?.pinned === true
      ).length,
    [safeNotes]
  );

  const categoriesCount = useMemo(() => {
    const categories = new Set();

    safeNotes.forEach((note) => {
      if (note?.tag) {
        categories.add(note.tag);
      }
    });

    return categories.size;
  }, [safeNotes]);

  /* ==========================================================
     RECENT NOTES
  ========================================================== */

  const recentNotes = useMemo(() => {
    return [...safeNotes]
      .sort((a, b) => {
        const dateA = new Date(a?.date || 0).getTime();
        const dateB = new Date(b?.date || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 4);
  }, [safeNotes]);

  /* ==========================================================
     DATE FORMAT
  ========================================================== */

  const formatDate = (date) => {
    if (!date) return "Recently";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Recently";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ==========================================================
     DESCRIPTION PREVIEW
  ========================================================== */

  const getPreview = (description) => {
    if (!description) {
      return "No description available.";
    }

    if (description.length > 90) {
      return `${description.substring(0, 90)}...`;
    }

    return description;
  };

  /* ==========================================================
     GREETING
  ========================================================== */

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="home-page">

      <div className="home-container">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="home-hero">

          <div className="home-hero-content">

            <span className="section-eyebrow">
              DASHBOARD
            </span>

            <h1>
              {getGreeting()} 👋
            </h1>

            <p>
              Welcome back to iNotebook. Keep your
              ideas organized and let AI help you
              get more done.
            </p>

            <div className="home-hero-actions">

              <button
                type="button"
                className="primary-action-btn"
                onClick={() =>
                  history.push("/notes")
                }
              >
                <i className="fa-solid fa-plus"></i>
                New Note
              </button>

              <button
                type="button"
                className="secondary-action-btn"
                onClick={() =>
                  history.push("/ai")
                }
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                Ask AI
              </button>

            </div>

          </div>

          <div className="home-hero-visual">

            <div className="hero-orb hero-orb-one"></div>
            <div className="hero-orb hero-orb-two"></div>

            <div className="hero-floating-card">

              <div className="hero-floating-icon">
                <i className="fa-solid fa-brain"></i>
              </div>

              <div>
                <strong>
                  AI Powered
                </strong>

                <span>
                  Your smart workspace
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            STATS
        ================================================== */}

        <section className="home-stats">

          <div className="home-stat-card">

            <div className="home-stat-icon">
              <i className="fa-regular fa-note-sticky"></i>
            </div>

            <div>
              <span>
                Total Notes
              </span>

              <strong>
                {totalNotes}
              </strong>
            </div>

          </div>

          <div className="home-stat-card">

            <div className="home-stat-icon">
              <i className="fa-solid fa-thumbtack"></i>
            </div>

            <div>
              <span>
                Pinned Notes
              </span>

              <strong>
                {pinnedNotes}
              </strong>
            </div>

          </div>

          <div className="home-stat-card">

            <div className="home-stat-icon">
              <i className="fa-solid fa-layer-group"></i>
            </div>

            <div>
              <span>
                Categories
              </span>

              <strong>
                {categoriesCount}
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            RECENT NOTES
        ================================================== */}

        <section className="home-section">

          <div className="home-section-header">

            <div>
              <span className="section-eyebrow">
                YOUR WORKSPACE
              </span>

              <h2>
                Recent Notes
              </h2>

              <p>
                Quickly access the notes you've
                created recently.
              </p>
            </div>

            <button
              type="button"
              className="text-action-btn"
              onClick={() =>
                history.push("/notes")
              }
            >
              View all
              <i className="fa-solid fa-arrow-right"></i>
            </button>

          </div>

          {recentNotes.length === 0 ? (

            <div className="home-empty-state">

              <div className="home-empty-icon">
                <i className="fa-regular fa-note-sticky"></i>
              </div>

              <h3>
                No notes yet
              </h3>

              <p>
                Create your first note and start
                building your workspace.
              </p>

              <button
                type="button"
                className="primary-action-btn"
                onClick={() =>
                  history.push("/notes")
                }
              >
                <i className="fa-solid fa-plus"></i>
                Create your first note
              </button>

            </div>

          ) : (

            <div className="home-notes-grid">

              {recentNotes.map((note) => (

                <article
                  className="home-note-card"
                  key={note?._id}
                  onClick={() =>
                    history.push("/notes")
                  }
                >

                  <div className="home-note-card-top">

                    <div className="home-note-icon">
                      <i className="fa-regular fa-file-lines"></i>
                    </div>

                    {note?.pinned && (
                      <span className="home-note-pinned">
                        <i className="fa-solid fa-thumbtack"></i>
                        Pinned
                      </span>
                    )}

                  </div>

                  <div className="home-note-content">

                    <h3>
                      {note?.title ||
                        "Untitled Note"}
                    </h3>

                    <p>
                      {getPreview(
                        note?.description
                      )}
                    </p>

                  </div>

                  <div className="home-note-footer">

                    <span>
                      <i className="fa-regular fa-calendar"></i>
                      {formatDate(note?.date)}
                    </span>

                    <span className="home-note-tag">
                      {note?.tag || "General"}
                    </span>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* ==================================================
            AI SECTION
        ================================================== */}

        <section className="home-ai-section">

          <div className="home-ai-content">

            <span className="section-eyebrow">
              AI ASSISTANT
            </span>

            <h2>
              Turn your notes into smarter results.
            </h2>

            <p>
              Ask questions, summarize your notes,
              generate MCQs, create flashcards and
              improve your writing with AI.
            </p>

            <button
              type="button"
              className="primary-action-btn"
              onClick={() =>
                history.push("/ai")
              }
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Explore AI
            </button>

          </div>

          <div className="home-ai-visual">

            <div className="ai-visual-circle">

              <i className="fa-solid fa-wand-magic-sparkles"></i>

            </div>

            <div className="ai-mini-card ai-mini-card-one">
              <i className="fa-solid fa-file-lines"></i>
              Summarize
            </div>

            <div className="ai-mini-card ai-mini-card-two">
              <i className="fa-solid fa-lightbulb"></i>
              Explain
            </div>

            <div className="ai-mini-card ai-mini-card-three">
              <i className="fa-solid fa-layer-group"></i>
              Flashcards
            </div>

          </div>

        </section>

        {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="home-section">

          <div className="home-section-header">

            <div>
              <span className="section-eyebrow">
                QUICK ACTIONS
              </span>

              <h2>
                Everything in one place
              </h2>

              <p>
                Jump directly to the tools you
                use most.
              </p>
            </div>

          </div>

          <div className="quick-actions-grid">

            {/* CREATE NOTE */}

            <button
              type="button"
              className="quick-action-card"
              onClick={() =>
                history.push("/notes")
              }
            >

              <div className="quick-action-icon">
                <i className="fa-solid fa-plus"></i>
              </div>

              <div>
                <h3>
                  Create a note
                </h3>

                <p>
                  Capture a new idea or thought.
                </p>
              </div>

              <i className="fa-solid fa-arrow-up-right-from-square quick-action-arrow"></i>

            </button>

            {/* BROWSE NOTES */}

            <button
              type="button"
              className="quick-action-card"
              onClick={() =>
                history.push("/notes")
              }
            >

              <div className="quick-action-icon">
                <i className="fa-regular fa-folder-open"></i>
              </div>

              <div>
                <h3>
                  Browse notes
                </h3>

                <p>
                  Search and organize your notes.
                </p>
              </div>

              <i className="fa-solid fa-arrow-up-right-from-square quick-action-arrow"></i>

            </button>

            {/* RECENT ACTIVITY */}

            <button
              type="button"
              className="quick-action-card"
              onClick={() =>
                history.push("/recent-activity")
              }
            >

              <div className="quick-action-icon">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>

              <div>
                <h3>
                  Recent activity
                </h3>

                <p>
                  See what's happening in your account.
                </p>
              </div>

              <i className="fa-solid fa-arrow-up-right-from-square quick-action-arrow"></i>

            </button>

            {/* AI HISTORY */}

            <button
              type="button"
              className="quick-action-card"
              onClick={() =>
                history.push("/ai-history")
              }
            >

              <div className="quick-action-icon">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>

              <div>
                <h3>
                  AI History
                </h3>

                <p>
                  Revisit your AI conversations and results.
                </p>
              </div>

              <i className="fa-solid fa-arrow-up-right-from-square quick-action-arrow"></i>

            </button>

            {/* SETTINGS */}

            <button
              type="button"
              className="quick-action-card"
              onClick={() =>
                history.push("/settings")
              }
            >

              <div className="quick-action-icon">
                <i className="fa-solid fa-gear"></i>
              </div>

              <div>
                <h3>
                  Workspace settings
                </h3>

                <p>
                  Manage your account preferences.
                </p>
              </div>

              <i className="fa-solid fa-arrow-up-right-from-square quick-action-arrow"></i>

            </button>

          </div>

        </section>

        {/* ==================================================
            PRODUCTIVITY TIP
        ================================================== */}

        <section className="home-tip-card">

          <div className="home-tip-icon">
            <i className="fa-regular fa-lightbulb"></i>
          </div>

          <div>

            <span>
              PRODUCTIVITY TIP
            </span>

            <h3>
              Write it down before you forget it.
            </h3>

            <p>
              Small ideas can become great projects.
              Keep everything organized in iNotebook
              and use AI whenever you need a little help.
            </p>

          </div>

        </section>

      </div>

    </div>
  );
};

export default Home;