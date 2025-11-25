import { SavedVocab, HistoryItem, DailyProgress } from '@/types';

// Interface internal untuk menangkap respons mentah dari API
// (Karena API mengembalikan 'createdAt' string, bukan 'timestamp' number)
interface VocabApiResponse {
  id: string;
  word: string;
  translation: string;
  originalSentence: string;
  mastered: boolean;
  createdAt: string; // Ini yang bikin masalah jika tidak di-convert
}

interface HistoryApiResponse {
  id: string;
  feature: string;
  details: string;
  source: string;
  tokens: number;
  createdAt: string;
}

export const DBService = {
  // --- VOCAB ---
  async getVocabs(): Promise<SavedVocab[]> {
    const res = await fetch('/api/vocab');
    if (!res.ok) return [];
    
    const data: VocabApiResponse[] = await res.json();
    
    // [CRITICAL FIX] Transformasi Data: createdAt (String) -> timestamp (Number)
    return data.map(item => ({
      id: item.id,
      word: item.word,
      originalSentence: item.originalSentence,
      translation: item.translation,
      mastered: item.mastered,
      // Kita konversi string tanggal ke angka (epoch time) agar bisa di-sort
      timestamp: new Date(item.createdAt).getTime()
    }));
  },

  async addVocab(vocab: Omit<SavedVocab, 'id' | 'mastered' | 'timestamp'>): Promise<SavedVocab | null> {
    const res = await fetch('/api/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vocab),
    });
    if (!res.ok) return null;
    
    const item: VocabApiResponse = await res.json();
    
    // [CRITICAL FIX] Transformasi data untuk item baru juga
    return {
      id: item.id,
      word: item.word,
      originalSentence: item.originalSentence,
      translation: item.translation,
      mastered: item.mastered,
      timestamp: new Date(item.createdAt).getTime()
    };
  },

  async toggleVocabMastery(id: string, mastered: boolean): Promise<boolean> {
    const res = await fetch(`/api/vocab?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mastered }),
    });
    return res.ok;
  },

  async deleteVocab(id: string): Promise<boolean> {
    const res = await fetch(`/api/vocab?id=${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --- HISTORY ---
  async getHistory(): Promise<HistoryItem[]> {
    const res = await fetch('/api/history');
    if (!res.ok) return [];
    
    const data = await res.json() as HistoryApiResponse[];
    
    return data.map((d) => ({
      id: d.id,
      feature: d.feature,
      details: d.details,
      source: d.source as 'API' | 'CACHE',
      tokens: d.tokens,
      timestamp: new Date(d.createdAt)
    }));
  },

  async logHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch(err => console.error("Log failed", err));
  },

  // --- DAILY CHALLENGE ---
  async getDailyProgress(date: string): Promise<DailyProgress | null> {
    const res = await fetch(`/api/daily?date=${date}`);
    if (!res.ok) return null;
    return res.json();
  },

  async saveDailyProgress(progress: DailyProgress): Promise<DailyProgress | null> {
    const res = await fetch('/api/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
    if (!res.ok) return null;
    return res.json();
  }
};