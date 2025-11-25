import { useState, useEffect } from 'react';
import { DBService } from '@/services/dbService';
import { SavedVocab } from '@/types';

export const useStoryLogic = () => {
  const [savedVocabs, setSavedVocabs] = useState<SavedVocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper untuk sorting (Terbaru di atas)
  // Kita asumsikan 'timestamp' atau 'createdAt' (jika ada di tipe FE) digunakan.
  // Di types.ts, SavedVocab punya 'timestamp: number' (waktu milidetik).
  const sortVocabs = (list: SavedVocab[]) => {
    return [...list].sort((a, b) => b.timestamp - a.timestamp);
  };

  const loadVocabs = async () => {
    try {
      const data = await DBService.getVocabs();
      // Pastikan data dari server di-sort sebelum di-set ke state
      setSavedVocabs(sortVocabs(data));
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
    setSavedVocabs((prev) => {
      // Tambahkan item baru di paling depan (index 0)
      // Ini menjamin item terbaru langsung muncul di atas tanpa perlu re-sort full array
      return [newVocab, ...prev];
    });
  };

  const updateVocabMastery = (id: string, mastered: boolean) => {
    setSavedVocabs((prev) => {
      const updatedList = prev.map((v) => v.id === id ? { ...v, mastered } : v);
      // Kita tidak perlu re-sort di sini jika urutan waktu tidak berubah,
      // tapi jika ingin sangat ketat, bisa gunakan sortVocabs(updatedList).
      // Untuk performa UI, membiarkan posisi tetap (hanya status berubah) biasanya lebih baik UX-nya.
      return updatedList;
    });
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