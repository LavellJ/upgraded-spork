import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateQuestions, generateSmartHint, generatePersonalizedExplanation, calculateAdaptiveDifficulty, generateLearningPathRecommendations, generateBuddyMessage } from "./services/openai";
import { badgeSystem, BADGE_DEFINITIONS } from "./badgeSystem";
import { 
  insertStudentSchema, 
  insertProgressSchema, 
  insertPomodoroSessionSchema,
  insertParentSchema,
  insertParentControlsSchema,
  type Question,
  type Progress
} from "@shared/schema";
import { z } from "zod";
import { 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  getSessionExpiry, 
  requireParentAuth, 
  getCurrentParent,
  logParentActivity
} from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Parent Authentication Routes
  app.post("/api/parents/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      // Check if parent already exists
      const existingParent = await storage.getParentByEmail(email);
      if (existingParent) {
        return res.status(400).json({ error: "Parent already exists with this email" });
      }
      
      // Hash password and create parent
      const hashedPassword = await hashPassword(password);
      const parentData = insertParentSchema.parse({ 
        name, 
        email, 
        password: hashedPassword 
      });
      
      const parent = await storage.createParent(parentData);
      
      // Create session  
      const sessionToken = generateSessionToken();
      await storage.createParentSession({
        parentId: parent.id,
        sessionToken,
        expiresAt: getSessionExpiry()
      });
      
      // Log signup activity
      await logParentActivity(parent.id, "account_created");
      
      // Return parent info (without password) and session
      const { password: _, ...safeParent } = parent;
      res.json({ 
        parent: safeParent, 
        sessionToken,
        message: "Parent account created successfully" 
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/parents/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const parent = await storage.getParentByEmail(email);
      if (!parent) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      const isValidPassword = await verifyPassword(password, parent.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Create new session
      const sessionToken = generateSessionToken();
      await storage.createParentSession({
        parentId: parent.id,
        sessionToken,
        expiresAt: getSessionExpiry()
      });
      
      // Log login activity  
      await logParentActivity(parent.id, "logged_in");
      
      // Return parent info (without password) and session
      const { password: _, ...safeParent } = parent;
      res.json({ 
        parent: safeParent, 
        sessionToken,
        message: "Login successful" 
      });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/parents/logout", requireParentAuth, async (req: any, res) => {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      if (sessionToken) {
        await storage.deleteParentSession(sessionToken);
      }
      
      // Log logout activity
      await logParentActivity(req.parentId, "logged_out");
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Parent Dashboard Routes
  app.get("/api/parents/me", requireParentAuth, async (req: any, res) => {
    try {
      const parent = await getCurrentParent(req);
      const { password: _, ...safeParent } = parent;
      res.json(safeParent);
    } catch (error) {
      console.error("Get parent error:", error);
      res.status(500).json({ error: "Failed to get parent data" });
    }
  });

  app.get("/api/parents/children", requireParentAuth, async (req: any, res) => {
    try {
      const children = await storage.getStudentsByParent(req.parentId);
      await logParentActivity(req.parentId, "viewed_children_list");
      res.json(children);
    } catch (error) {
      console.error("Get children error:", error);
      res.status(500).json({ error: "Failed to get children" });
    }
  });

  app.post("/api/parents/children", requireParentAuth, async (req: any, res) => {
    try {
      const childData = insertStudentSchema.parse({
        ...req.body,
        parentId: req.parentId
      });
      
      const child = await storage.createStudent(childData);
      
      // Create default parent controls for the new child
      await storage.createParentControls({
        parentId: req.parentId,
        studentId: child.id,
        dailyTimeLimit: 60,
        allowedSubjects: ["mathematics", "literacy", "science"],
        blockedTopics: [],
        requiresApproval: false,
        pomodoroEnabled: true,
        reportsEnabled: true
      });
      
      await logParentActivity(req.parentId, "added_child", child.id, { childName: child.name });
      
      res.json(child);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid child data", details: error.errors });
      }
      console.error("Add child error:", error);
      res.status(500).json({ error: "Failed to add child" });
    }
  });

  // Parent Controls Routes
  app.get("/api/parents/controls/:studentId", requireParentAuth, async (req: any, res) => {
    try {
      const controls = await storage.getParentControls(req.parentId, req.params.studentId);
      if (!controls) {
        return res.status(404).json({ error: "Controls not found" });
      }
      
      await logParentActivity(req.parentId, "viewed_controls", req.params.studentId);
      res.json(controls);
    } catch (error) {
      console.error("Get controls error:", error);
      res.status(500).json({ error: "Failed to get controls" });
    }
  });

  app.put("/api/parents/controls/:studentId", requireParentAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const controls = await storage.updateParentControls(req.parentId, req.params.studentId, updates);
      
      await logParentActivity(req.parentId, "updated_controls", req.params.studentId, updates);
      res.json(controls);
    } catch (error) {
      console.error("Update controls error:", error);
      res.status(500).json({ error: "Failed to update controls" });
    }
  });

  // Parent Activity Log Route
  app.get("/api/parents/activity", requireParentAuth, async (req: any, res) => {
    try {
      const activities = await storage.getParentActivityLog(req.parentId);
      res.json(activities);
    } catch (error) {
      console.error("Get activity log error:", error);
      res.status(500).json({ error: "Failed to get activity log" });
    }
  });

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
      console.error("Request body was:", req.body);
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

      // Enhanced performance analysis
      const student = await storage.getStudent(studentId);
      const topic = await storage.getTopic(topicId);
      const recentAccuracy = (topicProgress.correctAnswers || 0) / (topicProgress.questionsAnswered || 1);
      const overallCorrect = progress.reduce((sum: number, p: Progress) => sum + (p.correctAnswers || 0), 0);
      const overallTotal = progress.reduce((sum: number, p: Progress) => sum + (p.questionsAnswered || 0), 0);
      
      // Calculate learning velocity based on recent progress trend
      const recentSessions = progress.filter(p => p.lastStudied && 
        new Date(p.lastStudied).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last week
      );
      const avgRecentAccuracy = recentSessions.length > 0 ? 
        recentSessions.reduce((sum, p) => sum + ((p.correctAnswers || 0) / (p.questionsAnswered || 1)), 0) / recentSessions.length :
        recentAccuracy;
      
      const learningVelocity = Math.min(1, Math.max(0, 
        avgRecentAccuracy > recentAccuracy ? 0.8 : 
        avgRecentAccuracy === recentAccuracy ? 0.6 : 0.4
      ));
      
      // Identify struggling concepts
      const strugglingConcepts: string[] = [];
      const allTopics = await storage.getAllTopics();
      progress.forEach((p: Progress) => {
        if (p.questionsAnswered && p.correctAnswers && p.questionsAnswered >= 3 && 
            (p.correctAnswers / p.questionsAnswered) < 0.5) {
          const topicInfo = allTopics.find(t => t.id === p.topicId);
          if (topicInfo) strugglingConcepts.push(topicInfo.name);
        }
      });
      
      // Calculate session metrics (estimated)
      const sessionStart = Date.now() - (30 * 60 * 1000); // Assume 30 min session
      const sessionLength = 30; // minutes
      const fatigueFactor = Math.min(1, sessionLength / 45); // More tired after 45 min
      
      // Get recent question difficulties (simplified - would need tracking)
      const recentQuestionDifficulties = [3, 3, 3]; // Default to moderate
      
      const difficultyResult = await calculateAdaptiveDifficulty({
        topicId,
        studentPerformance: {
          recentAccuracy,
          topicMastery: recentAccuracy,
          learningVelocity,
          streakLength: topicProgress.currentStreak || 0,
          timeSpentPerQuestion: 60, // Default, could be tracked more precisely
          strugglingConcepts,
          learningStyle: undefined, // Could be determined through assessment
          sessionLength,
          fatigueFactor,
          ageGroup: (student?.ageGroup || topic?.ageGroup || "primary") as "pre-primary" | "primary" | "upper-primary"
        },
        currentDifficulty: 3, // Default current difficulty
        recentQuestionDifficulties
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

  // Learning path recommendations
  app.post("/api/learning-path/recommendations", async (req, res) => {
    try {
      const { studentId = "demo-student" } = req.body;
      
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const progress = await storage.getStudentProgress(studentId);
      const allTopics = await storage.getAllTopics();
      
      // Calculate mastery for each topic the student has attempted
      const currentProgress = progress.map((p: Progress) => {
        const topic = allTopics.find(t => t.id === p.topicId);
        const mastery = (p.questionsAnswered && p.questionsAnswered > 0) ? 
          (p.correctAnswers || 0) / p.questionsAnswered : 0;
        
        const strugglingAreas: string[] = [];
        if (mastery < 0.5 && topic) {
          strugglingAreas.push(topic.subject);
        }
        
        return {
          topicId: p.topicId,
          mastery,
          difficulty: 3, // Default difficulty, could be tracked
          strugglingAreas
        };
      });
      
      // Identify strengths and weaknesses based on performance
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      const subjectPerformance = new Map();
      progress.forEach((p: Progress) => {
        const topic = allTopics.find(t => t.id === p.topicId);
        if (topic && p.questionsAnswered && p.questionsAnswered > 0) {
          const accuracy = (p.correctAnswers || 0) / p.questionsAnswered;
          const current = subjectPerformance.get(topic.subject) || { total: 0, count: 0 };
          current.total += accuracy;
          current.count += 1;
          subjectPerformance.set(topic.subject, current);
        }
      });
      
      subjectPerformance.forEach((perf, subject) => {
        const avgAccuracy = perf.total / perf.count;
        if (avgAccuracy >= 0.75) {
          strengths.push(subject);
        } else if (avgAccuracy < 0.5) {
          weaknesses.push(subject);
        }
      });
      
      // If no clear strengths/weaknesses, provide defaults
      if (strengths.length === 0) strengths.push("problem-solving", "curiosity");
      if (weaknesses.length === 0) weaknesses.push("needs more practice");
      
      // Available topics for recommendations (filter out already mastered ones)
      const masteredTopicIds = currentProgress.filter(p => p.mastery >= 0.9).map(p => p.topicId);
      const availableTopics = allTopics
        .filter(topic => !masteredTopicIds.includes(topic.id))
        .map(topic => ({
          id: topic.id,
          name: topic.name,
          subject: topic.subject,
          level: topic.level,
          prerequisites: [] // Could be enhanced with actual prerequisites
        }));
      
      const recommendations = await generateLearningPathRecommendations({
        studentId,
        currentProgress,
        studentProfile: {
          ageGroup: student.ageGroup as "pre-primary" | "primary" | "upper-primary",
          learningStyle: undefined, // Could be determined through assessment
          strengths,
          weaknesses,
          interests: ["science", "nature"] // Could be tracked from user preferences
        },
        availableTopics
      });
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating learning path recommendations:", error);
      res.status(500).json({ message: "Failed to generate learning path recommendations" });
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

  // Explorer Buddy Messages
  app.post("/api/buddy/message", async (req, res) => {
    try {
      const {
        ageGroup,
        currentPage,
        studyDuration,
        recentProgress,
        messageType,
        studentName = "friend"
      } = req.body;

      if (!ageGroup || !currentPage || !messageType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Enhanced context for more intelligent responses
      const enhancedContext = {
        ageGroup,
        currentPage,
        studyDuration,
        recentProgress: {
          ...recentProgress,
          // Add calculated metrics for smarter responses
          averageAccuracy: recentProgress?.questionsAnswered > 0 ? 
            (recentProgress?.correctAnswers || 0) / recentProgress.questionsAnswered : 0,
          isOnStreak: (recentProgress?.streakCount || 0) > 2,
          needsEncouragement: (recentProgress?.questionsAnswered || 0) > 5 && 
            ((recentProgress?.correctAnswers || 0) / recentProgress.questionsAnswered) < 0.6
        },
        messageType,
        timeContext: {
          studyingTooLong: studyDuration > 25 * 60 * 1000, // 25+ minutes
          justStarted: studyDuration < 5 * 60 * 1000, // Less than 5 minutes
          inFocusZone: studyDuration >= 5 * 60 * 1000 && studyDuration <= 25 * 60 * 1000
        },
        pageContext: {
          isLearning: currentPage.includes('/learning') || currentPage === '/learning',
          isDashboard: currentPage === '/dashboard' || currentPage === '/',
          isOnboarding: currentPage === '/onboarding',
          isProgress: currentPage === '/progress'
        },
        studentName
      };

      const message = await generateBuddyMessage(enhancedContext);
      res.json({ message });
    } catch (error) {
      console.error("Error generating buddy message:", error);
      
      // Enhanced fallback messages
      const fallbackMessages = {
        celebration: `Amazing work, ${studentName}! You're doing fantastic! 🌟`,
        encouragement: `Keep going, ${studentName}! I believe in you! 💪`,
        break_suggestion: `How about a quick break, ${studentName}? Even explorers need rest! 🌿`,
        curiosity: `I wonder what we'll discover next, ${studentName}! 🔍`,
        companionship: `I'm here with you, ${studentName}! Let's learn together! 🤝`
      };
      
      const fallbackMessage = fallbackMessages[messageType] || 
        `Hey ${studentName}! Ready for our next adventure? 🚀`;
      
      res.json({ message: fallbackMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
