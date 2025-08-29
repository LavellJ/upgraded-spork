import { useState } from "react";

type MCQ = { id: string; type: "mc"; q: string; choices: string[]; answer: number };
type OpenQ = { id: string; type: "open"; q: string };
type Question = MCQ | OpenQ;

export default function QuestionCard({
  questionSet,
  onComplete,
}: {
  questionSet: { id: string; timeLimitSec: number; questions: Question[] };
  onComplete: (res: { total: number; correct: number }) => void;
}) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const q = questionSet.questions[index];

  function next(correct = false) {
    if (correct) setCorrectCount((c) => c + 1);
    if (index + 1 < questionSet.questions.length) {
      setIndex((i) => i + 1);
    } else {
      onComplete({
        total: questionSet.questions.length,
        correct: correctCount + (correct ? 1 : 0),
      });
    }
  }

  if (!q) return null;

  if (q.type === "mc") {
    return (
      <div style={styles.card}>
        <div style={styles.q}>{q.q}</div>
        <div style={styles.choices}>
          {q.choices.map((c, i) => (
            <button key={i} style={styles.choiceBtn} onClick={() => next(i === q.answer)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.type === "open") {
    return (
      <div style={styles.card}>
        <div style={styles.q}>{q.q}</div>
        <input style={styles.input} placeholder="Type your answer" />
        <button style={styles.choiceBtn} onClick={() => next(false)}>Next</button>
      </div>
    );
  }

  return null;
}

const styles = {
  card: { padding: 16, borderRadius: 16, border: "1px solid #ddd", maxWidth: 480 },
  q: { fontSize: 20, marginBottom: 12 as const },
  choices: { display: "grid", gap: 8 },
  choiceBtn: { padding: "10px 14px", borderRadius: 12, border: "1px solid #ccc", textAlign: "left" },
  input: { padding: 10, borderRadius: 12, border: "1px solid #ccc", marginBottom: 8, width: "100%" },
};