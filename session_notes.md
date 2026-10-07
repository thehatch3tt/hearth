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
- **Row 1, chosen look (2026-10-07):** Home, a child's page (Ellie), caring for Grandma Ruth, what the sitter sees, and the emergency card.
- **Row 2:** four other styles (Binder, Soft garden, Bold night, Calm care). The user preferred the original.
- **Row 3, the sharing flow:**
  1. Share Grandma Ruth: care team, one-time link, or PDF.
  2. Choose what Sarah sees: switches per section, plus "Update things" or "Only look".
  3. Send the invite: QR code, text or link. It works once and expires after 48 h. Both phones show three matching words.
  4. Sarah opens it: Continue with Apple or Google.
  5. The care team: members and roles, plus recent updates ("Sarah marked Donepezil given").
  6. Link for tonight: for the sitter. Pick the pages, add a note, and choose when the link stops working.

### The look

- **Type:** Manrope (400–800).
- **Colors:**
  - Background `#F3F4F6`, cards white with an 18–22 px radius, ink `#15171C`, muted text `#5B6070`.
  - Accent dark orange `#C2410C`, dark enough for white text on it.
- **A color per person:**
  - Ellie: blue, `#DCE6FB` with `#2A55B8`.
  - Max: teal, `#D6F0EA` with `#0B6E61`.
  - Grandma Ruth: purple, `#ECE2F8` with `#6236A8`.
- **Alerts:** allergy red `#FDE7E2` with `#A3260F`. The emergency screen is dark (`#1A0F0E`) with a big red "Call 911".
- **Icons:** outline icons, never emoji.
- **Buttons:** the mockups use some solid black buttons. In Scripture Loop the user didn't want solid black buttons (main actions used the accent color), so check before copying that into the real app.

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
- The template screens (`index.tsx`, `explore.tsx`) are still in place. Replace them with the real tabs.
- `AGENTS.md` / `CLAUDE.md` come from the template: read the versioned Expo docs before using any Expo API.
- **Before the first build, still to set:**
  - the app name check on the App Store ("Hearth" may be taken)
  - the bundle id
  - icon and splash colors
  - the EAS project

## Next steps

1. **GitHub:** https://github.com/thehatch3tt/hearth (private, branch `master`, pushed 2026-10-07). The `gh` CLI isn't installed here; plain `git push` works. **The user** creates a Firebase project when it's time to start syncing.
2. **Build the on-device handbook first**, with no accounts:
   - people (kids and parents), the house, the emergency card
   - local storage (expo-sqlite, as in Scripture Loop)
3. Then the sitter link, then care-team sharing with Firebase and encryption.
