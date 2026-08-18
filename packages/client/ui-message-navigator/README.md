# @deepseek-ai/dsh-client-ui-message-navigator

English | [中文](README.zh.md)

Message navigator is a pure browser Consumer that contributes the optional `conversation.session.navigator` slot beside Chat. It projects finalized user and steering rows from the current loaded `snapshot.chat` order and uses the Chat view's stable row anchors; it adds no session events, service, or persisted state.

Each navigator item shows a 16px horizontal anchor at rest. Pointer hover or keyboard focus keeps that anchor in place and reveals a left-side bubble aligned to its center; the first and last list items align the bubble inward to keep it visible. The bubble uses up to two 15-character lines: after whitespace normalization it retains 24 Unicode code points and appends `......` when content remains. Scrolling selects the latest user-authored row that has passed the reader's top offset; clicking an item scrolls that anchor to the same offset. The navigator renders only while Chat is active.

## Model Experience

None, as the navigator projects browser session history; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **Only the loaded chat window is navigable** — records preceding the current history page gain items after the Chat view loads that page.
- **Non-text content has no inline preview** — image-only messages retain a navigable marker and expose the localized empty-message accessible label.
