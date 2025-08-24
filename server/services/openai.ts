import OpenAI from "openai";
import type { Question } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface QuestionGenerationRequest {
  topic: string;
  subject: string;
  ageGroup: "pre-primary" | "primary" | "upper-primary";
  difficulty: number; // 1-5
  count: number;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
}

export async function generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
  const ageGroupDescriptions = {
    "pre-primary": "ages 3-5, foundation concepts with simple language",
    "primary": "ages 6-8, basic curriculum concepts",
    "upper-primary": "ages 9-12, more complex problem-solving"
  };

  const difficultyDescriptions = {
    1: "Very basic, introductory level",
    2: "Basic understanding required",
    3: "Moderate complexity, standard level",
    4: "Above average difficulty",
    5: "Advanced, challenging concepts"
  };

  const prompt = `Generate ${request.count} multiple choice questions for the Australian ${request.subject} curriculum.

Topic: ${request.topic}
Age Group: ${ageGroupDescriptions[request.ageGroup]}
Difficulty: ${difficultyDescriptions[request.difficulty as keyof typeof difficultyDescriptions]}

Requirements:
- Questions must align with Australian curriculum standards
- Age-appropriate language and concepts
- 4 multiple choice options per question
- Clear, detailed explanations for correct answers
- Practical, real-world contexts where possible
- Progressive difficulty within the set

Respond with JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct",
      "difficulty": ${request.difficulty}
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Australian curriculum educator specializing in creating engaging, age-appropriate educational content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result.questions;
  } catch (error) {
    console.error("Failed to generate questions:", error);
    throw new Error("Failed to generate questions. Please check your OpenAI API key and try again.");
  }
}

export interface SmartHintRequest {
  question: string;
  correctAnswer: string;
  studentPerformance: {
    ageGroup: "pre-primary" | "primary" | "upper-primary";
    topicProgress: number; // 0-1, how well they've done in this topic
    overallAccuracy: number; // 0-1, overall performance
    strugglingAreas: string[]; // Areas where they frequently get wrong answers
    learningStyle?: "visual" | "analytical" | "practical" | "creative";
  };
  previousAttempts?: string[]; // Previous incorrect answers to this question
}

export async function generateSmartHint(request: SmartHintRequest): Promise<string> {
  const ageGroupGuidance = {
    "pre-primary": "Use very simple language, visual concepts, and relate to things they know (toys, family, animals). Keep it encouraging and fun.",
    "primary": "Use clear explanations with examples from their world (school, home, friends). Break down concepts step by step.",
    "upper-primary": "Provide deeper thinking prompts, encourage problem-solving strategies, and connect to real-world applications."
  };

  const learningStyleGuidance = {
    "visual": "Use spatial descriptions, visual analogies, and encourage them to picture or draw the concept.",
    "analytical": "Provide logical steps, patterns, and systematic approaches to solve the problem.",
    "practical": "Give real-world examples and hands-on approaches they can relate to.",
    "creative": "Use storytelling, imagination, and creative connections to help them understand."
  };

  const performanceContext = request.studentPerformance.overallAccuracy < 0.5 ? 
    "This student is still building confidence. Provide extra encouragement and break down the concept into smaller, manageable steps." :
    request.studentPerformance.overallAccuracy > 0.8 ?
    "This student is performing well. You can provide slightly more challenging hints that encourage deeper thinking." :
    "This student is making good progress. Provide balanced support that builds on their current understanding.";

  const strugglingContext = request.studentPerformance.strugglingAreas.length > 0 ?
    `The student has shown difficulty with: ${request.studentPerformance.strugglingAreas.join(", ")}. Keep this in mind when crafting your hint.` : "";

  const previousAttemptsContext = request.previousAttempts && request.previousAttempts.length > 0 ?
    `The student previously tried these incorrect answers: ${request.previousAttempts.join(", ")}. Help them understand why these weren't right and guide them toward the correct thinking.` : "";

  const prompt = `You are an intelligent AI tutor providing a personalized hint. Adapt your response to this specific student:

QUESTION: ${request.question}
CORRECT ANSWER: ${request.correctAnswer}

STUDENT PROFILE:
- Age Group: ${request.studentPerformance.ageGroup} (${ageGroupGuidance[request.studentPerformance.ageGroup]})
- Learning Style: ${request.studentPerformance.learningStyle || "balanced"} ${request.studentPerformance.learningStyle ? `(${learningStyleGuidance[request.studentPerformance.learningStyle]})` : ""}
- Topic Progress: ${Math.round(request.studentPerformance.topicProgress * 100)}% mastery in this topic
- Overall Performance: ${Math.round(request.studentPerformance.overallAccuracy * 100)}% accuracy
${strugglingContext}
${previousAttemptsContext}

GUIDANCE: ${performanceContext}

Provide a hint that:
1. Doesn't give away the answer directly
2. Guides their thinking process
3. Is perfectly tailored to their age, performance level, and learning style
4. Builds their confidence while challenging them appropriately
5. Uses Australian spellings and cultural references where relevant`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert AI tutor who personalizes learning for each individual student. You understand child development, learning psychology, and the Australian curriculum."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error("Failed to generate smart hint:", error);
    throw new Error("Failed to generate hint. Please try again.");
  }
}

