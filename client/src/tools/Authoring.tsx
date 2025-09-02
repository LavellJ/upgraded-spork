import React, { useState, useRef } from 'react';
import { PrototypeQuestionSchema, validateLessonData } from '../schema/lesson';

const cx = (...s: (string | false | undefined)[]): string => s.filter(Boolean).join(" ");

const SUBJECTS = {
  forest: { label: "Literacy", color: "#3B7D44" },
  desert: { label: "Math", color: "#C96A2B" },
  ocean: { label: "Science", color: "#3BA7B6" },
  night: { label: "HASS", color: "#404A73" },
};

// Sample prototype question for initial state
const SAMPLE_QUESTION = {
  "q": "Which letter does 'sun' start with?",
  "options": ["S", "M", "B", "T"],
  "correct": 0,
  "explain": "Sun starts with the /s/ sound, which is written as 'S'"
};

interface MCPreviewProps {
  question: {
    q: string;
    options: string[];
    correct: number;
    explain: string;
  };
}

function MCPreview({ question }: MCPreviewProps) {
  const [sel, setSel] = useState(-1);
  const [checked, setChecked] = useState(false);
  const ok = checked && sel === question.correct;

  return (
    <div className="p-4 bg-white rounded-xl border">
      <div className="text-sm text-stone-600 mb-2">Live Preview</div>
      <div className="text-lg font-bold mb-4 text-stone-800">{question.q}</div>
      
      <div className="grid grid-cols-1 gap-2 mb-4">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => { setSel(i); setChecked(false); }}
            className={cx(
              "text-left px-4 py-3 rounded-lg border bg-white hover:bg-stone-50 transition ease-out",
              sel === i && "ring-2 ring-blue-500 bg-blue-50"
            )}
          >
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <button
          disabled={sel < 0}
          onClick={() => setChecked(true)}
          className={cx(
            "px-4 py-2 rounded-lg transition ease-out font-medium",
            sel < 0 
              ? "bg-stone-200 text-stone-500 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          Check Answer
        </button>
        {checked && (
          <span className={cx("font-medium", ok ? "text-emerald-600" : "text-red-600")}>
            {ok ? "✓ Correct!" : "✗ Try again"}
          </span>
        )}
      </div>

      {checked && !ok && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm text-amber-800">
            <strong>Hint:</strong> {question.explain}
          </div>
        </div>
      )}

      {ok && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="text-sm text-emerald-800">
            <strong>Great work!</strong> This question validates correctly and would work in the app.
          </div>
        </div>
      )}
    </div>
  );
}

interface ErrorListProps {
  errors: string[];
}

function ErrorList({ errors }: ErrorListProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
      <div className="text-sm font-semibold text-red-800 mb-2">Validation Errors</div>
      <ul className="space-y-1">
        {errors.map((error, i) => (
          <li key={i} className="text-sm text-red-700 flex items-start gap-2">
            <span className="text-red-500 mt-0.5">•</span>
            <span>{error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Authoring() {
  const [jsonContent, setJsonContent] = useState(JSON.stringify(SAMPLE_QUESTION, null, 2));
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    data?: any;
  }>({ valid: true, errors: [], data: SAMPLE_QUESTION });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate JSON content
  const validateContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      const result = validateLessonData(PrototypeQuestionSchema, parsed, 'editor');
      
      if (result.success) {
        setValidationResult({ valid: true, errors: [], data: result.data });
      } else {
        setValidationResult({ valid: false, errors: result.errors, data: null });
      }
    } catch (error) {
      setValidationResult({ 
        valid: false, 
        errors: [`Invalid JSON: ${error}`], 
        data: null 
      });
    }
  };

  // Handle content changes
  const handleContentChange = (content: string) => {
    setJsonContent(content);
    validateContent(content);
  };

  // Import from file
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleContentChange(content);
      };
      reader.readAsText(file);
    }
  };

  // Export to file
  const handleExport = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prototype-question.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load sample from prototypes
  const loadSample = (biome: string, questionId: string) => {
    // This would normally load from the actual prototypes.json file
    const samples = {
      'f1': { "q": "Blend CVC: c-a-t → ?", "options": ["cat","cot","cut","cap"], "correct": 0, "explain": "Blend the /c/ /a/ /t/ sounds." },
      'd1': { "q": "5 + 3 = ?", "options": ["7","8","9","10"], "correct": 1, "explain": "Use number bonds within 10." },
      'o1': { "q": "Push/pull are…", "options": ["forces","states of matter","energies","weights"], "correct": 0, "explain": "Push/pull change motion." },
      'n1': { "q": "Map symbol '★' often means…", "options": ["school","park","capital city","lake"], "correct": 2, "explain": "Many legends use a star for capitals." }
    };
    
    const sample = samples[questionId] || SAMPLE_QUESTION;
    const formatted = JSON.stringify(sample, null, 2);
    handleContentChange(formatted);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-stone-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Content Authoring Tool</h2>
            <p className="text-sm text-stone-600 mt-1">
              Create and validate prototype questions with live preview
            </p>
          </div>
          <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            DEV ONLY
          </div>
        </div>
      </div>

      {/* Quick samples */}
      <div className="border-b bg-white p-3">
        <div className="text-sm font-medium text-stone-700 mb-2">Quick Load Samples:</div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(SUBJECTS).map(([biome, subject]) => (
            <button
              key={biome}
              onClick={() => loadSample(biome, biome[0] + '1')}
              className="px-3 py-1 text-xs rounded-full border hover:bg-stone-50 transition ease-out"
              style={{ borderColor: subject.color + '40', color: subject.color }}
            >
              {subject.label} Sample
            </button>
          ))}
        </div>
      </div>

      {/* Split pane content */}
      <div className="flex-1 flex min-h-0">
        {/* Left pane - JSON Editor */}
        <div className="w-1/2 border-r bg-white flex flex-col">
          <div className="border-b p-3 bg-stone-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-stone-800">JSON Editor</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  className="px-3 py-1 text-xs rounded-lg border bg-white hover:bg-stone-50 transition ease-out"
                >
                  📁 Import
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-1 text-xs rounded-lg border bg-white hover:bg-stone-50 transition ease-out"
                >
                  💾 Export
                </button>
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
          </div>

          <div className="flex-1 p-4">
            <textarea
              value={jsonContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full resize-none font-mono text-sm border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your JSON content here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right pane - Preview */}
        <div className="w-1/2 bg-stone-50 flex flex-col">
          <div className="border-b p-3 bg-stone-100">
            <h3 className="font-semibold text-stone-800">Live Preview & Validation</h3>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {!validationResult.valid ? (
              <ErrorList errors={validationResult.errors} />
            ) : (
              <MCPreview question={validationResult.data} />
            )}

            {/* Validation status */}
            <div className="mt-4 p-3 rounded-lg border bg-white">
              <div className="flex items-center gap-2 mb-2">
                <div className={cx(
                  "w-3 h-3 rounded-full",
                  validationResult.valid ? "bg-emerald-500" : "bg-red-500"
                )}></div>
                <span className="font-medium text-stone-800">
                  {validationResult.valid ? "Valid" : "Invalid"}
                </span>
              </div>
              <div className="text-sm text-stone-600">
                {validationResult.valid 
                  ? "This question passes schema validation and is ready for use in LearnOz."
                  : "Fix the validation errors above to see the preview."
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}