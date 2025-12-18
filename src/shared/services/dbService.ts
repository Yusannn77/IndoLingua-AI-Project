import {
  HistoryItem,
  DailyProgress,
  DictionaryEntry,
  CreateEntryPayload,
  CreateStoryAttemptInput,
  StoryAttempt,
  Flashcard,
  CreateFlashcardInput
} from '@/shared/types';

// --- HELPER TYPES (Internal) ---
// Definisi bentuk data mentah dari API sebelum di-transform ke Domain Model
interface HistoryApiRecord {
  id: string;
  feature: string;
  details: string;
  source: string;
  tokens: number;
  createdAt: string; // API mengembalikan ISO String
}

// Type Guard untuk memvalidasi response dictionary
function isDictionaryEntryArray(data: unknown): data is DictionaryEntry[] {
  return Array.isArray(data);
}

// --- SECURITY CONFIG ---
const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'x-indolingua-secure': 'internal-client-v1'
    }
  });
};

export const DBService = {
  // --- NEW: DICTIONARY V2 (Strict Typed) ---

  async getDictionaryEntries(): Promise<DictionaryEntry[]> {
    try {
      const res = await secureFetch('/api/dictionary');
      if (!res.ok) return [];

      const data: unknown = await res.json();

      // Validasi tipe runtime dengan Type Guard
      if (isDictionaryEntryArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error("[DBService] getDictionaryEntries network error:", error);
      return [];
    }
  },

  async addDictionaryEntry(payload: CreateEntryPayload): Promise<DictionaryEntry | null> {
    try {
      const res = await secureFetch('/api/dictionary', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Kita bisa ambil error message jika perlu, tapi return null cukup untuk safety
        return null;
      }

      return (await res.json()) as DictionaryEntry;
    } catch (error) {
      console.error("[DBService] addDictionaryEntry error:", error);
      return null;
    }
  },

  async deleteDictionaryEntry(id: string): Promise<boolean> {
    try {
      const res = await secureFetch(`/api/dictionary?id=${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (error) { return false; }
  },

  async logStoryAttempt(payload: CreateStoryAttemptInput): Promise<boolean> {
    try {
      // UPDATE URL: Menjadi '/api/story'
      const res = await secureFetch('/api/story', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (error) {
      console.error("[DBService] logStoryAttempt error:", error);
      return false;
    }
  },

  async getStoryAttempts(): Promise<StoryAttempt[]> {
    try {
      // UPDATE URL: Menjadi '/api/story'
      const res = await secureFetch('/api/story');
      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      // Casting aman
      return data as StoryAttempt[];
    } catch (error) {
      console.error("[DBService] getStoryAttempts error:", error);
      return [];
    }
  },

  async getFlashcards(onlyDue: boolean = false): Promise<Flashcard[]> {
    try {
      const res = await secureFetch(`/api/flashcard?due=${onlyDue}`);
      if (!res.ok) return [];
      // Casting aman karena Backend menjamin tipe data
      return (await res.json()) as Flashcard[];
    } catch (error) {
      console.error("[DBService] getFlashcards error:", error);
      return [];
    }
  },

  async createFlashcard(input: CreateFlashcardInput): Promise<Flashcard | null> {
    try {
      const res = await secureFetch('/api/flashcard', {
        method: 'POST',
        body: JSON.stringify(input)
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn("Gagal membuat flashcard:", err);
        return null;
      }

      return (await res.json()) as Flashcard;
    } catch (error) {
      return null;
    }
  },

  async reviewFlashcard(id: string, isRemembered: boolean): Promise<Flashcard | null> {
    try {
      const res = await secureFetch('/api/flashcard', {
        method: 'PATCH',
        body: JSON.stringify({ id, isRemembered })
      });

      if (!res.ok) return null;
      return (await res.json()) as Flashcard;
    } catch (error) {
      return null;
    }
  },

  async deleteFlashcard(id: string): Promise<boolean> {
    try {
      const res = await secureFetch(`/api/flashcard?id=${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (error) { return false; }
  },

  // --- HISTORY (Page-based Pagination) ---
  async getHistory(page: number = 1): Promise<{
    entries: HistoryItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasPrev: boolean;
      hasNext: boolean;
    };
  }> {
    try {
      const res = await secureFetch(`/api/history?page=${page}`);
      if (!res.ok) return {
        entries: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasPrev: false, hasNext: false }
      };

      const data: unknown = await res.json();

      if (typeof data !== 'object' || data === null) {
        return {
          entries: [],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasPrev: false, hasNext: false }
        };
      }

      const response = data as {
        entries?: unknown[];
        pagination?: {
          currentPage: number;
          totalPages: number;
          totalCount: number;
          hasPrev: boolean;
          hasNext: boolean;
        };
      };

      if (!Array.isArray(response.entries)) {
        return {
          entries: [],
          pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasPrev: false, hasNext: false }
        };
      }

      const safeData = response.entries as HistoryApiRecord[];
      const entries: HistoryItem[] = safeData.map((d) => ({
        id: d.id,
        feature: d.feature,
        details: d.details,
        source: (d.source === 'CACHE' ? 'CACHE' : 'API'),
        tokens: d.tokens,
        timestamp: new Date(d.createdAt)
      }));

      return {
        entries,
        pagination: response.pagination || {
          currentPage: 1, totalPages: 1, totalCount: 0, hasPrev: false, hasNext: false
        }
      };
    } catch (error) {
      console.error('[DBService] getHistory error:', error);
      return {
        entries: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0, hasPrev: false, hasNext: false }
      };
    }
  },

  async logHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
    secureFetch('/api/history', {
      method: 'POST',
      body: JSON.stringify(item),
    }).catch(err => console.error("Log failed", err));
  },

  // --- DAILY PROGRESS ---
  async getDailyProgress(date: string): Promise<DailyProgress | null> {
    try {
      const res = await secureFetch(`/api/daily?date=${date}`);
      if (!res.ok) return null;
      return (await res.json()) as DailyProgress;
    } catch (error) { return null; }
  },

  async saveDailyProgress(progress: DailyProgress): Promise<DailyProgress | null> {
    try {
      const res = await secureFetch('/api/daily', {
        method: 'POST',
        body: JSON.stringify(progress),
      });
      if (!res.ok) return null;
      return (await res.json()) as DailyProgress;
    } catch (error) { return null; }
  },

  // --- PROGRESS TEMPORAL ---
  async getProgress(month: number, year: number): Promise<{
    current: {
      wordsAdded: number;
      cardsMastered: number;
      cardsReviewed: number;
      storyAttempts: number;
      storyAvgScore: number;
      storyBestScore: number;
      tokensUsed: number;
      aiRequests: number;
      activeDays: number;
      totalSessions: number;
      mostProductiveDay: string | null;
      mostActiveHour: string | null;
    };
    previous: {
      wordsAdded: number;
      cardsMastered: number;
      cardsReviewed: number;
      storyAttempts: number;
      storyAvgScore: number;
      storyBestScore: number;
      tokensUsed: number;
      aiRequests: number;
      activeDays: number;
      totalSessions: number;
      mostProductiveDay: string | null;
      mostActiveHour: string | null;
    } | null;
    period: { month: number; year: number };
  } | null> {
    try {
      const res = await secureFetch(`/api/progress?month=${month}&year=${year}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('[DBService] getProgress error:', error);
      return null;
    }
  }
};