export interface AdaptiveDifficultyRequest {
  topicId: string;
  studentPerformance: {
    recentAccuracy: number; // Accuracy in last 5-10 questions
    topicMastery: number; // 0-1, overall mastery of this topic
    learningVelocity: number; // How quickly they're improving (0-1)
    streakLength: number; // Current correct answer streak
    timeSpentPerQuestion: number; // Average time in seconds
  };
  currentDifficulty: number; // 1-5
}

export async function calculateAdaptiveDifficulty(request: AdaptiveDifficultyRequest): Promise<{
  newDifficulty: number;
  reasoning: string;
  encouragement: string;
}> {
  // Advanced adaptive algorithm
  let adjustmentFactor = 0;
  let reasoning = "";
  
  // Performance-based adjustments
  if (request.studentPerformance.recentAccuracy >= 0.8 && request.studentPerformance.streakLength >= 3) {
    adjustmentFactor += 0.5; // Increase difficulty
    reasoning += "Consistent high performance suggests readiness for more challenge. ";
  } else if (request.studentPerformance.recentAccuracy <= 0.4) {
    adjustmentFactor -= 0.7; // Decrease difficulty
    reasoning += "Recent struggles indicate need for easier questions to build confidence. ";
  }
  
  // Learning velocity considerations
  if (request.studentPerformance.learningVelocity > 0.7) {
    adjustmentFactor += 0.3; // Faster learners can handle more challenge
    reasoning += "Fast learning pace allows for accelerated progression. ";
  }
  
  // Time-based adjustments
  if (request.studentPerformance.timeSpentPerQuestion > 120) { // More than 2 minutes
    adjustmentFactor -= 0.3; // Too much thinking time suggests difficulty too high
    reasoning += "Lengthy question times suggest current difficulty may be too high. ";
  } else if (request.studentPerformance.timeSpentPerQuestion < 30) { // Less than 30 seconds
    adjustmentFactor += 0.2; // Very quick answers might mean too easy
    reasoning += "Quick answer times suggest room for increased challenge. ";
  }
  
  // Calculate new difficulty (clamped between 1-5)
  const newDifficulty = Math.max(1, Math.min(5, Math.round(request.currentDifficulty + adjustmentFactor)));
  
  // Generate encouragement based on performance
  const encouragementPrompts = {
    increasing: [
      "You're doing brilliantly! Let's try something a bit more challenging.",
      "Amazing progress! Ready for the next level?",
      "Your hard work is paying off - time to stretch those brain muscles!"
    ],
    maintaining: [
      "You're finding your perfect learning pace - keep it up!",
      "This difficulty level is working well for you!",
      "Great steady progress at just the right challenge level!"
    ],
    decreasing: [
      "Let's take a step back and make sure you feel confident.",
      "Sometimes the best learning happens when we slow down a little.",
      "Building strong foundations with easier questions first!"
    ]
  };
  
  const difficultyChange = newDifficulty > request.currentDifficulty ? "increasing" : 
                          newDifficulty < request.currentDifficulty ? "decreasing" : "maintaining";
  
  const encouragement = encouragementPrompts[difficultyChange][
    Math.floor(Math.random() * encouragementPrompts[difficultyChange].length)
  ];
  
  return {
    newDifficulty,
    reasoning: reasoning || "Maintaining current difficulty level based on steady performance.",
    encouragement
  };
}

