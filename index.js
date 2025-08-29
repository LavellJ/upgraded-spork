import lessonAnimals001 from "./lessons/animals-001.json";
import qsAnimals001 from "./question_sets/animals-001-quizA.json";

import lessonTravel001 from "./lessons/travel-001.json";
import qsTravel001 from "./question_sets/travel-001-quizA.json";

import lessonNumbers001 from "./lessons/numbers-001.json";
import qsNumbers001 from "./question_sets/numbers-001-quizA.json";

import lessonOcean001 from "./lessons/ocean-001.json";
import qsOcean001 from "./question_sets/ocean-001-quizA.json";

import lessonShapes001 from "./lessons/shapes-001.json";
import qsShapes001 from "./question_sets/shapes-001-quizA.json";

import lessonPhonics001 from "./lessons/phonics-001.json";
import qsPhonics001 from "./question_sets/phonics-001-quizA.json";

export const lessons = [
  lessonAnimals001,
  lessonTravel001,
  lessonNumbers001,
  lessonOcean001,
  lessonShapes001,
  lessonPhonics001,
];

export const questionSets = {
  [qsAnimals001.id]: qsAnimals001,
  [qsTravel001.id]: qsTravel001,
  [qsNumbers001.id]: qsNumbers001,
  [qsOcean001.id]: qsOcean001,
  [qsShapes001.id]: qsShapes001,
  [qsPhonics001.id]: qsPhonics001,
};