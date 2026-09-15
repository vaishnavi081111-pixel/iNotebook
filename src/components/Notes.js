import React, {
  useContext,
  useMemo,
  useState,
} from "react";
import noteContext from "../context/notes/noteContext";

const Notes = ({ showAlert }) => {
  const context = useContext(noteContext);

  const {
    notes,
    addNote,
    deleteNote,
    editNote,
    togglePin,
  } = context;

  const safeNotes = useMemo(
    () => (Array.isArray(notes) ? notes : []),
    [notes]
  );

  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tag: "General",
  });

  const [saving, setSaving] = useState(false);

  /* ==========================================================
     TAGS
  ========================================================== */

  const tags = useMemo(() => {
    const uniqueTags = new Set();

    safeNotes.forEach((note) => {
      if (note?.tag) {
        uniqueTags.add(note.tag);
      }
    });

    return ["All", ...Array.from(uniqueTags)];
  }, [safeNotes]);

  /* ==========================================================
     FILTER NOTES
  ========================================================== */

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeNotes.filter((note) => {
      const title =
        note?.title?.toLowerCase() || "";

      const description =
        note?.description?.toLowerCase() || "";

      const tag =
        note?.tag?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        tag.includes(query);

      const matchesTag =
        selectedTag === "All" ||
        note?.tag === selectedTag;

      return matchesSearch && matchesTag;
    });
  }, [safeNotes, search, selectedTag]);

  /* ==========================================================
     FORM
  ========================================================== */

  const openCreateModal = () => {
    setEditingNote(null);

    setFormData({
      title: "",
      description: "",
      tag: "General",
    });

    setShowModal(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);

    setFormData({
      title: note?.title || "",
      description: note?.description || "",
      tag: note?.tag || "General",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingNote(null);

    setFormData({
      title: "",
      description: "",
      tag: "General",
    });
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  /* ==========================================================
     SAVE NOTE
  ========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = formData.title.trim();
    const description = formData.description.trim();
    const tag = formData.tag.trim() || "General";

    if (!title) {
      showAlert("Please enter a note title.", "danger");
      return;
    }

    if (!description) {
      showAlert(
        "Please enter a note description.",
        "danger"
      );
      return;
    }

    setSaving(true);

    try {
      let success = false;

      if (editingNote) {
        success = await editNote(
          editingNote._id,
          title,
          description,
          tag
        );

        if (success) {
          showAlert(
            "Note updated successfully.",
            "success"
          );
        }
      } else {
        success = await addNote(
          title,
          description,
          tag
        );

        if (success) {
          showAlert(
            "Note created successfully.",
            "success"
          );
        }
      }

      if (success) {
        closeModal();
      } else {
        showAlert(
          editingNote
            ? "Unable to update note."
            : "Unable to create note.",
          "danger"
        );
      }
    } catch (error) {
      console.error("SAVE NOTE ERROR:", error);

      showAlert(
        "Something went wrong. Please try again.",
        "danger"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     PIN / UNPIN
  ========================================================== */

  const handleTogglePin = async (note) => {
    if (!note?._id) return;

    try {
      const success = await togglePin(note._id);

      if (success) {
        showAlert(
          note.pinned
            ? "Note unpinned."
            : "Note pinned.",
          "success"
        );
      } else {
        showAlert(
          "Unable to update pin status.",
          "danger"
        );
      }
    } catch (error) {
      console.error("TOGGLE PIN ERROR:", error);

      showAlert(
        "Something went wrong while updating the note.",
        "danger"
      );
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const confirmDelete = (note) => {
    setDeleteTarget(note);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    const id = deleteTarget._id;

    try {
      const success = await deleteNote(id);

      if (success) {
        showAlert(
          "Note deleted successfully.",
          "success"
        );
      } else {
        showAlert(
          "Unable to delete note.",
          "danger"
        );
      }
    } catch (error) {
      console.error("DELETE NOTE ERROR:", error);

      showAlert(
        "Something went wrong while deleting the note.",
        "danger"
      );
    }

    setDeleteTarget(null);
  };

  /* ==========================================================
     FORMAT DATE
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
     PREVIEW
  ========================================================== */

  const getPreview = (description) => {
    if (!description) {
      return "No description available.";
    }

    if (description.length > 150) {
      return `${description.substring(0, 150)}...`;
    }

    return description;
  };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="notes-page">
      <div className="notes-container">

        {/* ====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="notes-page-header">

          <div>
            <span className="section-eyebrow">
              YOUR WORKSPACE
            </span>

            <h1>My Notes</h1>

            <p>
              Create, organize and manage all your ideas
              in one place.
            </p>
          </div>

          <button
            type="button"
            className="primary-action-btn"
            onClick={openCreateModal}
          >
            <i className="fa-solid fa-plus"></i>
            New Note
          </button>

        </div>

        {/* ====================================================
            TOOLBAR
        ===================================================== */}

        <div className="notes-toolbar">

          <div className="notes-search">

            <i className="fa-solid fa-magnifying-glass"></i>

            <input
              type="text"
              placeholder="Search your notes..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch("")}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}

          </div>

          <div className="notes-toolbar-right">

            <div className="notes-count">
              <strong>
                {filteredNotes.length}
              </strong>

              <span>
                {filteredNotes.length === 1
                  ? "note"
                  : "notes"}
              </span>
            </div>

          </div>

        </div>

        {/* ====================================================
            TAG FILTERS
        ===================================================== */}

        <div className="notes-filters">

          <div className="filter-label">
            <i className="fa-solid fa-filter"></i>
            Filter
          </div>

          <div className="tag-filters">

            {tags.map((tag) => (
              <button
                type="button"
                key={tag}
                className={`tag-filter ${
                  selectedTag === tag
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedTag(tag)
                }
              >
                {tag}
              </button>
            ))}

          </div>

        </div>

        {/* ====================================================
            NOTES
        ===================================================== */}

        {filteredNotes.length === 0 ? (

          <div className="notes-empty-state">

            <div className="notes-empty-icon">
              <i className="fa-regular fa-note-sticky"></i>
            </div>

            {safeNotes.length === 0 ? (
              <>
                <h2>Your notebook is empty</h2>

                <p>
                  Start by creating your first note.
                  Your ideas deserve a place to live.
                </p>

                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={openCreateModal}
                >
                  <i className="fa-solid fa-plus"></i>
                  Create your first note
                </button>
              </>
            ) : (
              <>
                <h2>No notes found</h2>

                <p>
                  Try changing your search or selecting
                  another category.
                </p>

                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={() => {
                    setSearch("");
                    setSelectedTag("All");
                  }}
                >
                  Clear filters
                </button>
              </>
            )}

          </div>

        ) : (

          <div className="notes-grid">

            {filteredNotes.map((note) => (

              <article
                className="note-card"
                key={note._id}
              >

                {/* CARD TOP */}

                <div className="note-card-top">

                  <div className="note-card-icon">
                    <i className="fa-regular fa-file-lines"></i>
                  </div>

                  <div className="note-card-actions">

                    <button
                      type="button"
                      title={
                        note?.pinned
                          ? "Unpin note"
                          : "Pin note"
                      }
                      className={`pin-toggle-btn ${
                        note?.pinned ? "active" : ""
                      }`}
                      onClick={() =>
                        handleTogglePin(note)
                      }
                    >
                      <i className="fa-solid fa-thumbtack"></i>
                    </button>

                    <button
                      type="button"
                      title="Edit note"
                      onClick={() =>
                        openEditModal(note)
                      }
                    >
                      <i className="fa-regular fa-pen-to-square"></i>
                    </button>

                    <button
                      type="button"
                      title="Delete note"
                      className="delete-note-btn"
                      onClick={() =>
                        confirmDelete(note)
                      }
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>

                  </div>

                </div>

                {/* CARD CONTENT */}

                <div className="note-card-content">

                  <h2>
                    {note?.title ||
                      "Untitled Note"}
                  </h2>

                  <p>
                    {getPreview(
                      note?.description
                    )}
                  </p>

                </div>

                {/* CARD FOOTER */}

                <div className="note-card-footer">

                  <span className="note-card-date">
                    <i className="fa-regular fa-calendar"></i>
                    {formatDate(note?.date)}
                  </span>

                  <span className="note-card-tag">
                    {note?.tag || "General"}
                  </span>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

      {/* ======================================================
          CREATE / EDIT MODAL
      ======================================================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="note-modal">

            <div className="note-modal-header">

              <div>

                <span className="section-eyebrow">
                  {editingNote
                    ? "EDIT NOTE"
                    : "NEW NOTE"}
                </span>

                <h2>
                  {editingNote
                    ? "Update your note"
                    : "Create a new note"}
                </h2>

                <p>
                  {editingNote
                    ? "Make changes to your existing note."
                    : "Write down an idea before it disappears."}
                </p>

              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

            </div>

            <form
              className="note-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label htmlFor="note-title">
                  Title
                </label>

                <input
                  id="note-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Give your note a title..."
                  maxLength={100}
                  autoFocus
                />

              </div>

              <div className="form-group">

                <label htmlFor="note-description">
                  Description
                </label>

                <textarea
                  id="note-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Start writing your thoughts..."
                  rows="8"
                  maxLength={5000}
                ></textarea>

                <div className="textarea-counter">
                  {formData.description.length}
                  /5000
                </div>

              </div>

              <div className="form-group">

                <label htmlFor="note-tag">
                  Category
                </label>

                <div className="select-wrapper">

                  <select
                    id="note-tag"
                    name="tag"
                    value={formData.tag}
                    onChange={handleChange}
                  >
                    <option value="General">
                      General
                    </option>

                    <option value="Work">
                      Work
                    </option>

                    <option value="Study">
                      Study
                    </option>

                    <option value="Personal">
                      Personal
                    </option>

                    <option value="Ideas">
                      Ideas
                    </option>

                    <option value="Projects">
                      Projects
                    </option>
                  </select>

                  <i className="fa-solid fa-chevron-down"></i>

                </div>

              </div>

              <div className="note-modal-footer">

                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="auth-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i>

                      {editingNote
                        ? "Save changes"
                        : "Create note"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          DELETE CONFIRMATION
      ======================================================= */}

      {deleteTarget && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              cancelDelete();
            }
          }}
        >

          <div className="confirm-modal">

            <div className="confirm-icon">
              <i className="fa-regular fa-trash-can"></i>
            </div>

            <h2>Delete this note?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                "{deleteTarget?.title ||
                  "this note"}"
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="confirm-actions">

              <button
                type="button"
                className="secondary-action-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-action-btn"
                onClick={handleDelete}
              >
                <i className="fa-regular fa-trash-can"></i>
                Delete note
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default Notes;