# AGENTS.md — zoomlike

## Project Context

Personal screen sharing tool using WebRTC P2P. Zero server cost.

## Spec-Kit Workflow

1. Read `.spec/constitution.md` for project principles and tech stack
2. Read `.spec/spec.md` for functional requirements
3. Read `.spec/plan.md` for implementation plan
4. Implement based on the plan
5. Validate against the spec

## Guidelines

- Use Vanilla JS — no frameworks, no build step
- PeerJS for WebRTC abstraction
- Hosted on GitHub Pages (static files only)
- All media streams are P2P, never through a server
- pnpm as package manager
- vitest for testing
