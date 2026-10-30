# Tapestry card design rules

Owner decisions consolidated on 2026-10-24. This is the specification for generating more cards without repeating the layout decisions made in the review conversation. It records the latest decisions; earlier experiments are not alternative defaults.

## Scope and authority

“Tapestry” here means the game and its card interface. The fourteen reviewed examples are **civilization mats**, not the distinct tapestry-card deck. The common visual rules can be reused for tapestry, technology and other card families, but their complete frames, timings and gameplay interactions still need their own coverage. Do not mark all of issue #47 complete because the civilization frame is extracted.

The visual authority is **Style B / Civilization mat, Refs #47**, as refined in `collectors-review.html`. The owner supplied the mockup UI only for its palette and pixelised background treatment. Do not replace Style B's composition with a different UI copied from that reference.

## Technology and tapestry cards (Second Tapestry UI review, 2026-10-26)

The card study at `C:/Users/lazar/.codex/visualizations/2026/10/23/01a16638-a2cd-76f3-a4d0-b0043756ddbc/tech-card/index.html` established these layouts. `TechnologyCard` and `TapestryCard` are the reusable components shown in the component library and the card gallery. They draw their markup in Svelte from the engine's data, through `techCardData` and `tapestryCardData` in `src/lib/cards/game-cards.js` (#108). `src/styles/card-layouts.css` holds their shared appearance. The static main-screen mockup keeps its own copy of the first review fixtures and string markup in `docs/ui/assets/card-markup.js` and `card-layouts.css`. Engine rules remain authoritative for actual effects and requirements.

### Technology

