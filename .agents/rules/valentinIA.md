# Voice Notifications & Accessibility Rule (valentinIA)

- **Events Mode (`READ_MODE="events"`):**
  - Call `speak_status` with a short 1-sentence notification message when initiating tasks (`status="start"`), completing tasks (`status="success"`), encountering errors (`status="error"`), or needing input (`status="human_input_required"`).

- **Accessibility Mode (`READ_MODE="accessibility"`):**
  - Call `speak_status` with `status="success"` passing a clear, natural spoken summary of your response so the user hears the output read aloud.

- **Language Standard:**
  - Always use clear, natural Spanish for spoken messages when communicating in Spanish.
