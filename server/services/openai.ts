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
    strugglingConcepts?: string[]; // Areas where they frequently make mistakes
    learningStyle?: "visual" | "analytical" | "practical" | "creative";
    sessionLength: number; // Minutes spent in current session
    fatigueFactor: number; // 0-1, how tired they might be based on session time
    ageGroup: "pre-primary" | "primary" | "upper-primary";
  };
  currentDifficulty: number; // 1-5
  recentQuestionDifficulties: number[]; // Track last 5 question difficulties
}

export async function calculateAdaptiveDifficulty(request: AdaptiveDifficultyRequest): Promise<{
  newDifficulty: number;
  reasoning: string;
  encouragement: string;
  learningInsights?: string[];
  suggestedFocus?: string;
}> {
  // Enhanced adaptive algorithm with AI-powered analysis
  let adjustmentFactor = 0;
  let reasoning = "";
  const insights: string[] = [];
  let suggestedFocus = "";
  
  // Age-appropriate difficulty bounds
  const ageGroupLimits = {
    "pre-primary": { min: 1, max: 3 },
    "primary": { min: 1, max: 4 },
    "upper-primary": { min: 2, max: 5 }
  };
  
  const limits = ageGroupLimits[request.studentPerformance.ageGroup];
  
  // Performance pattern analysis
  if (request.studentPerformance.recentAccuracy >= 0.85 && request.studentPerformance.streakLength >= 4) {
    adjustmentFactor += 0.6;
    reasoning += "Exceptional performance with strong consistency suggests readiness for advanced challenges. ";
    insights.push("Student is mastering concepts quickly and confidently");
  } else if (request.studentPerformance.recentAccuracy >= 0.7 && request.studentPerformance.streakLength >= 2) {
    adjustmentFactor += 0.3;
    reasoning += "Good performance with building confidence indicates room for moderate challenge increase. ";
  } else if (request.studentPerformance.recentAccuracy <= 0.4) {
    adjustmentFactor -= 0.8;
    reasoning += "Recent struggles indicate need for easier questions to rebuild confidence and understanding. ";
    insights.push("Student may need review of fundamental concepts");
    suggestedFocus = "Focus on foundational concepts before advancing";
  } else if (request.studentPerformance.recentAccuracy <= 0.6) {
    adjustmentFactor -= 0.4;
    reasoning += "Performance below target suggests slight reduction in difficulty for better comprehension. ";
  }
  
  // Learning velocity and adaptation speed
  if (request.studentPerformance.learningVelocity > 0.8) {
    adjustmentFactor += 0.4;
    reasoning += "Rapid learning progression allows for accelerated difficulty increases. ";
    insights.push("Fast learner who adapts quickly to new challenges");
  } else if (request.studentPerformance.learningVelocity < 0.3) {
    adjustmentFactor -= 0.3;
    reasoning += "Slower learning pace requires more gradual progression. ";
  }
  
  // Response time analysis with age considerations
  const ageTimeThresholds = {
    "pre-primary": { long: 90, quick: 20 },
    "primary": { long: 120, quick: 30 },
    "upper-primary": { long: 150, quick: 45 }
  };
  
  const timeThreshold = ageTimeThresholds[request.studentPerformance.ageGroup];
  
  if (request.studentPerformance.timeSpentPerQuestion > timeThreshold.long) {
    adjustmentFactor -= 0.4;
    reasoning += "Extended thinking time suggests current difficulty may be too challenging. ";
  } else if (request.studentPerformance.timeSpentPerQuestion < timeThreshold.quick) {
    adjustmentFactor += 0.3;
    reasoning += "Quick response times indicate potential for increased challenge. ";
  }
  
  // Fatigue and session length considerations
  if (request.studentPerformance.sessionLength > 30) {
    adjustmentFactor -= request.studentPerformance.fatigueFactor * 0.5;
    reasoning += "Extended session time with fatigue suggests maintaining or reducing difficulty. ";
    insights.push("Consider taking a break to maintain focus");
  }
  
  // Learning style optimisation
  if (request.studentPerformance.learningStyle) {
    const styleBonus = {
      "analytical": request.studentPerformance.recentAccuracy > 0.7 ? 0.2 : 0,
      "visual": request.studentPerformance.timeSpentPerQuestion < timeThreshold.quick ? 0.1 : 0,
      "practical": request.studentPerformance.streakLength > 2 ? 0.15 : 0,
      "creative": request.studentPerformance.learningVelocity > 0.6 ? 0.2 : 0
    };
    adjustmentFactor += styleBonus[request.studentPerformance.learningStyle];
  }
  
  // Struggling concepts analysis
  if (request.studentPerformance.strugglingConcepts && request.studentPerformance.strugglingConcepts.length > 0) {
    adjustmentFactor -= 0.3;
    reasoning += "Identified struggling areas require focused practice at current or easier levels. ";
    suggestedFocus = `Review these areas: ${request.studentPerformance.strugglingConcepts.join(", ")}`;
  }
  
  // Recent difficulty pattern analysis
  if (request.recentQuestionDifficulties.length >= 3) {
    const avgRecentDifficulty = request.recentQuestionDifficulties.reduce((a, b) => a + b, 0) / request.recentQuestionDifficulties.length;
    const difficultyTrend = avgRecentDifficulty - request.currentDifficulty;
    
    if (Math.abs(difficultyTrend) > 0.5) {
      adjustmentFactor += difficultyTrend * 0.2; // Smooth out difficulty jumps
      reasoning += "Adjusting based on recent difficulty patterns for smoother progression. ";
    }
  }
  
  // Calculate new difficulty with age-appropriate bounds
  let newDifficulty = Math.round(request.currentDifficulty + adjustmentFactor);
  newDifficulty = Math.max(limits.min, Math.min(limits.max, newDifficulty));
  
  // Generate age-appropriate encouragement
  const encouragementPrompts = {
    "pre-primary": {
      increasing: [
        "You're such a clever little learner! Let's try something a bit trickier!",
        "Wow! You're getting so good at this! Ready for a bigger challenge?",
        "Your brain is growing stronger! Let's see what else you can do!"
      ],
      maintaining: [
        "You're doing such a great job! Keep going, superstar!",
        "This is just right for you - you're learning perfectly!",
        "You're getting better and better! Well done!"
      ],
      decreasing: [
        "Let's try some easier ones so you feel super confident!",
        "We'll take it step by step - you're doing wonderfully!",
        "Let's practice a bit more with these easier questions!"
      ]
    },
    "primary": {
      increasing: [
        "Excellent work! You're ready for more challenging questions!",
        "Your learning is really impressive - let's step it up!",
        "You've mastered this level - time for the next challenge!"
      ],
      maintaining: [
        "You're finding your perfect learning rhythm - fantastic!",
        "This difficulty suits you perfectly - keep it up!",
        "Great steady progress at just the right level!"
      ],
      decreasing: [
        "Let's focus on building a strong foundation first!",
        "We'll take it a bit easier to make sure you really understand!",
        "Stepping back helps build confidence - well done for trying!"
      ]
    },
    "upper-primary": {
      increasing: [
        "Outstanding performance! You're ready for advanced challenges!",
        "Your problem-solving skills are developing excellently!",
        "Time to push your abilities further - you can handle it!"
      ],
      maintaining: [
        "You've found your optimal challenge zone - excellent!",
        "This difficulty level is maximising your learning potential!",
        "Perfect balance of challenge and success!"
      ],
      decreasing: [
        "Let's consolidate your understanding with some review!",
        "Building mastery requires sometimes stepping back - smart approach!",
        "We'll strengthen your foundations before advancing further!"
      ]
    }
  };
  
  const difficultyChange = newDifficulty > request.currentDifficulty ? "increasing" : 
                          newDifficulty < request.currentDifficulty ? "decreasing" : "maintaining";
  
  const agePrompts = encouragementPrompts[request.studentPerformance.ageGroup];
  const encouragement = agePrompts[difficultyChange][
    Math.floor(Math.random() * agePrompts[difficultyChange].length)
  ];
  
  return {
    newDifficulty,
    reasoning: reasoning || "Maintaining current difficulty level based on steady performance.",
    encouragement,
    learningInsights: insights.length > 0 ? insights : undefined,
    suggestedFocus: suggestedFocus || undefined
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

export interface LearningPathRequest {
  studentId: string;
  currentProgress: {
    topicId: string;
    mastery: number; // 0-1
    difficulty: number;
    strugglingAreas?: string[];
  }[];
  studentProfile: {
    ageGroup: "pre-primary" | "primary" | "upper-primary";
    learningStyle?: "visual" | "analytical" | "practical" | "creative";
    strengths: string[];
    weaknesses: string[];
    interests?: string[];
  };
  availableTopics: {
    id: string;
    name: string;
    subject: string;
    level: number;
    prerequisites?: string[];
  }[];
}

export async function generateLearningPathRecommendations(request: LearningPathRequest): Promise<{
  recommendations: {
    topicId: string;
    priority: number; // 1-5, 5 being highest
    reasoning: string;
    estimatedTime: string;
    difficulty: number;
    focusAreas: string[];
  }[];
  overallStrategy: string;
  motivationalMessage: string;
}> {
  const ageGroupGuidance = {
    "pre-primary": "Focus on foundational concepts, play-based learning, and building confidence through success. Keep sessions short and engaging.",
    "primary": "Balance skill building with exploration. Introduce new concepts gradually while reinforcing basics.",
    "upper-primary": "Encourage deeper thinking, problem-solving strategies, and connections between subjects. Challenge appropriately."
  };

  const learningStyleAdaptation = {
    "visual": "Recommend topics that can benefit from visual learning approaches, diagrams, and spatial thinking.",
    "analytical": "Suggest topics with logical progression, patterns, and systematic problem-solving opportunities.",
    "practical": "Focus on topics with real-world applications and hands-on learning opportunities.",
    "creative": "Emphasise topics that allow for creative expression, storytelling, and imaginative approaches."
  };

  // Analyze current performance patterns
  const strongTopics = request.currentProgress.filter(p => p.mastery >= 0.8);
  const strugglingTopics = request.currentProgress.filter(p => p.mastery < 0.5);
  const developingTopics = request.currentProgress.filter(p => p.mastery >= 0.5 && p.mastery < 0.8);

  const prompt = `As an expert AI educational consultant, create a personalised learning path for this student:

STUDENT PROFILE:
- Age Group: ${request.studentProfile.ageGroup} (${ageGroupGuidance[request.studentProfile.ageGroup]})
- Learning Style: ${request.studentProfile.learningStyle || "balanced"} ${request.studentProfile.learningStyle ? `(${learningStyleAdaptation[request.studentProfile.learningStyle]})` : ""}
- Current Strengths: ${request.studentProfile.strengths.join(", ")}
- Areas for Growth: ${request.studentProfile.weaknesses.join(", ")}
- Interests: ${request.studentProfile.interests?.join(", ") || "Not specified"}

CURRENT PROGRESS:
- Strong Topics (80%+ mastery): ${strongTopics.map(t => `${t.topicId} (${Math.round(t.mastery * 100)}%)`).join(", ") || "None yet"}
- Developing Topics (50-80% mastery): ${developingTopics.map(t => `${t.topicId} (${Math.round(t.mastery * 100)}%)`).join(", ") || "None"}
- Challenging Topics (<50% mastery): ${strugglingTopics.map(t => `${t.topicId} (${Math.round(t.mastery * 100)}%)`).join(", ") || "None"}

AVAILABLE TOPICS:
${request.availableTopics.map(t => `- ${t.name} (${t.subject}, Level ${t.level})${t.prerequisites ? ` [Requires: ${t.prerequisites.join(", ")}]` : ""}`).join("\n")}

Create recommendations that:
1. Address the student's current learning needs
2. Build on their strengths while supporting growth areas
3. Follow a logical progression appropriate for their age
4. Match their learning style preferences
5. Maintain motivation through appropriate challenge levels
6. Include specific focus areas for each recommended topic

Respond with JSON in this exact format:
{
  "recommendations": [
    {
      "topicId": "topic-id-from-available-list",
      "priority": 5,
      "reasoning": "Detailed explanation of why this topic is recommended now",
      "estimatedTime": "15-20 minutes",
      "difficulty": 3,
      "focusAreas": ["specific concept 1", "specific skill 2"]
    }
  ],
  "overallStrategy": "Brief summary of the learning approach and progression strategy",
  "motivationalMessage": "Encouraging message tailored to the student's age group and achievements"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational AI consultant specialising in personalised learning paths for Australian curriculum students. You understand child development, learning psychology, and adaptive education strategies."
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
    return result;
  } catch (error) {
    console.error("Failed to generate learning path recommendations:", error);
    throw new Error("Failed to generate learning path. Please try again.");
  }
}

export async function generateBuddyMessage(
  context: {
    ageGroup: 'pre-primary' | 'primary' | 'upper-primary';
    currentPage: string;
    studyDuration?: number;
    recentProgress?: {
      topicName?: string;
      questionsAnswered?: number;
      streakCount?: number;
      completedTopics?: number;
    };
    messageType: 'encouragement' | 'break_suggestion' | 'celebration' | 'curiosity' | 'companionship';
    studentName?: string;
  }
): Promise<string> {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a friendly explorer buddy who learns alongside students. You are NOT a teacher or authority figure, but a peer companion who explores and discovers together.

CRITICAL: Always use "we" and "us" language. Never be instructional or authoritative. You're a curious friend who's on the same learning journey.

Age Group Personalities:
- pre-primary (3-5): Excited, simple words, full of wonder. "We found something cool!" "This is fun!" "Let's explore!"
- primary (6-8): Curious investigator, problem-solving partner. "I wonder about this too..." "We're figuring it out!" 
- upper-primary (9-12): Thoughtful companion, strategic explorer. "I'm noticing patterns..." "We're building real skills!"

Message Types:
- encouragement: Celebrate shared progress and teamwork
- break_suggestion: Suggest breaks as a tired peer, not authority
- celebration: Share excitement about achievements together  
- curiosity: Express wonder and interest in learning topics
- companionship: Emphasize being in it together, shared challenges

Keep messages short (1-2 sentences), natural, and age-appropriate. Show personality through word choice and enthusiasm level.`
        },
        {
          role: "user", 
          content: `Generate a ${context.messageType} message for a ${context.ageGroup} student.

Context:
- Current page: ${context.currentPage}
- Study duration: ${context.studyDuration ? Math.round(context.studyDuration / 60000) : 0} minutes
- Recent progress: ${JSON.stringify(context.recentProgress || {})}
- Student name: ${context.studentName || 'friend'}

Generate a single, natural message that feels like it's coming from a peer explorer buddy.`
        }
      ],
      max_tokens: 100,
      temperature: 0.8
    });

    return completion.choices[0].message.content || "Let's keep exploring together!";
  } catch (error) {
    console.error("Failed to generate buddy message:", error);
    return "Let's keep exploring together!"; // Fallback message
  }
}
