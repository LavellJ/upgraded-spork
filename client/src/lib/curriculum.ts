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
    {
      id: "addition-subtraction",
      name: "Addition & Subtraction",
      subject: "mathematics",
      ageGroup: "primary",
      level: 1,
      description: "Master basic addition and subtraction within 100",
      skills: ["Single-digit addition", "Subtraction facts", "Word problems"],
      isUnlocked: true,
    },
    {
      id: "fractions-decimals",
      name: "Fractions & Decimals",
      subject: "mathematics",
      ageGroup: "primary",
      level: 2,
      description: "Understand fractions and decimal representations",
      skills: ["Fraction concepts", "Decimal notation", "Comparing fractions"],
      isUnlocked: false,
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
