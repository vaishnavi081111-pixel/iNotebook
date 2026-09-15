import React, { useContext, useMemo, useState } from "react";
import noteContext from "../context/notes/noteContext";
import Noteitem from "./Noteitem";

const Notes = (props) => {
  const context = useContext(noteContext);

  const { notes = [] } = context;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  const tags = useMemo(() => {
    const uniqueTags = [
      ...new Set(
        notes.map((note) => note?.tag?.trim() || "General")
      ),
    ];

    return ["All", ...uniqueTags];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return notes.filter((note) => {
      const title = String(note?.title || "").toLowerCase();
      const description = String(
        note?.description || ""
      ).toLowerCase();
      const tag = String(
        note?.tag || "General"
      ).toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        description.includes(search) ||
        tag.includes(search);

      const noteTag = note?.tag || "General";

      const matchesTag =
        selectedTag === "All" ||
        noteTag === selectedTag;

      return matchesSearch && matchesTag;
    });
  }, [notes, searchTerm, selectedTag]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag("All");
  };

  return (
    <section className="notes-section">

      <div className="notes-header-row">

        <div>
          <span className="section-eyebrow">
            YOUR COLLECTION
          </span>

          <h2 className="notes-heading">
            Your Notes
          </h2>

          <p className="notes-subtitle">
            Keep your thoughts organized and easy to find.
          </p>
        </div>

        <div className="notes-header-right">

          <div className="notes-search">
            <i className="fa-solid fa-magnifying-glass"></i>

            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            {searchTerm && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchTerm("")}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="tag-filter">
            <i className="fa-solid fa-filter"></i>

            <select
              value={selectedTag}
              onChange={(e) =>
                setSelectedTag(e.target.value)
              }
            >
              {tags.map((tag) => (
                <option value={tag} key={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <span className="notes-count">
            {searchTerm || selectedTag !== "All"
              ? `${filteredNotes.length} ${
                  filteredNotes.length === 1
                    ? "Result"
                    : "Results"
                }`
              : `${notes.length} ${
                  notes.length === 1
                    ? "Note"
                    : "Notes"
                }`}
          </span>

        </div>
      </div>

      {notes.length === 0 ? (
        <div className="empty-notes">
          <div className="empty-icon">
            <i className="fa-regular fa-note-sticky"></i>
          </div>

          <h4>No notes yet</h4>

          <p>
            Create your first note and keep your ideas organized.
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="empty-notes">
          <div className="empty-icon">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>

          <h4>No notes found</h4>

          <p>
            Try another keyword or tag.
          </p>

          <button
            type="button"
            className="clear-search-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note, index) => (
            <Noteitem
              key={note?._id || `note-${index}`}
              note={note}
              showAlert={props.showAlert}
            />
          ))}
        </div>
      )}

    </section>
  );
};

export default Notes;