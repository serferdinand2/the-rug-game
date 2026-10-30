# Split PlayerTabs by tab (#95): implementation plan

1. **Test pure behavior first**
   - Add cases for `centredCorner`, `landingIndex`, and `capitalPlacement` to
     `tests/client-area-placement.test.mjs`.
   - Add cases for `defaultEra` to `tests/client-area-income.test.mjs`.
   - Run those focused tests and confirm the new cases fail before
     implementation.
2. **Implement shared calculations**
   - Add the pure helpers in `src/lib/area/placement-targets.js` and
     `defaultEra` in `src/lib/area/income.js`.
   - Re-run the focused tests.
3. **Extract the tab parts**
   - Move capital placement state, handlers, markup, and scoped styles to
     `CapitalTab.svelte`.
   - Move technology, era, and terrain markup and styles to their own
     components.
   - Keep `PlayerTabs` as the owner of the tab row, shared view sanitization,
     callbacks to game state, and the selected era value needed across tab
     switches.
4. **Update documentation**
   - Update `docs/architecture.md` with the screen-part split and helpers.
   - Update `docs/status.md` with #95's completion and remaining M13 owner
     checks.
5. **Validate**
   - Run focused area and capital/player-area/explore browser tests.
   - Run `npm run check` and formatting checks for the changed files.
   - Review the diff for unchanged decision callbacks, read-only views, and
     panel layout.
