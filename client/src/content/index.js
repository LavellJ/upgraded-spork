// src/content/index.js
// Auto-validate lessons & quizzes when loading content
import { validateLesson, validateQuestionSet } from "../utils/validateContent";

// ---- Import all lesson JSON ----
import lessonAnimals001 from "./lessons/animals-001.json";
import lessonTravel001 from "./lessons/travel-001.json";
import lessonNumbers001 from "./lessons/numbers-001.json";
import lessonOcean001 from "./lessons/ocean-001.json";
import lessonShapes001 from "./lessons/shapes-001.json";
import lessonPhonics001 from "./lessons/phonics-001.json";

// ---- Import all question set JSON ----
import qsAnimals001 from "./question_sets/animals-001-quizA.json";
import qsTravel001 from "./question_sets/travel-001-quizA.json";
import qsNumbers001 from "./question_sets/numbers-001-quizA.json";
import qsOcean001 from "./question_sets/ocean-001-quizA.json";
import qsShapes001 from "./question_sets/shapes-001-quizA.json";
import qsPhonics001 from "./question_sets/phonics-001-quizA.json";

// ---- Collect validation errors for UI banner ----
const contentErrors = [];

// ---- Validators (soft-fail: log and skip bad files) ----
function vetLessons(rawList) {
  const good = [];
  for (const l of rawList) {
    const errs = validateLesson(l);
    if (errs.length) {
      const msg = `❌ Lesson invalid (${l?.id ?? "unknown"}): ${errs.join(", ")}`;
      console.error(msg);
      contentErrors.push(msg);
      continue;
    }
    good.push(l);
  }
  return good;
}

function vetQuestionSets(rawMap) {
  const good = {};
  for (const qs of Object.values(rawMap)) {
    const errs = validateQuestionSet(qs);
    if (errs.length) {
      const msg = `❌ QuestionSet invalid (${qs?.id ?? "unknown"}): ${errs.join(", ")}`;
      console.error(msg);
      contentErrors.push(msg);
      continue;
    }
    good[qs.id] = qs;
  }
  return good;
}

// ---- Build raw collections ----
const rawLessons = [
  lessonAnimals001,
  lessonTravel001,
  lessonNumbers001,
  lessonOcean001,
  lessonShapes001,
  lessonPhonics001,
];

const rawQuestionSets = {
  [qsAnimals001.id]: qsAnimals001,
  [qsTravel001.id]: qsTravel001,
  [qsNumbers001.id]: qsNumbers001,
  [qsOcean001.id]: qsOcean001,
  [qsShapes001.id]: qsShapes001,
  [qsPhonics001.id]: qsPhonics001,
};

// ---- Export vetted collections + errors ----
export const lessons = vetLessons(rawLessons);
export const questionSets = vetQuestionSets(rawQuestionSets);
export const validationErrors = contentErrors;

// ---- Summary log ----
console.info(
  `✅ Content loaded: ${lessons.length} lessons, ${Object.keys(questionSets).length} question sets`
);