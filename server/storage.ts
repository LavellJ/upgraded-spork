import { 
  type Student, 
  type InsertStudent,
  type Topic,
  type InsertTopic,
  type Question,
  type InsertQuestion,
  type Progress,
  type InsertProgress,
  type PomodoroSession,
  type InsertPomodoroSession,
  type Achievement,
  type InsertAchievement
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student>;
  
  // Topics
  getAllTopics(): Promise<Topic[]>;
  getTopicsByAgeGroup(ageGroup: string): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  
  // Questions
  getQuestionsByTopic(topicId: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  
  // Progress
  getProgressByStudent(studentId: string): Promise<Progress[]>;
  getProgressByStudentAndTopic(studentId: string, topicId: string): Promise<Progress | undefined>;
  createProgress(progress: InsertProgress): Promise<Progress>;
  updateProgress(id: string, updates: Partial<Progress>): Promise<Progress>;
  
  // Pomodoro Sessions
  getPomodoroSessionsByStudent(studentId: string): Promise<PomodoroSession[]>;
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  updatePomodoroSession(id: string, updates: Partial<PomodoroSession>): Promise<PomodoroSession>;
  
  // Achievements
  getAchievementsByStudent(studentId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  hasAchievement(studentId: string, badgeId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student>;
  private topics: Map<string, Topic>;
  private questions: Map<string, Question>;
  private progress: Map<string, Progress>;
  private pomodoroSessions: Map<string, PomodoroSession>;
  private achievements: Map<string, Achievement>;

  constructor() {
    this.students = new Map();
    this.topics = new Map();
    this.questions = new Map();
    this.progress = new Map();
    this.pomodoroSessions = new Map();
    this.achievements = new Map();
    
    // Initialize with sample topics and questions
    this.initializeSampleTopics();
    this.initializeSampleQuestions();
    this.createDemoStudent();
  }

  private initializeSampleTopics() {
    const sampleTopics: Topic[] = [
      // Pre-primary topics
      {
        id: randomUUID(),
        name: "Counting & Numbers",
        subject: "mathematics",
        ageGroup: "pre-primary",
        level: 1,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Shapes & Colours",
        subject: "mathematics",
        ageGroup: "pre-primary",
        level: 2,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Letters & Sounds",
        subject: "literacy",
        ageGroup: "pre-primary",
        level: 3,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Patterns & Sorting",
        subject: "mathematics",
        ageGroup: "pre-primary",
        level: 4,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Sizes & Positions",
        subject: "mathematics",
        ageGroup: "pre-primary",
        level: 5,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Animals & Their Homes",
        subject: "science",
        ageGroup: "pre-primary",
        level: 6,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Days & Weather",
        subject: "science",
        ageGroup: "pre-primary",
        level: 7,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "My Body & Senses",
        subject: "science",
        ageGroup: "pre-primary",
        level: 8,
        isUnlocked: "true"
      },
      // Primary topics (Young Explorers)
      {
        id: randomUUID(),
        name: "Addition & Subtraction",
        subject: "mathematics",
        ageGroup: "primary",
        level: 1,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Multiplication Tables",
        subject: "mathematics",
        ageGroup: "primary",
        level: 2,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Fractions & Decimals",
        subject: "mathematics",
        ageGroup: "primary",
        level: 3,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Time & Money",
        subject: "mathematics",
        ageGroup: "primary",
        level: 4,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Reading Comprehension",
        subject: "literacy",
        ageGroup: "primary",
        level: 5,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Creative Writing",
        subject: "literacy",
        ageGroup: "primary",
        level: 6,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Spelling & Vocabulary",
        subject: "literacy",
        ageGroup: "primary",
        level: 7,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Grammar & Punctuation",
        subject: "literacy",
        ageGroup: "primary",
        level: 8,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Living Things",
        subject: "science",
        ageGroup: "primary",
        level: 9,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Earth & Space",
        subject: "science",
        ageGroup: "primary",
        level: 10,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Physical Science",
        subject: "science",
        ageGroup: "primary",
        level: 11,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Australian Studies",
        subject: "social-studies",
        ageGroup: "primary",
        level: 12,
        isUnlocked: "true"
      },
      // Upper primary topics (Advanced Minds)
      {
        id: randomUUID(),
        name: "Multiplication & Division",
        subject: "mathematics",
        ageGroup: "upper-primary",
        level: 1,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Geometry & Measurement",
        subject: "mathematics",
        ageGroup: "upper-primary",
        level: 2,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Fractions & Percentages",
        subject: "mathematics",
        ageGroup: "upper-primary",
        level: 3,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Data & Probability",
        subject: "mathematics",
        ageGroup: "upper-primary",
        level: 4,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Advanced Comprehension",
        subject: "literacy",
        ageGroup: "upper-primary",
        level: 5,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Persuasive Writing",
        subject: "literacy",
        ageGroup: "upper-primary",
        level: 6,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Poetry & Language Arts",
        subject: "literacy",
        ageGroup: "upper-primary",
        level: 7,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Research & Information Skills",
        subject: "literacy",
        ageGroup: "upper-primary",
        level: 8,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Chemistry Basics",
        subject: "science",
        ageGroup: "upper-primary",
        level: 9,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Ecosystems & Environment",
        subject: "science",
        ageGroup: "upper-primary",
        level: 10,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Physics & Energy",
        subject: "science",
        ageGroup: "upper-primary",
        level: 11,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "Australian History & Civics",
        subject: "social-studies",
        ageGroup: "upper-primary",
        level: 12,
        isUnlocked: "true"
      }
    ];

    sampleTopics.forEach(topic => this.topics.set(topic.id, topic));
  }

  private initializeSampleQuestions() {
    const topics = Array.from(this.topics.values());
    
    topics.forEach(topic => {
      let questions: Omit<Question, 'id' | 'createdAt'>[] = [];
      
      if (topic.name === "Counting & Numbers") {
        questions = [
          {
            topicId: topic.id,
            question: "What comes after the number 3?",
            options: ["2", "4", "5", "6"],
            correctAnswer: 1,
            explanation: "When counting, 4 comes right after 3!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "How many fingers do you have on one hand?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 2,
            explanation: "Count your fingers - you have 5 on each hand!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What is 2 + 1?",
            options: ["2", "3", "4", "5"],
            correctAnswer: 1,
            explanation: "When you have 2 things and add 1 more, you get 3!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Count the dots: • • • How many are there?",
            options: ["2", "3", "4", "5"],
            correctAnswer: 1,
            explanation: "Count each dot carefully - there are 3 dots!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which number is bigger: 7 or 5?",
            options: ["5", "7", "They're the same", "I don't know"],
            correctAnswer: 1,
            explanation: "7 is bigger than 5. When counting up, 7 comes after 5!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What number comes before 10?",
            options: ["8", "9", "11", "12"],
            correctAnswer: 1,
            explanation: "9 comes right before 10 when counting!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "If you have 4 toys and get 1 more, how many do you have?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 2,
            explanation: "4 + 1 = 5. You now have 5 toys in total!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Count by 2s: 2, 4, 6, ___",
            options: ["7", "8", "9", "10"],
            correctAnswer: 1,
            explanation: "When counting by 2s, we add 2 each time: 2, 4, 6, 8!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Addition & Subtraction") {
        questions = [
          {
            topicId: topic.id,
            question: "What is 5 + 3?",
            options: ["6", "7", "8", "9"],
            correctAnswer: 2,
            explanation: "5 + 3 = 8. You can count on your fingers!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 10 - 4?",
            options: ["5", "6", "7", "8"],
            correctAnswer: 1,
            explanation: "10 - 4 = 6. When you take away 4 from 10, you have 6 left.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "If you have 7 apples and eat 2, how many are left?",
            options: ["4", "5", "6", "7"],
            correctAnswer: 1,
            explanation: "7 - 2 = 5. You started with 7 and ate 2, so 5 apples remain.",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 6 + 4?",
            options: ["9", "10", "11", "12"],
            correctAnswer: 1,
            explanation: "6 + 4 = 10. When you put 6 and 4 together, you get 10!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 12 - 5?",
            options: ["6", "7", "8", "9"],
            correctAnswer: 1,
            explanation: "12 - 5 = 7. Count backwards from 12: 11, 10, 9, 8, 7.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Sarah has 8 stickers. She gives 3 to her friend. How many does she have left?",
            options: ["4", "5", "6", "11"],
            correctAnswer: 1,
            explanation: "8 - 3 = 5. Sarah gave away 3 stickers, so she has 5 left.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 7 + 6?",
            options: ["12", "13", "14", "15"],
            correctAnswer: 1,
            explanation: "7 + 6 = 13. You can think of it as 7 + 3 + 3 = 10 + 3 = 13!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 15 - 8?",
            options: ["6", "7", "8", "9"],
            correctAnswer: 1,
            explanation: "15 - 8 = 7. You can count up from 8 to 15: that's 7 steps!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Multiplication & Division") {
        questions = [
          {
            topicId: topic.id,
            question: "What is 6 × 4?",
            options: ["20", "22", "24", "26"],
            correctAnswer: 2,
            explanation: "6 × 4 = 24. This means 6 groups of 4 things each.",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 35 ÷ 7?",
            options: ["4", "5", "6", "7"],
            correctAnswer: 1,
            explanation: "35 ÷ 7 = 5. How many groups of 7 can you make from 35?",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If 8 × ? = 48, what is the missing number?",
            options: ["5", "6", "7", "8"],
            correctAnswer: 1,
            explanation: "8 × 6 = 48. You can check: 48 ÷ 8 = 6.",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "What is 7 × 3?",
            options: ["18", "20", "21", "24"],
            correctAnswer: 2,
            explanation: "7 × 3 = 21. Think of it as 7 + 7 + 7 = 21!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 24 ÷ 6?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 1,
            explanation: "24 ÷ 6 = 4. If you have 24 items in 6 equal groups, each group has 4 items.",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 9 × 5?",
            options: ["40", "44", "45", "50"],
            correctAnswer: 2,
            explanation: "9 × 5 = 45. You can think of it as (10 × 5) - (1 × 5) = 50 - 5 = 45!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If there are 4 boxes with 8 pencils each, how many pencils in total?",
            options: ["28", "30", "32", "36"],
            correctAnswer: 2,
            explanation: "4 × 8 = 32. Four boxes with 8 pencils each means 32 pencils total.",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 72 ÷ 9?",
            options: ["6", "7", "8", "9"],
            correctAnswer: 2,
            explanation: "72 ÷ 9 = 8. Think about your 9 times table: 9 × 8 = 72!",
            difficulty: 4
          }
        ];
      } else if (topic.name === "Shapes & Colours") {
        questions = [
          {
            topicId: topic.id,
            question: "What shape has 3 sides?",
            options: ["Circle", "Square", "Triangle", "Rectangle"],
            correctAnswer: 2,
            explanation: "A triangle has 3 sides and 3 corners!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which colour do you get when you mix red and yellow?",
            options: ["Purple", "Orange", "Green", "Pink"],
            correctAnswer: 1,
            explanation: "Red and yellow make orange, just like a sunset!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "How many sides does a square have?",
            options: ["2", "3", "4", "5"],
            correctAnswer: 2,
            explanation: "A square has 4 equal sides that are all the same length!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What shape is a ball?",
            options: ["Square", "Triangle", "Circle", "Rectangle"],
            correctAnswer: 2,
            explanation: "A ball is round like a circle! It's actually a sphere in 3D.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which colour do you get when you mix blue and yellow?",
            options: ["Purple", "Orange", "Green", "Red"],
            correctAnswer: 2,
            explanation: "Blue and yellow make green, like the colour of grass!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What shape has no corners?",
            options: ["Triangle", "Square", "Rectangle", "Circle"],
            correctAnswer: 3,
            explanation: "A circle is perfectly round with no corners or sides!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "How many sides does a rectangle have?",
            options: ["2", "3", "4", "6"],
            correctAnswer: 2,
            explanation: "A rectangle has 4 sides - 2 long sides and 2 short sides!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What are the three primary colours?",
            options: ["Red, Blue, Green", "Red, Blue, Yellow", "Yellow, Orange, Purple", "Blue, Green, Purple"],
            correctAnswer: 1,
            explanation: "Red, blue, and yellow are the primary colours. You can mix them to make all other colours!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Letters & Sounds") {
        questions = [
          {
            topicId: topic.id,
            question: "What letter does 'apple' start with?",
            options: ["B", "A", "C", "D"],
            correctAnswer: 1,
            explanation: "Apple starts with the letter A! A is for apple.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which letter makes the 'mmm' sound?",
            options: ["N", "L", "M", "P"],
            correctAnswer: 2,
            explanation: "M makes the 'mmm' sound, like in mummy!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What letter does 'sun' start with?",
            options: ["T", "S", "R", "N"],
            correctAnswer: 1,
            explanation: "Sun starts with S! S makes the 'sss' sound like a snake.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which word rhymes with 'cat'?",
            options: ["Dog", "Hat", "Fish", "Bird"],
            correctAnswer: 1,
            explanation: "Cat and hat rhyme! They both end with 'at'.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What letter does 'ball' start with?",
            options: ["D", "P", "B", "G"],
            correctAnswer: 2,
            explanation: "Ball starts with B! B makes the 'buh' sound.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which word starts with the same sound as 'dog'?",
            options: ["Cat", "Duck", "Fish", "Horse"],
            correctAnswer: 1,
            explanation: "Dog and duck both start with 'D' and make the 'duh' sound!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "How many sounds do you hear in 'big'?",
            options: ["2", "3", "4", "5"],
            correctAnswer: 1,
            explanation: "Big has 3 sounds: b-i-g. We can clap for each sound!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which letter comes after 'F' in the alphabet?",
            options: ["E", "G", "H", "I"],
            correctAnswer: 1,
            explanation: "G comes after F! A-B-C-D-E-F-G!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Patterns & Sorting") {
        questions = [
          {
            topicId: topic.id,
            question: "What comes next? Red, Blue, Red, Blue, ___",
            options: ["Green", "Red", "Yellow", "Purple"],
            correctAnswer: 1,
            explanation: "The pattern is Red, Blue, Red, Blue, so Red comes next!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which group do apples belong to?",
            options: ["Animals", "Fruit", "Toys", "Clothes"],
            correctAnswer: 1,
            explanation: "Apples are fruit! We eat them and they grow on trees.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What comes next? 1, 2, 1, 2, ___",
            options: ["3", "1", "4", "2"],
            correctAnswer: 1,
            explanation: "The pattern repeats: 1, 2, 1, 2, so 1 comes next!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which one is different?",
            options: ["Dog", "Cat", "Fish", "Car"],
            correctAnswer: 3,
            explanation: "Car is different because it's not an animal! The others are all animals.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What comes next? Circle, Square, Circle, Square, ___",
            options: ["Triangle", "Circle", "Rectangle", "Star"],
            correctAnswer: 1,
            explanation: "The pattern alternates: Circle, Square, so Circle comes next!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which things can fly?",
            options: ["Car and Bus", "Bird and Plane", "Fish and Frog", "Cat and Dog"],
            correctAnswer: 1,
            explanation: "Birds and planes can fly! They both move through the air.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What comes next? Big, Small, Big, Small, ___",
            options: ["Medium", "Big", "Tiny", "Large"],
            correctAnswer: 1,
            explanation: "The pattern alternates sizes: Big, Small, so Big comes next!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "How should we sort these: spoons, forks, plates, cups?",
            options: ["By colour", "Kitchen things", "By size", "Toys"],
            correctAnswer: 1,
            explanation: "They're all kitchen things we use for eating!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Sizes & Positions") {
        questions = [
          {
            topicId: topic.id,
            question: "Which is bigger: elephant or mouse?",
            options: ["Mouse", "Elephant", "Same size", "Can't tell"],
            correctAnswer: 1,
            explanation: "An elephant is much bigger than a mouse! Elephants are huge animals.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Where is the bird? The bird is ___ the tree.",
            options: ["Under", "On", "Inside", "Behind"],
            correctAnswer: 1,
            explanation: "Birds often sit ON tree branches or ON top of trees.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which is the smallest?",
            options: ["House", "Car", "Ant", "Chair"],
            correctAnswer: 2,
            explanation: "An ant is tiny! It's much smaller than all the other things.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "The ball is ___ the box.",
            options: ["Over", "Inside", "Beside", "Far from"],
            correctAnswer: 1,
            explanation: "If you can't see the ball, it's probably INSIDE the box!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the opposite of 'up'?",
            options: ["Left", "Right", "Down", "Forward"],
            correctAnswer: 2,
            explanation: "Up and down are opposites! When you go up stairs, the opposite is going down.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which comes first when you line up by height?",
            options: ["Tallest person", "Shortest person", "Middle person", "Any person"],
            correctAnswer: 1,
            explanation: "When lining up by height from shortest to tallest, the shortest person comes first!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "The cat is hiding ___ the bed.",
            options: ["On top", "Under", "Above", "Next to"],
            correctAnswer: 1,
            explanation: "Cats love to hide UNDER beds where it's cozy and dark!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Put these in order from smallest to biggest:",
            options: ["Baby, Adult, Teenager", "Adult, Teenager, Baby", "Baby, Teenager, Adult", "Teenager, Baby, Adult"],
            correctAnswer: 2,
            explanation: "Babies are smallest, teenagers are medium, and adults are biggest!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Animals & Their Homes") {
        questions = [
          {
            topicId: topic.id,
            question: "Where do fish live?",
            options: ["Trees", "Water", "Sky", "Underground"],
            correctAnswer: 1,
            explanation: "Fish live in water! They swim in oceans, rivers, and ponds.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What do bees make?",
            options: ["Milk", "Honey", "Eggs", "Wool"],
            correctAnswer: 1,
            explanation: "Bees make honey! They collect nectar from flowers to make sweet honey.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Where do birds build their homes?",
            options: ["Underground", "In trees", "In water", "In caves"],
            correctAnswer: 1,
            explanation: "Birds build nests in trees! They use twigs and leaves to make cozy homes.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which Australian animal carries babies in a pouch?",
            options: ["Koala", "Kangaroo", "Wombat", "Emu"],
            correctAnswer: 1,
            explanation: "Kangaroos carry their babies (joeys) in a special pouch! This keeps them safe and warm.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What sound do cows make?",
            options: ["Woof", "Meow", "Moo", "Cluck"],
            correctAnswer: 2,
            explanation: "Cows say 'Moo!' They live on farms and give us milk.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Where would you find a penguin?",
            options: ["Desert", "Hot jungle", "Cold places", "Top of trees"],
            correctAnswer: 2,
            explanation: "Penguins live in very cold places with lots of ice and snow!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What do caterpillars turn into?",
            options: ["Frogs", "Butterflies", "Birds", "Fish"],
            correctAnswer: 1,
            explanation: "Caterpillars transform into beautiful butterflies! This amazing change is called metamorphosis.",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which animal is famous for sleeping in eucalyptus trees in Australia?",
            options: ["Kangaroo", "Koala", "Crocodile", "Dingo"],
            correctAnswer: 1,
            explanation: "Koalas sleep in eucalyptus trees and eat their leaves! They sleep about 20 hours a day.",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Days & Weather") {
        questions = [
          {
            topicId: topic.id,
            question: "How many days are in a week?",
            options: ["5", "6", "7", "8"],
            correctAnswer: 2,
            explanation: "A week has 7 days! Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What do you wear when it's raining?",
            options: ["Sunglasses", "Raincoat", "Shorts", "Sandals"],
            correctAnswer: 1,
            explanation: "A raincoat keeps you dry when it's raining! You might also use an umbrella.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "When is it hottest during the day?",
            options: ["Morning", "Night", "Afternoon", "Midnight"],
            correctAnswer: 2,
            explanation: "The afternoon is usually the hottest time because the sun has been shining all day!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What comes after Wednesday?",
            options: ["Tuesday", "Thursday", "Friday", "Monday"],
            correctAnswer: 1,
            explanation: "Thursday comes after Wednesday! The days go: Monday, Tuesday, Wednesday, Thursday...",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What do you see in the sky when it's sunny?",
            options: ["Moon", "Sun", "Stars", "Clouds only"],
            correctAnswer: 1,
            explanation: "When it's sunny, you see the bright sun in the sky! It gives us light and warmth.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which season comes after summer in Australia?",
            options: ["Winter", "Autumn", "Spring", "Summer again"],
            correctAnswer: 1,
            explanation: "Autumn comes after summer! The leaves change colour and fall from trees.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What should you do on a very hot day?",
            options: ["Wear heavy clothes", "Stay in shade", "Run in the sun", "Don't drink water"],
            correctAnswer: 1,
            explanation: "On hot days, stay in the shade and drink lots of water to keep cool and safe!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "How many seasons are there in a year?",
            options: ["2", "3", "4", "5"],
            correctAnswer: 2,
            explanation: "There are 4 seasons: Summer, Autumn, Winter, and Spring!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "My Body & Senses") {
        questions = [
          {
            topicId: topic.id,
            question: "How many eyes do you have?",
            options: ["1", "2", "3", "4"],
            correctAnswer: 1,
            explanation: "You have 2 eyes! They help you see the world around you.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What do you use to hear sounds?",
            options: ["Eyes", "Nose", "Ears", "Mouth"],
            correctAnswer: 2,
            explanation: "You use your ears to hear! They help you listen to music, voices, and sounds.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What do you use to smell flowers?",
            options: ["Ears", "Nose", "Eyes", "Hands"],
            correctAnswer: 1,
            explanation: "Your nose helps you smell! You can smell yummy food and beautiful flowers.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "How many fingers do you have on one hand?",
            options: ["4", "5", "6", "3"],
            correctAnswer: 1,
            explanation: "You have 5 fingers on each hand! Count them: thumb, pointer, middle, ring, pinky.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What helps you taste your food?",
            options: ["Tongue", "Teeth", "Lips", "Cheeks"],
            correctAnswer: 0,
            explanation: "Your tongue has special taste buds that help you taste sweet, sour, salty, and bitter foods!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What should you do before eating?",
            options: ["Watch TV", "Wash hands", "Run around", "Shout loudly"],
            correctAnswer: 1,
            explanation: "Always wash your hands before eating! This keeps germs away and keeps you healthy.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which sense tells you if something is hot or cold?",
            options: ["Hearing", "Seeing", "Touch", "Smell"],
            correctAnswer: 2,
            explanation: "Touch helps you feel if things are hot, cold, soft, or rough! Your skin can feel all these things.",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "How many senses do we have?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 2,
            explanation: "We have 5 senses: see, hear, smell, taste, and touch! They help us learn about the world.",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Multiplication Tables") {
        questions = [
          {
            topicId: topic.id,
            question: "What is 3 × 4?",
            options: ["10", "11", "12", "13"],
            correctAnswer: 2,
            explanation: "3 × 4 = 12. Think of 3 groups of 4 things: 4 + 4 + 4 = 12!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 2 × 7?",
            options: ["12", "13", "14", "15"],
            correctAnswer: 2,
            explanation: "2 × 7 = 14. Double 7 gives you 14!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 5 × 6?",
            options: ["25", "30", "35", "40"],
            correctAnswer: 1,
            explanation: "5 × 6 = 30. Count by 5s six times: 5, 10, 15, 20, 25, 30!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 4 × 8?",
            options: ["28", "30", "32", "36"],
            correctAnswer: 2,
            explanation: "4 × 8 = 32. Four groups of 8 makes 32!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 9 × 3?",
            options: ["24", "25", "26", "27"],
            correctAnswer: 3,
            explanation: "9 × 3 = 27. Think of 9 + 9 + 9 = 27!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 6 × 7?",
            options: ["40", "41", "42", "43"],
            correctAnswer: 2,
            explanation: "6 × 7 = 42. This is a tricky one to remember!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 8 × 5?",
            options: ["35", "40", "45", "50"],
            correctAnswer: 1,
            explanation: "8 × 5 = 40. Five groups of 8 makes 40!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is 7 × 8?",
            options: ["54", "55", "56", "57"],
            correctAnswer: 2,
            explanation: "7 × 8 = 56. This is one of the harder times tables!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Time & Money") {
        questions = [
          {
            topicId: topic.id,
            question: "If the time is 3:30, what time will it be in 30 minutes?",
            options: ["3:60", "4:00", "4:30", "5:00"],
            correctAnswer: 1,
            explanation: "3:30 + 30 minutes = 4:00. Remember, 60 minutes makes a whole hour!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "How many minutes are in 1 hour?",
            options: ["50", "60", "70", "100"],
            correctAnswer: 1,
            explanation: "There are 60 minutes in 1 hour!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "If you have 2 × $1 coins and 3 × 20c coins, how much money do you have?",
            options: ["$2.30", "$2.60", "$3.20", "$3.60"],
            correctAnswer: 1,
            explanation: "$2.00 + 60 cents = $2.60. Count: $1, $2, 20c, 40c, 60c!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What time does the clock show when the big hand points to 6 and the small hand points to 2?",
            options: ["2:30", "6:02", "2:06", "6:30"],
            correctAnswer: 0,
            explanation: "When the big hand points to 6, it means 30 minutes past the hour. Small hand on 2 means 2:30!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "If something costs $4.50 and you pay with a $5 note, how much change do you get?",
            options: ["$0.50", "$1.00", "$1.50", "$4.50"],
            correctAnswer: 0,
            explanation: "$5.00 - $4.50 = $0.50. That's 50 cents change!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "How many 5-cent coins make 50 cents?",
            options: ["5", "10", "15", "20"],
            correctAnswer: 1,
            explanation: "50 ÷ 5 = 10. You need 10 five-cent coins to make 50 cents!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If you start reading at 7:15 and read for 45 minutes, what time do you finish?",
            options: ["7:45", "8:00", "8:15", "8:30"],
            correctAnswer: 1,
            explanation: "7:15 + 45 minutes = 8:00. 15 + 45 = 60 minutes = 1 hour!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which Australian coin is gold coloured?",
            options: ["5 cents", "10 cents", "$1", "$2"],
            correctAnswer: 3,
            explanation: "The $2 coin is gold coloured and has an Aboriginal elder on it!",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Reading Comprehension") {
        questions = [
          {
            topicId: topic.id,
            question: "In the story 'The Three Little Pigs', what did the third pig build his house from?",
            options: ["Straw", "Sticks", "Bricks", "Leaves"],
            correctAnswer: 2,
            explanation: "The third pig built his house from bricks, which kept him safe from the wolf!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What is the main idea of a story about a lost dog finding its way home?",
            options: ["Dogs are smart", "Never give up hope", "Animals get lost", "Home is important"],
            correctAnswer: 1,
            explanation: "The main idea is about never giving up hope, even when things seem difficult!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "If a character in a story is 'nervous', how are they feeling?",
            options: ["Happy", "Worried", "Angry", "Excited"],
            correctAnswer: 1,
            explanation: "Nervous means worried or anxious about something!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is a good prediction for a story that starts 'The dark clouds gathered overhead'?",
            options: ["It will be sunny", "It might rain", "Someone will be happy", "It's nighttime"],
            correctAnswer: 1,
            explanation: "Dark clouds gathering usually means rain is coming!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "In a story, what does 'setting' mean?",
            options: ["The main character", "When and where the story happens", "What the character wants", "How the story ends"],
            correctAnswer: 1,
            explanation: "Setting is when and where the story takes place - like 'in a forest long ago'!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "If you read 'Sarah slammed the door', how is Sarah probably feeling?",
            options: ["Happy", "Sleepy", "Angry", "Surprised"],
            correctAnswer: 2,
            explanation: "Slamming a door usually shows anger or frustration!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the problem called in a story?",
            options: ["Setting", "Character", "Conflict", "Theme"],
            correctAnswer: 2,
            explanation: "The problem in a story is called the conflict - it's what the character needs to solve!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If an author writes 'The cat crept quietly', what does this tell us?",
            options: ["The cat is loud", "The cat is trying not to be heard", "The cat is sleeping", "The cat is running"],
            correctAnswer: 1,
            explanation: "Crept quietly means the cat is moving carefully and silently!",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Creative Writing") {
        questions = [
          {
            topicId: topic.id,
            question: "What makes a good story beginning?",
            options: ["'The End'", "A hook that grabs attention", "Lots of big words", "A very long sentence"],
            correctAnswer: 1,
            explanation: "A good beginning hooks the reader and makes them want to keep reading!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which sentence uses better descriptive language?",
            options: ["The dog ran.", "The big dog ran fast.", "The golden retriever bounded joyfully.", "A dog moved."],
            correctAnswer: 2,
            explanation: "'Golden retriever bounded joyfully' paints a clear picture with specific, exciting words!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What should every story have?",
            options: ["A beginning, middle, and end", "At least 10 pages", "Difficult words", "Lots of characters"],
            correctAnswer: 0,
            explanation: "Every story needs a beginning, middle, and end to feel complete!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which word would make this sentence more exciting: 'The girl _____ across the playground'?",
            options: ["went", "walked", "raced", "moved"],
            correctAnswer: 2,
            explanation: "'Raced' is much more exciting and shows speed and energy!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is dialogue in a story?",
            options: ["The setting", "Words that characters speak", "The ending", "The author's name"],
            correctAnswer: 1,
            explanation: "Dialogue is when characters talk to each other, usually shown with quotation marks!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which sentence shows, rather than tells?",
            options: ["Sam was scared.", "Sam trembled and hid behind the tree.", "Sam felt afraid.", "Sam was not brave."],
            correctAnswer: 1,
            explanation: "'Trembled and hid' shows us Sam's fear through actions rather than just telling us!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What should you do before writing your final story?",
            options: ["Plan your ideas", "Count the words", "Check the time", "Choose a pen colour"],
            correctAnswer: 0,
            explanation: "Planning your ideas first helps you write a better, more organised story!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which makes a character more interesting?",
            options: ["Giving them a problem to solve", "Making them perfect", "Giving them a common name", "Making them very tall"],
            correctAnswer: 0,
            explanation: "Characters become interesting when they face challenges and problems to overcome!",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Spelling & Vocabulary") {
        questions = [
          {
            topicId: topic.id,
            question: "Which word means the opposite of 'hot'?",
            options: ["Warm", "Cool", "Cold", "Freezing"],
            correctAnswer: 2,
            explanation: "Cold is the direct opposite of hot! Cool and freezing are also cooler, but cold is the best opposite.",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which word is spelled correctly?",
            options: ["recieve", "receive", "recive", "receeve"],
            correctAnswer: 1,
            explanation: "Remember: 'i before e except after c' - so it's 'receive'!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What does 'enormous' mean?",
            options: ["Very small", "Very big", "Very fast", "Very slow"],
            correctAnswer: 1,
            explanation: "Enormous means very, very big - like an enormous elephant!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which word rhymes with 'night'?",
            options: ["not", "neat", "bright", "net"],
            correctAnswer: 2,
            explanation: "Night and bright both end with the same 'ight' sound!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which word has the same meaning as 'happy'?",
            options: ["Sad", "Angry", "Joyful", "Tired"],
            correctAnswer: 2,
            explanation: "Joyful and happy both mean feeling good and pleased!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which is the correct spelling?",
            options: ["frend", "friend", "freind", "friand"],
            correctAnswer: 1,
            explanation: "Friend - remember 'fri-end' - a friend is there to the end!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "If something is 'ancient', it is very...",
            options: ["new", "old", "big", "small"],
            correctAnswer: 1,
            explanation: "Ancient means very, very old - like ancient dinosaurs or ancient pyramids!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which word family do these belong to: light, night, sight, fight?",
            options: ["-ight words", "-ight words", "-ight words", "-ight words"],
            correctAnswer: 0,
            explanation: "These all belong to the '-ight' word family - they all end with the same sound and spelling!",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Grammar & Punctuation") {
        questions = [
          {
            topicId: topic.id,
            question: "What punctuation mark goes at the end of a question?",
            options: [".", "!", "?", ","],
            correctAnswer: 2,
            explanation: "Questions always end with a question mark (?) - like 'How are you?'",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which sentence is written correctly?",
            options: ["sarah went to the shop", "Sarah went to the shop.", "sarah went to the shop.", "Sarah went to the shop"],
            correctAnswer: 1,
            explanation: "Sentences start with a capital letter and end with a full stop!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What type of word is 'beautiful'?",
            options: ["Noun", "Verb", "Adjective", "Adverb"],
            correctAnswer: 2,
            explanation: "'Beautiful' describes something, so it's an adjective - like 'a beautiful flower'!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which word needs an apostrophe?",
            options: ["The cats fur was soft", "The dogs tail wagged", "The birds flew away", "The cars were red"],
            correctAnswer: 0,
            explanation: "It should be 'The cat's fur' - the apostrophe shows the fur belongs to the cat!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What type of word is 'run'?",
            options: ["Noun", "Verb", "Adjective", "Adverb"],
            correctAnswer: 1,
            explanation: "'Run' is an action word, so it's a verb - you can run fast!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which sentence needs a comma?",
            options: ["I like apples and oranges", "I like apples oranges and bananas", "I like apples", "I like fruit"],
            correctAnswer: 1,
            explanation: "'I like apples, oranges, and bananas' - commas separate items in a list!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What makes this sentence wrong: 'The boy run to school'?",
            options: ["Missing comma", "Wrong verb form", "No capital letter", "No full stop"],
            correctAnswer: 1,
            explanation: "It should be 'The boy runs' - the verb must match the subject!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which word is a noun?",
            options: ["quickly", "running", "beautiful", "elephant"],
            correctAnswer: 3,
            explanation: "'Elephant' is a thing you can see and touch, so it's a noun!",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Living Things") {
        questions = [
          {
            topicId: topic.id,
            question: "What do all living things need to survive?",
            options: ["Food, water, air", "Toys, games, books", "Cars, houses, phones", "Clothes, shoes, hats"],
            correctAnswer: 0,
            explanation: "All living things need food for energy, water to drink, and air to breathe!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What is the life cycle order for a butterfly?",
            options: ["Egg, caterpillar, butterfly, chrysalis", "Egg, chrysalis, caterpillar, butterfly", "Egg, caterpillar, chrysalis, butterfly", "Caterpillar, egg, chrysalis, butterfly"],
            correctAnswer: 2,
            explanation: "Butterflies start as eggs, hatch into caterpillars, form a chrysalis, then emerge as butterflies!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which animal is a herbivore (only eats plants)?",
            options: ["Lion", "Kangaroo", "Eagle", "Shark"],
            correctAnswer: 1,
            explanation: "Kangaroos are herbivores - they only eat grass and plants!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What do plants need to make their own food?",
            options: ["Soil and rain", "Sunlight, water, and carbon dioxide", "Animals and insects", "Wind and cold weather"],
            correctAnswer: 1,
            explanation: "Plants use sunlight, water, and carbon dioxide to make food through photosynthesis!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which animal adaptation helps a polar bear survive in the cold?",
            options: ["Long legs", "Thick fur", "Bright colours", "Small ears"],
            correctAnswer: 1,
            explanation: "Polar bears have thick fur to keep them warm in the freezing Arctic!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the food chain order?",
            options: ["Carnivore, herbivore, plant", "Plant, carnivore, herbivore", "Plant, herbivore, carnivore", "Herbivore, plant, carnivore"],
            correctAnswer: 2,
            explanation: "Energy flows from plants to herbivores (plant-eaters) to carnivores (meat-eaters)!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "How do fish breathe underwater?",
            options: ["Through their mouth", "Through gills", "They hold their breath", "Through their fins"],
            correctAnswer: 1,
            explanation: "Fish have special organs called gills that take oxygen from the water!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What do we call animals that are active at night?",
            options: ["Diurnal", "Nocturnal", "Hibernating", "Migrating"],
            correctAnswer: 1,
            explanation: "Nocturnal animals like owls and bats are active at night and sleep during the day!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Earth & Space") {
        questions = [
          {
            topicId: topic.id,
            question: "Why do we have day and night?",
            options: ["The sun moves around Earth", "Earth spins on its axis", "The moon blocks the sun", "Clouds cover the sun"],
            correctAnswer: 1,
            explanation: "Earth spins like a top! When your part faces the sun it's day, when it faces away it's night!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "How many seasons are there in a year?",
            options: ["2", "3", "4", "5"],
            correctAnswer: 2,
            explanation: "There are 4 seasons: summer, autumn, winter, and spring!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "What is the closest star to Earth?",
            options: ["Polaris", "Alpha Centauri", "The Sun", "Sirius"],
            correctAnswer: 2,
            explanation: "The Sun is our closest star! It gives us light and heat every day.",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What causes rain?",
            options: ["Clouds getting too heavy", "Water evaporating and condensing", "The moon pulling water", "Wind pushing water"],
            correctAnswer: 1,
            explanation: "Water evaporates from oceans, rises as clouds, then condenses and falls as rain!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which planet is known as the 'Red Planet'?",
            options: ["Venus", "Jupiter", "Mars", "Saturn"],
            correctAnswer: 2,
            explanation: "Mars looks red because of iron oxide (rust) on its surface!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What shape is Earth?",
            options: ["Flat like a plate", "Square like a box", "Round like a ball", "Triangle like a pyramid"],
            correctAnswer: 2,
            explanation: "Earth is round like a ball - we call this shape a sphere!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Why is summer warmer than winter?",
            options: ["Earth is closer to the sun", "The sun is hotter", "Earth tilts toward the sun", "There are more clouds"],
            correctAnswer: 2,
            explanation: "Earth tilts! In summer, your part of Earth tilts toward the sun and gets more direct sunlight!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What do we call a scientist who studies space?",
            options: ["Geologist", "Biologist", "Astronomer", "Meteorologist"],
            correctAnswer: 2,
            explanation: "An astronomer studies stars, planets, and everything in space!",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Physical Science") {
        questions = [
          {
            topicId: topic.id,
            question: "What happens when you push a ball?",
            options: ["It disappears", "It moves away from you", "It gets heavier", "It changes colour"],
            correctAnswer: 1,
            explanation: "When you push something, you apply a force that makes it move in the direction you pushed!",
            difficulty: 1
          },
          {
            topicId: topic.id,
            question: "Which material would be best for keeping ice cream cold?",
            options: ["Metal", "Plastic", "Styrofoam", "Glass"],
            correctAnswer: 2,
            explanation: "Styrofoam is a good insulator - it doesn't let heat pass through easily!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What do we call materials that let light pass through them?",
            options: ["Opaque", "Transparent", "Reflective", "Magnetic"],
            correctAnswer: 1,
            explanation: "Transparent materials like clear glass let light pass through so you can see through them!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Sound travels through:",
            options: ["Only air", "Only water", "Only solid things", "Air, water, and solids"],
            correctAnswer: 3,
            explanation: "Sound waves can travel through air, water, and solid materials like wood and metal!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What happens to most materials when they get very cold?",
            options: ["They expand", "They contract (get smaller)", "They change colour", "They become magnetic"],
            correctAnswer: 1,
            explanation: "Most materials contract (shrink) when they get cold and expand when they get hot!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which force pulls everything toward the ground?",
            options: ["Magnetism", "Gravity", "Friction", "Electricity"],
            correctAnswer: 1,
            explanation: "Gravity is the force that pulls everything down toward Earth!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What makes a ball bounce?",
            options: ["Gravity", "The material springs back", "Air pressure", "Magnetism"],
            correctAnswer: 1,
            explanation: "When a ball hits the ground, it squashes and then springs back to its original shape!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which of these is magnetic?",
            options: ["Plastic spoon", "Wooden stick", "Iron nail", "Glass cup"],
            correctAnswer: 2,
            explanation: "Iron and steel are magnetic - magnets can attract them!",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Australian Studies") {
        questions = [
          {
            topicId: topic.id,
            question: "How many states are there in Australia?",
            options: ["5", "6", "7", "8"],
            correctAnswer: 1,
            explanation: "Australia has 6 states: NSW, Victoria, Queensland, WA, SA, and Tasmania!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the capital city of Australia?",
            options: ["Sydney", "Melbourne", "Brisbane", "Canberra"],
            correctAnswer: 3,
            explanation: "Canberra is Australia's capital city, even though Sydney and Melbourne are bigger!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which animal appears on the Australian coat of arms with the kangaroo?",
            options: ["Koala", "Wombat", "Emu", "Platypus"],
            correctAnswer: 2,
            explanation: "The emu and kangaroo are on Australia's coat of arms because they can't walk backwards!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What do we call the original people of Australia?",
            options: ["Aboriginals", "Indigenous Australians", "First Nations people", "All of these"],
            correctAnswer: 3,
            explanation: "Aboriginal people, Indigenous Australians, and First Nations people all refer to Australia's original inhabitants!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is Australia's national flower?",
            options: ["Rose", "Wattle", "Eucalyptus", "Bottlebrush"],
            correctAnswer: 1,
            explanation: "The golden wattle is Australia's national flower - it's bright yellow and beautiful!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which ocean surrounds most of Australia?",
            options: ["Pacific Ocean", "Indian Ocean", "Atlantic Ocean", "Southern Ocean"],
            correctAnswer: 1,
            explanation: "The Indian Ocean surrounds most of Australia, especially the west and south!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What important event do we celebrate on January 26th?",
            options: ["Christmas", "Easter", "Australia Day", "Queen's Birthday"],
            correctAnswer: 2,
            explanation: "Australia Day on January 26th celebrates our nation, though it means different things to different people!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What does 'Aussie' mean?",
            options: ["Australian person", "Australian animal", "Australian food", "Australian weather"],
            correctAnswer: 0,
            explanation: "'Aussie' is a friendly nickname for an Australian person!",
            difficulty: 1
          }
        ];
      } else if (topic.name === "Geometry & Measurement") {
        questions = [
          {
            topicId: topic.id,
            question: "What is the area of a rectangle that is 8cm long and 5cm wide?",
            options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"],
            correctAnswer: 2,
            explanation: "Area = length × width. 8cm × 5cm = 40 cm²",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "How many faces does a cube have?",
            options: ["4", "6", "8", "12"],
            correctAnswer: 1,
            explanation: "A cube has 6 faces - think of a dice!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the perimeter of a square with sides of 7cm?",
            options: ["14 cm", "21 cm", "28 cm", "49 cm"],
            correctAnswer: 2,
            explanation: "Perimeter = 4 × side length. 4 × 7cm = 28cm",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What type of angle measures exactly 90 degrees?",
            options: ["Acute", "Right", "Obtuse", "Straight"],
            correctAnswer: 1,
            explanation: "A right angle measures exactly 90 degrees - like the corner of a square!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "How many millimetres are in 3.5 centimetres?",
            options: ["35 mm", "350 mm", "3.5 mm", "0.35 mm"],
            correctAnswer: 0,
            explanation: "1 cm = 10 mm, so 3.5 cm = 35 mm",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the volume of a rectangular prism 4cm × 3cm × 2cm?",
            options: ["9 cm³", "18 cm³", "24 cm³", "48 cm³"],
            correctAnswer: 2,
            explanation: "Volume = length × width × height. 4 × 3 × 2 = 24 cm³",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "If an angle measures 45 degrees, what type of angle is it?",
            options: ["Right angle", "Acute angle", "Obtuse angle", "Straight angle"],
            correctAnswer: 1,
            explanation: "Acute angles measure less than 90 degrees. 45° < 90°, so it's acute!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the area of a triangle with base 6cm and height 4cm?",
            options: ["10 cm²", "12 cm²", "24 cm²", "48 cm²"],
            correctAnswer: 1,
            explanation: "Area of triangle = ½ × base × height. ½ × 6 × 4 = 12 cm²",
            difficulty: 4
          }
        ];
      } else if (topic.name === "Fractions & Percentages") {
        questions = [
          {
            topicId: topic.id,
            question: "What is ¾ + ½?",
            options: ["1¼", "5/6", "1", "2/6"],
            correctAnswer: 0,
            explanation: "¾ + ½ = ¾ + 2/4 = 5/4 = 1¼",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is 25% of 80?",
            options: ["15", "20", "25", "30"],
            correctAnswer: 1,
            explanation: "25% = ¼, so 25% of 80 = 80 ÷ 4 = 20",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which fraction is equivalent to 0.75?",
            options: ["¾", "⅔", "⅘", "⅝"],
            correctAnswer: 0,
            explanation: "0.75 = 75/100 = ¾ when simplified",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If 60% of students like pizza, what fraction is this?",
            options: ["⅗", "⅔", "¾", "⅘"],
            correctAnswer: 0,
            explanation: "60% = 60/100 = ⅗ when simplified",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is ⅔ - ¼?",
            options: ["⅜", "5/12", "⅙", "7/12"],
            correctAnswer: 1,
            explanation: "⅔ - ¼ = 8/12 - 3/12 = 5/12",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "If a shirt costs $40 and is 30% off, what is the sale price?",
            options: ["$28", "$30", "$32", "$35"],
            correctAnswer: 0,
            explanation: "30% off means pay 70%. 70% of $40 = $28",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "What is the ratio 12:8 in its simplest form?",
            options: ["6:4", "3:2", "4:3", "2:1"],
            correctAnswer: 1,
            explanation: "Divide both numbers by 4: 12÷4 : 8÷4 = 3:2",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If ⅜ of a pizza is eaten, what percentage is left?",
            options: ["37.5%", "62.5%", "75%", "87.5%"],
            correctAnswer: 1,
            explanation: "⅜ eaten = 37.5% eaten, so 100% - 37.5% = 62.5% left",
            difficulty: 4
          }
        ];
      } else if (topic.name === "Data & Probability") {
        questions = [
          {
            topicId: topic.id,
            question: "What is the mean of these numbers: 4, 6, 8, 10, 12?",
            options: ["6", "8", "9", "10"],
            correctAnswer: 1,
            explanation: "Mean = (4+6+8+10+12) ÷ 5 = 40 ÷ 5 = 8",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If you flip a fair coin, what is the probability of getting heads?",
            options: ["¼", "⅓", "½", "¾"],
            correctAnswer: 2,
            explanation: "A fair coin has 2 equal outcomes (heads or tails), so P(heads) = 1/2",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the median of: 3, 7, 9, 12, 15?",
            options: ["7", "9", "10", "12"],
            correctAnswer: 1,
            explanation: "The median is the middle value when numbers are in order: 9",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "In a bag with 3 red balls and 7 blue balls, what's the probability of picking red?",
            options: ["3/10", "3/7", "7/10", "1/3"],
            correctAnswer: 0,
            explanation: "P(red) = red balls ÷ total balls = 3 ÷ 10 = 3/10",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the mode of: 2, 3, 3, 5, 7, 3, 9?",
            options: ["2", "3", "5", "7"],
            correctAnswer: 1,
            explanation: "The mode is the most frequent value. 3 appears three times!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "If you roll a die, what's the probability of getting a number greater than 4?",
            options: ["⅙", "¼", "⅓", "½"],
            correctAnswer: 2,
            explanation: "Numbers greater than 4 are 5 and 6. That's 2 out of 6 = ⅓",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the range of: 15, 8, 23, 12, 19?",
            options: ["11", "15", "19", "23"],
            correctAnswer: 1,
            explanation: "Range = highest - lowest = 23 - 8 = 15",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "In a survey of 20 students, 8 like maths, 12 like science. How many more like science?",
            options: ["2", "4", "8", "12"],
            correctAnswer: 1,
            explanation: "12 - 8 = 4 more students like science than maths",
            difficulty: 2
          }
        ];
      } else if (topic.name === "Advanced Comprehension") {
        questions = [
          {
            topicId: topic.id,
            question: "What is the author's main purpose in writing a persuasive advertisement?",
            options: ["To inform", "To entertain", "To persuade", "To describe"],
            correctAnswer: 2,
            explanation: "Persuasive advertisements are designed to convince people to buy or do something!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "When comparing two texts about the same topic, what should you look for?",
            options: ["Similar words", "Different viewpoints", "Same length", "Same author"],
            correctAnswer: 1,
            explanation: "Comparing texts means looking for different perspectives and viewpoints on the same topic!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What does it mean to 'read between the lines'?",
            options: ["Read every other line", "Skip difficult words", "Understand hidden meanings", "Read very slowly"],
            correctAnswer: 2,
            explanation: "Reading between the lines means understanding what the author suggests but doesn't directly say!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "If a character says 'Fine!' and slams their book shut, how are they feeling?",
            options: ["Happy", "Confused", "Frustrated", "Excited"],
            correctAnswer: 2,
            explanation: "The tone and actions (slamming the book) show frustration, even though 'fine' usually means okay!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is bias in a text?",
            options: ["A spelling mistake", "The author's opinion influencing the writing", "A long paragraph", "A difficult word"],
            correctAnswer: 1,
            explanation: "Bias is when an author's personal opinions influence how they present information!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What makes a source reliable?",
            options: ["It's on the internet", "It's written by an expert", "It's very long", "It has pictures"],
            correctAnswer: 1,
            explanation: "Reliable sources are written by experts who know the topic well and use evidence!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is foreshadowing in a story?",
            options: ["Hints about what will happen later", "Describing the weather", "Introducing characters", "The story's ending"],
            correctAnswer: 0,
            explanation: "Foreshadowing gives readers clues about future events in the story!",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "Why might an author choose to tell a story from a child's point of view?",
            options: ["To make it shorter", "To show innocence and wonder", "To use simple words", "To avoid dialogue"],
            correctAnswer: 1,
            explanation: "A child's perspective can show innocence, wonder, and a unique way of seeing the world!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Persuasive Writing") {
        questions = [
          {
            topicId: topic.id,
            question: "What is the most important part of a persuasive argument?",
            options: ["Using big words", "Providing strong evidence", "Writing very long sentences", "Using lots of adjectives"],
            correctAnswer: 1,
            explanation: "Strong evidence (facts, examples, expert opinions) makes your argument convincing!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which word would make your argument stronger: 'I think...' or 'Research shows...'?",
            options: ["I think", "Research shows", "Both are equal", "Neither"],
            correctAnswer: 1,
            explanation: "'Research shows' uses evidence, which is much more persuasive than personal opinion!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is a counter-argument?",
            options: ["Agreeing with everyone", "A point that opposes your view", "Writing backwards", "Using numbers"],
            correctAnswer: 1,
            explanation: "A counter-argument is an opposing viewpoint that you address to strengthen your case!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which persuasive technique uses famous people to support your point?",
            options: ["Statistics", "Celebrity endorsement", "Emotional appeal", "Logical reasoning"],
            correctAnswer: 1,
            explanation: "Celebrity endorsement uses famous people's influence to persuade others!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What should you do before writing a persuasive letter?",
            options: ["Choose fancy paper", "Research your audience", "Count the words", "Pick a pen colour"],
            correctAnswer: 1,
            explanation: "Understanding your audience helps you choose the best arguments and tone!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which is an example of emotional appeal?",
            options: ["'Studies show that 90% agree'", "'Think of the poor animals'", "'The data proves'", "'According to experts'"],
            correctAnswer: 1,
            explanation: "'Think of the poor animals' appeals to emotions like sympathy and compassion!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What makes a call to action effective?",
            options: ["It's very polite", "It's clear and specific", "It's very long", "It rhymes"],
            correctAnswer: 1,
            explanation: "Effective calls to action tell people exactly what to do in simple, clear language!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Why is it important to acknowledge different viewpoints?",
            options: ["To make writing longer", "To show you're fair and thoughtful", "To confuse readers", "To fill space"],
            correctAnswer: 1,
            explanation: "Acknowledging other views shows you've considered all sides, making you more credible!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Poetry & Language Arts") {
        questions = [
          {
            topicId: topic.id,
            question: "What is a metaphor?",
            options: ["Comparing using 'like' or 'as'", "Comparing without 'like' or 'as'", "A type of rhyme", "Describing sounds"],
            correctAnswer: 1,
            explanation: "A metaphor directly compares two things without using 'like' or 'as' - 'Her voice is music'!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is alliteration?",
            options: ["Words that rhyme", "Repeated consonant sounds", "Long sentences", "Silent letters"],
            correctAnswer: 1,
            explanation: "Alliteration repeats the same consonant sound - 'Peter Piper picked a peck'!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is personification?",
            options: ["Describing a person", "Giving human qualities to non-human things", "Using personal pronouns", "Writing about yourself"],
            correctAnswer: 1,
            explanation: "Personification gives human traits to objects or animals - 'The wind whispered'!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the rhyme scheme of: 'Roses are red (A), Violets are blue (B), Sugar is sweet (C), And so are you (B)'?",
            options: ["AABB", "ABAB", "ABCB", "ABCC"],
            correctAnswer: 2,
            explanation: "Each different ending sound gets a letter: red=A, blue=B, sweet=C, you=B, so ABCB!",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "Which is an example of onomatopoeia?",
            options: ["Beautiful bird", "Buzz", "Big balloon", "Happy home"],
            correctAnswer: 1,
            explanation: "Onomatopoeia words sound like what they describe - 'buzz' sounds like a bee!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is a simile?",
            options: ["A happy poem", "Comparing with 'like' or 'as'", "A short story", "Repeated words"],
            correctAnswer: 1,
            explanation: "Similes compare using 'like' or 'as' - 'as brave as a lion'!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What creates rhythm in poetry?",
            options: ["Rhyming words", "The pattern of stressed syllables", "Long lines", "Big words"],
            correctAnswer: 1,
            explanation: "Rhythm comes from the pattern of stressed and unstressed syllables - like a heartbeat!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is imagery in poetry?",
            options: ["Pictures in books", "Words that create mental pictures", "Rhyming words", "Short poems"],
            correctAnswer: 1,
            explanation: "Imagery uses descriptive words to help readers 'see' what the poet describes!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Research & Information Skills") {
        questions = [
          {
            topicId: topic.id,
            question: "What should you do first when starting a research project?",
            options: ["Write the conclusion", "Choose a specific topic", "Make it pretty", "Count the pages"],
            correctAnswer: 1,
            explanation: "Choosing a clear, specific topic helps focus your research and makes it manageable!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Which source would be most reliable for information about climate change?",
            options: ["A friend's opinion", "A scientific journal", "A random blog", "A social media post"],
            correctAnswer: 1,
            explanation: "Scientific journals are peer-reviewed and written by experts, making them very reliable!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the purpose of taking notes while researching?",
            options: ["To make your project longer", "To record important information", "To practice handwriting", "To use different colours"],
            correctAnswer: 1,
            explanation: "Notes help you remember and organise important information from your sources!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Why is it important to check multiple sources?",
            options: ["To have more pages", "To confirm information is accurate", "To use bigger words", "To impress teachers"],
            correctAnswer: 1,
            explanation: "Multiple sources help verify facts and give you a complete, balanced view of the topic!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is plagiarism?",
            options: ["Good research", "Using someone else's work without credit", "Writing neatly", "Using the internet"],
            correctAnswer: 1,
            explanation: "Plagiarism is using someone else's ideas or words without giving them credit - it's like stealing!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What makes a good research question?",
            options: ["It's very long", "It can be answered with yes or no", "It's specific and focused", "It has big words"],
            correctAnswer: 2,
            explanation: "Good research questions are specific, focused, and lead to interesting discoveries!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "When presenting research, what should you include?",
            options: ["Only your opinion", "Your sources and evidence", "Lots of decorations", "Very small text"],
            correctAnswer: 1,
            explanation: "Always include your sources and evidence so others can verify your information!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is a bibliography?",
            options: ["A type of book", "A list of sources you used", "A summary paragraph", "A research method"],
            correctAnswer: 1,
            explanation: "A bibliography lists all the sources you used, giving credit to the original authors!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Chemistry Basics") {
        questions = [
          {
            topicId: topic.id,
            question: "What are the three main states of matter?",
            options: ["Hot, cold, warm", "Solid, liquid, gas", "Big, medium, small", "Heavy, light, medium"],
            correctAnswer: 1,
            explanation: "The three states of matter are solid, liquid, and gas - like ice, water, and steam!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What happens to water molecules when water boils?",
            options: ["They disappear", "They move faster and turn to gas", "They freeze", "They get bigger"],
            correctAnswer: 1,
            explanation: "When water boils, molecules move so fast they escape as steam (water vapour)!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which is an example of a chemical change?",
            options: ["Ice melting", "Burning wood", "Cutting paper", "Breaking glass"],
            correctAnswer: 1,
            explanation: "Burning creates new substances (ash, smoke) - that's a chemical change!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the smallest part of an element called?",
            options: ["A molecule", "An atom", "A particle", "A piece"],
            correctAnswer: 1,
            explanation: "An atom is the smallest unit of an element - like tiny building blocks!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which is an example of a physical change?",
            options: ["Rust forming", "Bread toasting", "Ice melting", "Candle burning"],
            correctAnswer: 2,
            explanation: "Ice melting to water is just changing state - it's still the same substance (H₂O)!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What happens when you mix baking soda and vinegar?",
            options: ["Nothing", "They separate", "They react and fizz", "They get hot"],
            correctAnswer: 2,
            explanation: "Baking soda and vinegar react chemically, producing carbon dioxide gas that makes it fizz!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is a compound?",
            options: ["A single element", "Two or more elements joined together", "A state of matter", "A type of atom"],
            correctAnswer: 1,
            explanation: "A compound is made when different elements bond together, like water (H₂O)!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Why does ice float on water?",
            options: ["It's magic", "Ice is less dense than water", "Ice is warmer", "Water pushes it up"],
            correctAnswer: 1,
            explanation: "When water freezes, it expands and becomes less dense, so ice floats!",
            difficulty: 4
          }
        ];
      } else if (topic.name === "Ecosystems & Environment") {
        questions = [
          {
            topicId: topic.id,
            question: "What is biodiversity?",
            options: ["The study of biology", "The variety of life in an ecosystem", "The size of animals", "The age of plants"],
            correctAnswer: 1,
            explanation: "Biodiversity is the variety of different plants, animals and organisms in an ecosystem!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the difference between a food chain and a food web?",
            options: ["No difference", "Food webs show multiple connected food chains", "Food chains are bigger", "Food webs are for water animals"],
            correctAnswer: 1,
            explanation: "A food web shows how multiple food chains connect together in an ecosystem!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is the main cause of habitat destruction?",
            options: ["Natural disasters", "Human activities", "Animal behaviour", "Weather changes"],
            correctAnswer: 1,
            explanation: "Human activities like clearing forests and building cities are the main cause of habitat loss!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is a keystone species?",
            options: ["The biggest animal", "A species that has a large impact on its ecosystem", "The rarest animal", "The first animal in food chain"],
            correctAnswer: 1,
            explanation: "Keystone species have a huge impact - if they disappear, the whole ecosystem changes!",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "What is the greenhouse effect?",
            options: ["Growing plants in glass houses", "Gases trapping heat in Earth's atmosphere", "Green plants making oxygen", "Houses painted green"],
            correctAnswer: 1,
            explanation: "Greenhouse gases trap heat in our atmosphere, just like glass traps heat in a greenhouse!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Which human activity helps reduce carbon dioxide in the atmosphere?",
            options: ["Driving cars", "Planting trees", "Burning fossil fuels", "Using electricity"],
            correctAnswer: 1,
            explanation: "Trees absorb carbon dioxide from the air during photosynthesis!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is conservation?",
            options: ["Talking quietly", "Protecting natural resources and wildlife", "Saving money", "Eating less food"],
            correctAnswer: 1,
            explanation: "Conservation means protecting and preserving nature for future generations!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Why are decomposers important in ecosystems?",
            options: ["They eat all the plants", "They break down dead materials and recycle nutrients", "They are the biggest animals", "They make the food chains longer"],
            correctAnswer: 1,
            explanation: "Decomposers like bacteria and fungi recycle nutrients back to the soil for plants to use!",
            difficulty: 3
          }
        ];
      } else if (topic.name === "Physics & Energy") {
        questions = [
          {
            topicId: topic.id,
            question: "What are the main forms of energy?",
            options: ["Big and small", "Kinetic and potential", "Fast and slow", "Hot and cold"],
            correctAnswer: 1,
            explanation: "Kinetic energy is energy of motion, potential energy is stored energy!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What happens to energy - can it be created or destroyed?",
            options: ["It can be created but not destroyed", "It can be destroyed but not created", "It cannot be created or destroyed, only transformed", "It can be both created and destroyed"],
            correctAnswer: 2,
            explanation: "Energy cannot be created or destroyed, only changed from one form to another!",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "What do you need to complete an electrical circuit?",
            options: ["Just a battery", "A complete path for electricity to flow", "Only wires", "Just a light bulb"],
            correctAnswer: 1,
            explanation: "Electricity needs a complete path (circuit) to flow from the power source and back!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is friction?",
            options: ["A type of energy", "A force that opposes motion", "The speed of objects", "The weight of objects"],
            correctAnswer: 1,
            explanation: "Friction is a force that slows down moving objects when surfaces rub together!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the difference between speed and velocity?",
            options: ["No difference", "Velocity includes direction", "Speed is faster", "Velocity is slower"],
            correctAnswer: 1,
            explanation: "Speed is how fast you go, velocity is how fast you go in a specific direction!",
            difficulty: 4
          },
          {
            topicId: topic.id,
            question: "What type of energy does a stretched rubber band have?",
            options: ["Kinetic energy", "Heat energy", "Potential energy", "Light energy"],
            correctAnswer: 2,
            explanation: "A stretched rubber band stores potential energy that can be released when let go!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What makes sound travel?",
            options: ["Light waves", "Water", "Vibrations", "Electricity"],
            correctAnswer: 2,
            explanation: "Sound travels through vibrations that move through air, water, or solid materials!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is Newton's First Law of Motion?",
            options: ["Objects at rest stay at rest unless acted upon by a force", "Force equals mass times acceleration", "Every action has an equal and opposite reaction", "Energy cannot be created or destroyed"],
            correctAnswer: 0,
            explanation: "Objects at rest stay at rest, and moving objects keep moving, unless a force acts on them!",
            difficulty: 4
          }
        ];
      } else if (topic.name === "Australian History & Civics") {
        questions = [
          {
            topicId: topic.id,
            question: "When did European settlement begin in Australia?",
            options: ["1770", "1788", "1801", "1850"],
            correctAnswer: 1,
            explanation: "The First Fleet arrived in 1788, beginning European settlement in Australia!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What happened in 1901 that was important for Australia?",
            options: ["First convicts arrived", "Gold was discovered", "Federation - Australia became a nation", "World War I began"],
            correctAnswer: 2,
            explanation: "In 1901, the six colonies joined together to form the Commonwealth of Australia!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "Who makes the laws in Australia?",
            options: ["The Prime Minister alone", "Parliament", "The Governor-General", "State Premiers"],
            correctAnswer: 1,
            explanation: "Parliament (elected representatives) makes laws for Australia!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What are the three levels of government in Australia?",
            options: ["Big, medium, small", "Federal, state, local", "Past, present, future", "Executive, legislative, judicial"],
            correctAnswer: 1,
            explanation: "Australia has federal (national), state, and local government levels!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What is democracy?",
            options: ["Rule by one person", "Government by the people", "No government", "Government by the military"],
            correctAnswer: 1,
            explanation: "Democracy means government by the people - we vote to choose our leaders!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "Who were the Aboriginal people in relation to Australia?",
            options: ["The second people to arrive", "The first people to live here", "Visitors from other countries", "People who came in 1788"],
            correctAnswer: 1,
            explanation: "Aboriginal and Torres Strait Islander peoples are Australia's First Nations - they lived here for over 60,000 years!",
            difficulty: 2
          },
          {
            topicId: topic.id,
            question: "What is the role of the Prime Minister?",
            options: ["To make all the laws", "To lead the government", "To judge court cases", "To command the army"],
            correctAnswer: 1,
            explanation: "The Prime Minister leads the government and is the head of the political party with the most seats in Parliament!",
            difficulty: 3
          },
          {
            topicId: topic.id,
            question: "What rights do Australian citizens have?",
            options: ["Only the right to work", "The right to vote and free speech", "Only the right to travel", "No special rights"],
            correctAnswer: 1,
            explanation: "Australian citizens have many rights including voting, free speech, and equal treatment under the law!",
            difficulty: 3
          }
        ];
      }
      
      // Create and store the questions
      questions.forEach(questionData => {
        const question: Question = {
          ...questionData,
          id: randomUUID(),
          createdAt: new Date()
        };
        this.questions.set(question.id, question);
      });
    });
  }

  // Create demo student for testing
  private createDemoStudent() {
    const demoStudent: Student = {
      id: "demo-student",
      name: "Little Learner",
      ageGroup: "pre-primary",
      currentLevel: 1,
      totalPoints: 0,
      createdAt: new Date()
    };
    this.students.set("demo-student", demoStudent);
  }

  // Students
  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { 
      ...insertStudent, 
      id,
      currentLevel: insertStudent.currentLevel ?? 1,
      totalPoints: insertStudent.totalPoints ?? 0,
      createdAt: new Date()
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const student = this.students.get(id);
    if (!student) {
      throw new Error("Student not found");
    }
    const updatedStudent = { ...student, ...updates };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  // Topics
  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values());
  }

  async getTopicsByAgeGroup(ageGroup: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(topic => topic.ageGroup === ageGroup);
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    return this.topics.get(id);
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = randomUUID();
    const topic: Topic = { 
      ...insertTopic, 
      id,
      isUnlocked: insertTopic.isUnlocked ?? "false"
    };
    this.topics.set(id, topic);
    return topic;
  }

  // Questions
  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(question => question.topicId === topicId);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { 
      ...insertQuestion, 
      id,
      createdAt: new Date()
    };
    this.questions.set(id, question);
    return question;
  }

  async createQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    const questions: Question[] = [];
    for (const insertQuestion of insertQuestions) {
      const question = await this.createQuestion(insertQuestion);
      questions.push(question);
    }
    return questions;
  }

  // Progress
  async getProgressByStudent(studentId: string): Promise<Progress[]> {
    return Array.from(this.progress.values()).filter(p => p.studentId === studentId);
  }

  async getProgressByStudentAndTopic(studentId: string, topicId: string): Promise<Progress | undefined> {
    return Array.from(this.progress.values()).find(p => 
      p.studentId === studentId && p.topicId === topicId
    );
  }

  async createProgress(insertProgress: InsertProgress): Promise<Progress> {
    const id = randomUUID();
    const progress: Progress = { 
      ...insertProgress, 
      id,
      questionsAnswered: insertProgress.questionsAnswered ?? 0,
      correctAnswers: insertProgress.correctAnswers ?? 0,
      currentStreak: insertProgress.currentStreak ?? 0,
      bestStreak: insertProgress.bestStreak ?? 0,
      completionPercentage: insertProgress.completionPercentage ?? 0,
      lastStudied: new Date()
    };
    this.progress.set(id, progress);
    return progress;
  }

  async updateProgress(id: string, updates: Partial<Progress>): Promise<Progress> {
    const progress = this.progress.get(id);
    if (!progress) {
      throw new Error("Progress not found");
    }
    const updatedProgress = { 
      ...progress, 
      ...updates, 
      lastStudied: new Date() 
    };
    this.progress.set(id, updatedProgress);
    return updatedProgress;
  }

  // Pomodoro Sessions
  async getPomodoroSessionsByStudent(studentId: string): Promise<PomodoroSession[]> {
    return Array.from(this.pomodoroSessions.values()).filter(s => s.studentId === studentId);
  }

  async createPomodoroSession(insertSession: InsertPomodoroSession): Promise<PomodoroSession> {
    const id = randomUUID();
    const session: PomodoroSession = { 
      ...insertSession, 
      id,
      topicId: insertSession.topicId ?? null,
      completed: insertSession.completed ?? "false",
      startedAt: new Date()
    };
    this.pomodoroSessions.set(id, session);
    return session;
  }

  async updatePomodoroSession(id: string, updates: Partial<PomodoroSession>): Promise<PomodoroSession> {
    const session = this.pomodoroSessions.get(id);
    if (!session) {
      throw new Error("Pomodoro session not found");
    }
    const updatedSession = { ...session, ...updates };
    this.pomodoroSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Achievements
  async getAchievementsByStudent(studentId: string): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(a => a.studentId === studentId);
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = randomUUID();
    const achievement: Achievement = { 
      ...insertAchievement, 
      id,
      earnedAt: new Date(),
      metadata: insertAchievement.metadata || null
    };
    this.achievements.set(id, achievement);
    return achievement;
  }

  async hasAchievement(studentId: string, badgeId: string): Promise<boolean> {
    return Array.from(this.achievements.values()).some(a => 
      a.studentId === studentId && a.badgeId === badgeId
    );
  }
}

export const storage = new MemStorage();
