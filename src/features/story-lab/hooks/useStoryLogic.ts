import { useState, useEffect, useCallback } from 'react';
import { DBService } from '@/shared/services/dbService'; // <-- Path Baru
import { SavedVocab } from '@/shared/types'; // <-- Path Baru

export const useStoryLogic = () => {
  const [savedVocabs, setSavedVocabs] = useState<SavedVocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load awal tetap diperlukan untuk sinkronisasi pertama
  const loadVocabs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await DBService.getVocabs();
      setSavedVocabs(data);
    } catch (error) {
      console.error("Failed to load vocabs", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVocabs();
  }, [loadVocabs]);

  // 1. ADD VOCAB (Optimistic)
  const addVocab = async (vocabData: Omit<SavedVocab, 'id' | 'mastered' | 'timestamp' | 'updatedAt'>) => {
    // Buat ID sementara untuk UI immediate feedback
    const tempId = `temp-${Date.now()}`;
    const optimisticVocab: SavedVocab = {
      ...vocabData,
      id: tempId,
      mastered: false,
      timestamp: Date.now(),
      updatedAt: Date.now()
    };

    // Update UI duluan
    setSavedVocabs((prev) => [optimisticVocab, ...prev]);

    // Panggil Server
    const saved = await DBService.addVocab(vocabData);

    if (saved) {
      // Sukses: Ganti item temporary dengan data asli dari server (yang punya ID valid)
      setSavedVocabs((prev) => 
        prev.map((v) => (v.id === tempId ? saved : v))
      );
      return true;
    } else {
      // Gagal: Rollback (Hapus item temporary tadi)
      setSavedVocabs((prev) => prev.filter((v) => v.id !== tempId));
      alert("Gagal menyimpan vocab. Cek koneksi internet.");
      return false;
    }
  };

  // 2. TOGGLE MASTERY (Optimistic + Rollback)
  const toggleMastery = async (id: string, mastered: boolean) => {
    // Simpan state lama untuk jaga-jaga (Rollback)
    const previousState = savedVocabs.find((v) => v.id === id)?.mastered;

    // Update UI duluan
    setSavedVocabs((prev) => 
      prev.map((v) => 
        v.id === id 
          ? { ...v, mastered, updatedAt: Date.now() } 
          : v
      )
    );

    // Panggil Server
    const success = await DBService.toggleVocabMastery(id, mastered);

    if (!success && previousState !== undefined) {
      // Gagal: Rollback ke status sebelumnya
      console.error("Sync failed, rolling back...");
      setSavedVocabs((prev) => 
        prev.map((v) => 
          v.id === id 
            ? { ...v, mastered: previousState } // Kembalikan nilai asli
            : v
        )
      );
      alert("Gagal update status. Data dikembalikan.");
    }
  };

  // 3. DELETE VOCAB (Optimistic + Rollback)
  const deleteVocab = async (id: string) => {
    // Simpan item yang mau dihapus untuk Rollback
    const deletedItem = savedVocabs.find((v) => v.id === id);
    if (!deletedItem) return;

    // Hapus dari UI duluan
    setSavedVocabs((prev) => prev.filter((v) => v.id !== id));

    // Panggil Server
    const success = await DBService.deleteVocab(id);

    if (!success) {
      // Gagal: Masukkan kembali item yang tadi dihapus
      setSavedVocabs((prev) => [deletedItem, ...prev]);
      alert("Gagal menghapus. Data dikembalikan.");
    }
  };

  return {
    savedVocabs,
    isLoading,
    addVocab,
    toggleMastery,
    deleteVocab
  };
};