export interface PersonalizedExplanationRequest {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  studentProfile: {
    ageGroup: "pre-primary" | "primary" | "upper-primary";
    learningStyle?: "visual" | "analytical" | "practical" | "creative";
    confidenceLevel: number; // 0-1, based on recent performance
    previousMistakes: string[]; // Common mistake patterns
  };
  isCorrect: boolean;
}

export async function generatePersonalizedExplanation(request: PersonalizedExplanationRequest): Promise<string> {
  const ageGroupTone = {
    "pre-primary": "Use very simple words, lots of encouragement, and relate to things they love (animals, toys, family). Be extra celebratory for correct answers.",
    "primary": "Use clear, friendly language with practical examples from their daily life. Balance praise with gentle guidance.",
    "upper-primary": "Use more sophisticated language while remaining encouraging. Connect to their interests and provide deeper understanding."
  };

  const learningStyleApproach = {
    "visual": "Use visual metaphors, spatial descriptions, and encourage them to picture the concept in their mind.",
    "analytical": "Provide logical reasoning, step-by-step breakdowns, and systematic approaches.",
    "practical": "Give real-world applications, hands-on examples, and practical connections.",
    "creative": "Use imaginative scenarios, storytelling elements, and creative analogies."
  };

  const confidenceBoost = request.studentProfile.confidenceLevel < 0.5 ? 
    "This student needs extra confidence building. Be particularly encouraging and emphasize their progress." :
    request.studentProfile.confidenceLevel > 0.8 ?
    "This confident student can handle slightly more challenging explanations that push their thinking further." :
    "This student has moderate confidence. Provide balanced encouragement with clear explanations.";

  const mistakePatternContext = request.studentProfile.previousMistakes.length > 0 ?
    `The student often makes these types of mistakes: ${request.studentProfile.previousMistakes.join(", ")}. Address these patterns if relevant.` : "";

  const prompt = `Create a personalized explanation for this student's answer:

QUESTION: ${request.question}
STUDENT'S ANSWER: ${request.studentAnswer}
CORRECT ANSWER: ${request.correctAnswer}
RESULT: ${request.isCorrect ? "CORRECT" : "INCORRECT"}

STUDENT PROFILE:
- Age Group: ${request.studentProfile.ageGroup} (${ageGroupTone[request.studentProfile.ageGroup]})
- Learning Style: ${request.studentProfile.learningStyle || "balanced"} ${request.studentProfile.learningStyle ? `(${learningStyleApproach[request.studentProfile.learningStyle]})` : ""}
- Confidence Level: ${Math.round(request.studentProfile.confidenceLevel * 100)}% (${confidenceBoost})
${mistakePatternContext}

Create an explanation that:
1. ${request.isCorrect ? "Celebrates their success and expands their understanding" : "Gently corrects while maintaining confidence"}
2. Matches their age group and learning style perfectly
3. Builds on their existing knowledge
4. ${request.isCorrect ? "Challenges them to think deeper" : "Helps them understand why the correct answer makes sense"}
5. Uses encouraging, supportive language throughout
6. Uses Australian spellings and cultural references where appropriate

Keep it concise but impactful - this explanation will shape how they feel about learning!`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational psychologist and AI tutor who creates personalized learning experiences that boost confidence and accelerate learning for each individual child."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error("Failed to generate personalized explanation:", error);
    throw new Error("Failed to generate explanation. Please try again.");
  }
}
