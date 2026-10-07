# Session notes: Hearth

Notes for picking up Hearth in a new Claude Code session. Last updated 2026-10-07.

## What it is

**Hearth (working name) is a family handbook app.** It holds the things a helper needs to know about the people you care for:
- **Kids:** allergies, medicines, the bedtime routine, comfort items, the words they use.
- **Aging parents:** medicine times and who gave each dose, appointments and who's driving, who's visiting which day, notes.
- **The house:** Wi-Fi, alarm, where things are.
- **An emergency card** that works offline.

Why this app: in research on 2026-10-07, babysitter and family-handbook needs were mostly met by printable templates, with few real apps. Homeschool logs and teen driving logs were crowded. The aging-parent side gives families a reason to keep using the app week to week, not only on date night.

Same owner as Scripture Loop (`C:\Projects\scripture-loop`, its own `session_notes.md`). Same way of working:
- Ask before committing and pushing.
- Summarize in plain language.
- Offer 2–4 concrete options for visual choices.

## Mockups

- Design canvas: https://claude.ai/artifact/JAot5UYvpHQ5sRPCyBMucG
- **Row 1:** Home, a child's page (Ellie), caring for Grandma Ruth, what the sitter sees, and the emergency card. The page layouts still follow these.
- **Row 2:** four other styles (Binder, Soft garden, Bold night, Calm care). **The app now uses Soft garden (switched 2026-10-07 at the user's request)**, after first being built in the row 1 look.
- **Row 3, the sharing flow:**
  1. Share Grandma Ruth: care team, one-time link, or PDF.
  2. Choose what Sarah sees: switches per section, plus "Update things" or "Only look".
  3. Send the invite: QR code, text or link. It works once and expires after 48 h. Both phones show three matching words.
  4. Sarah opens it: Continue with Apple or Google.
  5. The care team: members and roles, plus recent updates ("Sarah marked Donepezil given").
  6. Link for tonight: for the sitter. Pick the pages, add a note, and choose when the link stops working.

### The look (Soft garden, all in `src/lib/theme.ts`)

- **Type:** Nunito (400–900). Headings are 900.
- **Colors:**
  - Pale sage background `#E8EEE4`, white cards with a 24–28 px radius, deep green ink `#1F3B2D`, muted text `#4D6B58`.
  - Main buttons are garden green `#2F5A43`, not black.
- **Heading:** "[Family name] Family Handbook" in big letters, with "Good evening, [your name]" above it.
- **Home:** a row of round faces (a coral ring marks anyone with an allergy or warning), then a Today card (medicine still due, appointments this week), then Our home and Emergency (pink) tiles.
- **A pastel per person:** peach, sky, lavender, sage, rose, butter. The first version's names (blue, teal...) still map to these.
- **Alerts:** `#FBE3DD` with `#8E2414`. The emergency screen stays dark (`#1A0F0E`) with a big red "Call 911".
- **Icons:** outline icons, never emoji.
- **Buttons:** the user didn't want solid black buttons in Scripture Loop, so main actions use a color.

## Data and sharing (decided 2026-10-07)

**The user's goal:** all information stays on the phone, but sharing with others who also look after the kids or parents is important. The plan is accounts that sync only minimal data.

- **On the phone:** the full handbook lives on the device and works offline, like Scripture Loop's device-only data.
- **Accounts only for sharing:** Sign in with Apple or Google, no passwords. Someone who never shares never needs an account.
- **Only shared items sync.** One person's page (e.g. Grandma) goes to a care team. Unshared pages never leave the phone.
- **End-to-end encryption:**
  - Shared pages are encrypted on the phone with a key for that care team, so the server holds only scrambled data plus who's in which team.
  - The three matching words come from the key exchange, so both people can confirm the invite reached the right person.
- **Sitter links (no account):**
  - The link holds an encrypted copy of the chosen pages. The key sits in the part of the link after `#`, which browsers never send to the server.
  - The copy is deleted when the link expires.
  - The web page that opens it can live on Vercel, which the user already uses.
- **Backend: Firebase.**
  - Firestore's offline sync fits a phone-first app, and Firebase Auth covers Apple and Google sign-in.
  - **Spark (free):** 1 GB stored, 50k reads and 20k writes a day, 10 GB downloads a month. It doesn't pause.
  - **Blaze (pay as you go):** you pay only past the free amounts.
  - The records are tiny, so it's likely $0 for hundreds of active families.
  - Supabase was the alternative: its free tier pauses after a week with no activity, and Pro is $25/month.
- **Pricing idea (not decided):**
  - Free for one household on one phone.
  - A one-time unlock for sitter links and PDFs.
  - A small yearly plan only for live care-team sharing, since syncing has ongoing server costs.

## The project

- Expo SDK 57 (create-expo-app default template, 2026-10-07): Expo Router in `src/app/`, typed routes, React Compiler.
- `AGENTS.md` / `CLAUDE.md` come from the template: read the versioned Expo docs before using any Expo API.
- **The on-device handbook (built 2026-10-07, no accounts):**
  - One stack with no tabs yet. The mockup's Today / Helpers / Papers tabs wait until there's something to put in them.
  - Screens: Home (`index`), a person's page (`person/[id]`), add/edit a person (`person/edit`), `house`, `emergency` (dark, Call 911, tap a number to call), `emergency-edit`, `settings` (family name, your name for "given by").
  - Data: expo-sqlite, `hearth.db`. Tables and migrations in `src/lib/db.ts` (`PRAGMA user_version`). Add a new `if (version === 1)` step for any change; never edit the version-0 tables.
  - `useQuery` re-reads after every save (a simple change counter, no per-table tracking).
  - Editing: `ListEditor` (rows of boxes, trash button, "+ Add").
  - **Pick lists (user request):** times, dates and set choices open a short bottom sheet (`components/Select.tsx`, built in JS so it looks the same on both platforms). The first version used long scrolling lists, which the user found much too big, so now they barely scroll:
    - `TimeSelect`: a grid of hours 12–11, then :00 / :15 / :30 / :45, am / pm, and "Set time".
    - `DaySelect`: a month calendar, plus Today / Tomorrow.
    - `Select`: choices as wrapping chips.
  - **Edit page sections fold away (user request):** About, Allergies, Medicine, Routines, Appointments, Notes and Words. Each shows one line with a summary ("2 daily, 1 as needed") and opens when tapped. One is open at a time. The choices are in `src/lib/choices.ts`: routine names, activities, note labels, contact labels, house labels, with separate lists for a child and an adult. Every list also has "Or type your own".
  - Routine steps are an activity plus optional details (the `note` column, added in database version 2).
  - **Several routines per person** (database version 3): a `routines` table, with each step belonging to one. A new person starts with one empty routine (Bedtime for a child, Daily for an adult). `people.routine_name` is left over and no longer used.
  - **Checking off routine steps:** tap a step on the person's page. `step_checks` records the day, the time and who did it ("Done at 7:12 pm by Matt"). Tap again to undo. Checks start fresh each day. Each routine shows "2 of 5 done" or "All done".
  - **Our home layout (user asked for cleaner and more concise):** one white card listing every item as a row (an outline icon from the label, the label, the details, and the password as dots with an eye button to reveal it). Tap a row to change it in a bottom sheet (`BottomSheet` in `components/Select.tsx`). Under the list, "+ Wi-Fi", "+ Alarm" and similar chips add the usual items that are still missing. "Add" in the header adds anything else.
  - **Passwords and codes (user request):** each house item has a visible "Details" box (`value`) and a separate "Password or code" box (`secret`, added in version 4) that is always hidden. The secret goes back to dots when the page is reopened. In the sheet it's typed as dots, with an eye button to check it. For Wi-Fi the boxes read "Network name" and "Password".
    - Version 4 moved anything already saved under a password-like label (Wi-Fi, Alarm, Door code, PIN... see `looksSecret` in `db.ts`) into the secret box.
    - The sitter link should keep secrets hidden until tapped too.
  - **Lesson:** a "Hide until tapped" switch was tried first and gave an error on the phone. Version 3 had been changed after the phone already ran it, so the column it needed was missing. Never change a database step once it may have run on a phone, even in testing: add a new step. Version 4 checks which columns exist before adding one.
  - Medicine with a time can be checked off each day (the `doses` table records who gave it and when). Medicine with no time shows as "As needed".
  - Light mode only for now (`userInterfaceStyle: "light"`). Icons are react-native-svg outlines in `components/Icon.tsx`. Nunito via `@expo-google-fonts/nunito`.
  - "Mark given" uses the person's color.
  - Not built yet: the sitter card on Home (it waits for sitter links), "Who's visiting" (needs the care team), reordering rows, photos and Papers, dark mode, web (expo-sqlite on web needs extra setup).
- **Before the first build, still to set:**
  - the app name check on the App Store ("Hearth" may be taken)
  - the bundle id
  - icon and splash colors
  - the EAS project

## Sitter links (built 2026-10-07, waiting on Firebase)

The user chose Firebase over packing everything into the link or using Vercel storage.

- **App:** `src/app/share.tsx` ("Link for tonight", opened from "Share with a sitter" on Home).
  - Who it's for, which pages (people as chips, Our home, Emergency card), a note, and when it stops working (tomorrow 9 am, 3 days, a week).
  - Then the phone's share sheet opens with the link.
  - Links still working are listed with "Send again" and "Stop".
- **How it works:** `src/lib/share.ts`.
  - `buildSnapshot` gathers the chosen pages (type `Snapshot`, version 1).
  - `createLink` encrypts them with AES-256-GCM (@noble/ciphers, new random key from expo-crypto) and saves `{v, data, iv, expiresAt, createdAt}` to Firestore `links/{random id}`.
  - The link is `VIEWER_URL/#<id>.<key>`. The key stays after the `#`, which browsers never send to a server.
  - The phone remembers sent links in `sitter_links` (database version 5).
- **Link page:** `viewer/index.html`, one static file for Vercel.
  - It reads the document through the Firestore REST API and decrypts it with WebCrypto.
  - It shows: warnings first, "The plan" (routine steps and timed medicine in time order), each person, Around the house (codes hidden until tapped), and Emergency (Call 911, tap-to-call numbers), with an Emergency button pinned at the bottom.
  - It's built only with text nodes (never innerHTML), and set to noindex and no-referrer.
- **Rules:** `firebase/firestore.rules`.
  - Create only in the exact shape, under about 400 KB, ending within 8 days.
  - Get by id, no listing, no updates, delete by id.
  - Plus a TTL policy on `links.expiresAt`.
  - There's no auth: knowing the random id is the permission. Before launch, add App Check so only the real app can create links.
- **Check:** `node scripts/check-share-crypto.mjs` confirms the app's encryption opens in the browser.
- **Still to do (the user):**
  1. Create the Firebase project and a Firestore database.
  2. Paste the rules and add the TTL policy.
  3. Add a web app and copy its settings into `.env` (see `.env.example`) and into the `FIREBASE` constant in `viewer/index.html`.
  4. Deploy `viewer/` to Vercel and put its URL in `.env`.

## Home layouts (2026-10-07)

The user wants Today to be the focus. There are four mockups in a new row on the design canvas ("Home with Today first"):
- **A, Timeline:** everyone's day in one list with a "Now" line.
- **B, Next up:** one big card for the next thing due, faces with progress rings, then later today.
- **C, By person:** a card per person with a progress bar and their next item.
- **D, Checklist:** Morning, Afternoon and Evening, with filter chips for each person.

All four have a "Share tonight" button.

**Then the user questioned the Soft garden look itself.**
- Recolors of the bento layout (G–J) were rejected as "only themes, not styles".
- Four real styles followed (K Transit line, L Editorial, M Notebook, N Chunky). **The user chose L, and asked to make it more like a newspaper than a magazine.**

**Newspaper style (mockups in the canvas row "Newspaper style — every screen", 2026-10-07; not yet approved or built):**
- **Type:** Playfair Display headlines, Source Serif 4 body text, Libre Franklin small-caps labels.
- **Nameplate:** "THE CARTER FAMILY HANDBOOK" in Playfair capitals. The user rejected blackletter.
- **Colors:** newsprint `#F5F2EA` with ink `#121212`. Blue ink `#1D4E89` for main buttons (never black). Red `#B3261E` only for allergies and emergencies. Small colored small-caps tags per person (Ellie `#B8501A`, Max `#1F5FA8`, Grandma `#6B3FA0`).
- **Shapes:** rules and double rules instead of cards, square checkboxes, 3 px corners.
- **Front page:** one column (the user rejected two columns). Lead story = next thing due, then "The rest of today", "Also in this edition", the index of sections, Share and Emergency.
- **Sections:** people are A2/A3/A4, Our home is B1 ("Around the House", boxed classified ads, one column), Emergency is B2 (a red bulletin banner and a phone directory with dotted leaders).
- **Other screens:** Edit has a grid time picker. The share screen is "Tonight's Edition". The sitter's web page uses the same newspaper style.
- **Toned down at the user's request ("stylish without being childish"):**
  - No section numbers, "Classifieds", "Place an ad", "editor's desk" or "Vol./No.". Plain labels: "Our Home", "+ Add", "Edit Ellie", "Words she uses", "Share with a sitter".
  - The one pun kept is "Tonight's Edition" for the sitter link, because it describes what it is.
  - One small-caps label style, at 11–12 px minimum (bigger again in the app).
  - Double rules only under the nameplate and at the bottom of Home and the sitter page.

## Next steps

1. **GitHub:** https://github.com/thehatch3tt/hearth (private, branch `master`, pushed 2026-10-07). The `gh` CLI isn't installed here; plain `git push` works. **The user** creates a Firebase project when it's time to start syncing.
2. **On-device handbook:** first version built (see above). Next: try it on a phone in Expo Go, then polish.
3. Then the sitter link, then care-team sharing with Firebase and encryption.
