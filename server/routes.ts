import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestions, generateSmartHint, generatePersonalizedExplanation, calculateAdaptiveDifficulty } from "./services/openai";
import { badgeSystem, BADGE_DEFINITIONS } from "./badgeSystem";
import { 
  insertStudentSchema, 
  insertProgressSchema, 
  insertPomodoroSessionSchema,
  type Question,
  type Progress
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

  // Get smart contextual hint for question
  app.post("/api/questions/hint", async (req, res) => {
    try {
      const { questionId, studentId = "demo-student" } = req.body;
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Get student performance data
      const student = await storage.getStudent(studentId);
      const progress = await storage.getStudentProgress(studentId);
      const topic = await storage.getTopic(question.topicId);
      
      // Calculate performance metrics
      const topicProgress = progress.find((p: Progress) => p.topicId === question.topicId);
      const overallCorrect = progress.reduce((sum: number, p: Progress) => sum + (p.correctAnswers || 0), 0);
      const overallTotal = progress.reduce((sum: number, p: Progress) => sum + (p.questionsAnswered || 0), 0);
      const overallAccuracy = overallTotal > 0 ? overallCorrect / overallTotal : 0.5;
      const topicAccuracy = topicProgress ? 
        (topicProgress.questionsAnswered && topicProgress.questionsAnswered > 0 ? (topicProgress.correctAnswers || 0) / topicProgress.questionsAnswered : 0.5) : 0.5;

      // Analyze struggling areas (basic implementation)
      const strugglingAreas: string[] = [];
      const allTopics = await storage.getAllTopics();
      progress.forEach((p: Progress) => {
        if (p.questionsAnswered && p.correctAnswers && p.questionsAnswered >= 3 && (p.correctAnswers / p.questionsAnswered) < 0.5) {
          const topicInfo = allTopics.find(t => t.id === p.topicId);
          if (topicInfo) strugglingAreas.push(topicInfo.subject);
        }
      });

      const correctOption = (question.options as string[])[question.correctAnswer];
      const hint = await generateSmartHint({
        question: question.question,
        correctAnswer: correctOption,
        studentPerformance: {
          ageGroup: (student?.ageGroup || topic?.ageGroup || "primary") as "pre-primary" | "primary" | "upper-primary",
          topicProgress: topicAccuracy,
          overallAccuracy,
          strugglingAreas,
          learningStyle: undefined as "visual" | "analytical" | "practical" | "creative" | undefined
        }
      });
      
      res.json({ hint });
    } catch (error) {
      console.error("Error generating smart hint:", error);
      res.status(500).json({ message: "Failed to generate hint" });
    }
  });

  // Adaptive difficulty calculation
  app.post("/api/questions/adaptive-difficulty", async (req, res) => {
    try {
      const { topicId, studentId = "demo-student" } = req.body;
      
      const progress = await storage.getStudentProgress(studentId);
      const topicProgress = progress.find((p: Progress) => p.topicId === topicId);
      
      if (!topicProgress || !topicProgress.questionsAnswered || topicProgress.questionsAnswered < 3) {
        // Not enough data, start with moderate difficulty
        return res.json({ 
          difficulty: 3, 
          reasoning: "Starting with moderate difficulty - not enough performance data yet.",
          encouragement: "Let's find the perfect challenge level for you!"
        });
      }

      // Calculate recent performance (basic implementation - could be enhanced)
      const recentAccuracy = (topicProgress.correctAnswers || 0) / (topicProgress.questionsAnswered || 1);
      const overallCorrect = progress.reduce((sum: number, p: Progress) => sum + (p.correctAnswers || 0), 0);
      const overallTotal = progress.reduce((sum: number, p: Progress) => sum + (p.questionsAnswered || 0), 0);
      const learningVelocity = recentAccuracy > 0.7 ? 0.8 : recentAccuracy > 0.5 ? 0.6 : 0.4;

      const difficultyResult = await calculateAdaptiveDifficulty({
        topicId,
        studentPerformance: {
          recentAccuracy,
          topicMastery: recentAccuracy,
          learningVelocity,
          streakLength: topicProgress.currentStreak || 0,
          timeSpentPerQuestion: 60 // Default, could be tracked more precisely
        },
        currentDifficulty: 3 // Default current difficulty
      });

      res.json(difficultyResult);
    } catch (error) {
      console.error("Error calculating adaptive difficulty:", error);
      res.status(500).json({ message: "Failed to calculate adaptive difficulty" });
    }
  });

  // Personalized explanation generation
  app.post("/api/questions/personalized-explanation", async (req, res) => {
    try {
      const { 
        questionId, 
        studentAnswer, 
        studentId = "demo-student", 
        isCorrect 
      } = req.body;
      
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const student = await storage.getStudent(studentId);
      const progress = await storage.getStudentProgress(studentId);
      const topic = await storage.getTopic(question.topicId);
      
      // Calculate confidence level based on recent performance
      const overallCorrect = progress.reduce((sum: number, p: Progress) => sum + (p.correctAnswers || 0), 0);
      const overallTotal = progress.reduce((sum: number, p: Progress) => sum + (p.questionsAnswered || 0), 0);
      const confidenceLevel = overallTotal > 0 ? overallCorrect / overallTotal : 0.5;

      // Basic mistake pattern analysis (could be enhanced)
      const previousMistakes: string[] = [];
      progress.forEach((p: Progress) => {
        if (p.questionsAnswered && p.correctAnswers && p.questionsAnswered > 0 && (p.correctAnswers / p.questionsAnswered) < 0.5) {
          previousMistakes.push("calculation errors"); // Simplified for now
        }
      });

      const correctOption = (question.options as string[])[question.correctAnswer];
      const explanation = await generatePersonalizedExplanation({
        question: question.question,
        studentAnswer,
        correctAnswer: correctOption,
        studentProfile: {
          ageGroup: (student?.ageGroup || topic?.ageGroup || "primary") as "pre-primary" | "primary" | "upper-primary",
          learningStyle: undefined as "visual" | "analytical" | "practical" | "creative" | undefined,
          confidenceLevel,
          previousMistakes
        },
        isCorrect
      });

      res.json({ explanation });
    } catch (error) {
      console.error("Error generating personalized explanation:", error);
      res.status(500).json({ message: "Failed to generate explanation" });
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
      console.log(`Checking badges for student: ${progressData.studentId}, found student:`, !!student);
      if (student) {
        console.log(`Student age group: ${student.ageGroup}`);
        const newBadges = await badgeSystem.checkAndAwardBadges(progressData.studentId, student.ageGroup);
        console.log(`New badges earned: ${newBadges.length}`, newBadges.map(b => b.badgeId));
        res.json({
          progress: result,
          newBadges: newBadges
        });
      } else {
        console.log('No student found, skipping badge check');
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
