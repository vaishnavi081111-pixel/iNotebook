const express = require("express");

const Groq = require("groq-sdk");

const Notes = require("../models/Notes");
const AIHistory = require("../models/AIHistory");

const fetchuser = require("../middleware/fetchuser");

const router = express.Router();

/* ============================================================
   GROQ CLIENT
============================================================ */

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ============================================================
   MODEL
============================================================ */

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  "openai/gpt-oss-120b";

/* ============================================================
   HELPER
   CALL GROQ
============================================================ */

const callGroq = async ({
  systemPrompt,
  userPrompt,
  temperature = 0.4,
  maxTokens = 2500,
}) => {
  const completion =
    await groq.chat.completions.create({
      model: GROQ_MODEL,

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],

      temperature,

      max_tokens: maxTokens,
    });

  return (
    completion?.choices?.[0]?.message?.content ||
    ""
  ).trim();
};

/* ============================================================
   HELPER
   SAVE AI HISTORY
============================================================ */

const saveAIHistory = async ({
  userId,
  type = "chat",
  action = "chat",
  title = "AI Conversation",
  prompt = "",
  response = "",
  noteCount = 0,
  noteId = null,
}) => {
  try {
    await AIHistory.create({
      user: userId,
      type,
      action,
      title,
      prompt,
      response,
      noteCount,
      noteId,
    });
  } catch (error) {
    /*
      History failure should NOT break the actual AI response.
    */

    console.error(
      "SAVE AI HISTORY ERROR:",
      error
    );
  }
};

/* ============================================================
   HELPER
   GET USER NOTES
============================================================ */

const getUserNotes = async (userId) => {
  const notes = await Notes.find({
    user: userId,
  })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  return notes;
};

/* ============================================================
   HELPER
   FORMAT NOTES
============================================================ */

const formatNotes = (notes) => {
  if (!Array.isArray(notes) || notes.length === 0) {
    return "The user has no notes.";
  }

  return notes
    .map((note, index) => {
      return `
NOTE ${index + 1}

Title:
${note?.title || "Untitled"}

Category:
${note?.tag || "General"}

Content:
${note?.description || "No description"}
`;
    })
    .join("\n-------------------------\n");
};

/* ============================================================
   POST /api/ai/chat
   NORMAL AI CHAT
============================================================ */

router.post("/chat", fetchuser, async (req, res) => {
  try {
    const { messages } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Messages are required.",
      });
    }

    /* ========================================================
       CLEAN MESSAGES
    ======================================================== */

    const cleanMessages = messages
      .filter(
        (message) =>
          message &&
          typeof message.content === "string" &&
          message.content.trim()
      )
      .slice(-12)
      .map((message) => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : "user",

        content:
          message.content
            .trim()
            .substring(0, 6000),
      }));

    if (cleanMessages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Valid messages are required.",
      });
    }

    const systemPrompt = `
You are iNotebook AI Assistant.

You help users with:
- studying
- programming
- writing
- productivity
- explanations
- brainstorming
- general questions

Give clear, useful and accurate answers.

Use simple language unless the user asks for advanced detail.

When explaining technical topics:
- use examples
- use headings when useful
- use bullet points when useful
- keep the answer structured

Do not claim that you performed an action that you did not actually perform.

You are an AI assistant inside the iNotebook application.
`;

    /* ========================================================
       CALL GROQ
    ======================================================== */

    const completion =
      await groq.chat.completions.create({
        model: GROQ_MODEL,

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },

          ...cleanMessages,
        ],

        temperature: 0.4,

        max_tokens: 3000,
      });

    const response =
      completion?.choices?.[0]?.message?.content ||
      "";

    if (!response) {
      return res.status(500).json({
        success: false,
        error: "AI returned an empty response.",
      });
    }

    /* ========================================================
       FIND LAST USER MESSAGE
    ======================================================== */

    const lastUserMessage =
      [...cleanMessages]
        .reverse()
        .find(
          (message) =>
            message.role === "user"
        );

    const prompt =
      lastUserMessage?.content ||
      "AI conversation";

    /* ========================================================
       SAVE HISTORY
    ======================================================== */

    await saveAIHistory({
      userId: req.user.id,

      type: "chat",

      action: "chat",

      title: "AI Chat",

      prompt,

      response,

      noteCount: 0,

      noteId: null,
    });

    /* ========================================================
       RESPONSE
    ======================================================== */

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error(
      "AI CHAT ERROR:",
      error
    );

    if (
      error?.status === 401 ||
      error?.statusCode === 401
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid Groq API key.",
      });
    }

    if (
      error?.status === 429 ||
      error?.statusCode === 429
    ) {
      return res.status(429).json({
        success: false,
        error:
          "AI request limit reached. Please try again later.",
      });
    }

    res.status(500).json({
      success: false,
      error:
        "Unable to get a response from AI.",
    });
  }
});

/* ============================================================
   POST /api/ai/notes
   AI ACTIONS ON USER NOTES
============================================================ */

