import { useState, useEffect, useCallback } from 'react';
import { DBService } from '@/shared/services/dbService';
import type { StoryAttempt, CreateStoryAttemptInput, CreateFlashcardInput } from '@/shared/types';

export const useStoryLogic = () => {
  const [historyLogs, setHistoryLogs] = useState<StoryAttempt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // --- HISTORY LOGIC (Tetap Sama) ---
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

  // --- NEW: FLASHCARD LOGIC (Pengganti addVocab lama) ---
  const saveWordToFlashcard = async (
    word: string, 
    meaning: string, 
    contextSentence: string
  ) => {
    if (!word) return false;

    const payload: CreateFlashcardInput = {
      word,
      meaning,
      contextUsage: contextSentence,
      sourceType: 'STORY'
    };

    // Panggil Service Flashcard (Bukan DictionaryEntry langsung)
    const newCard = await DBService.createFlashcard(payload);

    if (newCard) {
      // Sukses
      return true;
    } else {
      // Gagal (Mungkin duplikat flashcard atau error lain)
      // Pesan error detail sebaiknya dihandle oleh caller atau toast
      return false;
    }
  };

  return {
    historyLogs,
    isLoadingHistory,
    submitTranslationLog,
    refreshHistory: fetchHistory,
    // Expose fungsi baru
    saveWordToFlashcard 
  };
};