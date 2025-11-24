import { SavedVocab, HistoryItem, DailyProgress } from '@/types';

// Interface lokal untuk mapping respon API (Raw JSON)
// Karena via HTTP, Date akan menjadi string 'createdAt'
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
    return res.json();
  },

  async addVocab(vocab: Omit<SavedVocab, 'id' | 'mastered' | 'timestamp'>): Promise<SavedVocab | null> {
    const res = await fetch('/api/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vocab),
    });
    if (!res.ok) return null;
    return res.json();
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
    
    // FIXED: Menggunakan Typed Interface alih-alih 'any'
    const data = await res.json() as HistoryApiResponse[];
    
    // Mapping aman dari string date ke Object Date
    return data.map((d) => ({
      id: d.id,
      feature: d.feature,
      details: d.details,
      source: d.source as 'API' | 'CACHE', // Type casting aman untuk Union Type
      tokens: d.tokens,
      timestamp: new Date(d.createdAt)
    }));
  },

  async logHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
    // Fire and forget
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
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