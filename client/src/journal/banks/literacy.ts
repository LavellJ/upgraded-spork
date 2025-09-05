/**
 * Seed item banks for literacy skills
 * Provides practice items organized by skill and difficulty level
 */

import type { JournalItem } from '../../schema/journal';

export const literacyBanks: Record<string, Record<string, JournalItem[]>> = {
  // New standards for lesson blueprints
  'E.READ.MAIN.3': {
    easy: [
      {
        id: 'read-main-easy-1',
        skillId: 'E.READ.MAIN.3',
        prompt: 'Read: "The cat sat on the mat. It was very soft." What is the main idea?',
        kind: 'mcq',
        options: ['The cat likes mats', 'The mat was comfortable', 'Cats are pets', 'The cat found a soft place to sit'],
        answer: 'The cat found a soft place to sit',
        explanation: 'The main idea tells us the most important thing - the cat sat on a soft mat'
      },
      {
        id: 'read-main-easy-2',
        skillId: 'E.READ.MAIN.3',
        prompt: 'What is the main idea of a story about a girl who learns to ride a bike?',
        kind: 'mcq',
        options: ['Learning new skills', 'Bikes have wheels', 'Girls like to play', 'Exercise is good'],
        answer: 'Learning new skills',
        explanation: 'The story focuses on the girl learning something new'
      },
      {
        id: 'read-main-easy-3',
        skillId: 'E.READ.MAIN.3',
        prompt: 'A paragraph talks about different types of dogs. What is it mainly about?',
        kind: 'short',
        answer: 'Types of dogs',
        explanation: 'The main idea is what the whole paragraph focuses on'
      }
    ],
    core: [
      {
        id: 'read-main-core-1',
        skillId: 'E.READ.MAIN.3',
        prompt: 'Read: "Bees collect nectar from flowers. They use it to make honey in their hives. Many people enjoy eating this sweet treat." What is the main idea?',
        kind: 'mcq',
        options: ['Flowers make nectar', 'People like sweet things', 'Bees make honey from flower nectar', 'Hives are bee homes'],
        answer: 'Bees make honey from flower nectar',
        explanation: 'The passage explains the process of how bees make honey'
      },
      {
        id: 'read-main-core-2',
        skillId: 'E.READ.MAIN.3',
        prompt: 'Which sentence best states the main idea of a paragraph about recycling benefits?',
        kind: 'mcq',
        options: ['Recycling helps the environment in many ways', 'Plastic bottles can be recycled', 'Some people recycle paper', 'Recycling bins are blue'],
        answer: 'Recycling helps the environment in many ways',
        explanation: 'This captures the overall benefit, not just specific details'
      },
      {
        id: 'read-main-core-3',
        skillId: 'E.READ.MAIN.3',
        prompt: 'How do you find the main idea of a passage?',
        kind: 'short',
        answer: 'Look for what the whole passage is mostly about',
        explanation: 'The main idea is the central point that all details support'
      }
    ],
    stretch: [
      {
        id: 'read-main-stretch-1',
        skillId: 'E.READ.MAIN.3',
        prompt: 'A passage discusses how penguins adapt to cold weather, their diet, and breeding habits. What is the implied main idea?',
        kind: 'mcq',
        options: ['Penguins are interesting birds', 'Antarctic survival strategies of penguins', 'Penguins eat fish', 'Cold weather affects animals'],
        answer: 'Antarctic survival strategies of penguins',
        explanation: 'All the details relate to how penguins survive in their harsh environment'
      },
      {
        id: 'read-main-stretch-2',
        skillId: 'E.READ.MAIN.3',
        prompt: 'What is the difference between a main idea and supporting details?',
        kind: 'short',
        answer: 'Main idea is the central point, details give examples or evidence',
        explanation: 'Supporting details help explain or prove the main idea'
      }
    ]
  },

  'E.READ.DETAIL.3': {
    easy: [
      {
        id: 'read-detail-easy-1',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'Read: "Sam has a red bike. He rides it to school every day." What color is Sam\'s bike?',
        kind: 'mcq',
        options: ['Blue', 'Red', 'Green', 'Yellow'],
        answer: 'Red',
        explanation: 'The text clearly states "Sam has a red bike"'
      },
      {
        id: 'read-detail-easy-2',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'Read: "The library has 500 books. It opens at 9 AM." When does the library open?',
        kind: 'short',
        answer: '9 AM',
        explanation: 'Look for the specific time mentioned in the text'
      },
      {
        id: 'read-detail-easy-3',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'In the sentence "The tall oak tree has green leaves," which word describes the tree?',
        kind: 'mcq',
        options: ['Oak', 'Tall', 'Green', 'Leaves'],
        answer: 'Tall',
        explanation: '"Tall" is the adjective that describes what the tree looks like'
      }
    ],
    core: [
      {
        id: 'read-detail-core-1',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'Read: "The museum displays ancient artifacts from Egypt, Greece, and Rome. Visitors can see pottery, tools, and jewelry from these civilizations." What types of artifacts can visitors see?',
        kind: 'mcq',
        options: ['Only pottery', 'Only tools', 'Pottery, tools, and jewelry', 'Only Egyptian items'],
        answer: 'Pottery, tools, and jewelry',
        explanation: 'The text lists all three types: pottery, tools, and jewelry'
      },
      {
        id: 'read-detail-core-2',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'Read: "Maria practices piano for 30 minutes after school and 20 minutes before bed." How long does Maria practice piano each day?',
        kind: 'short',
        answer: '50 minutes',
        explanation: 'Add the two practice times: 30 + 20 = 50 minutes'
      },
      {
        id: 'read-detail-core-3',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'What should you do when looking for specific details in a text?',
        kind: 'mcq',
        options: ['Read quickly', 'Scan for key words', 'Only read the first sentence', 'Guess the answer'],
        answer: 'Scan for key words',
        explanation: 'Scanning helps you locate specific information quickly and accurately'
      }
    ],
    stretch: [
      {
        id: 'read-detail-stretch-1',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'Read: "The expedition team consisted of Dr. Sarah Chen (botanist), Mark Rodriguez (photographer), and Lisa Park (guide). They spent three weeks studying rare plants in the Amazon rainforest, documenting over 200 species." How many team members studied plants?',
        kind: 'mcq',
        options: ['One - only the botanist', 'Two - botanist and guide', 'All three team members', 'The text doesn\'t specify'],
        answer: 'All three team members',
        explanation: 'The text says "They spent three weeks studying," indicating all three participated'
      },
      {
        id: 'read-detail-stretch-2',
        skillId: 'E.READ.DETAIL.3',
        prompt: 'When details seem to contradict each other in a text, what should you do?',
        kind: 'short',
        answer: 'Re-read carefully and look for context clues',
        explanation: 'Careful re-reading often reveals that apparent contradictions have explanations'
      }
    ]
  },
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