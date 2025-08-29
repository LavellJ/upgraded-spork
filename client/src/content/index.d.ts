declare module "./index.js" {
  import type { Lesson, QuestionSet } from "../utils/validateContent";
  export const lessons: Lesson[];
  export const questionSets: Record<string, QuestionSet>;
  export const validationErrors: string[];
}