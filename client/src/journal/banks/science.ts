/**
 * Seed item banks for science skills
 * Provides practice items organized by skill and difficulty level
 */

import type { JournalItem } from '../../schema/journal';

export const scienceBanks: Record<string, Record<string, JournalItem[]>> = {
  // New standards for lesson blueprints
  'SCI.HABIT.3': {
    easy: [
      {
        id: 'habit-easy-1',
        skillId: 'SCI.HABIT.3',
        prompt: 'Where do fish live?',
        kind: 'mcq',
        options: ['In trees', 'In water', 'Underground', 'In the air'],
        answer: 'In water',
        explanation: 'Fish need water to breathe and live'
      },
      {
        id: 'habit-easy-2',
        skillId: 'SCI.HABIT.3',
        prompt: 'What do we call the place where an animal lives?',
        kind: 'short',
        answer: 'Habitat',
        explanation: 'A habitat is an animal\'s natural home'
      },
      {
        id: 'habit-easy-3',
        skillId: 'SCI.HABIT.3',
        prompt: 'Which animal lives in the forest?',
        kind: 'mcq',
        options: ['Shark', 'Bear', 'Dolphin', 'Crab'],
        answer: 'Bear',
        explanation: 'Bears live in forest habitats with trees and plants'
      }
    ],
    core: [
      {
        id: 'habit-core-1',
        skillId: 'SCI.HABIT.3',
        prompt: 'Why do polar bears have thick fur?',
        kind: 'mcq',
        options: ['To look pretty', 'To stay warm in cold habitat', 'To swim faster', 'To hide from fish'],
        answer: 'To stay warm in cold habitat',
        explanation: 'Thick fur helps polar bears survive in their icy Arctic habitat'
      },
      {
        id: 'habit-core-2',
        skillId: 'SCI.HABIT.3',
        prompt: 'What do desert animals need to survive in their habitat?',
        kind: 'mcq',
        options: ['Lots of water', 'Ways to stay cool and save water', 'Thick fur', 'Large fins'],
        answer: 'Ways to stay cool and save water',
        explanation: 'Desert habitats are hot and dry, so animals need special adaptations'
      },
      {
        id: 'habit-core-3',
        skillId: 'SCI.HABIT.3',
        prompt: 'Name two things animals get from their habitat.',
        kind: 'short',
        answer: 'Food and shelter',
        explanation: 'Habitats provide animals with food to eat and places to live safely'
      }
    ],
    stretch: [
      {
        id: 'habit-stretch-1',
        skillId: 'SCI.HABIT.3',
        prompt: 'How might cutting down a forest affect the animals that live there?',
        kind: 'mcq',
        options: ['Animals would find new homes easily', 'Animals would lose their habitat and might struggle to survive', 'Animals would become stronger', 'Nothing would change'],
        answer: 'Animals would lose their habitat and might struggle to survive',
        explanation: 'Destroying habitats removes animals\' homes, food sources, and shelter'
      },
      {
        id: 'habit-stretch-2',
        skillId: 'SCI.HABIT.3',
        prompt: 'Why do different animals live in different habitats?',
        kind: 'short',
        answer: 'Animals have adaptations that help them survive in specific environments',
        explanation: 'Each animal has special features that work best in certain habitats'
      }
    ]
  },
  'science.forces': {
    easy: [
      {
        id: 'force-easy-1',
        skillId: 'science.forces',
        prompt: 'What happens when you push a ball?',
        kind: 'mcq',
        options: ['It moves', 'It stays still', 'It disappears', 'It changes color'],
        answer: 'It moves',
        explanation: 'Think about what you observe when you push something'
      },
      {
        id: 'force-easy-2',
        skillId: 'science.forces',
        prompt: 'What do we call it when you pull something towards you?',
        kind: 'short',
        answer: 'pull',
        explanation: 'This is the opposite of push'
      }
    ],
    core: [
      {
        id: 'force-core-1',
        skillId: 'science.forces',
        prompt: 'What force pulls things down to the ground?',
        kind: 'mcq',
        options: ['Gravity', 'Magnetism', 'Friction', 'Wind'],
        answer: 'Gravity',
        explanation: 'This force makes apples fall from trees'
      },
      {
        id: 'force-core-2',
        skillId: 'science.forces',
        prompt: 'Which surface would cause more friction for a sliding box?',
        kind: 'mcq',
        options: ['Smooth ice', 'Rough carpet', 'Polished floor', 'Glass'],
        answer: 'Rough carpet',
        explanation: 'Friction is stronger on bumpy, rough surfaces'
      }
    ],
    stretch: [
      {
        id: 'force-stretch-1',
        skillId: 'science.forces',
        prompt: 'A book sits on a table. What forces are acting on it?',
        kind: 'mcq',
        options: [
          'Only gravity pulling down',
          'Only the table pushing up',
          'Gravity down and table force up',
          'No forces'
        ],
        answer: 'Gravity down and table force up',
        explanation: 'Balanced forces keep the book from moving'
      }
    ]
  },

  'science.animals': {
    easy: [
      {
        id: 'animal-easy-1',
        skillId: 'science.animals',
        prompt: 'Which animal lives in water?',
        kind: 'mcq',
        options: ['Dog', 'Fish', 'Cat', 'Bird'],
        answer: 'Fish',
        explanation: 'Think about animals that need water to breathe'
      },
      {
        id: 'animal-easy-2',
        skillId: 'science.animals',
        prompt: 'What do birds use to fly?',
        kind: 'short',
        answer: 'wings',
        explanation: 'These body parts help birds move through the air'
      }
    ],
    core: [
      {
        id: 'animal-core-1',
        skillId: 'science.animals',
        prompt: 'Which animals are mammals?',
        kind: 'mcq',
        options: ['Fish and birds', 'Dogs and cats', 'Insects and spiders', 'Snakes and lizards'],
        answer: 'Dogs and cats',
        explanation: 'Mammals have fur or hair and feed milk to their babies'
      },
      {
        id: 'animal-core-2',
        skillId: 'science.animals',
        prompt: 'What do herbivores eat?',
        kind: 'mcq',
        options: ['Only meat', 'Only plants', 'Both plants and meat', 'Nothing'],
        answer: 'Only plants',
        explanation: 'Think about what rabbits and cows eat'
      }
    ],
    stretch: [
      {
        id: 'animal-stretch-1',
        skillId: 'science.animals',
        prompt: 'How do desert animals adapt to hot, dry conditions?',
        kind: 'mcq',
        options: [
          'They store water and stay cool',
          'They move to cooler places',
          'They sleep all the time',
          'They eat more food'
        ],
        answer: 'They store water and stay cool',
        explanation: 'Think about how camels and other desert animals survive'
      }
    ]
  },

  'science.plants': {
    easy: [
      {
        id: 'plant-easy-1',
        skillId: 'science.plants',
        prompt: 'What do plants need to grow?',
        kind: 'mcq',
        options: ['Only water', 'Only sunlight', 'Water and sunlight', 'Nothing'],
        answer: 'Water and sunlight',
        explanation: 'Plants need several things to be healthy'
      },
      {
        id: 'plant-easy-2',
        skillId: 'science.plants',
        prompt: 'What part of the plant grows underground?',
        kind: 'short',
        answer: 'roots',
        explanation: 'This part helps the plant get water from the soil'
      }
    ],
    core: [
      {
        id: 'plant-core-1',
        skillId: 'science.plants',
        prompt: 'What do leaves do for the plant?',
        kind: 'mcq',
        options: [
          'Make food using sunlight',
          'Store water',
          'Attract insects',
          'Protect the stem'
        ],
        answer: 'Make food using sunlight',
        explanation: 'This process is called photosynthesis'
      },
      {
        id: 'plant-core-2',
        skillId: 'science.plants',
        prompt: 'How do flowers help plants reproduce?',
        kind: 'mcq',
        options: [
          'They make the plant pretty',
          'They attract pollinators',
          'They store food',
          'They make oxygen'
        ],
        answer: 'They attract pollinators',
        explanation: 'Bees and other animals help flowers make seeds'
      }
    ],
    stretch: [
      {
        id: 'plant-stretch-1',
        skillId: 'science.plants',
        prompt: 'Why are plants important in food webs?',
        kind: 'mcq',
        options: [
          'They are producers that make their own food',
          'They eat other plants',
          'They only provide shelter',
          'They are not important'
        ],
        answer: 'They are producers that make their own food',
        explanation: 'Plants are at the bottom of most food chains'
      }
    ]
  }
};