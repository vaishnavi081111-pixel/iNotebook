import React from "react";

const About = () => {
  return (
    <div className="about-page">

      {/* ================================
          HERO
      ================================= */}

      <section className="about-hero">

        <div className="about-logo">
          <i className="fa-solid fa-layer-group"></i>
        </div>

        <h1>About iNotebook</h1>

        <p>
          iNotebook is a modern, cloud-based notebook built to help
          you capture ideas, organize your thoughts and get more
          done — all backed by a secure workspace that is yours
          alone.
        </p>

      </section>

      {/* ================================
          FEATURE CARDS
      ================================= */}

      <section className="about-grid">

        <div className="about-card">
          <i className="fa-regular fa-note-sticky"></i>

          <h3>Effortless note-taking</h3>

          <p>
            Create, edit, tag and organize your notes in a clean,
            distraction-free workspace designed for speed.
          </p>
        </div>

        <div className="about-card">
          <i className="fa-solid fa-shield-halved"></i>

          <h3>Private &amp; secure</h3>

          <p>
            Every account is protected with encrypted passwords and
            token-based authentication, so only you can ever see
            your notes.
          </p>
        </div>

        <div className="about-card">
          <i className="fa-solid fa-wand-magic-sparkles"></i>

          <h3>Built for what's next</h3>

          <p>
            iNotebook's architecture is ready to connect an AI
            assistant that can summarize, improve and answer
            questions about your notes.
          </p>
        </div>

      </section>

    </div>
  );
};

export default About;