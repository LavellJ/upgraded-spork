import { useState } from "react";
import { questionSets } from "../content/index.js";
import QuestionCard from "../components/QuestionCard";
import { validateLesson, validateQuestionSet } from "../utils/validateContent";

export default function LessonRunner({
  lesson,
  onDone,
}: {
  lesson: { id: string; title: string; steps: any[] };
  onDone: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = lesson.steps[stepIndex];

  function next() {
    const hasMore = stepIndex + 1 < lesson.steps.length;
    if (hasMore) setStepIndex((i) => i + 1);
    else onDone();
  }

  if (!step) return null;

  if (step.type === "read") {
    return (
      <div style={styles.block}>
        <p style={styles.text}>{step.text}</p>
        <button style={styles.btn} onClick={next}>Next</button>
      </div>
    );
  }

  if (step.type === "activity") {
    return (
      <div style={styles.block}>
        <p style={styles.text}><strong>Activity:</strong> {step.prompt}</p>
        <button style={styles.btn} onClick={next}>Done</button>
      </div>
    );
  }

  if (step.type === "quiz") {
    const qs = questionSets[step.questionSetId];
    return (
      <div style={styles.block}>
        <QuestionCard
          questionSet={qs}
          onComplete={(res) => {
            alert(`Quiz complete! Correct: ${res.correct}/${res.total}`);
            next();
          }}
        />
      </div>
    );
  }

  return null;
}

const styles = {
  block: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 520 },
  text: { fontSize: 20 },
  btn: { alignSelf: "flex-start", padding: "10px 16px", borderRadius: 12, border: "1px solid #ccc" },
};