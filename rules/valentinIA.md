# Voice Notifications Rule (valentinIA)

- Call `speak_status` with `status="start"` when initiating long background commands, builds, or multi-step operations.
- Call `speak_status` with `status="success"` upon successfully completing a task, passing tests, or resolving a build error.
- Call `speak_status` with `status="error"` or `status="human_input_required"` if blocked, encountering a failure, or requiring human approval.
- Keep spoken text concise, clear, and relevant to the task event.
