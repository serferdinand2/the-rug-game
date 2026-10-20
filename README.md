# The Rug Game

A browser version of Stonemaier Games' **Tapestry** with every official expansion: Plans & Ploys, Arts & Architecture, and Fantasies & Futures. You can play it online with a table code, hot-seat on one screen, or solo against the official Automa and Shadow Empire. The table's creator picks the version and expansions. Version means the original 2019 printing or the current official rules.

It is built like the author's other table games, [Fablewood Rummy](https://github.com/lazar-milin/fablewood-rummy) and [Bird Table](https://github.com/lazar-milin/birdcard-ripoff):
- a plain Node.js server with no runtime packages;
- a shared rules engine;
- a Svelte 5 interface built with Vite;
- vector pixel-art in the Alagard and VCR OSD Mono fonts.

No official Stonemaier artwork, logos or rulebook text are used.

> **Status: design phase.** The rules research, the design plan, the main game screen and the art style are approved. The server, tests and CI are set up; the game itself starts with the rules engine in M3. Work follows the [issues](https://github.com/serferdinand2/the-rug-game/issues) in milestone order, starting with [#1](https://github.com/serferdinand2/the-rug-game/issues/1), [#2](https://github.com/serferdinand2/the-rug-game/issues/2) and [#3](https://github.com/serferdinand2/the-rug-game/issues/3).

## Current interface

This section always shows the latest approved or built interface. The colours and boxes are placeholders until the artwork lands. Full design notes are in [docs/ui/README.md](docs/ui/README.md).

**Tracks:** the main view on your turn. Your next space on each track shows its cost, in green when you can afford it.

![Tracks tab](docs/ui/screens/1-tracks.png)

| Map | Capital |
|---|---|
| ![Map tab](docs/ui/screens/2-map.png) | ![Capital tab](docs/ui/screens/3-capital.png) |
| **Cards** | **Players** |
| ![Cards tab](docs/ui/screens/4-cards.png) | ![Players tab](docs/ui/screens/5-players.png) |

## Run locally

You need Node.js 22.9 or newer. The only packages are development tools (Svelte, Vite, svelte-check, Prettier). The server itself has no runtime packages.

```sh
npm install
npm start      # builds the Svelte client, then serves http://127.0.0.1:3020
npm run dev    # hot-reloading development server on http://127.0.0.1:5173
npm test
```

Copy [.env.example](.env.example) to `.env` to change the host or port, or to trust a reverse proxy. For now the app shows a placeholder page; the game screens arrive with milestone M5.

## Art style

Every illustration is a 64×64 pixel-art scene in a card frame. This is style C, approved on 2026-10-20.

<img src="docs/art/style-c/lighthouse-scene.svg" alt="The Lighthouse landmark in art style C" width="192">

## Roadmap

The full plan is in [the design document](docs/superpowers/specs/2026-10-20-the-rug-game-design.md). Each milestone is a [GitHub milestone](https://github.com/serferdinand2/the-rug-game/milestones) with a matching `M…` label. Issues list the issues that must close before them under **Relationships → Blocked by**.

| Milestone | What it delivers |
|---|---|
| M0 · Groundwork | Project setup, and the rule conventions for details the research couldn't confirm |
| M1 · Interface design | Approved designs for every screen |
| M2 · Assets | About 300 illustrations and every icon, in an asset gallery |
| M3 · Base game rules engine | The complete base-game rules, tested |
| M4 · Tables and server | Tables, the HTTP API, the timer and undo |
| M5 · Playable base game | The full base game online and hot-seat, on desktop and phone |
| M6 · Solo play | The official Automa and Shadow Empire |
| M7–M9 | Plans & Ploys, Arts & Architecture, Fantasies & Futures |
| M10 · Rules pages | In-game help and a card reference |
| M11 · Discord Activity | Playing inside Discord |

## Repository guide

| Path | Contents |
|---|---|
| [docs/research/](docs/research/) | Rules research for the base game and every expansion, with sources |
| [docs/superpowers/specs/](docs/superpowers/specs/) | The design document: decisions, scope and the build plan |
| [docs/ui/](docs/ui/) | Approved interface designs, screenshots, and the scripts that generate them |
| [docs/art/](docs/art/) | Art production notes and the approved style reference |
| [CLAUDE.md](CLAUDE.md) | Guidance for contributors and coding agents, including where the work stands |
| [CONVENTIONS.md](CONVENTIONS.md) | Coding conventions: JavaScript with JSDoc, Svelte 5 components, BEM classes, the engine, tests and commits |

## Licence

[GPL-3.0-only](LICENSE), like the sibling projects. The fonts keep their authors' terms: Alagard by Hewett Tsoi (Pix3M) and VCR OSD Mono by Riciery Leal (MrManet). Their notices are in [client/static/fonts/](client/static/fonts/).
