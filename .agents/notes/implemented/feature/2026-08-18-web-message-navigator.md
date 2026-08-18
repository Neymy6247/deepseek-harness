# Agent Note: Web Chat message navigator is a pure slot contribution

Status: implemented

English | [中文](2026-08-18-web-message-navigator.zh.md)

## Problem

A long Chat transcript needs a compact way to identify sent messages and return to them without adding another transcript projection, persistent preference, or session-log event.

## Decision

`@deepseek-ai/dsh-client-ui-message-navigator` occupies the optional session-scoped `conversation.session.navigator` slot that `ui-conversation` places beside the active view. It reads the existing `ConversationSnapshot.chat` order and stable Chat row keys, includes finalized `user` and `steering` nodes, and remains absent when another view is active.

Each item always renders its 16px visual anchor. Hover or keyboard focus adds a left-side bubble centered on that anchor, except the first and last items constrain the bubble inward to stay visible; it joins text blocks, normalizes whitespace, and fits 24 Unicode code points plus `......` into two 15-character lines when truncated. The component derives the selected key from the Chat scrollport's user-row anchors and moves a clicked row to that same reading offset. Hover and selection remain component-local state.

The package owns no service, store, durable event, or model-visible content. The chat view remains the owner of transcript order, anchors, paging, and scroll follow behavior.

## Alternatives considered

**Add the navigator to `ui-conversation`.** Rejected because it is optional Chat-only chrome with no conversation-domain behavior; a Consumer plugin can be composed out without changing the shell.

**Persist navigator selection.** Rejected because selection represents the current viewport and must follow scroll immediately; restoring it would conflict with Chat's existing reader-position restoration.

**Build items from a second session-log projection.** Rejected because the existing Chat snapshot and stable anchors already contain the required visible rows, while a parallel projection would duplicate ordering and paging ownership.

## Consequences

The Web bundle enables the navigator by default through its client roster. The component suite pins preview limits, hover behavior, scroll selection, click navigation, and non-Chat absence; the assembled Web boot test proves the built client plugin joins the production graph. Navigation covers only the currently loaded Chat history, and image-only messages have no visible preview text.
