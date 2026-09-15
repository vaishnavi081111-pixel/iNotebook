const express = require("express");

const AIHistory = require("../models/AIHistory");
const fetchuser = require("../middleware/fetchuser");

const router = express.Router();

/* ============================================================
   GET AI HISTORY
   GET /api/ai-history

   Login required: Yes

   Returns the logged-in user's AI history.
============================================================ */

router.get("/", fetchuser, async (req, res) => {
  try {
    const history = await AIHistory.find({
      user: req.user.id,
    })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("GET AI HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Unable to fetch AI history.",
    });
  }
});

/* ============================================================
   DELETE ONE AI HISTORY ITEM
   DELETE /api/ai-history/:id

   Login required: Yes
============================================================ */

router.delete("/:id", fetchuser, async (req, res) => {
  try {
    const historyId = req.params.id;

    const historyItem = await AIHistory.findOne({
      _id: historyId,
      user: req.user.id,
    });

    if (!historyItem) {
      return res.status(404).json({
        success: false,
        error: "AI history item not found.",
      });
    }

    await AIHistory.findOneAndDelete({
      _id: historyId,
      user: req.user.id,
    });

    res.json({
      success: true,
      message: "AI history deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE AI HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Unable to delete AI history.",
    });
  }
});

/* ============================================================
   CLEAR ALL AI HISTORY
   DELETE /api/ai-history

   Login required: Yes
============================================================ */

router.delete("/", fetchuser, async (req, res) => {
  try {
    const result = await AIHistory.deleteMany({
      user: req.user.id,
    });

    res.json({
      success: true,
      message: "AI history cleared successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("CLEAR AI HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Unable to clear AI history.",
    });
  }
});

module.exports = router;