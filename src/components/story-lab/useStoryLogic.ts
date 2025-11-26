import { useState, useEffect } from 'react';
import { DBService } from '@/services/dbService';
import { SavedVocab } from '@/types';

export const useStoryLogic = () => {
  const [savedVocabs, setSavedVocabs] = useState<SavedVocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVocabs = async () => {
    try {
      const data = await DBService.getVocabs();
      // Tidak perlu sort di sini, biarkan View yang melakukan sort sesuai kebutuhan
      setSavedVocabs(data);
    } catch (error) {
      console.error("Failed to load vocabs", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVocabs();
  }, []);

  const addVocabOptimistic = (newVocab: SavedVocab) => {
    setSavedVocabs((prev) => [newVocab, ...prev]);
  };

  // 🔥 PERBAIKAN LOGIC UPDATE 🔥
  const updateVocabMastery = (id: string, mastered: boolean) => {
    setSavedVocabs((prev) => 
      prev.map((v) => 
        v.id === id 
          ? { 
              ...v, 
              mastered, 
              updatedAt: Date.now() // Update timestamp agar naik ke atas di History
            } 
          : v
      )
    );
  };

  const deleteVocabOptimistic = (id: string) => {
    setSavedVocabs((prev) => prev.filter((v) => v.id !== id));
  };

  return {
    savedVocabs,
    loadVocabs,
    addVocabOptimistic,
    updateVocabMastery,
    deleteVocabOptimistic,
    isLoading
  };
};