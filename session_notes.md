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
  - **Pick lists (user request):** times (every 15 min), dates (the next 6 months) and set choices open a bottom sheet (`components/Select.tsx`, built in JS so it looks the same on both platforms). The choices are in `src/lib/choices.ts`: routine names, activities, note labels, contact labels, house labels, with separate lists for a child and an adult. Every list also has "Or type your own".
  - Routine steps are an activity plus optional details (the `note` column, added in database version 2).
  - **Several routines per person** (database version 3): a `routines` table, with each step belonging to one. A new person starts with one empty routine (Bedtime for a child, Daily for an adult). `people.routine_name` is left over and no longer used.
  - **Checking off routine steps:** tap a step on the person's page. `step_checks` records the day, the time and who did it ("Done at 7:12 pm by Matt"). Tap again to undo. Checks start fresh each day. Each routine shows "2 of 5 done" or "All done".
  - **Passwords and codes (user request):** each house item has a visible "Details" box (`value`) and a separate "Password or code" box (`secret`, added in version 4) that is always hidden. On the page the secret shows as dots with a "Show" button, and goes back to dots when the page is reopened. In the editor it's typed as dots, with an eye button to check it.
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

## Next steps

1. **GitHub:** https://github.com/thehatch3tt/hearth (private, branch `master`, pushed 2026-10-07). The `gh` CLI isn't installed here; plain `git push` works. **The user** creates a Firebase project when it's time to start syncing.
2. **On-device handbook:** first version built (see above). Next: try it on a phone in Expo Go, then polish.
3. Then the sitter link, then care-team sharing with Firebase and encryption.
