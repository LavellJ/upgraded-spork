export const sampleLessons = [
  {
    lessonId: "math_01_addition",
    subject: "Math",
    level: "Pre-Primary",
    scoutIntro: "G'day mate! Ready to help me collect some treasure? To open the chest, we need to solve a puzzle!",
    challengeType: "multipleChoice" as const,
    challengeContent: {
      question: "What is 3 + 2?",
      options: ["4", "5", "6", "7"],
      answer: "5"
    },
    feedback: {
      correct: "Woohoo! You got it! The treasure chest is open! 🎉",
      incorrect: "Almost! Try again — here's a hint: 3 plus 2 is like counting 3, then 4, then 5!"
    },
    reward: {
      type: "visualChange",
      description: "A golden star lights up in the sky above Scout!"
    }
  },
  {
    lessonId: "english_02_vowels",
    subject: "English",
    level: "Pre-Primary",
    scoutIntro: "Hey friend, I found a secret word but some letters are missing. Can you help me finish it?",
    challengeType: "fillBlank" as const,
    challengeContent: {
      sentence: "The c_t sat on the m_t.",
      answer: ["a", "a"]
    },
    feedback: {
      correct: "Nice job! The cat sat on the mat! 🐱",
      incorrect: "Not quite! Remember, it's a little animal that says 'meow'."
    },
    reward: {
      type: "badge",
      description: "You earned the 'Word Builder' badge!"
    }
  },
  {
    lessonId: "science_03_animals",
    subject: "Science",
    level: "Pre-Primary",
    scoutIntro: "Let's help the animals find their homes! Can you match each animal to where it belongs?",
    challengeType: "dragDrop" as const,
    challengeContent: {
      pairs: [
        { item: "Fish", match: "Ocean" },
        { item: "Kangaroo", match: "Grassland" },
        { item: "Penguin", match: "Ice" }
      ]
    },
    feedback: {
      correct: "Perfect! All the animals are happy at home. 🦘🐧🐟",
      incorrect: "Hmm, one of the animals looks lost. Want to try again?"
    },
    reward: {
      type: "visualChange",
      description: "Scout builds a little bridge across the map!"
    }
  },
  {
    lessonId: "math_04_counting",
    subject: "Math", 
    level: "Pre-Primary",
    scoutIntro: "I see some colorful balloons! Let's count them together. How many balloons do you see?",
    challengeType: "multipleChoice" as const,
    challengeContent: {
      question: "Count the balloons: 🎈🎈🎈🎈🎈",
      options: ["3", "4", "5", "6"],
      answer: "5"
    },
    feedback: {
      correct: "Fantastic counting! There are 5 balloons! 🎈",
      incorrect: "Let's try counting again. Point to each balloon: 1, 2, 3, 4, 5!"
    },
    reward: {
      type: "visualChange", 
      description: "More balloons float into the sky around Scout!"
    }
  },
  {
    lessonId: "english_05_sounds",
    subject: "English",
    level: "Pre-Primary", 
    scoutIntro: "What sound does this letter make? Let's practice our letter sounds together!",
    challengeType: "multipleChoice" as const,
    challengeContent: {
      question: "What sound does the letter 'B' make?",
      options: ["Aaa", "Buh", "Cuh", "Duh"],
      answer: "Buh"
    },
    feedback: {
      correct: "Brilliant! B makes the 'Buh' sound, like in 'Ball'! ⚽",
      incorrect: "Not quite! Think about words like 'Ball' or 'Bear'. What sound do they start with?"
    },
    reward: {
      type: "badge",
      description: "You earned the 'Letter Expert' badge!"
    }
  }
];