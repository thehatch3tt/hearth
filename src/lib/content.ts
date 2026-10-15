/**
 * The handbook's sections and pages: what each page asks for, a gentle line about it, and questions
 * to help when someone isn't sure what to write. A "note" page is free writing; a "list" page is a
 * set of entries (an account, a person, a place), each a title and a few words; a "fields" page asks
 * for a few set things (a name, a date, where a paper is kept). `{family}` in an intro or note becomes
 * the names of the people it's written for (see `forFamily`).
 */
export type PageKind = 'note' | 'list' | 'fields';

export type Field = { id: string; label: string; hint: string };

export type Page = {
  id: string;
  title: string;
  kind: PageKind;
  intro: string;
  prompts: string[];
  /** For list pages: what an entry is called, and hints for its two fields. */
  entry?: { noun: string; title: string; note: string };
  /** For fields pages: what it asks for. */
  fields?: Field[];
  /** A short line kept at the foot of the page (what not to write, what the page is not). */
  note?: string;
  /** Minutes a first go usually takes. */
  minutes: number;
};

export type Section = { id: string; title: string; short: string; about: string; icon: string; pages: Page[] };

export const SECTIONS: Section[] = [
  {
    id: 'begin',
    title: 'Begin here',
    short: 'Begin here',
    about: 'What your family needs in the first days',
    icon: 'flag',
    pages: [
      { id: 'note', title: 'A note to start', kind: 'note', minutes: 5, intro: 'The first words {family} will read. A few warm lines are enough.', prompts: ['What do you want them to hear first?', 'What can wait?', 'Who should they lean on?'] },
      { id: 'today', title: 'Only these, today', kind: 'list', minutes: 5, intro: 'The two or three things that really must happen on the first day. Everything else can wait.', prompts: ['Who do they call first?', 'Is a plan already arranged?'], entry: { noun: 'thing to do', title: 'What to do', note: 'Who to call, and the number' } },
      {
        id: 'facts',
        title: 'The facts they’ll be asked for',
        kind: 'fields',
        minutes: 5,
        intro: 'In the first days, the funeral home will ask {family} for these. Writing them here saves a search through drawers.',
        prompts: ['Is there a name you went by that isn’t on your papers?', 'Where is your birth certificate?', 'Where is your marriage certificate?'],
        fields: [
          { id: 'name', label: 'Full legal name', hint: 'First, middle and last' },
          { id: 'born', label: 'Born', hint: 'The date, and the city and state' },
          { id: 'parents', label: 'Parents', hint: 'Both names, and your mother’s maiden name' },
          { id: 'married', label: 'Married to', hint: 'Their name, and since when' },
          { id: 'work', label: 'Work for most of my life', hint: 'What you did, and where' },
          { id: 'military', label: 'Military service', hint: 'Branch and years, and where the discharge papers are' },
          { id: 'ssn', label: 'Where my Social Security card is', hint: 'Where it’s kept, never the number' },
        ],
        note: 'Say where things are, never the numbers themselves.',
      },
      {
        id: 'papers',
        title: 'Where my papers are',
        kind: 'fields',
        minutes: 5,
        intro: 'So {family} know who to call and where to look, without guessing.',
        prompts: ['Is there a trust?', 'Is a funeral already arranged or paid for?', 'Who else has a copy?'],
        fields: [
          { id: 'will', label: 'My will', hint: 'Where it is, and who has a copy' },
          { id: 'executor', label: 'Who I chose to carry it out', hint: 'Their name, and whether they know' },
          { id: 'poa', label: 'Power of attorney', hint: 'Who, for money and for health' },
          { id: 'directive', label: 'My wishes for medical care', hint: 'Where your advance directive or living will is' },
          { id: 'lawyer', label: 'Our lawyer', hint: 'Their name and number' },
        ],
        note: 'This page helps {family} find your papers. It isn’t a will and can’t replace one.',
      },
      {
        id: 'helpers',
        title: 'Who can help',
        kind: 'list',
        minutes: 5,
        intro: 'People will ask what they can do. Name who could take what off {family}’s plate, nearby friends and groups too, so saying yes is easy.',
        prompts: ['Who could bring meals?', 'Who tells everyone the news?', 'Who looks after the pets?', 'Who lives close by?', 'What would help most?'],
        entry: { noun: 'way to help', title: 'What they could do', note: 'Who, and how to reach them' },
      },
      { id: 'when', title: 'What comes when', kind: 'note', minutes: 10, intro: 'A rough order for the first weeks and months, so nothing feels urgent that isn\'t.', prompts: ['What happens the first week?', 'What can wait a month or more?'] },
      { id: 'words', title: 'Words they may hear', kind: 'list', minutes: 5, intro: 'Terms that come up (probate, executor, beneficiary) and what they mean for your family.', prompts: ['Who is your executor?', 'Is there a trust?'], entry: { noun: 'word', title: 'The word', note: 'What it means for us' } },
    ],
  },
  {
    id: 'people',
    title: 'People and places',
    short: 'People',
    about: 'Who to tell, and where things are kept',
    icon: 'people',
    pages: [
      {
        id: 'family',
        title: 'People to tell',
        kind: 'list',
        minutes: 10,
        intro: 'The people who should know, closest first, and how to reach each of them.',
        prompts: ['Who should hear it from family first?', 'Who can tell the rest?', 'Anyone who needs gentle handling?', 'Who from work?', 'Old friends who’d want to know?'],
        entry: { noun: 'person', title: 'Name', note: 'How they know you, their number, and whether to call them first' },
      },
      { id: 'kept', title: 'Where things are kept', kind: 'list', minutes: 10, intro: 'Papers, keys, the safe. Say where each thing is, not the thing itself.', prompts: ['Where are spare keys?', 'Is there a safe?', 'Where are the photo albums?'], entry: { noun: 'thing', title: 'What it is', note: 'Exactly where to find it' } },
      {
        id: 'logins',
        title: 'Phone, logins and accounts',
        kind: 'list',
        minutes: 10,
        intro: 'How to get into your phone, where your passwords are kept, and what to do with each account. Never the passwords themselves.',
        prompts: ['How do they unlock your phone?', 'Do you use a password manager?', 'Where are the family photos?', 'Should accounts be closed or kept?'],
        entry: { noun: 'account', title: 'The account', note: 'Keep, close or memorialize' },
      },
    ],
  },
  {
    id: 'money',
    title: 'Money matters',
    short: 'Money',
    about: 'Accounts, policies and what is owed',
    icon: 'wallet',
    pages: [
      { id: 'firststeps', title: 'The first money steps', kind: 'note', minutes: 5, intro: 'What keeps working and what needs attention first, so no one worries about paying the bills.', prompts: ['Which account pays the bills?', 'Is anything due soon?'] },
      { id: 'receives', title: 'Who receives what', kind: 'list', minutes: 10, intro: 'Things you want to go to someone in particular. Your will still decides; this explains.', prompts: ['Any keepsakes for someone?', 'Anything with a story behind it?'], entry: { noun: 'gift', title: 'What it is', note: 'Who it\'s for, and why' } },
      { id: 'banks', title: 'Bank accounts', kind: 'list', minutes: 10, intro: 'List each account so nothing is missed. A line or two about each is plenty.', prompts: ['Who else is on it?', 'Who receives it?', 'What pays from it?', 'Where are the cards?'], entry: { noun: 'account', title: 'Account name', note: 'Bank, last four digits, and what to know' } },
      { id: 'insurance', title: 'Insurance and what is owed', kind: 'list', minutes: 10, intro: 'Life insurance, mortgages, loans, cards: who to call and where the papers are.', prompts: ['Is there life insurance?', 'Any loans in your name only?'], entry: { noun: 'policy or debt', title: 'What it is', note: 'Company, where the papers are, who to call' } },
      { id: 'bills', title: 'Monthly bills', kind: 'list', minutes: 10, intro: 'Each bill, how it\'s paid, and whether to cancel it or move it over.', prompts: ['What pays automatically?', 'What should be cancelled?'], entry: { noun: 'bill', title: 'The bill', note: 'How it\'s paid, and cancel or keep' } },
      {
        id: 'pension',
        title: 'Work, pension and benefits',
        kind: 'list',
        minutes: 10,
        intro: 'Who to tell at work, final pay, pensions, retirement accounts and survivor benefits to claim.',
        prompts: ['Who is your contact at work?', 'Is there life insurance through work?', 'Is there a survivor benefit?', 'Who handles the retirement account?'],
        entry: { noun: 'benefit', title: 'What it is', note: 'Who to call, and what to ask for' },
      },
    ],
  },
  {
    id: 'home',
    title: 'Home and family',
    short: 'Home',
    about: 'The house, the cars, the pets',
    icon: 'home',
    pages: [
      {
        id: 'house',
        title: 'The house',
        kind: 'list',
        minutes: 10,
        intro: 'How the house runs, where the shut-offs are, and who to call when something breaks.',
        prompts: ['Where is the water shut-off?', 'Who do you trust for repairs?', 'What needs doing each season?'],
        entry: { noun: 'thing', title: 'What it is', note: 'Where it is, and who to call' },
      },
      { id: 'cars', title: 'The cars', kind: 'list', minutes: 5, intro: 'Each car, where its title is, and what you\'d like to happen with it.', prompts: ['Who should get it?', 'Is it paid off?'], entry: { noun: 'car', title: 'The car', note: 'Where the title is, and your wishes' } },
      { id: 'pets', title: 'Pets', kind: 'list', minutes: 5, intro: 'Who will care for them, their food, their vet, their quirks.', prompts: ['Who will take them?', 'What do they eat?'], entry: { noun: 'pet', title: 'Name', note: 'Who takes them, vet, food, quirks' } },
      { id: 'health', title: 'Health records', kind: 'note', minutes: 5, intro: 'Doctors, medicines and where records are kept, in case they\'re needed.', prompts: ['Who are your doctors?', 'Any advance directive?'] },
    ],
  },
  {
    id: 'wishes',
    title: 'Wishes and memories',
    short: 'Wishes',
    about: 'How you want to be remembered',
    icon: 'flame',
    pages: [
      { id: 'service', title: 'Service wishes', kind: 'note', minutes: 10, intro: 'Burial or cremation, music, readings, who you hope will speak. Nothing is too small.', prompts: ['Any songs or readings?', 'Who would you like to speak?', 'Where would you like to rest?'] },
      { id: 'stories', title: 'Stories', kind: 'note', minutes: 15, intro: 'Stories you want kept: how you met, family history, the funny ones.', prompts: ['How did you two meet?', 'A story the grandkids should know?'] },
      { id: 'know', title: 'Things I want you to know', kind: 'note', minutes: 10, intro: 'The things you\'d want to say, if there were time.', prompts: ['What are you proud of?', 'What do you hope for them?'] },
    ],
  },
];

