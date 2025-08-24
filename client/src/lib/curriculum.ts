export interface CurriculumTopic {
  id: string;
  name: string;
  subject: string;
  ageGroup: "pre-primary" | "primary" | "upper-primary";
  level: number;
  description: string;
  skills: string[];
  isUnlocked: boolean;
}

export const australianCurriculumTopics: Record<string, CurriculumTopic[]> = {
  "pre-primary": [
    {
      id: "counting-numbers",
      name: "Counting & Numbers",
      subject: "mathematics",
      ageGroup: "pre-primary",
      level: 1,
      description: "Learn to count objects and recognize numbers 1-20",
      skills: ["Counting to 20", "Number recognition", "One-to-one correspondence"],
      isUnlocked: true,
    },
    {
      id: "shapes-colors",
      name: "Shapes & Colors",
      subject: "mathematics",
      ageGroup: "pre-primary",
      level: 2,
      description: "Identify and describe basic shapes and colors",
      skills: ["Shape recognition", "Color identification", "Sorting by attributes"],
      isUnlocked: false,
    }
  ],
  "primary": [
    // Mathematics Topics
    {
      id: "addition-subtraction",
      name: "Addition & Subtraction",
      subject: "mathematics",
      ageGroup: "primary",
      level: 1,
      description: "Master addition and subtraction with numbers up to 1000",
      skills: ["Two-digit addition", "Subtraction with borrowing", "Word problems", "Mental maths strategies"],
      isUnlocked: true,
    },
    {
      id: "multiplication-tables",
      name: "Multiplication Tables",
      subject: "mathematics",
      ageGroup: "primary",
      level: 2,
      description: "Learn multiplication facts from 2x to 10x tables",
      skills: ["Times tables 2-10", "Arrays and groups", "Multiplication patterns", "Quick recall"],
      isUnlocked: true,
    },
    {
      id: "fractions-decimals",
      name: "Fractions & Decimals",
      subject: "mathematics",
      ageGroup: "primary",
      level: 3,
      description: "Understand fractions and decimal representations",
      skills: ["Fraction concepts", "Decimal notation", "Comparing fractions", "Adding simple fractions"],
      isUnlocked: true,
    },
    {
      id: "time-money",
      name: "Time & Money",
      subject: "mathematics",
      ageGroup: "primary",
      level: 4,
      description: "Tell time and work with Australian currency",
      skills: ["Reading analogue clocks", "Digital time", "Money calculations", "Making change"],
      isUnlocked: true,
    },
    
    // Literacy Topics
    {
      id: "reading-comprehension",
      name: "Reading Comprehension",
      subject: "literacy",
      ageGroup: "primary",
      level: 5,
      description: "Develop strong reading skills and understanding",
      skills: ["Main idea identification", "Character analysis", "Inference", "Summarising texts"],
      isUnlocked: true,
    },
    {
      id: "creative-writing",
      name: "Creative Writing",
      subject: "literacy",
      ageGroup: "primary",
      level: 6,
      description: "Express ideas through imaginative writing",
      skills: ["Story structure", "Character development", "Descriptive language", "Editing skills"],
      isUnlocked: true,
    },
    {
      id: "spelling-vocabulary",
      name: "Spelling & Vocabulary",
      subject: "literacy",
      ageGroup: "primary",
      level: 7,
      description: "Build spelling patterns and expand vocabulary",
      skills: ["Common spelling rules", "Word families", "Synonyms and antonyms", "Context clues"],
      isUnlocked: true,
    },
    {
      id: "grammar-punctuation",
      name: "Grammar & Punctuation",
      subject: "literacy",
      ageGroup: "primary",
      level: 8,
      description: "Master sentence structure and punctuation rules",
      skills: ["Sentence types", "Comma usage", "Apostrophes", "Subject-verb agreement"],
      isUnlocked: true,
    },
    
    // Science Topics
    {
      id: "living-things",
      name: "Living Things",
      subject: "science",
      ageGroup: "primary",
      level: 9,
      description: "Explore plants, animals and their environments",
      skills: ["Life cycles", "Animal adaptations", "Plant needs", "Food chains"],
      isUnlocked: true,
    },
    {
      id: "earth-space",
      name: "Earth & Space",
      subject: "science",
      ageGroup: "primary",
      level: 10,
      description: "Discover our planet and the solar system",
      skills: ["Day and night cycle", "Seasons", "Weather patterns", "Solar system basics"],
      isUnlocked: true,
    },
    {
      id: "physical-science",
      name: "Physical Science",
      subject: "science",
      ageGroup: "primary",
      level: 11,
      description: "Investigate forces, motion and materials",
      skills: ["Push and pull forces", "Properties of materials", "Sound and light", "Simple experiments"],
      isUnlocked: true,
    },
    {
      id: "australian-studies",
      name: "Australian Studies",
      subject: "social-studies",
      ageGroup: "primary",
      level: 12,
      description: "Learn about Australian geography, culture and community",
      skills: ["Australian states", "Indigenous culture", "Community helpers", "Local history"],
      isUnlocked: true,
    }
  ],
  "upper-primary": [
    {
      id: "multiplication-division",
      name: "Multiplication & Division",
      subject: "mathematics",
      ageGroup: "upper-primary",
      level: 1,
      description: "Develop fluency with multiplication and division",
      skills: ["Times tables", "Long division", "Problem solving strategies"],
      isUnlocked: true,
    },
    {
      id: "geometry-measurement",
      name: "Geometry & Measurement",
      subject: "mathematics",
      ageGroup: "upper-primary",
      level: 2,
      description: "Explore geometric concepts and measurement units",
      skills: ["Area and perimeter", "Angles", "Metric units"],
      isUnlocked: false,
    }
  ]
};

export function getTopicsByAgeGroup(ageGroup: string): CurriculumTopic[] {
  return australianCurriculumTopics[ageGroup] || [];
}

export function getUnlockedTopics(ageGroup: string): CurriculumTopic[] {
  return getTopicsByAgeGroup(ageGroup).filter(topic => topic.isUnlocked);
}
