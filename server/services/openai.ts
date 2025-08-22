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

export async function generateHint(question: string, correctAnswer: string): Promise<string> {
  const prompt = `Provide a helpful hint for this question without giving away the answer directly:

Question: ${question}
Correct Answer: ${correctAnswer}

The hint should guide the student's thinking process and help them understand the concept better.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a supportive tutor who provides gentle guidance to help students learn."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error("Failed to generate hint:", error);
    throw new Error("Failed to generate hint. Please try again.");
  }
}

export async function generateExplanation(question: string, studentAnswer: string, correctAnswer: string): Promise<string> {
  const prompt = `Provide an encouraging explanation for a student's answer:

Question: ${question}
Student's Answer: ${studentAnswer}
Correct Answer: ${correctAnswer}

If the student was correct, praise them and expand on the concept.
If incorrect, gently explain why the correct answer is right and help them understand the concept.
Keep the tone supportive and educational.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an encouraging teacher who helps students learn from both correct and incorrect answers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error("Failed to generate explanation:", error);
    throw new Error("Failed to generate explanation. Please try again.");
  }
}
