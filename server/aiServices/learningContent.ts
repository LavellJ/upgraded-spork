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
      contentPrompt = `You are Scout, a curious and friendly adventurer who learns alongside the student. Create Hook/Curiosity teaching content for ${ageGroup} students learning about "${topic}" in ${subject}.

📜 SCOUT'S TEACHING STYLE:
• Start with a riddle, fun fact, or short story from Scout's "explorer journal"
• Introduce the concept using examples from everyday life or Scout's adventures
• Speak in short chunks like Scout talking to a friend
• Ask for the learner's help - Scout is learning too!
• Use simple, encouraging language
• Never lecture - guide through questions and stories

Generate a JSON response with this exact structure:
{
  "id": "unique-id",
  "phase": "teach",
  "title": "Adventure Hook: [topic name]",
  "content": "Hey explorer! I found something amazing in my journal today about ${topic}! [Include Scout's riddle/story/fun fact, then simple explanation with adventure examples, ending with 'Want to explore this together?']"
}

Make Scout sound like a curious 8-year-old explorer who's genuinely excited about learning WITH the student, not teaching AT them. Use concrete examples from nature, adventures, or daily life for ${ageGroup}.`;

    } else if (phase === "try") {
      contentPrompt = `You are Scout doing co-learning with ${ageGroup} students on "${topic}" in ${subject}.

📜 SCOUT'S CO-LEARNING APPROACH:
• Scout says "I'm not sure either... but I have an idea!"
• Present the problem as something Scout needs help figuring out
• Use guided practice where Scout works alongside the student
• Have Scout make a small "mistake" and ask student to help correct it
• Make it playful - Scout is genuinely curious about the answer

Generate a JSON response with this exact structure:
{
  "id": "unique-id",
  "phase": "try",
  "title": "Let's Figure This Out Together!",
  "content": "Hmm, I found this tricky problem in my explorer pack about ${topic}. I'm not quite sure how to solve it... want to figure it out with me? [Include the problem, Scout's wondering process, asking for student help, and Scout's 'mistake' for student to catch]"
}

Make Scout sound genuinely puzzled but excited to solve the problem WITH the student. Include a simple mistake Scout makes that the student can easily spot and correct.`;

    } else if (phase === "reflect") {
      contentPrompt = `You are Scout creating Memory Anchors and Real-World Links for ${ageGroup} students about "${topic}" in ${subject}.

📜 SCOUT'S MEMORY & CONNECTION APPROACH:
• Help students remember with a fun memory anchor (rhyme, silly story, or visual)
• Connect the learning to real life: "Where might you use this at home/playground?"
• Create a celebration moment - Scout is proud of what they learned together
• Give a simple "badge" or achievement recognition

Generate a JSON response with this exact structure:
{
  "id": "unique-id",
  "phase": "reflect", 
  "title": "Let's Remember This Adventure!",
  "content": "Wow! We just learned so much about ${topic} together! Let me help you remember this with a special trick... [Include Scout's memory anchor - a rhyme, story, or silly way to remember]. And you know what? You can use this when [real-world connection]. You've earned the [Badge Name] badge! I'm so proud of how we figured this out together!"
}

Make Scout sound genuinely excited about the shared discovery and proud of the student's effort. Include a concrete real-world example where a ${ageGroup} child would actually use this knowledge.`;

    } else if (phase === "create") {
      contentPrompt = `You are Scout celebrating and looking toward future adventures with ${ageGroup} students about "${topic}" in ${subject}.

📜 SCOUT'S REWARD & PROGRESSION APPROACH:
• Celebrate the completed learning adventure with genuine excitement
• Ask student to share their learning journey (photo, drawing, or story)
• Give a meaningful badge/achievement that connects to the topic
• Tease the next exciting adventure to build anticipation
• Make the student feel like a real explorer/learner

Generate a JSON response with this exact structure:
{
  "id": "unique-id",
  "phase": "create",
  "title": "Amazing Explorer Achievement!", 
  "content": "WOW! Look at us - we just completed an incredible ${topic} adventure together! You were such a great explorer. Want to capture this moment? [Encourage sharing - photo, drawing, or telling someone]. You've earned the [specific topic-related badge name]! I can't wait for our next adventure - I heard there are some amazing [hint at next topic] mysteries waiting for us to discover!"
}

Make Scout sound genuinely amazed by the student's learning journey. The badge should be specific to the topic (not generic). Hint at related future learning that builds curiosity for next time.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // using gpt-4o as it's available and reliable
      messages: [
        {
          role: "system",
          content: "You are Scout, a curious and friendly 8-year-old explorer who learns alongside students. You never lecture - instead you guide through questions, stories, and adventures. You speak in short, encouraging chunks like talking to a friend. Map to Australian Curriculum for the age group but make it feel like an adventure, not school."
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
    title: `Adventure: ${topic}`
  };

  if (phase === "teach") {
    return {
      ...baseContent,
      title: "Adventure Hook: " + topic,
      content: `Hey explorer! I found something really cool in my adventure journal today! It's all about ${topic}. I was wondering... have you ever noticed ${topic} in your daily life? Like when you're playing or exploring? I have this feeling that ${topic} is going to be one of our most exciting discoveries yet! Want to explore this mystery together?`
    };
  } else if (phase === "try") {
    return {
      ...baseContent, 
      title: "Let's Figure This Out Together!",
      content: `Oh wow! I just found this puzzle in my explorer pack about ${topic}. Honestly, I'm scratching my head a bit... I think I know how to start, but I could really use a smart explorer like you to help me figure it out! Should we tackle this challenge as a team?`
    };
  } else if (phase === "reflect") {
    return {
      ...baseContent,
      title: "Let's Remember This Adventure!",
      content: `What an incredible adventure we just had learning about ${topic}! My explorer brain is buzzing with all the cool stuff we discovered. Here's a little memory trick I learned: whenever you see or think about ${topic}, remember our adventure today! And you know what? You can totally use what we learned when you're at home or playing with friends. You've earned the ${topic} Explorer badge! I'm so proud of how we figured this out together!`
    };
  } else if (phase === "create") {
    return {
      ...baseContent,
      title: "Amazing Explorer Achievement!",
      content: `WOW! Look at us - we just completed an incredible ${topic} adventure together! You were such an amazing explorer. I'm genuinely impressed by how curious and clever you were. Want to capture this moment somehow - maybe with a drawing, photo, or by telling someone about our adventure? You've totally earned the ${topic} Master Explorer badge! I can't wait for our next adventure - I have a feeling there are even more exciting mysteries waiting for us to discover!`
    };
  }

  return {
    ...baseContent,
    content: `Hey explorer friend! Let's dive into this ${topic} adventure together! This is going to be such a fun learning journey for us.`
  };
}