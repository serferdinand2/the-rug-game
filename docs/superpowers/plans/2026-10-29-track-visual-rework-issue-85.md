# Issue #85 implementation plan

1. Capture the owner's approved SVG symbols and their native PNG sources; keep the traces pixel exact.
2. Apply the approved face and optional-band layouts to the game's `TrackSpace`, with `ExplorationFace` composing Exploration's twelve faces and `CardSymbol` composing the three card backs.
3. Show the reusable components and art in `/components.html`; document the icon and layout decisions in the component index and design record.
4. Run formatting, Svelte checks, unit tests, browser checks and a production build. Review the rendered gallery and game track board for missing art and alignment.
5. Commit, push, and close #85 once the implementation and checks pass.