router.post("/notes", fetchuser, async (req, res) => {
  try {
    const {
      action,
      question,
      noteId,
    } = req.body;

    /* ========================================================
       VALIDATE ACTION
    ======================================================== */

    const allowedActions = [
      "summarize",
      "explain",
      "mcq",
      "flashcards",
      "ask",
      "improve",
    ];

    if (
      !action ||
      !allowedActions.includes(action)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid AI action.",
      });
    }

    /* ========================================================
       GET USER NOTES
    ======================================================== */

    const notes = await getUserNotes(
      req.user.id
    );

    if (
      !Array.isArray(notes) ||
      notes.length === 0
    ) {
      return res.status(404).json({
        success: false,
        error:
          "You don't have any notes yet.",
      });
    }

    /* ========================================================
       FORMAT NOTES
    ======================================================== */

    const notesText =
      formatNotes(notes);

    /* ========================================================
       ACTION CONFIG
    ======================================================== */

    let systemPrompt = "";
    let userPrompt = "";
    let title = "";

    /* ========================================================
       SUMMARIZE
    ======================================================== */

    if (action === "summarize") {
      title = "Summarize Notes";

      systemPrompt = `
You are an expert study assistant.

Summarize the user's notes clearly.

Rules:
- Keep important information.
- Remove unnecessary repetition.
- Use headings and bullet points.
- Make it easy to revise.
- Do not invent information.
`;

      userPrompt = `
Summarize the following notes:

${notesText}
`;
    }

    /* ========================================================
       EXPLAIN
    ======================================================== */

    else if (action === "explain") {
      title = "Explain Notes";

      systemPrompt = `
You are a helpful teacher.

Explain the user's notes in simple language.

Rules:
- Explain difficult concepts step by step.
- Give examples where useful.
- Use simple wording.
- Keep technical terms when necessary.
- Do not invent facts.
`;

      userPrompt = `
Explain the following notes in an easy-to-understand way:

${notesText}
`;
    }

    /* ========================================================
       MCQ
    ======================================================== */

    else if (action === "mcq") {
      title = "Generate MCQs";

      systemPrompt = `
You are an exam preparation assistant.

Create multiple-choice questions from the notes.

Generate 10 useful MCQs.

For every question provide:
1. Question
2. Four options A, B, C, D
3. Correct answer
4. Short explanation

Only use information present in the notes.
`;

      userPrompt = `
Create 10 MCQs from these notes:

${notesText}
`;
    }

    /* ========================================================
       FLASHCARDS
    ======================================================== */

    else if (action === "flashcards") {
      title = "Generate Flashcards";

      systemPrompt = `
You are a study assistant.

Create useful flashcards from the user's notes.

Generate approximately 10-15 flashcards.

Format:

Q: Question

A: Answer

Keep answers concise but informative.

Only use information from the notes.
`;

      userPrompt = `
Create flashcards from these notes:

${notesText}
`;
    }

    /* ========================================================
       IMPROVE
    ======================================================== */

    else if (action === "improve") {
      title = "Improve Notes";

      systemPrompt = `
You are a professional writing assistant.

Improve the user's notes.

Rules:
- Correct grammar.
- Improve clarity.
- Improve structure.
- Keep the original meaning.
- Do not add unrelated information.
- Make the writing clean and professional.
`;

      userPrompt = `
Improve the following notes:

${notesText}
`;
    }

    /* ========================================================
       ASK
    ======================================================== */

    else if (action === "ask") {
      title = "Ask About Notes";

      const cleanQuestion =
        typeof question === "string"
          ? question.trim()
          : "";

      if (!cleanQuestion) {
        return res.status(400).json({
          success: false,
          error:
            "Please enter a question.",
        });
      }

      if (cleanQuestion.length > 2000) {
        return res.status(400).json({
          success: false,
          error:
            "Question is too long.",
        });
      }

      systemPrompt = `
You are an AI study assistant.

Answer the user's question using their notes.

Rules:
- Prefer information from the notes.
- If the answer cannot be found in the notes, clearly say so.
- Do not invent information.
- Explain clearly.
`;

      userPrompt = `
USER QUESTION:

${cleanQuestion}

USER NOTES:

${notesText}
`;
    }

    /* ========================================================
       CALL GROQ
    ======================================================== */

    const response = await callGroq({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 4000,
    });

    if (!response) {
      return res.status(500).json({
        success: false,
        error:
          "AI returned an empty response.",
      });
    }

    /* ========================================================
       HISTORY PROMPT
    ======================================================== */

    let historyPrompt = "";

    if (action === "ask") {
      historyPrompt =
        typeof question === "string"
          ? question.trim()
          : "Question about notes";
    } else {
      historyPrompt =
        `AI action: ${action}`;
    }

    /* ========================================================
       FIND NOTE ID
    ======================================================== */

    let validNoteId = null;

    if (noteId) {
      const matchingNote =
        notes.find(
          (note) =>
            String(note._id) ===
            String(noteId)
        );

      if (matchingNote) {
        validNoteId =
          matchingNote._id;
      }
    }

    /* ========================================================
       SAVE AI HISTORY
    ======================================================== */

    await saveAIHistory({
      userId: req.user.id,

      type: "note-action",

      action,

      title,

      prompt: historyPrompt,

      response,

      noteCount: notes.length,

      noteId: validNoteId,
    });

    /* ========================================================
       RESPONSE
    ======================================================== */

    res.json({
      success: true,

      response,

      action,

      title,

      noteCount: notes.length,
    });
  } catch (error) {
    console.error(
      "AI NOTES ERROR:",
      error
    );

    if (
      error?.status === 401 ||
      error?.statusCode === 401
    ) {
      return res.status(401).json({
        success: false,
        error: "Invalid Groq API key.",
      });
    }

    if (
      error?.status === 429 ||
      error?.statusCode === 429
    ) {
      return res.status(429).json({
        success: false,
        error:
          "AI request limit reached. Please try again later.",
      });
    }

    res.status(500).json({
      success: false,
      error:
        "Unable to process your notes with AI.",
    });
  }
});

/* ============================================================
   EXPORT ROUTER
============================================================ */

module.exports = router;