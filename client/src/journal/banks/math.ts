/**
 * Seed item banks for math skills
 * Provides practice items organized by skill and difficulty level
 */

import type { JournalItem } from '../../schema/journal';

export const mathBanks: Record<string, Record<string, JournalItem[]>> = {
  'math.addition': {
    easy: [
      {
        id: 'add-easy-1',
        skillId: 'math.addition',
        prompt: 'What is 2 + 3?',
        kind: 'mcq',
        options: ['4', '5', '6', '7'],
        answer: '5',
        explanation: 'Count up from 2: 3, 4, 5'
      },
      {
        id: 'add-easy-2',
        skillId: 'math.addition',
        prompt: 'What is 1 + 4?',
        kind: 'short',
        answer: '5',
        explanation: 'Use your fingers to count'
      },
      {
        id: 'add-easy-3',
        skillId: 'math.addition',
        prompt: 'What is 3 + 2?',
        kind: 'mcq',
        options: ['5', '4', '6', '1'],
        answer: '5',
        explanation: 'Addition can be done in any order'
      }
    ],
    core: [
      {
        id: 'add-core-1',
        skillId: 'math.addition',
        prompt: 'What is 8 + 7?',
        kind: 'mcq',
        options: ['14', '15', '16', '13'],
        answer: '15',
        explanation: 'Try making 10 first: 8 + 2 = 10, then add 5 more'
      },
      {
        id: 'add-core-2',
        skillId: 'math.addition',
        prompt: 'What is 25 + 13?',
        kind: 'short',
        answer: '38',
        explanation: 'Add the ones first: 5 + 3 = 8, then the tens: 20 + 10 = 30'
      },
      {
        id: 'add-core-3',
        skillId: 'math.addition',
        prompt: 'Sarah has 6 stickers. Her friend gives her 9 more. How many does she have now?',
        kind: 'mcq',
        options: ['13', '15', '14', '16'],
        answer: '15',
        explanation: 'This is an addition word problem: 6 + 9'
      }
    ],
    stretch: [
      {
        id: 'add-stretch-1',
        skillId: 'math.addition',
        prompt: 'What is 47 + 38?',
        kind: 'short',
        answer: '85',
        explanation: 'Remember to regroup when the ones add up to more than 10'
      },
      {
        id: 'add-stretch-2',
        skillId: 'math.addition',
        prompt: 'Find the missing number: 35 + __ = 62',
        kind: 'mcq',
        options: ['27', '28', '26', '29'],
        answer: '27',
        explanation: 'This is subtraction in disguise: 62 - 35'
      }
    ]
  },

  'math.subtraction': {
    easy: [
      {
        id: 'sub-easy-1',
        skillId: 'math.subtraction',
        prompt: 'What is 5 - 2?',
        kind: 'mcq',
        options: ['3', '2', '4', '7'],
        answer: '3',
        explanation: 'Start with 5 and count backwards 2 times'
      },
      {
        id: 'sub-easy-2',
        skillId: 'math.subtraction',
        prompt: 'What is 8 - 3?',
        kind: 'short',
        answer: '5',
        explanation: 'How many are left when you take 3 away from 8?'
      }
    ],
    core: [
      {
        id: 'sub-core-1',
        skillId: 'math.subtraction',
        prompt: 'What is 15 - 7?',
        kind: 'mcq',
        options: ['8', '7', '9', '6'],
        answer: '8',
        explanation: 'Think: 7 + what equals 15?'
      },
      {
        id: 'sub-core-2',
        skillId: 'math.subtraction',
        prompt: 'What is 23 - 15?',
        kind: 'short',
        answer: '8',
        explanation: 'Subtract the ones first, then the tens'
      }
    ],
    stretch: [
      {
        id: 'sub-stretch-1',
        skillId: 'math.subtraction',
        prompt: 'What is 62 - 27?',
        kind: 'short',
        answer: '35',
        explanation: 'You may need to regroup from the tens place'
      }
    ]
  },

  'math.place-value': {
    easy: [
      {
        id: 'place-easy-1',
        skillId: 'math.place-value',
        prompt: 'In the number 25, which digit is in the ones place?',
        kind: 'mcq',
        options: ['2', '5', '25', '0'],
        answer: '5',
        explanation: 'The ones place is on the right'
      },
      {
        id: 'place-easy-2',
        skillId: 'math.place-value',
        prompt: 'How many tens are in 40?',
        kind: 'short',
        answer: '4',
        explanation: 'Count by tens: 10, 20, 30, 40'
      }
    ],
    core: [
      {
        id: 'place-core-1',
        skillId: 'math.place-value',
        prompt: 'What number has 3 tens and 7 ones?',
        kind: 'mcq',
        options: ['73', '37', '30', '7'],
        answer: '37',
        explanation: 'Tens go in the left position, ones go in the right'
      },
      {
        id: 'place-core-2',
        skillId: 'math.place-value',
        prompt: 'What is the value of the 6 in 264?',
        kind: 'mcq',
        options: ['6', '60', '600', '6000'],
        answer: '60',
        explanation: 'The 6 is in the tens place'
      }
    ],
    stretch: [
      {
        id: 'place-stretch-1',
        skillId: 'math.place-value',
        prompt: 'Round 367 to the nearest hundred.',
        kind: 'mcq',
        options: ['300', '400', '360', '370'],
        answer: '400',
        explanation: 'Look at the tens digit to decide which way to round'
      }
    ]
  }
};