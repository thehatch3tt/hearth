# Session notes: Hearth

Notes for picking up Hearth in a new Claude Code session. Last updated 2026-10-07.

## What it is

**Hearth (working name) is a family handbook app.** It holds the things a helper needs to know about the people you care for:
- **Kids:** allergies, medicines, routines, comfort items, the words they use.
- **Aging parents:** medicine times and who gave each dose, appointments and who's driving, notes.
- **The house:** Wi-Fi, alarm, where things are.
- **An emergency card** that works offline.

Why this app: in research on 2026-10-07, babysitter and family-handbook needs were mostly met by printable templates, with few real apps. The aging-parent side gives families a reason to keep using the app week to week, not only on date night.

**How it's different from Skylight and other family calendars:** they plan the family's own week. Hearth is for the people who step in (sitters, grandparents, siblings sharing a parent's care). It holds know-how, keeps a log of who gave which dose, shares without accounts, and stays on the phone. Advice given to the user: don't grow it into a calendar. The sitter link and the care team are what set it apart.

Same owner as Scripture Loop (`C:\Projects\scripture-loop`, its own `session_notes.md`). Same way of working:
- Ask before committing and pushing.
- Summarize in plain language.
- Offer 2–4 concrete options for visual choices, and mock them up on the design canvas before building.

## Where things stand (end of 2026-10-07)

- **Committed and pushed:** everything up to `16db670`, including the Editorial with glass look and tab navigation on every screen.
- **Not committed yet (2026-10-07):** the app icon and splash (see "App icon"), dark mode, the tidier Settings, the whole-day page, and underlined names on Today.
- **Today layout:** the user chose **D · Front page** (2026-10-07), which is what's built.
- **Waiting on the user:** creating the Firebase project (see "Sitter links").

## Current look: Editorial with glass (chosen later on 2026-10-07)

- **Mockups:** a new design canvas, https://claude.ai/artifact/XDW9MProdbm8zNqpQLVjVM. "L · Editorial with glass" is the chosen one; the original L is beside it. (The old canvas link under "Design history" no longer opens; its files survive only in an old session's scratchpad.)
- **The user's direction:** clean, like a book or magazine, with liquid glass. **Not the newspaper version** (too busy). The old "serif only on a bold header" rule is **dropped**.
- **Colors** (`src/lib/theme.ts`): paper `#FAF8F3`, ink `#141414`, muted `#6B665D`, rules `#D9D4C8` / `#E6E1D6`, rust `#B23A10` accent. Person colors, alerts and the dark emergency card are unchanged.
- **Type:** Instrument Serif (one weight, upright and italic) for the day, headlines, names and times: `Text`'s `serif` and `italic` props. Instrument Sans for everything else (it stops at bold; weights 800/900 map to bold).
- **Glass** (`components/Glass.tsx`): Apple's real Liquid Glass via `expo-glass-effect` on iOS 26+, a frosted white with a soft shadow elsewhere (Android, older iPhones). `GlassButton` and `GlassIconButton`.
- **Tabs** (`src/app/(tabs)/`): Today (`index`), Family (new), Our home (`house`), Share. The menu bar is custom (`components/TabBar.tsx`): a glass pill plus a separate red glass Emergency circle that opens the emergency card (it never dials by itself). Person pages, editing, settings and Emergency are stack screens that slide over the tabs. Tab pages use `<Screen tabBar>` so content scrolls clear of the bar.
- **Today:** a small-caps masthead with a glass Settings button, the weekday huge in serif over an italic "the seventh of October", the next item as a serif sentence ("Donepezil, *for Grandma Ruth at two o'clock.*") with a glass "Mark it given →", the rest of today (three rows, italic times, square tick boxes), then "In this handbook" with dotted leaders to each person's warning, next appointment or age.
- **Every screen is Editorial now:**
  - Each page starts with a `Masthead`: a small-caps running head over a black rule, with a glass back button on sub-pages and Edit/Done/Add on the right.
  - Then a serif `Title` that stays on one line and shrinks to fit, with an optional italic line under it.
  - Sections are `Card`s (a black rule, no box) with small-caps `SectionTitle`s and thin rules between rows.
  - Medicine and routine steps use the same `CheckRow` as Today: an italic time with a small am/pm, square tick boxes, and a light haptic tap (`expo-haptics`, added 2026-10-07).
  - Folding sections on the edit page, the rest of today, and lists animate in and out with Reanimated layout transitions.
  - Chips are white with a thin edge (rust when chosen); sheets sit on paper with serif titles. The emergency card stays dark, with names and the address in serif.
- The Figtree and Fraunces font packages are no longer used and can be removed.

## Dark mode, Settings and the whole day (built 2026-10-07)

- **Dark mode:** Settings › Appearance: Like the phone (default), Light or Dark, saved as the `appearance` setting. `lib/theme.ts` has a light and a dark palette (warm near-black paper `#151412`, cream ink `#F1EDE5`, lighter rust `#E07A4F` with dark text on rust buttons) and dark person colors. Screens read colors with `useTheme()`; `components/ThemeProvider.tsx` applies the choice (also to the keyboard, alerts and Liquid Glass via `Appearance.setColorScheme`) and holds the splash until it has loaded. Stylesheets hold no colors any more: colors go inline from `useTheme()`. The emergency card stays dark in both; the sitter's shared page is always light. `app.json` now has `userInterfaceStyle: automatic`, which needs a new native build.
- **Settings:** two lines (Family name, Your name) typed in place in italic serif, instead of two big boxes; then Appearance.
- **The whole day** (`src/app/day.tsx`): everything for today in Morning, Afternoon, Evening and Any time, done items struck through in place. Today shows the next thing and three after it; the section heading and "See the whole day →" open this page. The list logic is shared in `lib/day.ts`.
- **Names that look tappable:** names in "In this handbook" are underlined.

## Today layouts (mocked up 2026-10-07)

On the canvas, row "Today: layouts to choose from": **D · Front page** (what's built now), **E · Timeline** (done items above a rust "now" line, the next item large, the rest below), **F · By person** (each person's name as a heading with their items under it), **G · Contents first** (the family name, a glass "Next" card, then a numbered contents list) and **H · Front page at night** (D in dark mode).

## Previous look: Linen bento with a bold serif header (replaced)

Chosen on 2026-10-07 after a long design search (see "Design history").
- **Colors** (`src/lib/theme.ts`): cream `#F4EFE6` page, warm-white cards `#FFFDF8` (24–28 px corners), espresso ink `#2E2420`, muted `#6B5B50`, terracotta `#A2452A` for main buttons (never solid black: the user doesn't want black buttons).
  - Earthy person colors (clay, dusty blue, ochre, sage, plum, rose), stored under the older keys peach, sky, butter, sage, lavender, rose. `personColor()` maps even older names.
  - Alerts are `#F8E0D8` with `#93301B`. The emergency card stays dark (`#1F1714`) with a big red Call 911.
  - All text colors were checked at 4.5:1 or better.
- **Type:** Figtree for everything. **Fraunces Bold only for the Home header** (`Text`'s `serif` prop in `components/ui.tsx`).
  - The user's rule: serif only on the top header, bold, with the family name as the largest line, and it must fit on screen.
  - Instrument Serif (the font in the Editorial mockup) was dropped because it has no bold.
- **Home** (`src/app/index.tsx`), the bento layout:
  - The greeting and settings on a small top row. Then "The Carter Family" in bold serif as the largest line (it shrinks to fit), with "Handbook" in smaller serif under it.
  - Faces in progress rings for today's medicine and routine steps, plus a red dot for an allergy. "+ Add" at the end.
  - A big Today tile: a progress bar, the next item highlighted in the person's color with Given/Done, two more to tick, and "See the whole day".
  - Tonight (the next evening routine) and Tomorrow (the next appointment) tiles.
  - A row with Share tonight, Our home and Emergency.
- **Other screens** keep their earlier layouts (rounded cards) in the Linen colors and fonts. Carry the Linen look through them more carefully once the user approves Home.
- **Icons:** outline icons (react-native-svg, `components/Icon.tsx`), never emoji.

## App icon (chosen 2026-10-07)

- **Concept 4, "Heart window":** a terracotta (`#A2452A`) house with a cream (`#F4EFE6`) heart-shaped window, on a **linen background**. The user asked for linen instead of the near-white cream.
- **The linen in the mockup:** `#E6D8C3` with a faint woven texture (fine light horizontal lines and soft brown vertical lines).
- **Mockup:** the "App icon ideas" board on the design canvas, marked "chosen". The other five concepts (home flame, open handbook, H monogram, hearth arch, bookmark flame) are there for reference.
- **Made (2026-10-07):**
  - A house with a chimney and rounded corners, in terracotta, with a cream heart window. Drawn as SVG and rendered to PNG by a throwaway script (not in the repo; the shapes are in `assets/hearth.icon/Assets/house.svg`).
  - `assets/images/icon.png` (1024, linen with a faint weave), the Android adaptive layers (foreground, linen background and monochrome, with the house at 72% so it clears the circle mask), `splash-icon.png` (the house alone; the splash background is linen `#E6D8C3`, width 180) and `favicon.png`.
  - iOS uses an Icon Composer file, `assets/hearth.icon`, so iOS 26 gives the house Liquid Glass: a linen automatic gradient behind it, translucency off. It replaced the Expo template `expo.icon`. Its JSON was copied from the template, because the format for a plain solid fill could not be confirmed. **Not checked in a real iOS build yet.**
  - Checked: it reads at 29 px; the Android prebuild made the launcher icons correctly. The splash only shows in a preview or production build, not in Expo Go or a development build.

## Data and sharing (decided 2026-10-07)

**The user's goal:** all information stays on the phone, but sharing with others who also look after the kids or parents is important.
- **On the phone:** the full handbook lives on the device and works offline.
- **Accounts only for sharing:** Sign in with Apple or Google, no passwords. Someone who never shares never needs an account.
- **Only shared items sync,** end-to-end encrypted: the server holds only scrambled data plus who's in which team. Three matching words confirm a care-team invite reached the right person.
- **Backend: Firebase** (chosen over Supabase, whose free tier pauses after a week of inactivity). Spark (free) covers 1 GB, 50k reads and 20k writes a day; it's likely $0 for hundreds of families.
- **Pricing idea (not decided):** free for one household on one phone; a one-time unlock for sitter links and PDFs; a small yearly plan only for live care-team sharing.

## Sitter links (built, waiting on Firebase)

- **App:** `src/app/share.tsx` ("Link for tonight", from "Share tonight" on Home). Choose who it's for, which pages, a note, and when it stops working (tomorrow 9 am, 3 days, a week). Then the phone's share sheet opens. Links still working are listed with "Send again" and "Stop".
- **How it works:** `src/lib/share.ts`.
  - `buildSnapshot` gathers the pages (type `Snapshot`, version 1).
  - `createLink` encrypts them with AES-256-GCM (@noble/ciphers, a random key from expo-crypto) and saves `{v, data, iv, expiresAt, createdAt}` to Firestore `links/{random id}`.
  - The link is `VIEWER_URL/#<id>.<key>`. The key stays after the `#`, which browsers never send to a server.
  - The phone remembers sent links in `sitter_links` (database version 5).
- **Link page:** `viewer/index.html`, one static file for Vercel.
  - It decrypts with WebCrypto, then shows warnings first, "The plan", each person, the house (codes hidden until tapped) and Emergency.
  - It uses text nodes only (never innerHTML), and is set to noindex and no-referrer.
  - **Still in the Soft garden look:** restyle it to Editorial when Firebase is connected.
- **Rules:** `firebase/firestore.rules`. Create only in the exact shape (under about 400 KB, ending within 8 days); get by id; no listing or updates; delete by id. Add a TTL policy on `links.expiresAt`. Before launch, add App Check so only the real app can create links.
- **Check:** `node scripts/check-share-crypto.mjs` confirms the app's encryption opens in a browser.
- **Still to do (the user):**
  1. Create the Firebase project and a Firestore database.
  2. Paste the rules and add the TTL policy.
  3. Add a web app and copy its settings into `.env` (see `.env.example`) and into the `FIREBASE` constant in `viewer/index.html`.
  4. Deploy `viewer/` to Vercel and put its URL in `.env`.

## The project

- Expo SDK 57: Expo Router in `src/app/`, typed routes, React Compiler. `AGENTS.md` / `CLAUDE.md` come from the template: read the versioned Expo docs before using any Expo API.
- **After installing packages, restart with `npx expo start --clear`.** A running dev server misses new packages, which caused the "Unable to resolve @firebase/firestore" error.
- **Navigation:** one stack, no tabs. Screens: `index` (Home), `person/[id]`, `person/edit`, `house`, `emergency`, `emergency-edit`, `settings`, `share`.
- **Data:** expo-sqlite, `hearth.db`, migrations in `src/lib/db.ts` (`PRAGMA user_version`, currently version 5). `useQuery` re-reads after every save.
  - **Rule:** never change a migration step once it may have run on a phone, even in testing. Add a new step instead. A changed step 3 once left the phone missing a column.
- **Features:**
  - **People:** allergies and warnings, medicine (timed medicine is checked off daily in `doses`, which records who and when; untimed is "As needed"), several routines each (version 3), steps checked off daily in `step_checks`, appointments, notes, and words.
  - **Editing:** the edit page's sections fold to one-line summaries, one open at a time. `ListEditor` handles the rows. The choices for the pick lists are in `src/lib/choices.ts`, with separate lists for a child and an adult and "Or type your own".
  - **Pickers** (`components/Select.tsx`, bottom sheets that barely scroll): `TimeSelect` (an hour grid, :00/:15/:30/:45, am/pm), `DaySelect` (a month calendar), `Select` (chips), and `BottomSheet`.
  - **Our home:** a compact list, edited in a sheet. Each item has visible details plus a separate password or code (`secret`, version 4) that's always hidden until tapped. There are quick "+ Wi-Fi"-style buttons for common items.
  - **Emergency:** a dark card. Call 911, the address to read aloud, tap-to-call numbers, and allergies pulled from each person.
- Light mode only (`userInterfaceStyle: "light"`).
- **Not built yet:** "Who's visiting" (needs the care team), reordering rows, photos and Papers, dark mode, web.
- **Before the first store build:** check whether "Hearth" is available on the App Store, then set the bundle id, the icon and splash (see "App icon"), and the EAS project.

## Design history (2026-10-07, condensed)

All mockups are on the design canvas: https://claude.ai/artifact/JAot5UYvpHQ5sRPCyBMucG
1. **Original (row 1):** gray, white cards, Manrope, dark orange. Built first, then replaced.
2. **Soft garden:** sage, Nunito, pastels. Built and committed (`1a3965d`).
3. **Today-first layouts A–D,** then the bento Home **E/F** (F has a serif heading). The user liked F.
4. **Theme recolors G–J** of F (Linen, Harbor, Dusk, Paper). At first the user rejected them as "only colors, not styles".
5. **Real styles K–N** (Transit line, Editorial, Notebook, Chunky). The user chose **L Editorial**, then a **newspaper** version of it, with the puns removed. It was built but felt wrong on a phone, so it was dropped uncommitted.
6. **Modern directions** (Native Glass, Day Blocks, Midnight, Bold Minimal): rejected as generic.
7. **Retro, modern bones** (Seventies Kitchen, Mid-Century Family, Merit Badges, plus B2/B3 toned down). B2 was briefly started, then stopped.
8. A brief rebuild of the original with Instrument Serif, then the user settled on **G · Linen bento with a bold serif header**, the current look.

**What the user wants:** personality without being childish or generic, easy phone navigation, Today prominent, readable type, and serif only for the top header.

## Next steps

1. **The user tests Editorial on a phone** (every screen). Adjust anything they notice, then commit and push. A development build needs rebuilding for haptics.
2. Remove the unused Figtree and Fraunces font packages.
3. Today stays on **D · Front page** for now; E (the "now" line) and the others are on the canvas if it changes.
4. **Check the icon and splash in a real build** (EAS preview build), especially the iOS Liquid Glass icon.
5. **Firebase:** when the user has created the project, connect it, deploy the link page to Vercel, restyle it to Editorial, and send a real test link.
6. Later: care-team sharing (Apple/Google sign-in, encrypted sync), App Check, the store build.

GitHub: https://github.com/thehatch3tt/hearth (private, branch `master`). The `gh` CLI isn't installed here; plain `git push` works.
