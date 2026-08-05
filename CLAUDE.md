# Explorer Kids — project context

Offline-first learning PWA for young children (React 19 + Vite + `vite-plugin-pwa`).
Kid-facing activity app plus a parent dashboard. **No backend, no network calls** —
everything persists to `localStorage` under `kids-app-v2-state`.

## Curriculum source

Structure is modelled on **K5 Learning's Kindergarten section** (`k5learning.com`).
We take the *taxonomy and sequencing* only — that's standard early-maths pedagogy and
not theirs to own. Their worksheet PDFs, artwork and page copy are © K5 Learning and
must not be copied or embedded.

Scope is **Kindergarten only**. Two subjects mirroring K5 verbatim (no merging):

| Subject (`id`) | Topics | Activities mapped | Activities built |
|---|---|---|---|
| Numbers & Counting (`numbers`) | 5 | 52 | 0 |
| Simple Math (`math`) | 6 | 46 | 8 |

Only Addition and Subtraction have activities the engine can serve, so **`numbers` is
currently hidden** — empty topics and subjects are filtered out, never shown as
"coming soon".

> Subject ids are `numbers` / `math` (not `numbers-counting` / `simple-math`) so the
> names still fit when Grade 1 content lands. These ids are baked into `dailyRecords`
> keys — changing them later is a migration.

## Information architecture

```
Home → Subject → Topic → Activity → questions
```

The **activity** is the playable unit (one K5 worksheet set). Route:
`/subject/:subjectId/topic/:topicId/activity/:activityId`

`subjectEntryPath()` in `data/subjects.ts` skips the topic screen when a subject has
exactly one topic. That's how flat K5 subjects (Shapes, Letters, Colors — no topic
level) slot in later without changing the data shape.

## Key decisions and why

- **No personal information.** No age, no grade, no birth year. Nothing leaves the
  device. A child's *level* is a setting, not identity — that distinction is why
  `band`/`levels` are acceptable and age was rejected.
- **`band` (`k`/`g1`/`g2`) and `tier` (1–3) are stored on every activity but not
  enforced.** No padlocks. The timetable steers instead — a plan says "right now,
  this" where a lock says "you can't".
- **The timetable is a plan, not a clock.** Times and durations are shown, sorted by,
  and used for the `NOW` marker — but never hide or disable anything. A kid who opens
  the app late still finds everything available.
- **Duration governs session length** for planned activities (`?mins=N` → the session
  runs for that long). Free play still uses `questionsPerTopic`. No visible countdown
  for the child — pressure at this age.
- **Adding several activities at once cascades** them back to back rather than
  stacking them on one minute. Overlaps are detected and flagged, never silent.
- **Parent dashboard is draft + one Save button** (explicit user choice). A sticky
  "Unsaved changes" bar appears when dirty; leaving or switching child prompts first.
  Destructive actions bypass the draft — they're commands, not settings.
- **No `window.confirm` anywhere.** Use `components/ConfirmDialog.tsx`: named buttons
  ("Erase everything", not OK), child avatar shown, cancel first and autofocused.
- **The activity owns the number ceiling**; `difficulty` only softens within it, so
  "Sums to 5" really can produce 5.

## Where things live

| Path | Role |
|---|---|
| `data/subjects.ts` | Curriculum tree + visibility/lookup helpers |
| `utils/plan.ts` | Timetable logic — cascade, overlaps, gaps, plan-only gating |
| `utils/mathQuestions.ts` | Question generation; band-aware ranges |
| `utils/progress.ts` | Per-activity progress keys |
| `context/AppContext.tsx` | All persisted state |
| `components/PlanAddSheet.tsx` | Drill-down activity picker (scales to 98) |
| `components/{ConfirmDialog,Toast,TimePicker}.tsx` | Shared UI primitives |

## Known issues

- **`dailyRecords` keeps no history.** `AppContext.tsx` discards yesterday's record the
  moment the kid plays today. This blocks any mastery-driven tier promotion and is the
  main prerequisite for auto-levelling.
- `TopicSessionRecord.gradePercent` means *score*, not grade level — a naming collision
  waiting to bite once bands are enforced. It also keeps best-ever, not recent, which
  overstates ability.
- `package.json` version is `0.0.0`, surfaced in Device → About.
- The child card subtitle hardcodes "Kindergarten"; should read from `levels` once
  Grade 1 ships.
- K5's own sequencing has a quirk we deliberately did *not* copy: Kindergarten includes
  subtraction with borrowing, Grade 1 explicitly excludes it. Put borrowing in band 2.

## Likely next steps

1. **More question forms** — missing addend (the only form present in every grade K–6),
   count objects, doubles. Objects/count would unlock the `numbers` subject.
2. The remaining ~90 activities (pure data once the forms exist).
3. Persist history, then enable tier promotion from mastery.
4. Grade 1 content + the class selector (deliberately deferred — architecture is ready,
   the screen isn't built).

## Commands

```bash
npm run dev      # port 5173 (may fall back to 5174)
npm run build    # tsc -b && vite build
npx oxlint src   # lint
```

Note `devOptions.enabled: true` in `vite.config.ts` regenerates the service worker on
every HMR rebuild, so the "A new version is ready" banner fires constantly in dev. Not
a bug; it won't behave that way in production.
