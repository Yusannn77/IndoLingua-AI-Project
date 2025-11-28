import { SavedVocab, HistoryItem, DailyProgress } from '@/shared/types';

// --- SECURITY CONFIG ---
const secureFetch = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'x-indolingua-secure': 'internal-client-v1'
    }
  });
};

interface VocabApiResponse {
  id: string;
  word: string;
  translation: string;
  originalSentence: string;
  mastered: boolean;
  createdAt: string;
  updatedAt: string;
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
    try {
      const res = await secureFetch('/api/vocab');
      if (!res.ok) return [];
      
      const data: VocabApiResponse[] = await res.json();
      
      return data.map(item => ({
        id: item.id,
        word: item.word,
        originalSentence: item.originalSentence,
        translation: item.translation,
        mastered: item.mastered,
        timestamp: new Date(item.createdAt).getTime(),
        updatedAt: new Date(item.updatedAt).getTime()
      }));
    } catch (error) {
      return [];
    }
  },

  async addVocab(vocab: Omit<SavedVocab, 'id' | 'mastered' | 'timestamp' | 'updatedAt'>): Promise<SavedVocab | null> {
    try {
      const res = await secureFetch('/api/vocab', {
        method: 'POST',
        body: JSON.stringify(vocab),
      });
      if (!res.ok) return null;
      
      const item: VocabApiResponse = await res.json();
      
      return {
        id: item.id,
        word: item.word,
        originalSentence: item.originalSentence,
        translation: item.translation,
        mastered: item.mastered,
        timestamp: new Date(item.createdAt).getTime(),
        updatedAt: new Date(item.updatedAt).getTime()
      };
    } catch (error) {
      return null;
    }
  },

  async toggleVocabMastery(id: string, mastered: boolean): Promise<boolean> {
    try {
      const res = await secureFetch(`/api/vocab?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ mastered }),
      });
      return res.ok;
    } catch (error) { return false; }
  },

  async deleteVocab(id: string): Promise<boolean> {
    try {
      const res = await secureFetch(`/api/vocab?id=${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (error) { return false; }
  },

  // --- HISTORY ---
  async getHistory(): Promise<HistoryItem[]> {
    try {
      const res = await secureFetch('/api/history');
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
    } catch (error) { return []; }
  },

  async logHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
    secureFetch('/api/history', {
      method: 'POST',
      body: JSON.stringify(item),
    }).catch(err => console.error("Log failed", err));
  },

  // --- DAILY ---
  async getDailyProgress(date: string): Promise<DailyProgress | null> {
    try {
      const res = await secureFetch(`/api/daily?date=${date}`);
      if (!res.ok) return null;
      return res.json();
    } catch (error) { return null; }
  },

  async saveDailyProgress(progress: DailyProgress): Promise<DailyProgress | null> {
    try {
      const res = await secureFetch('/api/daily', {
        method: 'POST',
        body: JSON.stringify(progress),
      });
      if (!res.ok) return null;
      return res.json();
    } catch (error) { return null; }
  }
};