/**
 * Seed item banks for literacy skills
 * Provides practice items organized by skill and difficulty level
 */

import type { JournalItem } from '../../schema/journal';

export const literacyBanks: Record<string, Record<string, JournalItem[]>> = {
  'literacy.phonics': {
    easy: [
      {
        id: 'phon-easy-1',
        skillId: 'literacy.phonics',
        prompt: 'What sound does the letter "b" make?',
        kind: 'mcq',
        options: ['/b/', '/d/', '/p/', '/t/'],
        answer: '/b/',
        explanation: 'Think about the beginning sound in "ball"'
      },
      {
        id: 'phon-easy-2', 
        skillId: 'literacy.phonics',
        prompt: 'Which letter makes the /s/ sound?',
        kind: 'mcq',
        options: ['s', 'z', 'c', 'x'],
        answer: 's',
        explanation: 'Listen to the beginning of "sun"'
      },
      {
        id: 'phon-easy-3',
        skillId: 'literacy.phonics',
        prompt: 'What is the first sound in "cat"?',
        kind: 'short',
        answer: '/k/',
        explanation: 'Say "cat" slowly and listen to the first sound'
      }
    ],
    core: [
      {
        id: 'phon-core-1',
        skillId: 'literacy.phonics',
        prompt: 'Which word has the same beginning sound as "ship"?',
        kind: 'mcq',
        options: ['chair', 'shark', 'cat', 'ball'],
        answer: 'shark',
        explanation: 'Both words start with the /sh/ sound'
      },
      {
        id: 'phon-core-2',
        skillId: 'literacy.phonics',
        prompt: 'What vowel sound do you hear in "cake"?',
        kind: 'mcq', 
        options: ['/ā/', '/ă/', '/ē/', '/ĭ/'],
        answer: '/ā/',
        explanation: 'The "a" says its name in this word'
      },
      {
        id: 'phon-core-3',
        skillId: 'literacy.phonics',
        prompt: 'How many sounds are in the word "dog"?',
        kind: 'short',
        answer: '3',
        explanation: 'Count each sound: /d/ /o/ /g/'
      }
    ],
    stretch: [
      {
        id: 'phon-stretch-1',
        skillId: 'literacy.phonics',
        prompt: 'Which word contains a consonant blend?',
        kind: 'mcq',
        options: ['cat', 'snap', 'dog', 'sun'],
        answer: 'snap',
        explanation: 'Look for two consonants that blend together'
      },
      {
        id: 'phon-stretch-2',
        skillId: 'literacy.phonics',
        prompt: 'What is the vowel pattern in "night"?',
        kind: 'mcq',
        options: ['long i', 'short i', 'long e', 'short a'],
        answer: 'long i',
        explanation: 'The "igh" makes the long i sound'
      }
    ]
  },

  'literacy.sight-words': {
    easy: [
      {
        id: 'sight-easy-1',
        skillId: 'literacy.sight-words',
        prompt: 'Which word says "the"?',
        kind: 'mcq',
        options: ['the', 'that', 'they', 'then'],
        answer: 'the',
        explanation: 'This is one of the most common words'
      },
      {
        id: 'sight-easy-2',
        skillId: 'literacy.sight-words',
        prompt: 'What word is this: a-n-d',
        kind: 'short',
        answer: 'and',
        explanation: 'This word connects things together'
      }
    ],
    core: [
      {
        id: 'sight-core-1',
        skillId: 'literacy.sight-words',
        prompt: 'Which sentence uses "were" correctly?',
        kind: 'mcq',
        options: [
          'They were happy.',
          'We were going.',
          'You were there.',
          'All of the above'
        ],
        answer: 'All of the above',
        explanation: '"Were" is the past form of "are"'
      },
      {
        id: 'sight-core-2',
        skillId: 'literacy.sight-words',
        prompt: 'Complete: "I ____ to the store."',
        kind: 'mcq',
        options: ['went', 'want', 'when', 'were'],
        answer: 'went',
        explanation: 'This tells about something that happened in the past'
      }
    ],
    stretch: [
      {
        id: 'sight-stretch-1',
        skillId: 'literacy.sight-words',
        prompt: 'Which word means "in spite of"?',
        kind: 'mcq',
        options: ['thought', 'through', 'although', 'enough'],
        answer: 'although',
        explanation: 'This word shows contrast'
      }
    ]
  },

  'literacy.reading-comprehension': {
    easy: [
      {
        id: 'comp-easy-1',
        skillId: 'literacy.reading-comprehension',
        prompt: 'The cat sat on the mat. Where did the cat sit?',
        kind: 'short',
        answer: 'on the mat',
        explanation: 'Look for the word "where" in the sentence'
      }
    ],
    core: [
      {
        id: 'comp-core-1',
        skillId: 'literacy.reading-comprehension',
        prompt: 'Sam was excited about his birthday party. How did Sam feel?',
        kind: 'mcq',
        options: ['sad', 'excited', 'angry', 'tired'],
        answer: 'excited',
        explanation: 'The text tells us Sam\'s feeling directly'
      }
    ],
    stretch: [
      {
        id: 'comp-stretch-1',
        skillId: 'literacy.reading-comprehension',
        prompt: 'Maya looked at the dark clouds and grabbed her umbrella. What can you infer?',
        kind: 'mcq',
        options: [
          'Maya likes umbrellas',
          'It might rain',
          'Maya is going to a party',
          'It is sunny'
        ],
        answer: 'It might rain',
        explanation: 'Think about why someone would take an umbrella when seeing dark clouds'
      }
    ]
  }
};