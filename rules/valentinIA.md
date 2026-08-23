# Voice Notifications & Accessibility Rule (valentinIA)

- **Events Mode (`READ_MODE="events"`):**
  - Call `speak_status` with a short 1-sentence notification message when initiating tasks (`status="start"`), completing tasks (`status="success"`), encountering errors (`status="error"`), or needing input (`status="human_input_required"`).

- **Accessibility Mode (`READ_MODE="accessibility"`):**
  - Call `speak_status` with `status="success"` passing the FULL UNTRUNCATED TEXT of your response (including all numbered points, sections, and conclusions, stripped of markdown symbols like `#` or `**`) so the spoken audio recites 100% of the on-screen text word-for-word without omitting any section.

- **Language Standard:**
  - Always use clear, natural Spanish for spoken messages when communicating in Spanish.