- **425 px wide**, horizontal, approximately 298 px tall. Do not turn a Tech card into a tall portrait card or shrink its source artwork to a token icon.
- Use the same warm beige pixel-noise paper, brown gradient band, solid gold title letters, and border treatment as the approved Civilization cards. The title band reaches the card sides.
- Put the **full 150×150 artwork on the left**, with the same inset and fine double-border treatment as the Civilization portrait. The two effect boxes sit to its right.
- The **square / top-row benefit is above the circle / middle-row benefit**. Draw the shapes as thick empty outlines, with no inset fill. The Tech tab's row headings use the same shapes.
- Keep effect wording in Atkinson. The shape and its benefit share one light beige box. Separate the two benefits so their distinct upgrade timing is immediately visible.
- Put the conditions in a dedicated row **below the artwork and effects**. Align the light-grey condition boxes right. For a track requirement, show its icon, its name in Cinzel and its track colour, then the **Arabic numeral** (for example `Technology 2`). A row condition uses the same empty square followed by `Top row`.
- Leave equal visual breathing room above and below the condition row: the gap from the artwork to the conditions matches the gap from the conditions to the edition separator.
- Put the edition chip at the bottom in the same position, vertical alignment and colours as the other cards. Base game is brown; Plans & Ploys is green; Arts & Architecture is purple; Fantasies & Futures is teal, so it never looks like Arts & Architecture on a card (owner, 2026-10-29, #109). Every card family draws it through `CardEdition`, and its title band through `CardBand`. Do not add an extra separator around the chip.
- In the Tech tab, card wrappers may overlap horizontally. Hover and keyboard focus raise one card above its neighbours. Empty row placeholders use a **solid border**, never a dashed one.

### Tapestry

- **319 px wide**, three quarters of the 425 px Civilization card width, and 560 px tall in the reviewed frame. Do not use the Tech dimensions.
- Use the Civilization paper, border, title gradient and gold letters. **Trap** is the exception: its title gradient is red.
- The full **160×160 portrait is on the left** with the Civilization portrait border. Put the timing label **to the right of the artwork**, not in the title band or below the artwork.
- Timing labels distinguish `This Era`, `When Played`, and `Trap · Response`. Trap retains its separate income-turn note in the rules area.
- Put the effect in a readable Atkinson area under the portrait, with a fine top rule. Pending rules text uses this same area and separator; do not enclose it in a beige effect box. Put edition metadata at the foot, using the same edition chip as Tech and Civilization.
- The active era tab displays the complete current card. Earlier eras remain selectable for inspection. The Hand and decision choice shelf use the same complete card layout, scaled to their available space; hovering or focusing overlapping cards raises the chosen one.
- Tapestry choice remains in the card shelf above the decision box. The box carries the confirmation action, not a second list of card buttons.

The production implementation is `src/lib/components/player/`, where each card pattern takes its content as data and its state as props and owns its styles (#106); `src/styles/card-patterns.css` keeps only the card's palette, its paper and the pictogram symbols `CivilizationCard` still draws itself; the fixture inventory is `src/lib/cards/reviewed-civilizations.js`. Both `/docs/ui/collectors-review.html` and the component library consume these components. The previous static HTML is archived at `archive/2026-10-24-civilization-review.html`.

Priority when generating a card:

1. The owner's latest explicit decision in this document.
2. The corresponding reviewed card pattern and its shared component.
3. The project's shared typography, colours and accessibility conventions.
4. The exact selected rules edition and researched card wording.

Visual review does not certify rules text. Several examples deliberately use original mats whose current official versions behave differently. Always carry the edition in the card's data and review label. Never infer an engine rule from a decorative fixture or an example blue highlight.

## Frame, hierarchy and sizing

- Civilization cards are **425 px wide**, including their border. This supersedes the older 456 px decision and every wider intermediate mockup.
- Card height is content-driven. Do not force a common height by shrinking text, padding out a short card or hiding overflow.
- Put all reviewed cards on one page. Wrap the gallery's cards into rows; do not shrink the individual card to fit another card beside it.
- Order: title band; large artwork beside the main effect; placement or choice area; relevant triggered/scoring sections; clarifying text beneath the area it clarifies; footer metadata. Collectors retains its explicit end-game score ladder below its clarifications.
- The main artwork is **160×160 px** in the reviewed civilization frame, with a 12 px gap to the main text. Use the full civilization portrait asset, not an icon, crop or thumbnail. Preserve pixel rendering and the complete composition.
- The body uses 12 px inset on both sides. A placement row's usable width is about 397 px inside the frame.
- Keep the main instruction next to the artwork. It is larger than the clarifications, and must include the action's timing and what the player does.
- No unexplained arrow in a footer. An arrow must communicate an actual progression, legal connection or ownership transfer, and its meaning must be clear from the adjacent content.

## Colour and surface

- Card paper is warm beige (`#e8d6ad`), with the supplied **pixelised noise** texture. The extracted texture is `src/styles/card-paper-noise.svg`. This is the approved material treatment, not a request for procedural blur, random grain or a different distressed-paper effect.
- Title letters use the mockup UI's actual gold, **`#e2b857`**. The title is solid gold, not gradient text.
- The title band's gradient uses the former brown title colour: `#5c3e1f` through `#987a51` to `#cbb58c`. The title's colour and the band's colour are separate decisions.
- Primary card text is dark brown (`#3c3021`); secondary text is `#756447`. Card surfaces locally override the dark application palette. Do not turn the whole application beige.
- Borders and separators use the established card browns (`#94764c`, `#735934`, and the softer `#b59a70`). Use fine lines, not thick black partitions.
- Empty/unfilled placement squares are grey (`#aaa8a1`, border `#797875`). Their printed item examples are muted/greyscale. A completed example can use the blue player border/highlight.
- Beige benefit boxes mean a **triggered effect or scoring rule**. They are not a generic border around every icon or sentence.

## Typography and copy

- Card titles use Cinzel, 28 px, bold, with the established gold treatment.
- Main effect text uses Atkinson Hyperlegible, 15 px, approximately 1.38 line height. Keep this visibly larger than the supporting text.
- All rules, clarifications, benefits and VP values use **Atkinson Hyperlegible**. Do not use the decorative title face for numbers or score labels.
- Benefit explanations are generally 12 px/1.3; dense slot-adjacent text is 11 px/1.2; clarifications are 11 px/1.3. Do not solve a fit problem by pushing below the reviewed 10 px floor.
- Write `3 VP` on one line. Never stack the number over “VP”. Use the same rule for `10 VP`, `15 VP`, and the Collectors ladder. Keep VP numbers bold where they are the reward.
- In dense columns, ordinary benefit wording is regular weight. **Only the `X VP` benefit is bold**, rather than making every word bold.
- Resource amounts and their symbols form an unbreakable group. A plus sign must never sit at the end of one line while its resource icon moves to the next.
- For one resource, write **`+` followed by the resource icon**, not `+1` followed by the icon. Show a number when the quantity is greater than one.
- “with benefit” stays on one line. The Craftsmen research clarification is “bonus is available”; do not revert to “you may pay the bonus to …”.
- Say “Take from the left of either row” only once for Militants. Do not duplicate the same instruction above and below the rows.
- Remove redundant labels such as “different items on this …” from Collectors. Explain the rule once in the main copy or the relevant clarification.
- Do not add claims, reinterpret a researched effect, or silently mix original/current rules to make text shorter.

## Resources, terrain and tokens

### Resources

The active artwork has **two native versions: 24×24 and 48×48**. The former 32×32 resource set is deprecated and archived. A 16 px UI display is a scaled use of the 24 px source; it is not a third native version.

Cards use native 24 px inline resources from `resource-24/{coin,worker,food,culture,any}` through `CardResource` / `ResourceIcon`. Use `resource-48` when a larger standalone illustration is needed. Never upscale the 24 px file and describe it as the native 48 px artwork.

**No resource circles.** The owner tried 26 px and 28 px grey circles, then explicitly removed them. That abandoned experiment is not a component variant to resurrect. No box around Collectors' any-resource reward either.

Preserve the full image canvas. Do not crop to visible pixels, recolour through CSS filters, blur, smooth, stretch, or change alpha to imitate another size. Inline artwork must not increase the text row's line spacing. The baseline wrapper reserves the icon's width and positions its native 24 px artwork around the lowercase text height without making the line taller.

The asset conversion must preserve every visible RGB value and the original alpha channel. The latest supplied tokens and resources have opaque coloured pixels and fully transparent exterior pixels; do not introduce partial opacity on their colour areas.

### Terrain

The five assets are named **Terrain hex markers**: sea, desert, forest, grassland and mountain. They are distinct from the capital's biome tile solutions.

Use `/art/terrain/{sea,desert,forest,grassland,mountain}.svg` in cards that refer to terrain. These files come from the owner's edited 24 px PNGs, including the later forest revision. Do not substitute coloured dots, generic landscape emoji or capital biome tiles for these markers.

### Player tokens

The current player tokens are the owner's shaded 32×32 images in blue, green, purple, red and yellow, supplied on 2026-10-24. Production URLs retain `piece/token-{colour}`. `PlayerToken` uses those assets. Originals are preserved in `tools/art/imported-pngs/player-tokens/`.

The old flat player-colour drawings are deprecated under `docs/art/archive/player-tokens-v1/`; they are not active choices in the gallery. The neutral `piece/token` remains a separately labelled unassigned-piece legacy icon, not a sixth player colour.

Do not add a player-token indicator just to repeat a selected state: on Collectors and comparable selected spaces, the blue highlight is sufficient. Show a physical token when it is the object being stored, moved, loaned or placed by the card's rule.

## Placement squares

Every surface on which the player is meant to place a piece or marker is a **square**. A large rectangular benefit area does not double as a placement target.

Use the two reviewed ordinary sizes:

| Square | Reference | Usage |
|---|---|---|
| 62×62 px | Collectors, six spaces across | Default compact placement; Craftsmen; outpost rows; token reserves |
| 75×75 px | Leaders, five spaces across | Larger target; reward paths; compact reward tracks |
| 39×39 px | Mystics numbered targets | Compact number selection only, not a larger physical-piece slot |

**Never make a placement square larger than the Leaders square.** Use fewer items per row or greater card height instead. Number targets can be smaller. Keep width and height equal in all states; selection borders must not enlarge the square.

Unfilled spaces and any illustrative printed item are greyed. Filled/selected spaces use the player-colour border. Printed rewards under a piece stay in the same square and become visible as the piece leaves. Do not put a second reward box under an outpost.

Square states are supplied by the caller as props (`collected`, `exposed`, `used`, `current`, `selected`, `filled`), and only in the play look; no card class or stylesheet gate decides them. These components do not decide whether a move is legal, pay a cost or mutate a game. A production interactive adapter must use legal options from the engine and expose actual buttons/keyboard controls, not clickable decorative spans.

## Pattern recipes

### Collectors: collection and stepped score

Six equal compact placement squares, labels beneath, then an unboxed `+ any-resource` benefit. Use the appropriate item artwork and face-down card/tile treatment. Do not add a redundant player marker. The blue selected border is enough.

All clarification text is beneath the spaces. The end-game score has one horizontal sequence of `1 VP`, `3 VP`, `6 VP`, `10 VP`, `15 VP`, `21 VP`, with Atkinson numbers and the collection counts aligned underneath. Keep the stepped score treatment; do not put “VP” below each number.

### Architects and other passive/triggered effects

Main instruction beside large art. Distinct triggered/scoring effects use beige `CardEffectBox` rows. Their condition is readable separately from their benefit. Clarifications follow these effect rows.

### Leaders: four once-only choices

Four square track targets in one row, at most 75 px: Exploration, Science, Technology and Military. Use the existing track symbols and short labels. An unused choice is greyed; a used/selected choice is highlighted. Expansion names appear as text boxes in the footer, not as icons attached to each label. Arts & Architecture changes nothing for the Leaders (03 §7); only the Revised Civilization Pack, which is out of scope, adds an Arts choice, so the card shows no Arts space (2026-10-27).

### Treasure Hunters: terrain rewards

Use the five-marker asset family (the relevant four for this mat), then the terrain name and its benefit. Keep the resource glyph with its amount and the explanatory text readable. Use a muted/used treatment only for an actual used state supplied by the caller; an example state is labelled as such.

### Craftsmen: three bottom-aligned columns

Three columns contain stacks of **62 px square + benefit to its right**. The columns start from the bottom and may have different heights. They are not three giant square panels and not one vertical list spanning the card.

Draw a thin vertical separator **between columns**, never between a square and its own benefit. Ordinary text is regular weight; `X VP` is bold. Keep resource glyph groups and “with benefit” unbroken. Do not add a horizontal separator between each square-benefit pair.

### Entertainers: branching legal paths

Square rewards form a four-by-four arrangement. Draw visible connectors between legally connected next spaces, including the appropriate diagonal branches. Connections are semantic: derive them from the selected card edition's legal transitions, not from a decorative grid. The card draws them from the engine's `entertainersMoves`, so it never shows a link the game refuses. State highlights the current reward; it must not obscure the printed reward. A nearby instruction explains movement direction.

### Militants: outposts covering income rewards

Two rows of four compact squares. Put each bonus **behind the outpost, inside its square**. When an outpost leaves, reveal the bonus there. Draw fine separators above, between and below the rows. Keep the single instruction about taking from the left of either row.

### Mystics: predictions plus two payoffs

Each category has a horizontal row of square numbered targets. Add a separator above and below the whole area and between category rows. A chosen target uses the blue highlight; do not confuse a selected prediction with a reached or exact-final prediction.

Use **two separate beige boxes**: the reward for first reaching a prediction, and the 10 VP per exact prediction at final income. Do not merge timing and scoring into an unstructured paragraph.

### Alchemists: temporary marked results

Four track squares record the current activation. Beige effect boxes distinguish stopping, repeating a rolled track, and advancing beyond the track end. Tokens here represent temporary results, not permanent used spaces. The demo must clear/mark them consistently with its labelled state. A rolled track's token is the player's own, in full colour, in the square's top-right corner as the Merrymakers' token marks its square, so the greyed track icon stays readable; the square keeps its unused look (owner, 2026-10-30).

### Isolationists: reserve plus score scale

Compact token reserve; a beige triggered reward box; a beige end-game score scale. Terrain markers demonstrate a connected landmass. Keep the original-mat edition label: this is not the revised ability.

### Traders: alternative targets

Compact token reserve followed by two distinct benefit boxes. The map-target illustrations distinguish an empty territory from a territory with an opponent outpost. The text carries the immediate-versus-later trigger difference.

### Merrymakers: independent upward tracks

Three reward columns, bottom-up. One starting token below each column. Each square can contain a paired reward; both rewards must remain readable. A moved token should not cover the reward. This example is the original mat, not the revised orthogonal-grid ability.

### Historians: uncovered rewards with an external trigger

Four squares show rewards covered by tokens. Removing tokens exposes rewards, and an opponent's landmark triggers all currently exposed rewards. Show the triggered effect in a beige box. Do not infer which square must be uncovered first from the demo.

### Inventors: ownership transfer

Compact reserve; a schematic of an opponent's top-row technology becoming the player's bottom-row technology; separate beige upgrade and top-row trigger explanations. A transfer arrow has explicit origin and destination. It illustrates an actual rule rather than a footer decoration. The token stays on the transferred card. This is an illustrative diagram, not an additional reserve or a second physical token.

## Components and generation

### Masterpiece cards

The approved Arts & Architecture masterpiece frame is 319 px wide and follows its content rather than holding a forced square height. Use the card-paper noise, a 49 px gold title band with Cinzel title text, and a full-width separator above the edition row. Set a 12 px inset around the body and a 12 px gap between the centered beige effect box on the left and the 144 px artwork on the right. The artwork's bottom edge is 12 px above the edition separator. Center effect content both vertically and horizontally. Show a single resource as `+` followed by its native 24 px icon; keep `X VP` on one line. The footer contains the Arts & Architecture label in its usual expansion box. `MasterpieceCard` owns this frame; callers provide the title, artwork and effect snippet. The Painting example in the component library is the approved layout fixture, not a separate frame for each card.

All public card primitives live under `src/lib/components/player/` and appear on `/components.html`:

| Component | Contract |
|---|---|
| `CardFrame` | `title`, full `portrait`, `portraitAlt`, edition codes in `editions`, `complexity`, `state`, main `effect` snippet and layout `children`; `bodyMinHeight` and `textLeading` for a short card's reviewed proportions; `plain` draws only the paper around the children, as the library shows a pattern |
| `CivilizationCard` | A recipe by `id`, with `state="empty"` or `"play"`; eighteen fixture recipes: the fourteen reviewed ones and the Futurists, Heralds, Nomads and The Chosen, awaiting review |
| `CardResource` | Native 24 px `symbol`, inline baseline treatment, `fine` in 11 px text; a container centres it with `--card-resource-center` and `--card-resource-height`; delegates artwork to `ResourceIcon` |
| `PlayerToken` | The supplied five `color` variants, native 32 px by default; optional display `size` and `decorative` |
| `CardSlot` | Only approved `size` values 39, 62 or 75; `label`, `filled` (the 2 px player border), content snippet; `pickable`, `picked`, `value` and `onCardSlotPick` for a decision's spot; never runs game logic |
| `CardEffectBox` | Beige triggered/scoring row: `title`, a `gain` resource or a `label` word as its symbol (or a `symbol` snippet), `symbolText` 12–15 px, rules as `children` |
| `CardEffectList` | The column of effect boxes, `above` for extra space |
| `CardClarity` | Supporting rules below the relevant spaces/effects as its own paragraph, an optional fainter `setup` line, `above` and `minHeight` |
| `CardPlacementRows` | `items` in a `collection`, `covered`, `tracks`, `leaders` or `history` layout, each item's state a field |
| `CardRewardColumns` | `columns`: `kind="beside"` for bottom-aligned slot/benefit rows; `"inside"` for cells a token climbs |
| `CardPathGrid` | `heads`, `spaces`, the legal `links` as pairs of square ids (drawn by the component), `current` and the `start` words |
| `CardPredictionTracks` | `categories` of numbered squares with boundary and row separators, each with its `selected` number |
| `CardTerrainRewards` | `rows` of terrain marker, name, `gain` and `effect`, each maybe `used` |
| `CardTokenReserve` | `count`, `used`, player `color`; renders remaining physical tokens in compact squares |
| `CardScoreLadder` | `steps` of `{ count, points }`, `current`, timing `label` and item `noun`; the stepped ladder or `kind="flat"` boxes with an `example` |
| `CardTechnologyTransfer` | Labelled ownership/row diagram, optional `active` illustration |

The squares a decision offers come to the patterns as `choices` (spot ids) and `picked`, and each reports `onCard{Name}Pick` with the spot id; `spotChoice` in `src/lib/card-spots.js` makes the CardSlot a button.

The pattern components take their structure as data and their rules text as typed Svelte snippets, never raw HTML strings. Use the existing reviewed recipe as a composition example. A new card does not need its own copied frame, badge styling, circle/resource implementation or giant page stylesheet.

Example for a new researched civilization layout:

```svelte
<CardFrame title={card.name} portrait={card.art} portraitAlt={card.artDescription}
  editions={card.editions} complexity={card.complexity}>
  {#snippet effect()}{card.mainInstruction}{/snippet}
  <CardTokenReserve count={card.initialTokens} used={view.sentTokens} />
  <CardEffectList>
    <CardEffectBox title={card.trigger} gain="any" symbolText={13}>
      {card.triggeredInstruction}
    </CardEffectBox>
  </CardEffectList>
  <CardClarity>
    {card.clarification}
    {#snippet setup()}{card.setup}{/snippet}
  </CardClarity>
</CardFrame>
```

Content data, rules edition, engine state and presentation are separate inputs. The review page's `play` mode is only a clearly labelled fixture. Do not wire it directly to a multiplayer game as authoritative state. When adding a new interactive primitive, follow `ComponentEvent` and callback conventions and use real buttons for legal choices.

## Generation and review checklist

1. Identify card family and exact rules edition; obtain verified content before composing.
2. Choose an existing pattern for each behavior: collection, covered benefit, numbered prediction, path, reserve, passive trigger, score or transfer.
3. Compose within 425 px; allow natural height; use the full large artwork.
4. Keep placement squares at the reviewed sizes. Inspect every long label and every paired reward.
5. Use current native assets and preserve colours/alpha. No deprecated 32 px resources or flat player tokens.
6. Check `+ icon`, one-line `X VP`, unbroken resource groups, ordinary benefit weight, and all clarifications below the relevant spaces.
7. Place expansion and complexity metadata in the footer as text boxes/dots. No expansion pictogram.
8. Check empty and marked examples. A blue highlight alone must not accidentally invent a placed token; a covered reward must reveal in the original square.
9. Test the real 425 px card width for overflow, loaded artwork, title clipping, and legal connector alignment. Test the published build as well as the development URL.
10. Add the new example to the single review page/library and update the fixture inventory. Record which design decision is new and which established pattern is reused.

## Superseded experiments and unresolved work

Superseded: 456 px card width; smaller civilization artwork; turquoise general-outpost flag; 32 px resource originals; grey circles around resources; a separate Collectors any-resource box; stacked VP labels; oversized Craftsmen placement panels; bold entire column rewards; expansion icons; duplicate “take from left” instructions; Militants rewards below rather than behind outposts; unconnected Entertainers squares.

Unresolved: final frames for every non-civilization card family; all 41 civilization rules/read models; live gameplay adapters, legal selection and submission states; complete in-game reference routing and private-card handling; precise card-choice/turn-sequence flows from issue #3. The fourteen reviewed examples demonstrate layout coverage, not completion of those systems. Keep the broad issue checklists open where their remaining requirements still apply.

## Integration verification — 2026-10-25

The review now renders the same shared Svelte components as the library. The latest main was merged without conflicts. The combined production build and 972 tests passed (one Unix permission test is skipped on Windows); Svelte reported zero errors and warnings. Source PNG versus SVG checks compare every token pixel, including transparency. Browser review covers unmarked and in-play cards. The design detector reported only the intentionally dense 10/11/12 px supporting text sizes; these approved sizes are recorded under "Typography and copy" above.
