# Issue 31: component integration and playthrough report

Work branch: `codex/issue-31-automa-shadow-empire`. Main is unchanged.

## Reviewed UI decisions

- Decision cards use the existing CardFrame and CardBand: gold Cinzel title, a left-to-right green-to-darker-green gradient over the shared pixel-noise paper, and a solid green numbered footer. Track names use Cinzel; the favourite star is brown. Track names in bot report descriptions use Cinzel too.
- The canonical 22-card deck generates the gallery. All 22 cards have distinct interface titles, such as Final Push, Scientific Legacy and Engineering Marvels. Track / Income and Hex / Topple are smaller section labels, not card titles. Each includes its canonical fields and four track rows. The favourite resolves to a star before its track. Named hex-pattern rows reveal the full 34-hex diagram only in the shared grey tooltip on hover or keyboard focus. AutomaHexPattern uses the same canonical ordering and shared map geometry as the engine, with the primary scan arrow, subsequent rows and starting hex. Descriptive card and pattern names are interface labels rather than claims about official printed names.
- Bot reports use the revealed pair recorded in public events, not hidden current deck state. Events snapshot the favourite so replaying an old report does not change its star.
- Lobby seat height remains the existing 112px token. Only the host can add/configure/remove bots; the settings component appears beneath the selected seat.
- Six official levels come from the canonical difficulty data. Level 2, Automa the Average, is the default. The control is six clickable squares filled from the left.
- Bot type is selected with two buttons. Shadow Empire is dark green. Remove bot uses the existing danger treatment.
- Historical names are randomly selected from unused names in the Egypt, Mesopotamia, Indus Valley, Shang and Sumer pool. Bot tiles have no extra coloured square; `(Automa)` or `(Shadow Empire)` appears on its own Cinzel line below the name. Action reports retain their seat-coloured marker.
- The player removal × and the You/Host/Ready badges belong to the same top-row container, with the × at the right.
- Browser measurement confirmed identical vertical centres for the removal button and badge row.
- Header chips include bots. Clicking a bot opens the overview rather than a nonexistent human capital/hand. Bot overview cards show only actual public bot facts.

## Verification performed

Seeded engine playthroughs used seed 3109 and current base rules, selecting legal human answers and normally preferring an advance when available. These are scripted games, not human browser sessions or a statistical balance study.

| Setup | Result | Human answers | Final VP |
|---|---|---:|---|
| One human, level-2 Automa, Shadow Empire | Finished | 87 | Human 59; Automa 179 |
| Two humans, Shadow Empire | Finished | 145 | Humans 77 and 58; Shadow 0 |
| One human, level-1 Automa, Shadow Empire | Finished | 89 | Human 68; Automa 213 |
| One human, level-6 Automa, Shadow Empire | Finished | 79 | Human 38; Automa 386 |

No game stopped on a bot-owned human decision. Human and Automa participants completed five income turns; standalone Shadow uses no income turns. Shadow is excluded from winning placings.

The local browser rendering check generated 24 card instances (22 full deck cards and two report cards), six level squares and five 112px seats without browser script errors. The final static component/type check passed with zero errors and zero warnings, including the report/overview integration.

The local unit suite was not run, following the owner's instruction to use hosted CI for it.

## Bugs found and corrected

1. The earlier handwritten mockup had invalid JavaScript quotation marks and nonfunctional controls. The preview now compiles the production Svelte components into a standalone file.
2. Bot turns entered the human choose-turn path. Automatic bot operations now run through the shared operation stack.
3. A neighbouring technology effect attempted to invent into Shadow Empire's nonexistent human tech mat. Bot recipients now use their official effect rules: Shadow gains no benefits; Automa refreshes rather than holding technology cards.
4. Mixed bot effects could refresh/draw before a previously queued movement. Effects now resolve sequentially through stack continuations.
5. Bot hidden decks and face-down tapestry identities could leave the server in views. They now become counts; private income selection state is removed.
6. Bot draws were absent from undo's reveal detection. Drawing or changing a hidden bot pile now prevents undo across that reveal.
7. Automa's landmark box did not participate in normal landmark tiebreaks. It now counts; Shadow cannot win.
8. A historical report could show the current favourite instead of the favourite used for that action. Public pair events now snapshot the favourite tracks.

## Remaining review limits

- R39 still calls for owner comparison of the ten map arrow patterns against all 22 physical decision cards. The gallery now renders the full diagram, and the component-library example can expose priority labels for that review.
- Original-version parity, rare human civilization interactions and long randomized runs require hosted regression results and further gameplay; completion of four scripted games does not establish all combinations.
- No expansion bot support is introduced. The owner confirmed the two official base configurations rather than a two-human-plus-Automa house rule.

## Main integration review (2026-11-10)

Merged origin/main at 7dd4ff13 into the feature branch. Resolved setup, turn, VP and status-log conflicts by preserving both main's A&A/F&F additions and base-only bot behavior. Independent engine and component reviews found no blocking findings. The production build and component/type checks passed (zero errors/warnings). PR #185 is open; its hosted regression runs are pending, so this is not yet a merged-main claim.
