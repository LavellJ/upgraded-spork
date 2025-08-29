type LessonStep =
  | { type: "read"; text: string }
  | { type: "activity"; prompt: string }
  | { type: "quiz"; questionSetId: string };

export type Lesson = {
  id: string;
  title: string;
  ageBand?: string;
  steps: LessonStep[];
};

export type Question = {
  id: string;
  type: "mc" | "open";
  q: string;
  choices?: string[];
  answer?: number;
};

export type QuestionSet = {
  id: string;
  timeLimitSec: number;
  questions: Question[];
};

// --- Validators ---
export function validateLesson(obj: any): string[] {
  const errors: string[] = [];
  if (!obj.id) errors.push("Lesson missing id");
  if (!obj.title) errors.push("Lesson missing title");
  if (!Array.isArray(obj.steps)) errors.push("Lesson steps must be an array");

  if (Array.isArray(obj.steps)) {
    obj.steps.forEach((s: any, i: number) => {
      if (!s.type) errors.push(`Step ${i} missing type`);
      if (s.type === "read" && !s.text) errors.push(`Step ${i} (read) missing text`);
      if (s.type === "activity" && !s.prompt) errors.push(`Step ${i} (activity) missing prompt`);
      if (s.type === "quiz" && !s.questionSetId) errors.push(`Step ${i} (quiz) missing questionSetId`);
    });
  }
  return errors;
}

export function validateQuestionSet(obj: any): string[] {
  const errors: string[] = [];
  if (!obj.id) errors.push("QuestionSet missing id");
  if (typeof obj.timeLimitSec !== "number") errors.push("QuestionSet missing or invalid timeLimitSec");
  if (!Array.isArray(obj.questions)) errors.push("QuestionSet questions must be an array");

  if (Array.isArray(obj.questions)) {
    obj.questions.forEach((q: any, i: number) => {
      if (!q.id) errors.push(`Question ${i} missing id`);
      if (!q.type) errors.push(`Question ${i} missing type`);
      if (!q.q) errors.push(`Question ${i} missing q`);
      if (q.type === "mc" && !Array.isArray(q.choices)) errors.push(`Question ${i} (mc) missing choices array`);
      if (q.type === "mc" && typeof q.answer !== "number") errors.push(`Question ${i} (mc) missing answer index`);
    });
  }
  return errors;
}