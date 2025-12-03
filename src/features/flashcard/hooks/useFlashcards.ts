import { useState, useEffect, useCallback } from 'react';
import { DBService } from '@/shared/services/dbService';
import { Flashcard, CreateFlashcardInput } from '@/shared/types';

export const useFlashcards = (mode: 'ALL' | 'REVIEW_ONLY' = 'ALL') => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. FETCH CARDS
  const loadCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await DBService.getFlashcards(mode === 'REVIEW_ONLY');
      setCards(data);
    } catch (error) {
      console.error("Load cards failed", error);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // 2. ADD CARD
  const addCard = async (input: CreateFlashcardInput) => {
    const exists = cards.some(c => 
      c.dictionaryEntry?.word.toLowerCase() === input.word.toLowerCase()
    );
    if (exists) return false;

    const newCard = await DBService.createFlashcard(input);
    if (newCard) {
      setCards(prev => [newCard, ...prev]);
      return true;
    }
    return false;
  };

  // 3. SUBMIT REVIEW
  const submitReview = async (id: string, isRemembered: boolean) => {
    // Optimistic Update: Hapus dari list review agar user langsung lanjut
    if (mode === 'REVIEW_ONLY') {
       setCards(prev => prev.filter(c => c.id !== id));
    }

    const updatedCard = await DBService.reviewFlashcard(id, isRemembered);
    
    // Update data jika di mode ALL
    if (mode === 'ALL' && updatedCard) {
      setCards(prev => prev.map(c => c.id === id ? updatedCard : c));
    }
  };

  // 4. DELETE CARD
  const deleteCard = async (id: string) => {
    const oldCards = [...cards];
    setCards(prev => prev.filter(c => c.id !== id));

    const success = await DBService.deleteFlashcard(id);
    if (!success) {
      setCards(oldCards);
      alert("Gagal menghapus kartu.");
    }
  };

  // 5. SHUFFLE CARDS (NEW FEATURE)
  // Mengacak urutan kartu di client-side untuk variasi latihan
  const shuffleCards = useCallback(() => {
    setCards(prev => {
      const shuffled = [...prev];
      // Algoritma Fisher-Yates Shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, []);

  return {
    cards,
    isLoading,
    addCard,
    submitReview,
    deleteCard,
    refresh: loadCards,
    shuffleCards // <-- Diexport agar bisa dipakai di UI
  };
};