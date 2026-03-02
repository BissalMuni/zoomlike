# Constitution — zoomlike

> Personal screen sharing tool using WebRTC P2P

## Principles

- **Zero cost**: No paid server infrastructure. Use free services (GitHub Pages, PeerJS Cloud, Google STUN).
- **Simplicity**: Vanilla JS, no build step, no framework overhead.
- **Privacy**: Video/audio streams go directly P2P. No server touches the media data.
- **Browser-native**: Rely on built-in browser APIs (WebRTC, Screen Capture API).

## Tech Stack

| Layer       | Technology                  | Cost  |
|-------------|-----------------------------|-------|
| Frontend    | Vanilla JS + HTML/CSS       | $0    |
| Hosting     | GitHub Pages                | $0    |
| Signaling   | PeerJS Cloud                | $0    |
| STUN        | Google STUN (free)          | $0    |
| P2P Stream  | WebRTC (browser built-in)   | $0    |

## Non-Functional Requirements

- Support 1:1 screen sharing (expandable to small groups)
- Latency < 200ms for P2P connections
- No server-side processing of media streams
- Works on modern browsers (Chrome, Firefox, Edge)
- Mobile-friendly viewer experience

## Coding Conventions

- Package manager: pnpm
- Test framework: vitest
- Comments in Korean
- Commit messages in English
- No build step required for production
