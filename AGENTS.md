# Agent Rules & Preferences

- **Subagent Delegation**: Describe the solution first, then always delegate code fixes and implementation tasks to a Hydrogen (`flash_lite`) subagent (`invoke_subagent` with `TypeName: "self"`, `Model: "flash_lite"`). When continuing an existing subagent's task, switch it to or invoke it with `Model: "flash_lite"`.
- **Screenshots & Visual Checks**: Do not launch the browser subagent to take screenshots unless explicitly asked by the user.
