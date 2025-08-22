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
