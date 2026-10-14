/**
 * The handbook's sections and pages: what each page asks for, a gentle line about it, and questions
 * to help when someone isn't sure what to write. A "note" page is free writing; a "list" page is a
 * set of entries (an account, a person, a place), each a title and a few words.
 */
export type PageKind = 'note' | 'list';

export type Page = {
  id: string;
  title: string;
  kind: PageKind;
  intro: string;
  prompts: string[];
  /** For list pages: what an entry is called, and hints for its two fields. */
  entry?: { noun: string; title: string; note: string };
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
      { id: 'note', title: 'A note to start', kind: 'note', minutes: 5, intro: 'The first words your family will read. A few warm lines are enough.', prompts: ['What do you want them to hear first?', 'What can wait?', 'Who should they lean on?'] },
      { id: 'today', title: 'Only these, today', kind: 'list', minutes: 5, intro: 'The two or three things that really must happen on the first day. Everything else can wait.', prompts: ['Who do they call first?', 'Is a plan already arranged?'], entry: { noun: 'thing to do', title: 'What to do', note: 'Who to call, and the number' } },
      { id: 'helpers', title: 'Who helps with what', kind: 'list', minutes: 5, intro: 'Jobs others can take off their plate: meals, the dog, the yard, keeping people posted.', prompts: ['Who organizes meals?', 'Who tells everyone the news?', 'Who looks after the pets?'], entry: { noun: 'job', title: 'The job', note: 'Who could do it' } },
      { id: 'when', title: 'What comes when', kind: 'note', minutes: 10, intro: 'A rough order for the first weeks and months, so nothing feels urgent that isn\'t.', prompts: ['What happens the first week?', 'What can wait a month or more?'] },
      { id: 'words', title: 'Words they may hear', kind: 'list', minutes: 5, intro: 'Terms that come up (probate, executor, beneficiary) and what they mean for your family.', prompts: ['Who is your executor?', 'Is there a trust?'], entry: { noun: 'word', title: 'The word', note: 'What it means for us' } },
      { id: 'nearby', title: 'Help close to home', kind: 'list', minutes: 5, intro: 'People and places near you who can help: a pastor, a neighbor, a grief group.', prompts: ['Who lives close by?', 'Is there a church or group?'], entry: { noun: 'place', title: 'Who or where', note: 'How they can help, and how to reach them' } },
      { id: 'offers', title: 'When people offer help', kind: 'note', minutes: 5, intro: 'People will ask what they can do. Write what would truly help, so saying yes is easy.', prompts: ['What would help most?', 'What should people not worry about?'] },
    ],
  },
  {
    id: 'people',
    title: 'People and places',
    short: 'People',
    about: 'Who to call, and where things are kept',
    icon: 'people',
    pages: [
      { id: 'family', title: 'Our family', kind: 'list', minutes: 5, intro: 'The people closest to you, and how to reach each of them.', prompts: ['Who should be told together?', 'Anyone who needs gentle handling?'], entry: { noun: 'person', title: 'Name', note: 'How you\'re related, and their number' } },
      { id: 'tell', title: 'Who to tell first', kind: 'list', minutes: 5, intro: 'The few people to call right away, in order.', prompts: ['Who would want to hear it from family?', 'Who can tell the rest?'], entry: { noun: 'person', title: 'Name', note: 'Number, and who should call them' } },
      { id: 'contacts', title: 'Everyone else', kind: 'list', minutes: 10, intro: 'Friends, work, church, clubs: people who should know, but not first.', prompts: ['Who from work?', 'Old friends who\'d want to know?'], entry: { noun: 'person', title: 'Name', note: 'How they know you, and how to reach them' } },
      { id: 'kept', title: 'Where things are kept', kind: 'list', minutes: 10, intro: 'Papers, keys, the safe. Say where each thing is, not the thing itself.', prompts: ['Where is the will?', 'Where are spare keys?', 'Is there a safe?'], entry: { noun: 'thing', title: 'What it is', note: 'Exactly where to find it' } },
      { id: 'logins', title: 'Logins and codes', kind: 'note', minutes: 5, intro: 'Where your passwords are kept and how to get into your phone. Don\'t write the passwords here.', prompts: ['Do you use a password manager?', 'How do they unlock your phone?'] },
      { id: 'online', title: 'Online accounts', kind: 'list', minutes: 10, intro: 'Email, photos, social media: what to keep, close or memorialize.', prompts: ['Where are the family photos?', 'Should accounts be closed or kept?'], entry: { noun: 'account', title: 'The account', note: 'Keep, close or memorialize' } },
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
      { id: 'pension', title: 'Pension and benefits', kind: 'list', minutes: 5, intro: 'Pensions, retirement accounts and survivor benefits to claim.', prompts: ['Is there a survivor benefit?', 'Who handles the retirement account?'], entry: { noun: 'benefit', title: 'What it is', note: 'Who to call, and what to ask for' } },
    ],
  },
  {
    id: 'home',
    title: 'Home and family',
    short: 'Home',
    about: 'The house, the cars, the pets',
    icon: 'home',
    pages: [
      { id: 'house', title: 'The house', kind: 'note', minutes: 10, intro: 'How the house runs: the mortgage or lease, who you call for things, what needs regular care.', prompts: ['Who do you call for repairs?', 'What needs doing each season?'] },
      { id: 'breaks', title: 'If something breaks', kind: 'list', minutes: 5, intro: 'The water shut-off, the breaker box, the furnace: where they are and who fixes them.', prompts: ['Where is the water shut-off?', 'Who do you trust for repairs?'], entry: { noun: 'thing', title: 'What it is', note: 'Where it is, and who to call' } },
      { id: 'cars', title: 'The cars', kind: 'list', minutes: 5, intro: 'Each car, where its title is, and what you\'d like to happen with it.', prompts: ['Who should get it?', 'Is it paid off?'], entry: { noun: 'car', title: 'The car', note: 'Where the title is, and your wishes' } },
      { id: 'pets', title: 'Pets', kind: 'list', minutes: 5, intro: 'Who will care for them, their food, their vet, their quirks.', prompts: ['Who will take them?', 'What do they eat?'], entry: { noun: 'pet', title: 'Name', note: 'Who takes them, vet, food, quirks' } },
      { id: 'health', title: 'Health records', kind: 'note', minutes: 5, intro: 'Doctors, medicines and where records are kept, in case they\'re needed.', prompts: ['Who are your doctors?', 'Any advance directive?'] },
      { id: 'work', title: 'Work and retirement', kind: 'note', minutes: 5, intro: 'Who to tell at work, final pay, and anything owed to you.', prompts: ['Who is your contact at work?', 'Is there life insurance through work?'] },
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
