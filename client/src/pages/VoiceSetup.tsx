import { useState, useEffect } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { Link } from 'wouter';
import { getLearnerName } from '@/utils/learnerName';

interface Voice {
  voice_id: string;
  name: string;
  description?: string;
}

export function VoiceSetup() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/speech/voices');
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }
      const data = await response.json();
      setVoices(data.voices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  const testVoice = async (voiceId: string, voiceName: string) => {
    try {
      const response = await fetch('/api/speech/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `G'day ${getLearnerName()}! I'm Scout, your Aussie learning buddy! Ready for an adventure?`,
          voiceId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Error testing voice:', error);
      alert('Error testing voice. Please try again.');
    }
  };

  const copyVoiceId = (voiceId: string) => {
    navigator.clipboard.writeText(voiceId);
    alert('Voice ID copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your voices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl">Error: {error}</div>
          <button 
            onClick={fetchVoices}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-white">ElevenLabs Voice Setup</h1>
        </div>

        <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Find Your Scout Voice</h2>
            <p className="text-white/80">
              Click "Test Voice" to hear each voice. When you find your Scout voice, copy the Voice ID and replace the placeholder in the code.
            </p>
          </div>

          <div className="space-y-4">
            {voices.map((voice) => (
              <div key={voice.voice_id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{voice.name}</h3>
                    {voice.description && (
                      <p className="text-white/70 text-sm mb-3">{voice.description}</p>
                    )}
                    <div className="text-white/60 text-xs font-mono bg-black/20 rounded p-2 break-all">
                      {voice.voice_id}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => testVoice(voice.voice_id, voice.name)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Volume2 size={16} />
                      Test Voice
                    </button>
                    <button
                      onClick={() => copyVoiceId(voice.voice_id)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Copy ID
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {voices.length === 0 && (
            <div className="text-center text-white/70 py-8">
              No voices found. Make sure your ElevenLabs API key is configured correctly.
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6">
          <h3 className="text-yellow-300 font-semibold mb-2">Next Steps:</h3>
          <ol className="text-yellow-200 space-y-2 list-decimal list-inside">
            <li>Test the voices above to find your Scout voice</li>
            <li>Copy the Voice ID for your Scout voice</li>
            <li>Replace 'SCOUT_VOICE_ID_PLACEHOLDER' in the code with your actual Voice ID</li>
            <li>Scout will then use your custom ElevenLabs voice!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}