const express = require("express");
const router = express.Router();

const fetchuser = require("../middleware/fetchuser");
const Notes = require("../models/Notes");
const Activity = require("../models/Activity");

const { body, validationResult } = require("express-validator");


// ============================================================
// GET ALL NOTES
// GET /api/notes/fetchallnotes
// Login required: Yes
// ============================================================

router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Notes.find({
      user: req.user.id,
    }).sort({
      date: -1,
    });

    res.json(notes);
  } catch (error) {
    console.error("FETCH NOTES ERROR:", error);
    res.status(500).send("Internal Server Error");
  }
});


// ============================================================
// ADD NOTE
// POST /api/notes/addnote
// Login required: Yes
// ============================================================

router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Title is required").isLength({ min: 1 }),
    body("description", "Description is required").isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const {
        title,
        description,
        tag,
      } = req.body;

      const note = new Notes({
        title,
        description,
        tag: tag || "General",
        user: req.user.id,
      });

      const savedNote = await note.save();

      await Activity.create({
        user: req.user.id,
        action: "created",
        message: `Created note "${savedNote.title}"`,
        noteId: savedNote._id,
        noteTitle: savedNote.title,
      });

      res.json(savedNote);

    } catch (error) {
      console.error("ADD NOTE ERROR:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);


// ============================================================
// UPDATE NOTE
// PUT /api/notes/updatenote/:id
// Login required: Yes
// ============================================================

router.put(
  "/updatenote/:id",
  fetchuser,
  [
    body("title", "Title is required").isLength({ min: 1 }),
    body("description", "Description is required").isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const {
        title,
        description,
        tag,
      } = req.body;

      let note = await Notes.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!note) {
        return res.status(404).json({
          error: "Note not found",
        });
      }

      note.title = title;
      note.description = description;
      note.tag = tag || "General";

      const updatedNote = await note.save();

      await Activity.create({
        user: req.user.id,
        action: "updated",
        message: `Updated note "${updatedNote.title}"`,
        noteId: updatedNote._id,
        noteTitle: updatedNote.title,
      });

      res.json(updatedNote);

    } catch (error) {
      console.error("UPDATE NOTE ERROR:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);


// ============================================================
// DELETE NOTE
// DELETE /api/notes/deletenote/:id
// Login required: Yes
// ============================================================

router.delete(
  "/deletenote/:id",
  fetchuser,
  async (req, res) => {
    try {

      const note = await Notes.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!note) {
        return res.status(404).json({
          error: "Note not found",
        });
      }

      const deletedNote = await Notes.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!deletedNote) {
        return res.status(404).json({
          error: "Note not found",
        });
      }

      await Activity.create({
        user: req.user.id,
        action: "deleted",
        message: `Deleted note "${deletedNote.title}"`,
        noteId: deletedNote._id,
        noteTitle: deletedNote.title,
      });

      res.json({
        success: true,
        message: "Note deleted successfully",
      });

    } catch (error) {
      console.error("DELETE NOTE ERROR:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);


// ============================================================
// TOGGLE PIN
// PUT /api/notes/togglenote/:id/pin
// Login required: Yes
// ============================================================

router.put(
  "/togglenote/:id/pin",
  fetchuser,
  async (req, res) => {
    try {

      const note = await Notes.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!note) {
        return res.status(404).json({
          error: "Note not found",
        });
      }

      note.pinned = !note.pinned;

      const updatedNote = await note.save();

      await Activity.create({
        user: req.user.id,
        action: updatedNote.pinned ? "pinned" : "unpinned",
        message: updatedNote.pinned
          ? `Pinned note "${updatedNote.title}"`
          : `Unpinned note "${updatedNote.title}"`,
        noteId: updatedNote._id,
        noteTitle: updatedNote.title,
      });

      res.json(updatedNote);

    } catch (error) {
      console.error("TOGGLE PIN ERROR:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);


module.exports = router;