/**
 * Seed item banks for math skills
 * Provides practice items organized by skill and difficulty level
 */

import type { JournalItem } from '../../schema/journal';

export const mathBanks: Record<string, Record<string, JournalItem[]>> = {
  // New standards for lesson blueprints
  'M.FRAC.EQ.3': {
    easy: [
      {
        id: 'frac-eq-easy-1',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Which fraction is equal to 1/2?',
        kind: 'mcq',
        options: ['2/4', '1/3', '3/5', '1/4'],
        answer: '2/4',
        explanation: 'Both 1/2 and 2/4 represent the same amount - half of something'
      },
      {
        id: 'frac-eq-easy-2',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Are 2/3 and 4/6 equal?',
        kind: 'mcq',
        options: ['Yes', 'No'],
        answer: 'Yes',
        explanation: 'If you multiply both parts of 2/3 by 2, you get 4/6'
      },
      {
        id: 'frac-eq-easy-3',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Which shows 3/6 in simplest form?',
        kind: 'short',
        answer: '1/2',
        explanation: 'Divide both 3 and 6 by 3 to get 1/2'
      }
    ],
    core: [
      {
        id: 'frac-eq-core-1',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Find an equivalent fraction for 3/4',
        kind: 'mcq',
        options: ['6/8', '4/5', '2/3', '5/7'],
        answer: '6/8',
        explanation: 'Multiply both 3 and 4 by 2 to get 6/8'
      },
      {
        id: 'frac-eq-core-2',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Which fraction is NOT equivalent to 1/4?',
        kind: 'mcq',
        options: ['2/8', '3/12', '4/16', '2/6'],
        answer: '2/6',
        explanation: '2/6 simplifies to 1/3, not 1/4'
      },
      {
        id: 'frac-eq-core-3',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Complete: 2/5 = ?/10',
        kind: 'short',
        answer: '4',
        explanation: 'Multiply 2 by 2 since 5×2=10, so 2/5 = 4/10'
      }
    ],
    stretch: [
      {
        id: 'frac-eq-stretch-1',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Which set contains all equivalent fractions?',
        kind: 'mcq',
        options: ['1/3, 2/6, 3/9', '1/4, 2/6, 3/8', '2/3, 4/6, 5/9', '1/2, 3/4, 2/8'],
        answer: '1/3, 2/6, 3/9',
        explanation: 'All equal 1/3 when simplified'
      },
      {
        id: 'frac-eq-stretch-2',
        skillId: 'M.FRAC.EQ.3',
        prompt: 'Find the simplest form of 12/16',
        kind: 'short',
        answer: '3/4',
        explanation: 'Divide both by their greatest common factor, 4'
      }
    ]
  },

  'M.FRAC.COMP.3': {
    easy: [
      {
        id: 'frac-comp-easy-1',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Which is larger: 1/2 or 1/4?',
        kind: 'mcq',
        options: ['1/2', '1/4', 'They are equal'],
        answer: '1/2',
        explanation: 'Think of pizza slices - half a pizza is bigger than a quarter'
      },
      {
        id: 'frac-comp-easy-2',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Which is smaller: 2/3 or 1/3?',
        kind: 'mcq',
        options: ['2/3', '1/3', 'They are equal'],
        answer: '1/3',
        explanation: 'With the same denominator, compare the numerators'
      },
      {
        id: 'frac-comp-easy-3',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Put these in order from smallest to largest: 1/4, 1/2, 1/8',
        kind: 'short',
        answer: '1/8, 1/4, 1/2',
        explanation: 'With unit fractions, larger denominators mean smaller values'
      }
    ],
    core: [
      {
        id: 'frac-comp-core-1',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Compare: 3/4 and 2/3',
        kind: 'mcq',
        options: ['3/4 > 2/3', '3/4 < 2/3', '3/4 = 2/3'],
        answer: '3/4 > 2/3',
        explanation: 'Convert to common denominators: 9/12 > 8/12'
      },
      {
        id: 'frac-comp-core-2',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Which fraction is closest to 1?',
        kind: 'mcq',
        options: ['3/4', '5/6', '7/8', '2/3'],
        answer: '7/8',
        explanation: '7/8 is only 1/8 away from 1, the closest'
      },
      {
        id: 'frac-comp-core-3',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Order from smallest to largest: 5/8, 3/4, 1/2',
        kind: 'short',
        answer: '1/2, 5/8, 3/4',
        explanation: 'Convert to eighths: 4/8, 5/8, 6/8'
      }
    ],
    stretch: [
      {
        id: 'frac-comp-stretch-1',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Which is greater: 5/7 or 6/8?',
        kind: 'mcq',
        options: ['5/7', '6/8', 'They are equal'],
        answer: '6/8',
        explanation: 'Cross multiply: 5×8=40, 6×7=42, so 6/8 is larger'
      },
      {
        id: 'frac-comp-stretch-2',
        skillId: 'M.FRAC.COMP.3',
        prompt: 'Find a fraction between 1/3 and 1/2',
        kind: 'short',
        answer: '2/5',
        explanation: '2/5 = 0.4, which is between 1/3 ≈ 0.33 and 1/2 = 0.5'
      }
    ]
  },

  'M.NUM.MUL.3': {
    easy: [
      {
        id: 'num-mul-easy-1',
        skillId: 'M.NUM.MUL.3',
        prompt: 'What is 3 × 2?',
        kind: 'mcq',
        options: ['5', '6', '8', '4'],
        answer: '6',
        explanation: 'Think of 3 groups of 2: 2 + 2 + 2 = 6'
      },
      {
        id: 'num-mul-easy-2',
        skillId: 'M.NUM.MUL.3',
        prompt: 'What is 4 × 1?',
        kind: 'short',
        answer: '4',
        explanation: 'Any number times 1 equals itself'
      },
      {
        id: 'num-mul-easy-3',
        skillId: 'M.NUM.MUL.3',
        prompt: 'What is 2 × 5?',
        kind: 'mcq',
        options: ['7', '10', '12', '8'],
        answer: '10',
        explanation: 'Count by 2s five times: 2, 4, 6, 8, 10'
      }
    ],
    core: [
      {
        id: 'num-mul-core-1',
        skillId: 'M.NUM.MUL.3',
        prompt: 'What is 7 × 8?',
        kind: 'mcq',
        options: ['54', '56', '58', '52'],
        answer: '56',
        explanation: 'Use the multiplication table or break it down: 7×8 = 7×(10-2) = 70-14'
      },
      {
        id: 'num-mul-core-2',
        skillId: 'M.NUM.MUL.3',
        prompt: 'If 6 × 4 = 24, what is 4 × 6?',
        kind: 'short',
        answer: '24',
        explanation: 'Multiplication is commutative - order doesn\'t matter'
      },
      {
        id: 'num-mul-core-3',
        skillId: 'M.NUM.MUL.3',
        prompt: 'There are 9 boxes with 6 crayons each. How many crayons total?',
        kind: 'mcq',
        options: ['54', '56', '48', '52'],
        answer: '54',
        explanation: 'This is 9 × 6 = 54 crayons'
      }
    ],
    stretch: [
      {
        id: 'num-mul-stretch-1',
        skillId: 'M.NUM.MUL.3',
        prompt: 'What is 12 × 8?',
        kind: 'short',
        answer: '96',
        explanation: 'Break it down: 12×8 = (10+2)×8 = 80+16 = 96'
      },
      {
        id: 'num-mul-stretch-2',
        skillId: 'M.NUM.MUL.3',
        prompt: 'If 7 × ? = 63, what is the missing number?',
        kind: 'mcq',
        options: ['8', '9', '10', '7'],
        answer: '9',
        explanation: 'Think: what times 7 equals 63? Count by 7s or use division'
      }
    ]
  },
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
  },

  'number.fractions': {
    easy: [
      {
        id: 'number.fractions-easy-1',
        skillId: 'number.fractions',
        prompt: 'Look at a pizza cut into 2 equal pieces. If you eat 1 piece, what fraction did you eat?',
        kind: 'mcq',
        options: ['1/2', '1/4', '2/1', '1/3'],
        answer: '1/2',
        explanation: 'When something is split into 2 equal parts and you take 1 part, that\'s 1/2 (one half).'
      },
      {
        id: 'number.fractions-easy-2', 
        skillId: 'number.fractions',
        prompt: 'Which fraction means \'one quarter\'?',
        kind: 'mcq',
        options: ['1/4', '1/2', '4/1', '2/4'],
        answer: '1/4',
        explanation: 'One quarter is written as 1/4 - it means 1 out of 4 equal parts.'
      },
      {
        id: 'number.fractions-easy-3',
        skillId: 'number.fractions', 
        prompt: 'If a chocolate bar has 4 squares and you eat 1 square, what fraction is left?',
        kind: 'mcq',
        options: ['3/4', '1/4', '4/3', '1/3'],
        answer: '3/4',
        explanation: 'You ate 1 out of 4 squares, so 3 out of 4 squares are left. That\'s 3/4.'
      },
      {
        id: 'number.fractions-easy-4',
        skillId: 'number.fractions',
        prompt: 'What does the bottom number in a fraction tell us?',
        kind: 'short',
        answer: 'How many equal parts the whole is divided into',
        explanation: 'The bottom number (denominator) shows how many equal pieces something is split into.'
      },
      {
        id: 'number.fractions-easy-5',
        skillId: 'number.fractions',
        prompt: 'Circle the larger fraction: 1/2 or 1/4',
        kind: 'short', 
        answer: '1/2',
        explanation: '1/2 is larger than 1/4. When you cut something in half, you get bigger pieces than when you cut it into quarters.'
      },
      {
        id: 'number.fractions-easy-6',
        skillId: 'number.fractions',
        prompt: 'A cake is cut into 8 equal slices. If 3 slices are eaten, what fraction represents the eaten portion?',
        kind: 'mcq',
        options: ['3/8', '8/3', '5/8', '3/5'],
        answer: '3/8',
        explanation: '3 slices out of 8 total slices equals 3/8.'
      },
      {
        id: 'number.fractions-easy-7',
        skillId: 'number.fractions',
        prompt: 'Which fraction is the same as one whole?',
        kind: 'mcq',
        options: ['4/4', '1/4', '4/1', '1/2'],
        answer: '4/4',
        explanation: '4/4 equals one whole because you have all 4 parts out of 4 total parts.'
      }
    ],
    core: [
      {
        id: 'number.fractions-core-1',
        skillId: 'number.fractions',
        prompt: 'Which fractions are equivalent to 1/2?',
        kind: 'mcq',
        options: ['2/4 and 3/6', '1/4 and 2/8', '2/3 and 4/6', '1/3 and 2/9'],
        answer: '2/4 and 3/6',
        explanation: '2/4 = 1/2 and 3/6 = 1/2. You can multiply or divide both parts of a fraction by the same number to get equivalent fractions.'
      },
      {
        id: 'number.fractions-core-2',
        skillId: 'number.fractions',
        prompt: 'Put these fractions in order from smallest to largest: 1/4, 1/2, 1/8',
        kind: 'short',
        answer: '1/8, 1/4, 1/2',
        explanation: 'When fractions have the same numerator (top number), the one with the bigger denominator (bottom number) is smaller.'
      },
      {
        id: 'number.fractions-core-3',
        skillId: 'number.fractions',
        prompt: 'What is 1/4 + 1/4?',
        kind: 'mcq',
        options: ['1/2', '2/8', '1/8', '2/4'],
        answer: '1/2',
        explanation: '1/4 + 1/4 = 2/4 = 1/2. When adding fractions with the same denominator, add the numerators.'
      },
      {
        id: 'number.fractions-core-4',
        skillId: 'number.fractions',
        prompt: 'A number line shows 0, ?, 1. What fraction goes in the middle?',
        kind: 'short',
        answer: '1/2',
        explanation: '1/2 is exactly halfway between 0 and 1 on a number line.'
      },
      {
        id: 'number.fractions-core-5',
        skillId: 'number.fractions',
        prompt: 'If 2/3 of a class are girls, what fraction are boys?',
        kind: 'short',
        answer: '1/3',
        explanation: 'The whole class equals 3/3. If 2/3 are girls, then 3/3 - 2/3 = 1/3 are boys.'
      },
      {
        id: 'number.fractions-core-6',
        skillId: 'number.fractions',
        prompt: 'Simplify the fraction 6/8',
        kind: 'short',
        answer: '3/4',
        explanation: '6/8 = 3/4 when you divide both 6 and 8 by their common factor of 2.'
      }
    ],
    stretch: [
      {
        id: 'number.fractions-stretch-1',
        skillId: 'number.fractions',
        prompt: 'Convert 2 3/4 to an improper fraction',
        kind: 'short',
        answer: '11/4',
        explanation: '2 3/4 = (2×4 + 3)/4 = (8 + 3)/4 = 11/4'
      },
      {
        id: 'number.fractions-stretch-2',
        skillId: 'number.fractions',
        prompt: 'What is 3/4 - 1/3? Express as a single fraction.',
        kind: 'short',
        answer: '5/12',
        explanation: 'Find common denominator: 3/4 = 9/12, 1/3 = 4/12. So 9/12 - 4/12 = 5/12'
      },
      {
        id: 'number.fractions-stretch-3',
        skillId: 'number.fractions',
        prompt: 'A recipe calls for 1 1/2 cups of flour. If you want to make half the recipe, how much flour do you need?',
        kind: 'short',
        answer: '3/4 cups',
        explanation: '1 1/2 ÷ 2 = 3/2 ÷ 2 = 3/4 cups of flour'
      },
      {
        id: 'number.fractions-stretch-4',
        skillId: 'number.fractions',
        prompt: 'Which is larger: 5/8 or 3/5?',
        kind: 'mcq',
        options: ['5/8', '3/5', 'They are equal', 'Cannot tell'],
        answer: '3/5',
        explanation: 'Convert to decimals: 5/8 = 0.625 and 3/5 = 0.6. Or find common denominator: 25/40 vs 24/40, so 3/5 is larger.'
      },
      {
        id: 'number.fractions-stretch-5',
        skillId: 'number.fractions',
        prompt: 'Express 0.75 as a fraction in lowest terms',
        kind: 'short',
        answer: '3/4',
        explanation: '0.75 = 75/100. Simplify by dividing both by 25: 75÷25 = 3, 100÷25 = 4, so 3/4'
      },
      {
        id: 'number.fractions-stretch-6',
        skillId: 'number.fractions',
        prompt: 'A pizza is cut into 12 slices. Sam eats 1/3 and Alex eats 1/4. How many slices are left?',
        kind: 'short',
        answer: '5 slices',
        explanation: 'Sam: 1/3 of 12 = 4 slices. Alex: 1/4 of 12 = 3 slices. Total eaten: 7 slices. Left: 12 - 7 = 5 slices'
      },
      {
        id: 'number.fractions-stretch-7',
        skillId: 'number.fractions',
        prompt: 'What fraction is halfway between 1/4 and 3/4?',
        kind: 'short',
        answer: '1/2',
        explanation: '(1/4 + 3/4) ÷ 2 = 4/4 ÷ 2 = 1 ÷ 2 = 1/2'
      }
    ]
  },

  'measurement.area': {
    easy: [
      {
        id: 'measurement.area-easy-1',
        skillId: 'measurement.area',
        prompt: 'A square has sides of 3 cm. What is its area?',
        kind: 'mcq',
        options: ['9 square cm', '6 square cm', '12 square cm', '3 square cm'],
        answer: '9 square cm',
        explanation: 'Area of a square = side × side = 3 × 3 = 9 square cm'
      },
      {
        id: 'measurement.area-easy-2',
        skillId: 'measurement.area',
        prompt: 'What is the area of a rectangle that is 4 cm long and 2 cm wide?',
        kind: 'short',
        answer: '8 square cm',
        explanation: 'Area of rectangle = length × width = 4 × 2 = 8 square cm'
      },
      {
        id: 'measurement.area-easy-3',
        skillId: 'measurement.area',
        prompt: 'Which unit is used to measure area?',
        kind: 'mcq',
        options: ['square metres', 'metres', 'litres', 'grams'],
        answer: 'square metres',
        explanation: 'Area is measured in square units like square metres, square centimetres, etc.'
      },
      {
        id: 'measurement.area-easy-4',
        skillId: 'measurement.area',
        prompt: 'A playground is 5 metres long and 3 metres wide. What is its area?',
        kind: 'short',
        answer: '15 square metres',
        explanation: 'Area = length × width = 5 × 3 = 15 square metres'
      }
    ],
    core: [
      {
        id: 'measurement.area-core-1',
        skillId: 'measurement.area',
        prompt: 'A garden bed is 6 m long and 4 m wide. If grass costs $2 per square metre, how much will it cost to cover the garden?',
        kind: 'short',
        answer: '$48',
        explanation: 'Area = 6 × 4 = 24 square metres. Cost = 24 × $2 = $48'
      },
      {
        id: 'measurement.area-core-2',
        skillId: 'measurement.area',
        prompt: 'Which rectangle has a larger area: 6×3 or 5×4?',
        kind: 'mcq',
        options: ['5×4', '6×3', 'They are equal', 'Cannot tell'],
        answer: '5×4',
        explanation: '6×3 = 18 square units, 5×4 = 20 square units. So 5×4 has larger area.'
      },
      {
        id: 'measurement.area-core-3',
        skillId: 'measurement.area',
        prompt: 'A square has an area of 16 square cm. What is the length of each side?',
        kind: 'short',
        answer: '4 cm',
        explanation: 'If area = side², then 16 = side². So side = 4 cm.'
      },
      {
        id: 'measurement.area-core-4',
        skillId: 'measurement.area',
        prompt: 'A swimming pool is 25 m long and 10 m wide. What is its area in square metres?',
        kind: 'short',
        answer: '250 square metres',
        explanation: 'Area = 25 × 10 = 250 square metres'
      }
    ],
    stretch: [
      {
        id: 'measurement.area-stretch-1',
        skillId: 'measurement.area',
        prompt: 'A triangle has a base of 8 cm and height of 6 cm. What is its area?',
        kind: 'short',
        answer: '24 square cm',
        explanation: 'Area of triangle = ½ × base × height = ½ × 8 × 6 = 24 square cm'
      },
      {
        id: 'measurement.area-stretch-2',
        skillId: 'measurement.area',
        prompt: 'A compound shape consists of a rectangle (5×3) and a square (2×2) attached to it. What is the total area?',
        kind: 'short',
        answer: '19 square units',
        explanation: 'Rectangle area = 5×3 = 15. Square area = 2×2 = 4. Total = 15+4 = 19 square units'
      },
      {
        id: 'measurement.area-stretch-3',
        skillId: 'measurement.area',
        prompt: 'A circular pond has a radius of 3 metres. What is its approximate area? (Use π ≈ 3.14)',
        kind: 'short',
        answer: '28.26 square metres',
        explanation: 'Area of circle = π × radius² = 3.14 × 3² = 3.14 × 9 = 28.26 square metres'
      },
      {
        id: 'measurement.area-stretch-4',
        skillId: 'measurement.area',
        prompt: 'A farmer has a rectangular field 50m × 30m. He plants crops on 60% of it. What area is planted?',
        kind: 'short',
        answer: '900 square metres',
        explanation: 'Total area = 50×30 = 1500 sq m. Planted area = 60% of 1500 = 0.6×1500 = 900 sq m'
      }
    ]
  },

  'measurement.volume': {
    easy: [
      {
        id: 'measurement.volume-easy-1',
        skillId: 'measurement.volume',
        prompt: 'A cube has sides of 2 cm. What is its volume?',
        kind: 'mcq',
        options: ['8 cubic cm', '6 cubic cm', '4 cubic cm', '12 cubic cm'],
        answer: '8 cubic cm',
        explanation: 'Volume of cube = side × side × side = 2 × 2 × 2 = 8 cubic cm'
      },
      {
        id: 'measurement.volume-easy-2',
        skillId: 'measurement.volume',
        prompt: 'Which unit measures volume?',
        kind: 'mcq',
        options: ['cubic metres', 'square metres', 'metres', 'grams'],
        answer: 'cubic metres',
        explanation: 'Volume is measured in cubic units like cubic metres, cubic centimetres, or litres.'
      },
      {
        id: 'measurement.volume-easy-3',
        skillId: 'measurement.volume',
        prompt: 'A box is 3 cm long, 2 cm wide, and 4 cm high. What is its volume?',
        kind: 'short',
        answer: '24 cubic cm',
        explanation: 'Volume = length × width × height = 3 × 2 × 4 = 24 cubic cm'
      }
    ],
    core: [
      {
        id: 'measurement.volume-core-1',
        skillId: 'measurement.volume',
        prompt: 'A fish tank is 50 cm long, 30 cm wide, and 40 cm high. What is its volume in litres? (1000 cubic cm = 1 litre)',
        kind: 'short',
        answer: '60 litres',
        explanation: 'Volume = 50×30×40 = 60,000 cubic cm = 60,000÷1000 = 60 litres'
      },
      {
        id: 'measurement.volume-core-2',
        skillId: 'measurement.volume',
        prompt: 'A cube has a volume of 27 cubic cm. What is the length of each edge?',
        kind: 'short',
        answer: '3 cm',
        explanation: 'If volume = edge³, then 27 = edge³. So edge = 3 cm (since 3×3×3 = 27)'
      },
      {
        id: 'measurement.volume-core-3',
        skillId: 'measurement.volume',
        prompt: 'Which container holds more: a cube with 4 cm edges or a box 5×3×2 cm?',
        kind: 'mcq',
        options: ['The cube', 'The box', 'They hold the same', 'Cannot tell'],
        answer: 'The cube',
        explanation: 'Cube volume = 4³ = 64 cubic cm. Box volume = 5×3×2 = 30 cubic cm. Cube holds more.'
      }
    ],
    stretch: [
      {
        id: 'measurement.volume-stretch-1',
        skillId: 'measurement.volume',
        prompt: 'A cylinder has a radius of 5 cm and height of 10 cm. What is its volume? (Use π ≈ 3.14)',
        kind: 'short',
        answer: '785 cubic cm',
        explanation: 'Volume of cylinder = π × radius² × height = 3.14 × 5² × 10 = 3.14 × 25 × 10 = 785 cubic cm'
      },
      {
        id: 'measurement.volume-stretch-2',
        skillId: 'measurement.volume',
        prompt: 'A swimming pool is 25m long, 12m wide, and 1.5m deep. How many litres of water does it hold?',
        kind: 'short',
        answer: '450,000 litres',
        explanation: 'Volume = 25×12×1.5 = 450 cubic metres = 450×1000 = 450,000 litres'
      }
    ]
  },

  'data.reading': {
    easy: [
      {
        id: 'data.reading-easy-1',
        skillId: 'data.reading',
        prompt: 'Look at this data: 3, 7, 5, 9, 2. What is the highest number?',
        kind: 'mcq',
        options: ['9', '7', '5', '3'],
        answer: '9',
        explanation: 'The highest number in the data set is 9.'
      },
      {
        id: 'data.reading-easy-2',
        skillId: 'data.reading',
        prompt: 'In this list: 4, 1, 8, 3, 6, what is the smallest number?',
        kind: 'short',
        answer: '1',
        explanation: 'Looking through all the numbers, 1 is the smallest.'
      },
      {
        id: 'data.reading-easy-3',
        skillId: 'data.reading',
        prompt: 'How many numbers are in this data set: 2, 5, 8, 1, 9, 3?',
        kind: 'short',
        answer: '6',
        explanation: 'Count each number in the list: there are 6 numbers total.'
      },
      {
        id: 'data.reading-easy-4',
        skillId: 'data.reading',
        prompt: 'A bar chart shows: Apples=5, Oranges=3, Bananas=7. Which fruit has the most?',
        kind: 'mcq',
        options: ['Bananas', 'Apples', 'Oranges', 'All the same'],
        answer: 'Bananas',
        explanation: 'Bananas have 7, which is more than Apples (5) and Oranges (3).'
      }
    ],
    core: [
      {
        id: 'data.reading-core-1',
        skillId: 'data.reading',
        prompt: 'Data: 12, 8, 15, 8, 10, 8, 14. What is the mode (most common value)?',
        kind: 'short',
        answer: '8',
        explanation: 'The number 8 appears 3 times, more than any other number, so it\'s the mode.'
      },
      {
        id: 'data.reading-core-2',
        skillId: 'data.reading',
        prompt: 'Find the range of this data: 3, 8, 1, 6, 9, 2',
        kind: 'short',
        answer: '8',
        explanation: 'Range = highest value - lowest value = 9 - 1 = 8'
      },
      {
        id: 'data.reading-core-3',
        skillId: 'data.reading',
        prompt: 'The temperatures this week were: 22°, 25°, 23°, 26°, 24°. What is the average temperature?',
        kind: 'short',
        answer: '24°',
        explanation: 'Average = (22+25+23+26+24) ÷ 5 = 120 ÷ 5 = 24°'
      },
      {
        id: 'data.reading-core-4',
        skillId: 'data.reading',
        prompt: 'A pie chart shows: Red 40%, Blue 30%, Green 20%, Yellow 10%. Which colour is least popular?',
        kind: 'mcq',
        options: ['Yellow', 'Green', 'Blue', 'Red'],
        answer: 'Yellow',
        explanation: 'Yellow has the smallest percentage at 10%.'
      }
    ],
    stretch: [
      {
        id: 'data.reading-stretch-1',
        skillId: 'data.reading',
        prompt: 'Data: 5, 7, 8, 8, 9, 12, 15. What is the median?',
        kind: 'short',
        answer: '8',
        explanation: 'With 7 numbers, the median is the 4th number when arranged in order. The 4th number is 8.'
      },
      {
        id: 'data.reading-stretch-2',
        skillId: 'data.reading',
        prompt: 'A line graph shows sales increasing from 100 in January to 400 in April. What was the total increase?',
        kind: 'short',
        answer: '300',
        explanation: 'Total increase = 400 - 100 = 300 units'
      },
      {
        id: 'data.reading-stretch-3',
        skillId: 'data.reading',
        prompt: 'Survey results: 25% like pizza, 35% like burgers, 40% like salad. If 200 people were surveyed, how many like burgers?',
        kind: 'short',
        answer: '70',
        explanation: '35% of 200 = 0.35 × 200 = 70 people like burgers'
      },
      {
        id: 'data.reading-stretch-4',
        skillId: 'data.reading',
        prompt: 'Two data sets: A (2,4,6,8) and B (1,3,5,7,9). Which has the larger range?',
        kind: 'mcq',
        options: ['Set B', 'Set A', 'Same range', 'Cannot tell'],
        answer: 'Set B',
        explanation: 'Set A range = 8-2 = 6. Set B range = 9-1 = 8. Set B has the larger range.'
      }
    ]
  },

  'problem.multi': {
    easy: [
      {
        id: 'problem.multi-easy-1',
        skillId: 'problem.multi',
        prompt: 'Sarah has 5 stickers. Tom gives her 3 more stickers. Then she gives 2 stickers to her friend. How many stickers does Sarah have now?',
        kind: 'short',
        answer: '6',
        explanation: 'Start with 5, add 3 (5+3=8), then subtract 2 (8-2=6). Sarah has 6 stickers.'
      },
      {
        id: 'problem.multi-easy-2',
        skillId: 'problem.multi',
        prompt: 'At a zoo, there are 8 lions and 6 tigers. 3 more tigers arrive. How many big cats are there in total?',
        kind: 'short',
        answer: '17',
        explanation: 'Lions: 8, Tigers: 6+3=9. Total big cats: 8+9=17'
      },
      {
        id: 'problem.multi-easy-3',
        skillId: 'problem.multi',
        prompt: 'Emma buys 4 apples for $2 each, then buys 1 orange for $1. How much does she spend in total?',
        kind: 'mcq',
        options: ['$9', '$7', '$8', '$6'],
        answer: '$9',
        explanation: 'Apples: 4 × $2 = $8. Orange: $1. Total: $8 + $1 = $9'
      }
    ],
    core: [
      {
        id: 'problem.multi-core-1',
        skillId: 'problem.multi',
        prompt: 'A class has 24 students. They form teams of 6. Each team needs 3 books. How many books are needed in total?',
        kind: 'short',
        answer: '12',
        explanation: 'Number of teams: 24 ÷ 6 = 4 teams. Books needed: 4 teams × 3 books = 12 books'
      },
      {
        id: 'problem.multi-core-2',
        skillId: 'problem.multi',
        prompt: 'Jake saves $5 each week for 6 weeks. He then spends $18 on a toy. How much money does he have left?',
        kind: 'short',
        answer: '$12',
        explanation: 'Total saved: $5 × 6 = $30. After buying toy: $30 - $18 = $12'
      },
      {
        id: 'problem.multi-core-3',
        skillId: 'problem.multi',
        prompt: 'A bakery makes 8 dozen cookies. They sell 3/4 of them. How many cookies do they have left?',
        kind: 'short',
        answer: '24',
        explanation: 'Total cookies: 8 × 12 = 96. Sold: 3/4 × 96 = 72. Left: 96 - 72 = 24 cookies'
      }
    ],
    stretch: [
      {
        id: 'problem.multi-stretch-1',
        skillId: 'problem.multi',
        prompt: 'A cinema has 15 rows with 20 seats each. For a show, 85% of seats are sold. How many empty seats are there?',
        kind: 'short',
        answer: '45',
        explanation: 'Total seats: 15 × 20 = 300. Sold: 85% of 300 = 255. Empty: 300 - 255 = 45 seats'
      },
      {
        id: 'problem.multi-stretch-2',
        skillId: 'problem.multi',
        prompt: 'Maria runs 3.5 km each morning and 2.8 km each evening for 5 days. What is her total distance?',
        kind: 'short',
        answer: '31.5 km',
        explanation: 'Daily total: 3.5 + 2.8 = 6.3 km. Weekly total: 6.3 × 5 = 31.5 km'
      },
      {
        id: 'problem.multi-stretch-3',
        skillId: 'problem.multi',
        prompt: 'A recipe serves 4 people and uses 250g flour. How much flour is needed to serve 14 people?',
        kind: 'short',
        answer: '875g',
        explanation: 'Scale factor: 14 ÷ 4 = 3.5. Flour needed: 250g × 3.5 = 875g'
      },
      {
        id: 'problem.multi-stretch-4',
        skillId: 'problem.multi',
        prompt: 'A store reduces prices by 20%, then adds 10% tax. If an item originally costs $50, what is the final price?',
        kind: 'short',
        answer: '$44',
        explanation: 'After discount: $50 × 0.8 = $40. After tax: $40 × 1.1 = $44'
      }
    ]
  }
};