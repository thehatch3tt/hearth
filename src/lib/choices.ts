/**
 * Ready-made choices for the pick lists, so filling in a page is mostly tapping. Every list also lets
 * you type your own.
 */
import { type PersonKind } from '@/lib/db';

type ByKind = Record<PersonKind, string[]>;

export const routineNames: ByKind = {
  child: ['Bedtime routine', 'Morning routine', 'Nap time', 'After school', 'Mealtimes', 'Daily routine'],
  adult: ['Daily routine', 'Morning routine', 'Evening routine', 'Bedtime routine', 'Mealtimes'],
};

export const activities: ByKind = {
  child: [
    'Wake up',
    'Breakfast',
    'Get dressed',
    'Brush teeth',
    'Snack',
    'Lunch',
    'Nap',
    'Quiet time',
    'Play outside',
    'Homework',
    'Screen time',
    'Screens off',
    'Dinner',
    'Bath',
    'Pajamas',
    'Potty and wash hands',
    'Story time',
    'Prayers',
    'Cuddle and song',
    'Nightlight on',
    'Lights out',
  ],
  adult: [
    'Wake up',
    'Breakfast',
    'Get dressed',
    'Exercises',
    'Walk',
    'Lunch',
    'Rest',
    'Puzzles or reading',
    'Phone call with family',
    'Snack and water',
    'Dinner',
    'Shower',
    'TV time',
    'Get ready for bed',
    'Lock the doors',
    'Bedtime',
  ],
};

export const noteLabels: ByKind = {
  child: ['Comfort', 'Food', 'Screen time', 'Naps', 'Potty', 'Calming down', 'Rules', 'Friends and pets'],
  adult: ['Food', 'Mobility', 'Hearing and vision', 'Mood', 'Bathroom', 'Sleep', 'Likes to talk about', 'Doctors'],
};

export const contactLabels = ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Neighbor', 'Doctor', 'Pediatrician', 'Poison Control', 'Aunt', 'Uncle'];

export const houseLabels = ['Wi-Fi', 'Alarm', 'Door code', 'Garage code', 'Spare key', 'First aid kit', 'Fuse box', 'Water shut-off', 'Trash day', 'Pets', 'TV and remotes', 'Thermostat'];

/** Turns a list of words into pick-list options. */
export const toOptions = (list: string[]) => list.map((value) => ({ value, label: value }));
