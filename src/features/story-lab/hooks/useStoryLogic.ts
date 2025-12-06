import { useState, useEffect, useCallback } from 'react';
import { DBService } from '@/shared/services/dbService';
import type { StoryAttempt, CreateStoryAttemptInput, CreateFlashcardInput } from '@/shared/types';

export const useStoryLogic = () => {
  const [historyLogs, setHistoryLogs] = useState<StoryAttempt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // --- STATE BARU: Menyimpan daftar kata unik yang sudah ada di Flashcard ---
  // Menggunakan Set<string> agar pengecekan data sangat cepat (O(1))
  const [savedWordSet, setSavedWordSet] = useState<Set<string>>(new Set());

  // --- 1. FETCH FLASHCARD DATA (Initial Load) ---
  useEffect(() => {
    const fetchExistingWords = async () => {
      try {
        // Ambil semua kartu (false = ambil semua, bukan hanya yang jatuh tempo)
        const cards = await DBService.getFlashcards(false);
        
        // Masukkan semua kata ke dalam Set dengan format lowercase agar seragam
        const words = new Set(
          cards.map(c => c.dictionaryEntry?.word.toLowerCase() || "")
        );
        setSavedWordSet(words);
      } catch (error) {
        console.error("Gagal memuat daftar kata flashcard:", error);
      }
    };

    fetchExistingWords();
  }, []);

  // --- 2. HISTORY LOGIC (Existing) ---
  const fetchHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const data = await DBService.getStoryAttempts();
      setHistoryLogs(data);
    } catch (error) {
      console.error("Failed to load story history", error);
      setHistoryLogs([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const submitTranslationLog = async (payload: CreateStoryAttemptInput) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticLog: StoryAttempt = {
      ...payload,
      id: tempId,
      createdAt: new Date().toISOString()
    };
    setHistoryLogs((prev) => [optimisticLog, ...prev]);

    const success = await DBService.logStoryAttempt(payload);
    if (success) {
      fetchHistory();
    } else {
      setHistoryLogs((prev) => prev.filter(log => log.id !== tempId));
      alert("Gagal menyimpan riwayat latihan.");
    }
  };

  // --- 3. FLASHCARD SAVING LOGIC (Updated) ---
  const saveWordToFlashcard = async (
    word: string, 
    meaning: string, 
    contextSentence: string
  ) => {
    if (!word) return false;
    const cleanWord = word.toLowerCase();

    // Cek di client-side: Jika sudah ada, jangan panggil API
    if (savedWordSet.has(cleanWord)) {
        return false;
    }

    const payload: CreateFlashcardInput = {
      word,
      meaning,
      contextUsage: contextSentence,
      sourceType: 'STORY'
    };

    const newCard = await DBService.createFlashcard(payload);

    if (newCard) {
      // Optimistic Update: Langsung tambahkan ke Set agar UI berubah jadi Hijau
      setSavedWordSet(prev => new Set(prev).add(cleanWord));
      return true;
    } else {
      return false;
    }
  };

  return {
    historyLogs,
    isLoadingHistory,
    submitTranslationLog,
    refreshHistory: fetchHistory,
    saveWordToFlashcard,
    savedWordSet // <-- Return state ini ke UI
  };
};