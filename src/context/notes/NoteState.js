import React, {
  useState,
  useEffect,
  useCallback,
} from "react";

import { useLocation } from "react-router-dom";

import noteContext from "./noteContext";


const NoteState = (props) => {

  const host = "https://inotebook-dw4s.onrender.com";

  const [notes, setNotes] = useState([]);

  const location = useLocation();


  // ============================================================
  // GET NOTES
  // ============================================================

  const getNotes = useCallback(async () => {

    try {

      const response = await fetch(
        `${host}/api/notes/fetchallnotes`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }
      );

      const json = await response.json();

      if (response.ok) {
        setNotes(json);
        return json;
      }

      console.error("GET NOTES ERROR:", json);

      return [];

    } catch (error) {

      console.error("GET NOTES ERROR:", error);

      return [];
    }

  }, []);


  // ============================================================
  // ADD NOTE
  // ============================================================

  const addNote = async (
    title,
    description,
    tag
  ) => {

    try {

      const response = await fetch(
        `${host}/api/notes/addnote`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },

          body: JSON.stringify({
            title,
            description,
            tag,
          }),
        }
      );

      const note = await response.json();

      if (response.ok) {

        setNotes((prevNotes) => [
          note,
          ...prevNotes,
        ]);

        return true;
      }

      console.error("ADD NOTE ERROR:", note);

      return false;

    } catch (error) {

      console.error("ADD NOTE ERROR:", error);

      return false;
    }
  };


  // ============================================================
  // DELETE NOTE
  // ============================================================

  const deleteNote = async (id) => {

    try {

      const response = await fetch(
        `${host}/api/notes/deletenote/${id}`,
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

        setNotes((prevNotes) =>
          prevNotes.filter(
            (note) => note._id !== id
          )
        );

        return true;
      }

      console.error("DELETE NOTE ERROR:", json);

      return false;

    } catch (error) {

      console.error("DELETE NOTE ERROR:", error);

      return false;
    }
  };


  // ============================================================
  // EDIT NOTE
  // ============================================================

  const editNote = async (
    id,
    title,
    description,
    tag
  ) => {

    try {

      const response = await fetch(
        `${host}/api/notes/updatenote/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },

          body: JSON.stringify({
            title,
            description,
            tag,
          }),
        }
      );

      const updatedNote = await response.json();

      if (response.ok) {

        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === id
              ? updatedNote
              : note
          )
        );

        return true;
      }

      console.error(
        "EDIT NOTE ERROR:",
        updatedNote
      );

      return false;

    } catch (error) {

      console.error(
        "EDIT NOTE ERROR:",
        error
      );

      return false;
    }
  };


  // ============================================================
  // TOGGLE PIN
  // ============================================================

  const togglePin = async (id) => {

    try {

      const response = await fetch(
        `${host}/api/notes/togglenote/${id}/pin`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }
      );

      const updatedNote = await response.json();

      if (response.ok) {

        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === id
              ? updatedNote
              : note
          )
        );

        return true;
      }

      console.error(
        "TOGGLE PIN ERROR:",
        updatedNote
      );

      return false;

    } catch (error) {

      console.error(
        "TOGGLE PIN ERROR:",
        error
      );

      return false;
    }
  };


  // ============================================================
  // GET NOTES WHEN ROUTE CHANGES
  // ============================================================

  useEffect(() => {

    if (localStorage.getItem("token")) {
      getNotes();
    }

  }, [location.pathname, getNotes]);


  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  return (
    <noteContext.Provider
      value={{
        notes,
        addNote,
        deleteNote,
        editNote,
        togglePin,
        getNotes,
      }}
    >
      {props.children}
    </noteContext.Provider>
  );
};


export default NoteState;