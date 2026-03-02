# Plan — zoomlike

> Technical implementation plan.

## Architecture

```
┌──────────────┐                    ┌──────────────┐
│   Sharer     │   P2P (WebRTC)     │   Viewer     │
│  (Browser)   │ ◄════════════════► │  (Browser)   │
│  getDisplay  │   Media Stream     │  <video>     │
│  Media()     │                    │  element     │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │  Signaling (PeerJS Cloud)         │
       └───────────┐       ┌───────────────┘
                   ▼       ▼
              ┌──────────────┐
              │  PeerJS Cloud │  (free signaling)
              │  + Google STUN│  (free NAT traversal)
              └──────────────┘
```

## File Structure

```
zoomlike/
├── index.html          # Main page (sharer + viewer UI)
├── css/
│   └── style.css       # Styles
├── js/
│   ├── app.js          # Main application logic
│   ├── sharer.js       # Screen capture + P2P send
│   └── viewer.js       # P2P receive + display
├── .spec/              # Spec-kit files
├── package.json
├── CLAUDE.md
└── AGENTS.md
```

## Implementation Order

1. **HTML/CSS**: Basic UI with share/view toggle
2. **sharer.js**: Screen capture + PeerJS connection
3. **viewer.js**: Receive stream + display
4. **app.js**: Orchestrate sharer/viewer flow
5. **Polish**: Connection status, error handling, mobile responsive

## Dependencies

| Package | Purpose            | Dev/Prod |
|---------|--------------------|----------|
| peerjs  | WebRTC abstraction | prod     |
| vitest  | Testing            | dev      |

## Key APIs

- `navigator.mediaDevices.getDisplayMedia()` — Screen capture
- `PeerJS` — WebRTC signaling + connection management
- `RTCPeerConnection` — Underlying WebRTC (managed by PeerJS)
