# Project architecture

Pratik's Progress Plan remains a dependency-free static PWA. The code is split by responsibility so each area can be changed without editing the full application.

## Entry point

- `index.html` is the minimal document entry point. It contains metadata, asset imports, and two component mount points.
- `styles/main.css` contains the shared design system, component styles, responsive rules, and print styles.

## HTML components

- `components/layout/` contains the header, hero, navigation, and footer.
- `components/sections/` contains one file per application panel: dashboard, today, calendar, 21-day plan, life routine, activity, diary, insights, and settings.
- `components/overlays/` contains modal and feedback layers.
- `scripts/components.js` loads all partials in a declared order before application initialization.

## JavaScript layers

Scripts are loaded with `defer` in dependency order:

1. `scripts/components.js` — HTML partial manifest and component loader.
2. `scripts/config.js` — constants, defaults, and initial application state.
3. `scripts/state.js` — persistence, dates, scoring, and shared state helpers.
4. `scripts/analytics.js` — metrics, habit scores, and coaching recommendations.
5. `scripts/dashboard.js` — dashboard, charts, calendar, and insight rendering.
6. `scripts/routine.js` — adaptive routine generation and next-action behavior.
7. `scripts/activity.js` — Chrome extension messaging and digital activity rendering.
8. `scripts/diary.js` — private diary storage, local language analysis, planner synchronization, rendering, search, and entry controls.
9. `scripts/ui.js` — settings, focus timer, navigation, exports, and shared UI utilities.
10. `scripts/app.js` — event wiring and application bootstrap after components load.

The files intentionally use ordered classic scripts rather than bundled ES modules. This preserves direct file hosting, GitHub Pages support, the existing global event model, and compatibility with the activity extension without introducing a build step.

## Supporting PWA files

- `manifest.json` defines installable-app metadata.
- `sw.js` caches the application shell and all extracted assets for offline use.
- `icon.svg` is the installable app icon.

## Browser data

Progress continues to use the existing `pratiksProgressPlan_v3` localStorage key. Focus timer and extension storage contracts are unchanged.

Diary entries use the separate `pppDiary_v1` localStorage key. Entries are kept by default; an entry expires seven days after creation only when its `autoDelete` option is selected.

Diary analysis runs locally without sending writing to an external service. Confident completed or missed habit statements synchronize structured values to the entry's calendar day. Future plans are added to that day's reflection; ambiguous or unrelated text remains diary-only.

Diary statements with a resolvable date and time range—such as “work tomorrow from 10 to 15”—create deduplicated records under `pppCalendarCommitments_v1`. My Day Planner can plan any selected date and treats these records as fixed busy intervals when positioning its three learning blocks.

Diary statements that specify a wake-up or bedtime create per-date overrides under `pppDaySchedulePreferences_v1`. My Day Planner also asks for optional wake-up and sleep times before creating a plan and saves supplied values to the same per-date record. A supplied value takes priority for that date; an omitted value falls back to the corresponding preferred time in Settings. Existing diary entries are migrated when loaded, so previously saved schedule statements can begin affecting their resolved dates without being re-entered. “Use Default Times” removes the selected date's override.

All planning surfaces use the canonical `GOALS` schema in `scripts/config.js`. Each goal has one key, standard label, daily minute target, score weight, diary keywords, and optional milestone. This schema drives check-in controls, focus tracking, calendar columns, analytics, graphs, settings, routines, diary extraction, and the rolling 21-day plan.

`scripts/routine.js` also provides the automatic human-capacity day planner. It selects only three learning goals using milestone urgency, career importance, weekday/weekend context, and recent consistency. Exact times are derived from preferred wake and sleep settings, with meals, movement, buffers, social/private life, diary review, and shutdown protected as first-class schedule blocks.
