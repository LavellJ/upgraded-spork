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
    // Advanced Mathematics Topics
    {
      id: "multiplication-division",
      name: "Multiplication & Division",
      subject: "mathematics",
      ageGroup: "upper-primary",
      level: 1,
      description: "Master complex multiplication and division with large numbers",
      skills: ["Multi-digit multiplication", "Long division", "Problem solving strategies", "Factors and multiples"],
      isUnlocked: true,
    },
    {
      id: "geometry-measurement",
      name: "Geometry & Measurement",
      subject: "mathematics",
      ageGroup: "upper-primary",
      level: 2,
      description: "Advanced geometric concepts and precise measurements",
      skills: ["Area and perimeter", "3D shapes", "Angles and triangles", "Metric conversions"],
      isUnlocked: true,
    },
    {
      id: "fractions-percentages",
      name: "Fractions & Percentages",
      subject: "mathematics",
      ageGroup: "upper-primary",
      level: 3,
      description: "Complex fraction operations and percentage calculations",
      skills: ["Equivalent fractions", "Adding/subtracting fractions", "Percentage problems", "Ratio and proportion"],
      isUnlocked: true,
    },
    {
      id: "data-probability",
      name: "Data & Probability",
      subject: "mathematics",
      ageGroup: "upper-primary",
      level: 4,
      description: "Analyse data and understand probability concepts",
      skills: ["Reading graphs", "Creating surveys", "Mean, median, mode", "Basic probability"],
      isUnlocked: true,
    },
    
    // Advanced Literacy Topics
    {
      id: "advanced-comprehension",
      name: "Advanced Comprehension",
      subject: "literacy",
      ageGroup: "upper-primary",
      level: 5,
      description: "Analyse complex texts and develop critical thinking",
      skills: ["Text analysis", "Comparing sources", "Making inferences", "Author's purpose"],
      isUnlocked: true,
    },
    {
      id: "persuasive-writing",
      name: "Persuasive Writing",
      subject: "literacy",
      ageGroup: "upper-primary",
      level: 6,
      description: "Write compelling arguments and persuasive texts",
      skills: ["Argument structure", "Supporting evidence", "Persuasive techniques", "Audience awareness"],
      isUnlocked: true,
    },
    {
      id: "poetry-language",
      name: "Poetry & Language Arts",
      subject: "literacy",
      ageGroup: "upper-primary",
      level: 7,
      description: "Explore poetry, metaphors and advanced language features",
      skills: ["Poetic devices", "Figurative language", "Rhyme and rhythm", "Literary appreciation"],
      isUnlocked: true,
    },
    {
      id: "research-skills",
      name: "Research & Information Skills",
      subject: "literacy",
      ageGroup: "upper-primary",
      level: 8,
      description: "Develop research skills and evaluate information sources",
      skills: ["Information literacy", "Source evaluation", "Note-taking", "Research presentation"],
      isUnlocked: true,
    },
    
    // Advanced Science Topics
    {
      id: "chemistry-basics",
      name: "Chemistry Basics",
      subject: "science",
      ageGroup: "upper-primary",
      level: 9,
      description: "Introduction to atoms, molecules and chemical reactions",
      skills: ["States of matter", "Chemical vs physical changes", "Basic atomic structure", "Simple reactions"],
      isUnlocked: true,
    },
    {
      id: "ecosystems-environment",
      name: "Ecosystems & Environment",
      subject: "science",
      ageGroup: "upper-primary",
      level: 10,
      description: "Study complex ecosystems and environmental science",
      skills: ["Food webs", "Biodiversity", "Human impact", "Conservation strategies"],
      isUnlocked: true,
    },
    {
      id: "physics-energy",
      name: "Physics & Energy",
      subject: "science",
      ageGroup: "upper-primary",
      level: 11,
      description: "Explore energy, electricity and advanced physics concepts",
      skills: ["Forms of energy", "Simple circuits", "Force and motion", "Scientific method"],
      isUnlocked: true,
    },
    {
      id: "australian-history",
      name: "Australian History & Civics",
      subject: "social-studies",
      ageGroup: "upper-primary",
      level: 12,
      description: "Explore Australian history, government and democratic processes",
      skills: ["Colonial history", "Federation", "Government structure", "Rights and responsibilities"],
      isUnlocked: true,
    }
  ]
};

export function getTopicsByAgeGroup(ageGroup: string): CurriculumTopic[] {
  return australianCurriculumTopics[ageGroup] || [];
}

export function getUnlockedTopics(ageGroup: string): CurriculumTopic[] {
  return getTopicsByAgeGroup(ageGroup).filter(topic => topic.isUnlocked);
}
