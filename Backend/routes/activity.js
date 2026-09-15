const express = require("express");

const router = express.Router();

const fetchuser = require("../middleware/fetchuser");
const Activity = require("../models/Activity");

// ============================================================
// GET RECENT ACTIVITY
// GET /api/activity/recent
// Login required: Yes
// ============================================================

router.get(
  "/recent",
  fetchuser,
  async (req, res) => {
    try {
      const activities = await Activity.find({
        user: req.user.id,
      })
        .sort({
          date: -1,
        })
        .limit(30);

      res.json(activities);
    } catch (error) {
      console.error(
        "FETCH ACTIVITY ERROR:",
        error
      );

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// ============================================================
// CLEAR ACTIVITY
// DELETE /api/activity/clear
// Login required: Yes
// ============================================================

router.delete(
  "/clear",
  fetchuser,
  async (req, res) => {
    try {
      await Activity.deleteMany({
        user: req.user.id,
      });

      res.json({
        success: true,
        message: "Activity cleared successfully",
      });
    } catch (error) {
      console.error(
        "CLEAR ACTIVITY ERROR:",
        error
      );

      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

module.exports = router;