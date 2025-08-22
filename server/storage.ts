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
        subject: "social-studies",
        ageGroup: "pre-primary",
        level: 7,
        isUnlocked: "true"
      },
      {
        id: randomUUID(),
        name: "My Body & Senses",
        subject: "health",
        ageGroup: "pre-primary",
        level: 8,
        isUnlocked: "true"
      },
      // Primary topics
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
        name: "Fractions & Decimals",
        subject: "mathematics",
        ageGroup: "primary",
        level: 2,
        isUnlocked: "false"
      },
      // Upper primary topics
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
        isUnlocked: "false"
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
