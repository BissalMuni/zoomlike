# Specification — zoomlike

> Functional requirements for the personal screen sharing tool.

## User Stories

### Sharer (Host)
- As a sharer, I want to start sharing my screen with one click so that I can quickly show my screen.
- As a sharer, I want to get a shareable link/code so that I can invite viewers.
- As a sharer, I want to stop sharing at any time.
- As a sharer, I want to choose which screen/window/tab to share.

### Viewer
- As a viewer, I want to join a session by entering a code or clicking a link.
- As a viewer, I want to see the shared screen in real-time with minimal delay.
- As a viewer, I want to view the shared screen on both desktop and mobile browsers.

## Requirements

### MVP (v1.0)
- [x] Screen capture using `getDisplayMedia` API
- [x] P2P connection via PeerJS
- [x] Share session via peer ID (copy/paste)
- [x] Real-time screen viewing
- [x] Stop sharing button
- [x] Connection status indicator

### Future (v2.0+)
- [x] Shareable URL with embedded peer ID
- [ ] Audio sharing option
- [ ] Multiple viewers (small group)
- [ ] Chat alongside screen share
- [ ] Recording capability
