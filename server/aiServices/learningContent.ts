import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface LearningContentRequest {
  topicId: string;
  phase: string;
  ageGroup: "pre-primary" | "primary" | "upper-primary";
  topic: string;
  subject: string;
}

export async function generateLearningContent(request: LearningContentRequest) {
  const { phase, ageGroup, topic, subject } = request;

  try {
    let contentPrompt = "";
    
    if (phase === "teach") {
      contentPrompt = `Create engaging teaching content for ${ageGroup} students learning about "${topic}" in ${subject}.

Generate a JSON response with this exact structure:
{
  "id": "unique-id",
  "phase": "teach",
  "title": "Learning About [topic name]",
  "content": {
    "title": "Let's Learn About [topic]!",
    "scoutThinkAloud": {
      "steps": [
        {
          "id": "step1",
          "text": "Scout's explanation step 1",
          "reasoning": "Why Scout is explaining this way",
          "visualCue": "🤔",
          "duration": 4
        },
        {
          "id": "step2", 
          "text": "Scout's explanation step 2",
          "reasoning": "Deeper explanation",
          "visualCue": "💡",
          "duration": 5
        },
        {
          "id": "step3",
          "text": "Scout's conclusion",
          "reasoning": "Wrap up understanding", 
          "visualCue": "✨",
          "duration": 3
        }
      ],
      "concept": "Main concept explanation",
      "example": "Simple example for the age group"
    },
    "workedExample": {
      "problem": "Example problem to demonstrate",
      "steps": [
        {
          "step": "First step explanation",
          "explanation": "Why we do this step",
          "highlight": "Key point to remember"
        },
        {
          "step": "Second step explanation", 
          "explanation": "Building on previous step",
          "highlight": "Another important concept"
        }
      ]
    },
    "keyTakeaways": [
      "Main lesson point 1",
      "Main lesson point 2", 
      "Main lesson point 3"
    ]
  }
}

Make Scout friendly, encouraging, and age-appropriate for ${ageGroup} students. Use simple language and relatable examples.`;

    } else if (phase === "try") {
      contentPrompt = `Create practice content for ${ageGroup} students to try "${topic}" in ${subject}.

Generate a JSON response with this exact structure:
{
  "id": "unique-id",
  "phase": "try", 
  "title": "Practice Time: [topic]",
  "content": {
    "title": "Let's Practice [topic]!",
    "fadedExamples": [
      {
        "id": "example1",
        "problem": "Practice problem statement",
        "steps": [
          {
            "stepText": "Complete this step: ___",
            "support": "blank",
            "answer": "expected answer",
            "hintLadder": {
              "nudge": "Gentle hint",
              "strategy": "Strategy suggestion",
              "workedStep": "Worked example",
              "reveal": "Complete answer"
            }
          },
          {
            "stepText": "Here's the next step already done for you",
            "support": "filled",
            "answer": "provided answer"
          }
        ],
        "feedback": {
          "success": "Great job! You got it right!",
          "encouragement": "Keep going, you're doing well!"
        }
      }
    ],
    "manipulatives": {
      "type": "number-line",
      "instructions": "Use this tool to help solve the problems"
    },
    "misconceptionDetector": {
      "commonErrors": [
        {
          "pattern": "common mistake pattern",
          "explanation": "Why this happens",
          "redirect": "How to think about it correctly"
        }
      ]
    }
  }
}

Focus on gradual release from support to independence for ${ageGroup} level.`;

    } else if (phase === "reflect") {
      contentPrompt = `Create reflection prompts for ${ageGroup} students after learning "${topic}" in ${subject}.

Generate a JSON response with this exact structure:
{
  "id": "unique-id", 
  "phase": "reflect",
  "title": "Thinking About Our Learning",
  "content": {
    "title": "How Did That Feel?",
    "metacognitionPrompts": [
      {
        "id": "difficulty",
        "type": "difficulty",
        "question": "How hard was this topic for you?",
        "options": ["Very easy", "Just right", "Pretty hard", "Too difficult"]
      },
      {
        "id": "strategy",
        "type": "strategy", 
        "question": "What helped you learn this best?",
        "allowText": true
      },
      {
        "id": "confidence",
        "type": "confidence",
        "question": "How confident do you feel about this topic now?",
        "options": ["Not confident", "A little confident", "Pretty confident", "Very confident"]
      }
    ],
    "selfAssessment": {
      "criteria": [
        {
          "skill": "Understanding the concept",
          "description": "I can explain the main idea",
          "levels": ["Not yet", "Getting there", "I've got it!"]
        }
      ]
    }
  }
}

Make questions age-appropriate for ${ageGroup} students with simple, clear language.`;

    } else if (phase === "create") {
      contentPrompt = `Create creative application activities for ${ageGroup} students using their "${topic}" knowledge in ${subject}.

Generate a JSON response with this exact structure:
{
  "id": "unique-id",
  "phase": "create", 
  "title": "Show What You Know!",
  "content": {
    "title": "Make Something Cool!",
    "projectMissions": [
      {
        "id": "mission1",
        "title": "Creative Project Title",
        "description": "What students will create",
        "type": "design",
        "deliverables": [
          {
            "type": "drawing",
            "prompt": "Draw or create something that shows what you learned",
            "optional": false
          },
          {
            "type": "text", 
            "prompt": "Explain your creation",
            "optional": false
          }
        ],
        "successCriteria": [
          "Shows understanding of the topic",
          "Creative and personal",
          "Clear explanation"
        ],
        "scaffolds": [
          "Think about the main idea",
          "How can you show this in your own way?",
          "What would help others understand?"
        ]
      }
    ],
    "teachBackMode": {
      "enabled": true,
      "scenario": "Pretend you're teaching Scout about this topic. How would you explain it?",
      "rubric": {
        "clarity": "Explanation is clear and easy to follow",
        "accuracy": "Information is correct",
        "creativity": "Uses creative examples or analogies"
      }
    }
  }
}

Design activities that let ${ageGroup} students apply their learning creatively and authentically.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator specializing in Australian Curriculum content for young learners. Generate engaging, age-appropriate learning content that follows evidence-based teaching practices."
        },
        {
          role: "user",
          content: contentPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    return content;

  } catch (error) {
    console.error("Error generating learning content:", error);
    
    // Return fallback content based on phase
    return getFallbackContent(phase, ageGroup, topic);
  }
}

function getFallbackContent(phase: string, ageGroup: string, topic: string) {
  const baseContent = {
    id: "fallback-" + phase,
    phase,
    title: `Learning ${topic}`
  };

  if (phase === "teach") {
    return {
      ...baseContent,
      content: {
        title: `Let's Learn About ${topic}!`,
        scoutThinkAloud: {
          steps: [
            {
              id: "step1",
              text: `Hi! I'm Scout and I'm excited to learn about ${topic} with you!`,
              reasoning: "Introducing the topic with enthusiasm",
              visualCue: "👋",
              duration: 3
            },
            {
              id: "step2", 
              text: `${topic} is really interesting because it helps us understand the world around us.`,
              reasoning: "Connecting to relevance",
              visualCue: "🤔",
              duration: 4
            },
            {
              id: "step3",
              text: `Let me show you some examples so we can explore this together!`,
              reasoning: "Moving to concrete examples",
              visualCue: "✨",
              duration: 3
            }
          ],
          concept: `${topic} is an important concept that helps us learn and grow.`,
          example: "Let me show you a simple example to get started!"
        },
        keyTakeaways: [
          `${topic} is important for learning`,
          "We can practice to get better",
          "Learning together is fun!"
        ]
      }
    };
  }

  return {
    ...baseContent,
    content: {
      title: `Working with ${topic}`,
      message: `Let's explore ${topic} together! This is a great learning opportunity for ${ageGroup} students.`
    }
  };
}