export const PAGES: Page[] = SECTIONS.flatMap((section) => section.pages);

export const pageById = (id: string) => PAGES.find((page) => page.id === id);
export const sectionOf = (id: string) => SECTIONS.find((section) => section.pages.some((page) => page.id === id));

/**
 * Pages folded into another on 2026-10-15 (28 pages became 23): what each one became. Saved writing
 * from the old pages moves across when the handbook loads (lib/store.ts).
 */
export const MERGED: Record<string, string> = { tell: 'family', contacts: 'family', nearby: 'helpers', offers: 'helpers', online: 'logins', breaks: 'house', work: 'pension' };

/** "Ann", "Ann and Sam", "Ann, Sam and Joe", or `fallback` when no one is listed yet. */
export function forFamily(names: string[], fallback = 'your family') {
  const list = names.map((name) => name.trim()).filter(Boolean);
  if (!list.length) return fallback;
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/** A page's intro or note with `{family}` filled in. */
export const personal = (text: string, names: string[]) => text.replace(/\{family\}/g, forFamily(names));

/** Questions that help start a letter (tapping one adds it to the letter). */
export const LETTER_PROMPTS = [
  'What I have always loved about you',
  'A memory I want you to keep',
  'What I hope for you',
  'What I am proud of',
  'Something I never said enough',
  'What to do when you miss me',
];

/** Moments a letter can wait for. */
export const MOMENTS = ['Their wedding day', 'Graduating', 'Their first child', 'A milestone birthday', 'A hard day', 'Buying a home'];

/** What the family reads in "Caring for yourself" (2026-10-14 wording). */
export const CARE_MESSAGE =
  'Grief comes in waves, and every one of them is allowed. Nothing in this handbook matters more than you do. Eat something, sleep when you can, and say yes when someone offers to help.';
export const FIRST_WORDS =
  'Take it one breath at a time. There\'s no right way to grieve and no deadline here. Do one small thing, then rest, and let the people who love you carry some of it.';

/** The promise about where everything is kept, word for word wherever it appears. */
export const KEPT_HERE =
  'Everything you write, record and photograph stays on this phone. There’s no account and no server, and we never see it. It leaves only when you send it yourself, as a backup file or a PDF.';
export const KEPT_HERE_BACKUPS = 'If your phone backs up to iCloud or Google, that backup includes it too, protected by your account.';
export const NOT_ADVICE = 'Left in Love helps you write things down for your family. It isn’t legal, medical or financial advice.';
