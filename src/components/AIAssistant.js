

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteActionLoading, setNoteActionLoading] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ============================================================
  // API BASE URL
  // ============================================================

  const API_BASE_URL = "https://inotebook-dw4s.onrender.com";

  // ============================================================
  // AI SUGGESTIONS
  // ============================================================

  const suggestions = [
    {
      icon: "fa-solid fa-wand-magic-sparkles",
      text: "Improve my writing",
      type: "chat",
    },
    {
      icon: "fa-solid fa-list-check",
      text: "Give me key points",
      type: "chat",
    },
    {
      icon: "fa-solid fa-lightbulb",
      text: "Help me generate ideas",
      type: "chat",
    },
    {
      icon: "fa-solid fa-graduation-cap",
      text: "Explain a topic simply",
      type: "chat",
    },
  ];

  // ============================================================
  // NOTE AI ACTIONS
  // ============================================================

  const noteActions = [
    {
      action: "summarize",
      icon: "fa-solid fa-file-lines",
      title: "Summarize My Notes",
      description:
        "Get a concise summary and key points from all your notes.",
    },
    {
      action: "explain",
      icon: "fa-solid fa-lightbulb",
      title: "Explain My Notes",
      description:
        "Understand your notes in simple and easy language.",
    },
    {
      action: "mcq",
      icon: "fa-solid fa-circle-question",
      title: "Generate MCQs",
      description:
        "Create practice questions from your notes.",
    },
    {
      action: "flashcards",
      icon: "fa-solid fa-layer-group",
      title: "Generate Flashcards",
      description:
        "Turn your notes into quick revision flashcards.",
    },
    {
      action: "improve",
      icon: "fa-solid fa-pen-to-square",
      title: "Improve My Notes",
      description:
        "Improve grammar, clarity and organization.",
    },
  ];

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, noteActionLoading]);

  // ============================================================
  // AUTO FOCUS
  // ============================================================

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const addUserMessage = (content) => {
    return {
      role: "user",
      content,
    };
  };

  const addAssistantMessage = (content, isError = false) => {
    return {
      role: "assistant",
      content,
      isError,
    };
  };

  // ============================================================
  // NORMAL AI CHAT
  // ============================================================

  const sendMessage = async (customMessage = null) => {
    const text = (
      customMessage !== null ? customMessage : input
    ).trim();

    if (!text || loading || noteActionLoading) {
      return;
    }

    const token = getToken();

    if (!token) {
      setMessages((previous) => [
        ...previous,
        addAssistantMessage(
          "Please log in to use the AI Assistant.",
          true
        ),
      ]);
      return;
    }

    const userMessage = addUserMessage(text);

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
          body: JSON.stringify({
            messages: updatedMessages,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `AI request failed with status ${response.status}.`
        );
      }

      const aiReply =
        data?.reply ||
        data?.response ||
        data?.message;

      if (!aiReply) {
        throw new Error(
          "The AI server did not return a response."
        );
      }

      setMessages((previous) => [
        ...previous,
        addAssistantMessage(aiReply),
      ]);
    } catch (error) {
      console.error(
        "AI FRONTEND ERROR:",
        error
      );

      let errorMessage =
        error?.message ||
        "Sorry, something went wrong while contacting the AI.";

      if (
        error?.message?.includes("Failed to fetch")
      ) {
        errorMessage =
          "Unable to connect to the AI server. Please make sure your backend is running on port 5000.";
      }

      setMessages((previous) => [
        ...previous,
        addAssistantMessage(errorMessage, true),
      ]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // ============================================================
  // AI + NOTES ACTION
  // ============================================================

  const runNoteAction = async (action) => {
    if (loading || noteActionLoading) {
      return;
    }

    const actionInfo = noteActions.find(
      (item) => item.action === action
    );

    const actionTitle =
      actionInfo?.title || "AI Notes Action";

    const token = getToken();

    if (!token) {
      setMessages((previous) => [
        ...previous,
        addAssistantMessage(
          "Please log in to use your notes with AI.",
          true
        ),
      ]);
      return;
    }

    const userMessage =
      addUserMessage(actionTitle);

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setNoteActionLoading(action);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Unable to process your notes. Server status: ${response.status}.`
        );
      }

      const aiReply =
        data?.reply ||
        data?.response ||
        data?.message;

      if (!aiReply) {
        throw new Error(
          "The AI server did not return a response for this action."
        );
      }

      setMessages((previous) => [
        ...previous,
        addAssistantMessage(aiReply),
      ]);
    } catch (error) {
      console.error(
        "AI NOTES FRONTEND ERROR:",
        error
      );

      let errorMessage =
        error?.message ||
        "Something went wrong while processing your notes.";

      if (
        error?.message?.includes("Failed to fetch")
      ) {
        errorMessage =
          "Unable to connect to the AI server. Please make sure your backend is running on port 5000.";
      }

      setMessages((previous) => [
        ...previous,
        addAssistantMessage(errorMessage, true),
      ]);
    } finally {
      setNoteActionLoading("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // ============================================================
  // ASK ABOUT NOTES
  // ============================================================

  const askAboutNotes = async (question) => {
    const text = String(question || "").trim();

    if (!text || loading || noteActionLoading) {
      return;
    }

    const token = getToken();

    if (!token) {
      setMessages((previous) => [
        ...previous,
        addAssistantMessage(
          "Please log in to use your notes with AI.",
          true
        ),
      ]);
      return;
    }

    const userMessage = addUserMessage(
      `Ask about my notes: ${text}`
    );

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setNoteActionLoading("ask");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
          body: JSON.stringify({
            action: "ask",
            question: text,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Unable to answer your question. Server status: ${response.status}.`
        );
      }

      const aiReply =
        data?.reply ||
        data?.response ||
        data?.message;

      if (!aiReply) {
        throw new Error(
          "The AI server did not return an answer."
        );
      }

      setMessages((previous) => [
        ...previous,
        addAssistantMessage(aiReply),
      ]);
    } catch (error) {
      console.error(
        "AI ASK NOTES ERROR:",
        error
      );

      let errorMessage =
        error?.message ||
        "Something went wrong while searching your notes.";

      if (
        error?.message?.includes("Failed to fetch")
      ) {
        errorMessage =
          "Unable to connect to the AI server. Please make sure your backend is running on port 5000.";
      }

      setMessages((previous) => [
        ...previous,
        addAssistantMessage(errorMessage, true),
      ]);
    } finally {
      setNoteActionLoading("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // ============================================================
  // FORM SUBMIT
  // ============================================================

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  // ============================================================
  // KEYBOARD
  // ============================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ============================================================
  // CLEAR CHAT
  // ============================================================

  const clearChat = () => {
    if (loading || noteActionLoading) {
      return;
    }

    setMessages([]);
    setInput("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // ============================================================
  // COPY RESPONSE
  // ============================================================

  const copyResponse = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("COPY ERROR:", error);
    }
  };

  // ============================================================
  // FORMAT AI MESSAGE
  // ============================================================

  const formatMessage = (text) => {
    if (!text) {
      return null;
    }

    const lines = String(text).split("\n");

    return lines.map((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return (
          <div
            key={index}
            className="ai-message-space"
          />
        );
      }

      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={index}>
            {trimmed.substring(4)}
          </h4>
        );
      }

      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={index}>
            {trimmed.substring(3)}
          </h3>
        );
      }

      if (trimmed.startsWith("# ")) {
        return (
          <h3 key={index}>
            {trimmed.substring(2)}
          </h3>
        );
      }

      if (
        trimmed.startsWith("- ") ||
        trimmed.startsWith("* ")
      ) {
        return (
          <div
            key={index}
            className="ai-bullet-line"
          >
            <span>•</span>
            <span>
              {trimmed.substring(2)}
            </span>
          </div>
        );
      }

      const numberedMatch =
        trimmed.match(/^(\d+)\.\s+(.*)$/);

      if (numberedMatch) {
        return (
          <div
            key={index}
            className="ai-number-line"
          >
            <span>
              {numberedMatch[1]}.
            </span>

            <span>
              {numberedMatch[2]}
            </span>
          </div>
        );
      }

      return (
        <p key={index}>
          {trimmed}
        </p>
      );
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="ai-assistant-page">
      <div className="ai-assistant-container">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="ai-assistant-header">
          <div>
            <span className="section-eyebrow">
              AI WORKSPACE
            </span>

            <h1>
              iNotebook{" "}
              <span>AI Assistant</span>
            </h1>

            <p>
              Ask questions, work with your
              notes, improve your writing and
              study smarter.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              className="ai-clear-btn"
              onClick={clearChat}
              disabled={
                loading ||
                noteActionLoading
              }
            >
              <i className="fa-solid fa-trash-can"></i>
              Clear chat
            </button>
          )}
        </div>

        {/* ======================================================
            NOTES AI TOOLS
            IMPORTANT:
            THESE STAY VISIBLE EVEN AFTER CHAT STARTS.
        ====================================================== */}

        <div className="ai-notes-tools">

          <div className="ai-tools-heading">
            <div>
              <span className="ai-tools-eyebrow">
                YOUR NOTES + AI
              </span>

              <h2>
                Study smarter with your notes
              </h2>

              <p>
                Let AI summarize, explain
                and turn your notes into
                study material.
              </p>
            </div>

            <div className="ai-tools-badge">
              <i className="fa-solid fa-lock"></i>
              Private
            </div>
          </div>

          <div className="ai-note-action-grid">
            {noteActions.map((item) => (
              <button
                key={item.action}
                type="button"
                className="ai-note-action-card"
                onClick={() =>
                  runNoteAction(item.action)
                }
                disabled={
                  loading ||
                  noteActionLoading
                }
              >
                <div className="ai-note-action-icon">
                  <i className={item.icon}></i>
                </div>

                <div className="ai-note-action-content">
                  <strong>
                    {item.title}
                  </strong>

                  <span>
                    {item.description}
                  </span>
                </div>

                <i className="fa-solid fa-arrow-right ai-note-action-arrow"></i>
              </button>
            ))}
          </div>

          <div className="ai-note-question-box">
            <i className="fa-solid fa-circle-question"></i>

            <input
              type="text"
              placeholder="Ask something about your notes..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  const value =
                    event.target.value.trim();

                  if (value) {
                    askAboutNotes(value);
                    event.target.value = "";
                  }
                }
              }}
              disabled={
                loading ||
                noteActionLoading
              }
            />
          </div>
        </div>

        {/* ======================================================
            CHAT CARD
        ====================================================== */}

        <div className="ai-chat-card">

          {/* ====================================================
              EMPTY STATE
          ==================================================== */}

          {messages.length === 0 ? (
            <div className="ai-empty-state">

              <div className="ai-empty-icon">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>

              <h2>
                How can I help you?
              </h2>

              <p>
                I'm your iNotebook AI
                assistant. Ask me anything
                or choose an action below.
              </p>

              <div className="ai-suggestion-grid">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    type="button"
                    className="ai-suggestion-card"
                    onClick={() =>
                      sendMessage(
                        suggestion.text
                      )
                    }
                    disabled={
                      loading ||
                      noteActionLoading
                    }
                  >
                    <i
                      className={
                        suggestion.icon
                      }
                    ></i>

                    <span>
                      {suggestion.text}
                    </span>

                    <i className="fa-solid fa-arrow-up-right"></i>
                  </button>
                ))}
              </div>
            </div>
          ) : (

            /* ==================================================
               MESSAGES
            ================================================== */

            <div className="ai-messages">

              {messages.map(
                (message, index) => (
                  <div
                    className={`ai-message-row ${
                      message.role === "user"
                        ? "ai-user-row"
                        : "ai-assistant-row"
                    }`}
                    key={index}
                  >
                    <div className="ai-avatar">
                      {message.role === "user" ? (
                        <i className="fa-solid fa-user"></i>
                      ) : (
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                      )}
                    </div>

                    <div className="ai-message-wrapper">

                      <div
                        className={`ai-message-bubble ${
                          message.isError
                            ? "ai-error-message"
                            : ""
                        }`}
                      >
                        {formatMessage(
                          message.content
                        )}
                      </div>

                      {message.role ===
                        "assistant" &&
                        !message.isError && (
                          <button
                            type="button"
                            className="ai-copy-btn"
                            onClick={() =>
                              copyResponse(
                                message.content
                              )
                            }
                            title="Copy response"
                          >
                            <i className="fa-regular fa-copy"></i>
                            Copy
                          </button>
                        )}
                    </div>
                  </div>
                )
              )}

              {(loading ||
                noteActionLoading) && (
                <div className="ai-message-row ai-assistant-row">

                  <div className="ai-avatar">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>

                  <div className="ai-message-wrapper">
                    <div className="ai-message-bubble ai-typing-bubble">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>

                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>
          )}

          {/* ====================================================
              INPUT
          ==================================================== */}

          <form
            className="ai-input-area"
            onSubmit={handleSubmit}
          >
            <div className="ai-input-wrapper">

              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask iNotebook AI anything..."
                rows="1"
                disabled={
                  loading ||
                  noteActionLoading
                }
              />

              <button
                type="submit"
                className="ai-send-btn"
                disabled={
                  loading ||
                  noteActionLoading ||
                  !input.trim()
                }
                title="Send message"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>

            <span className="ai-input-hint">
              Press Enter to send • Shift +
              Enter for a new line
            </span>
          </form>
        </div>

        {/* ======================================================
            SECURITY NOTE
        ====================================================== */}

        <div className="ai-security-note">
          <i className="fa-solid fa-shield-halved"></i>

          <span>
            Your AI request is securely
            processed through the
            iNotebook backend. Your notes
            are only accessed for your
            authenticated account.
          </span>
        </div>

      </div>
    </section>
  );
};

export default AIAssistant;

