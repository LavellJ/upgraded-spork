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
    
    // Initialize with sample topics
    this.initializeSampleTopics();
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
        name: "Shapes & Colors",
        subject: "mathematics",
        ageGroup: "pre-primary",
        level: 2,
        isUnlocked: "false"
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
