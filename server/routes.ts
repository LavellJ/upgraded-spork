import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestions, generateHint, generateExplanation } from "./services/openai";
import { badgeSystem, BADGE_DEFINITIONS } from "./badgeSystem";
import { 
  insertStudentSchema, 
  insertProgressSchema, 
  insertPomodoroSessionSchema,
  type Question
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Students
  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  // Topics
  app.get("/api/topics", async (req, res) => {
    try {
      const { ageGroup } = req.query;
      const topics = ageGroup 
        ? await storage.getTopicsByAgeGroup(ageGroup as string)
        : await storage.getAllTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topic = await storage.getTopic(req.params.id);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Questions
  app.get("/api/questions/:topicId", async (req, res) => {
    try {
      const questions = await storage.getQuestionsByTopic(req.params.topicId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Generate AI questions
  app.post("/api/questions/generate", async (req, res) => {
    try {
      const { topicId, count = 5, difficulty = 3 } = req.body;
      
      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }

      const generatedQuestions = await generateQuestions({
        topic: topic.name,
        subject: topic.subject,
        ageGroup: topic.ageGroup as "pre-primary" | "primary" | "upper-primary",
        difficulty,
        count
      });

      const questionsToInsert = generatedQuestions.map(q => ({
        topicId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty
      }));

      const createdQuestions = await storage.createQuestions(questionsToInsert);
      res.json(createdQuestions);
    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ message: "Failed to generate questions. Please check your OpenAI API key." });
    }
  });

  // Get hint for question
  app.post("/api/questions/hint", async (req, res) => {
    try {
      const { questionId } = req.body;
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const correctOption = (question.options as string[])[question.correctAnswer];
      const hint = await generateHint(question.question, correctOption);
      
      res.json({ hint });
    } catch (error) {
      console.error("Error generating hint:", error);
      res.status(500).json({ message: "Failed to generate hint" });
    }
  });

  // Progress tracking
  app.get("/api/progress/:studentId", async (req, res) => {
    try {
      const progress = await storage.getProgressByStudent(req.params.studentId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const progressData = insertProgressSchema.parse(req.body);
      
      // Check if progress already exists
      const existingProgress = await storage.getProgressByStudentAndTopic(
        progressData.studentId, 
        progressData.topicId
      );

      let result;
      if (existingProgress) {
        result = await storage.updateProgress(existingProgress.id, {
          questionsAnswered: (existingProgress.questionsAnswered || 0) + 1,
          correctAnswers: progressData.correctAnswers 
            ? (existingProgress.correctAnswers || 0) + 1 
            : existingProgress.correctAnswers,
          currentStreak: progressData.correctAnswers 
            ? (existingProgress.currentStreak || 0) + 1 
            : 0,
          bestStreak: Math.max(
            existingProgress.bestStreak || 0, 
            progressData.correctAnswers ? (existingProgress.currentStreak || 0) + 1 : 0
          )
        });
      } else {
        result = await storage.createProgress(progressData);
      }
      
      // Check for new badges after progress update
      const student = await storage.getStudent(progressData.studentId);
      if (student) {
        const newBadges = await badgeSystem.checkAndAwardBadges(progressData.studentId, student.ageGroup);
        res.json({
          progress: result,
          newBadges: newBadges
        });
      } else {
        res.json({ progress: result, newBadges: [] });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Pomodoro sessions
  app.post("/api/pomodoro", async (req, res) => {
    try {
      const sessionData = insertPomodoroSessionSchema.parse(req.body);
      const session = await storage.createPomodoroSession(sessionData);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      console.error("Error creating pomodoro session:", error);
      res.status(500).json({ message: "Failed to create pomodoro session" });
    }
  });

  app.patch("/api/pomodoro/:id", async (req, res) => {
    try {
      const session = await storage.updatePomodoroSession(req.params.id, req.body);
      
      // Check for new badges after completing a Pomodoro session
      if (session.completed === "true") {
        const student = await storage.getStudent(session.studentId);
        if (student) {
          await badgeSystem.checkAndAwardBadges(session.studentId, student.ageGroup);
        }
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error updating pomodoro session:", error);
      res.status(500).json({ message: "Failed to update pomodoro session" });
    }
  });

  // Achievements
  app.get("/api/achievements/:studentId", async (req, res) => {
    try {
      const achievements = await storage.getAchievementsByStudent(req.params.studentId);
      const achievementsWithDetails = achievements.map(achievement => ({
        ...achievement,
        badge: badgeSystem.getBadgeDefinition(achievement.badgeId)
      }));
      res.json(achievementsWithDetails);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/badges", async (req, res) => {
    try {
      const { ageGroup } = req.query;
      const badges = ageGroup 
        ? BADGE_DEFINITIONS.filter(badge => badge.ageGroups.includes(ageGroup as any))
        : BADGE_DEFINITIONS;
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/achievements/check/:studentId", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      const newBadges = await badgeSystem.checkAndAwardBadges(req.params.studentId, student.ageGroup);
      res.json(newBadges);
    } catch (error) {
      console.error("Error checking for badges:", error);
      res.status(500).json({ message: "Failed to check for badges" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
