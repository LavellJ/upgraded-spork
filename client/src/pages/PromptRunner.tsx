import React, { useState, useMemo } from 'react';
import { loadPrompts, type PromptFile } from '@/lib/loadPrompts';
import { CopyButton } from '@/components/CopyButton';

export function PromptRunner() {
  const [searchTerm, setSearchTerm] = useState('');
  const prompts = useMemo(() => loadPrompts(), []);

  const filteredPrompts = useMemo(() => {
    if (!searchTerm.trim()) return prompts;
    
    const term = searchTerm.toLowerCase();
    return prompts.filter(prompt => 
      prompt.name.toLowerCase().includes(term) || 
      prompt.text.toLowerCase().includes(term)
    );
  }, [prompts, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Prompt Runner</h1>
        
        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompts..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          {filteredPrompts.length} of {prompts.length} prompts
        </p>

        {/* Prompt Cards */}
        <div className="space-y-6">
          {filteredPrompts.map((prompt) => (
            <div key={prompt.path} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{prompt.name}</h2>
                <CopyButton text={prompt.text} />
              </div>
              <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                {prompt.text}
              </pre>
            </div>
          ))}
        </div>

        {filteredPrompts.length === 0 && prompts.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No prompts match your search.</p>
          </div>
        )}

        {prompts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No prompt files found in /prompts directory.</p>
          </div>
        )}
      </div>
    </div>
  );
}