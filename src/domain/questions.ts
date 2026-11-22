// Follow-up questions ATLAS asks after the four essential inputs.
// Answers shape the research prompt and are shown on the itinerary.

export interface FollowUpQuestion {
  id: string;
  question: string;
  hint: string;
  options?: string[];
}

export const FOLLOW_UP_QUESTIONS: FollowUpQuestion[] = [
  {
    id: 'purpose',
    question: 'What should this Venture feel like?',
    hint: 'One line you can come back to when choosing between options.',
  },
  {
    id: 'pace',
    question: 'What pace suits this Venture?',
    hint: 'How many things per day before it stops being fun.',
    options: ['Slow — one anchor a day', 'Balanced', 'Full — see a lot'],
  },
  {
    id: 'bases',
    question: 'How many places do you want to stay?',
    hint: 'Fewer moves means more spontaneous exploring.',
    options: ['One base', 'Two bases', 'Three or more / road trip'],
  },
  {
    id: 'lodging',
    question: 'What kind of places to stay?',
    hint: 'e.g. small lodge, apartment in the old town, guesthouse near the beach.',
    options: ['Independent lodge / B&B', 'Apartment / house', 'Small hotel', 'Mix'],
  },
  {
    id: 'transport',
    question: 'How will you get around?',
    hint: 'Car rental, transfers, trains, bikes, walking.',
    options: ['Rental car', 'Transfers / shuttles', 'Public transport', 'Mostly walking & bikes'],
  },
  {
    id: 'mustDo',
    question: 'Any must-dos?',
    hint: 'Specific sites, neighborhoods, a surf lesson, a market day…',
  },
  {
    id: 'avoid',
    question: 'Anything to avoid?',
    hint: 'Crowded resort strips, long drives, early starts, certain foods…',
  },
  {
    id: 'food',
    question: 'How do you want to eat?',
    hint: 'Markets and local spots, cooking yourselves, a special dinner or two.',
    options: ['Mostly local & casual', 'Mix of cooking and eating out', 'A few special meals'],
  },
  {
    id: 'season',
    question: 'Weather or seasonal concerns?',
    hint: 'Rainy season, surf season, festivals, school holidays.',
  },
];
