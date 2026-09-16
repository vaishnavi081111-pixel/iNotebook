require("dotenv").config();

const connectToMongo = require("./db");
const express = require("express");
const cors = require("cors");

connectToMongo();

const app = express();

const port = process.env.PORT || 5000;


/* ============================================================
   CORS
   ============================================================ */

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://inotebook-frontend-jn8s.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "auth-token"],
  })
);

/* ============================================================
   BODY PARSER
   ============================================================ */

app.use(express.json());


/* ============================================================
   HEALTH CHECK
   ============================================================ */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "iNotebook backend is running",
  });
});


/* ============================================================
   API ROUTES
   ============================================================ */

app.use(
  "/api/auth",
  require("./routes/auth")
);

app.use(
  "/api/notes",
  require("./routes/notes")
);

app.use(
  "/api/activity",
  require("./routes/activity")
);

app.use(
  "/api/ai",
  require("./routes/ai")
);


/* ============================================================
   AI HISTORY
   ============================================================ */

app.use(
  "/api/ai-history",
  require("./routes/aiHistory")
);


/* ============================================================
   START SERVER
   ============================================================ */

app.listen(port, () => {
  console.log(
    `iNotebook backend listening on port ${port}`
  );
});