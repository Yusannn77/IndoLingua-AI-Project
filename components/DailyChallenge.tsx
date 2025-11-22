import React, { useState, useEffect } from 'react';
import { Trophy, Send, Star, RefreshCcw } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ChallengeScenario, ChallengeFeedback } from '../types';

const DailyChallenge: React.FC = () => {
  const [scenario, setScenario] = useState<ChallengeScenario | null>(null);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<ChallengeFeedback | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadChallenge = async () => {
    setLoadingScenario(true);
    setScenario(null);
    setFeedback(null);
    setResponse('');
    try {
      const data = await GeminiService.getDailyChallenge();
      setScenario(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingScenario(false);
    }
  };

  useEffect(() => {
    loadChallenge();
  }, []);

  const handleSubmit = async () => {
    if (!scenario || !response.trim()) return;
    setSubmitting(true);
    try {
      // Changed to pass the English goal + User translation
      const result = await GeminiService.evaluateChallengeResponse(scenario.scenario, scenario.goal, response);
      setFeedback(result);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-amber-100 text-amber-600 rounded-full mb-4">
            <Trophy size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Tantangan Harian</h2>
        <p className="text-slate-600">Asah kemampuan percakapanmu dalam situasi nyata.</p>
      </div>

      {loadingScenario ? (
        <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
      ) : (
        scenario && (
          <div className="space-y-6">
            {/* Scenario Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-8 -mt-8 z-0" />
               <div className="relative z-10">
                  <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-2">Konteks</h3>
                  <p className="text-xl font-medium text-slate-900 mb-4 leading-relaxed">{scenario.scenario}</p>
                  
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mt-6">
                    <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                      Objektif Misi : Terjemahkan kalimat di bawah ini ke bahasa Indonesia
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-brand-800 leading-tight">
                      "{scenario.goal}"
                    </p>
                  </div>
               </div>
            </div>

            {/* Input Area */}
            {!feedback ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Terjemahan kamu (dalam Bahasa Indonesia):
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Ketik terjemahan bahasa Indonesia di sini..."
                  className="w-full p-3 bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none min-h-[100px]"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={!response.trim() || submitting}
                    className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? 'Menilai...' : (
                        <>Kirim Jawaban <Send size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback Card */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-slide-up">
                 <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-lg text-slate-900">Hasil Evaluasi</h3>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xl">
                        <Star fill="currentColor" />
                        <span>{feedback.score}/10</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                        <p className="text-sm text-slate-500 mb-1 font-medium">Feedback AI</p>
                        <p className="text-slate-700">{feedback.feedback}</p>
                    </div>
                    
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                        <p className="text-sm text-green-700 mb-1 font-medium">Terjemahan yang Lebih Natural:</p>
                        <p className="text-green-900 font-medium italic">"{feedback.improved_response}"</p>
                    </div>

                    <button 
                        onClick={loadChallenge}
                        className="w-full py-3 border border-slate-300 text-slate-600 font-medium rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 mt-4"
                    >
                        <RefreshCcw size={18} /> Tantangan Baru
                    </button>
                 </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default DailyChallenge;
