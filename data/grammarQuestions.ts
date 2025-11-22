import { GrammarQuestion } from '../types';

// --- LEVEL 1: BEGINNER (Dasar-dasar) ---
export const beginnerQuestions: GrammarQuestion[] = [
  // To Be & Pronouns
  {
    id: "beg-1",
    question: "I ___ a student at Universitas Indonesia.",
    options: ["is", "are", "am", "were"],
    correctIndex: 2,
    explanation: "Subjek 'I' (saya) selalu berpasangan dengan To Be 'am' dalam bentuk sekarang (Present)."
  },
  {
    id: "beg-2",
    question: "___ are my best friends.",
    options: ["They", "Them", "Their", "It"],
    correctIndex: 0,
    explanation: "Dibutuhkan Subjek di awal kalimat. 'They' adalah kata ganti subjek untuk 'mereka'."
  },
  {
    id: "beg-3",
    question: "Is this ___ book?",
    options: ["you", "your", "yours", "me"],
    correctIndex: 1,
    explanation: "Menunjukkan kepemilikan (Possessive Adjective) sebelum kata benda 'book'. Gunakan 'your'."
  },
  // Simple Present Tense
  {
    id: "beg-4",
    question: "She ___ to the office every day.",
    options: ["go", "goes", "going", "gone"],
    correctIndex: 1,
    explanation: "Simple Present Tense untuk rutinitas (every day). Subjek 'She' (dia perempuan) menambahkan akhiran -es pada kata kerja (goes)."
  },
  {
    id: "beg-5",
    question: "We ___ like spicy food.",
    options: ["does not", "do not", "is not", "are not"],
    correctIndex: 1,
    explanation: "Kalimat negatif Simple Present untuk subjek 'We' menggunakan kata bantu 'do not' (don't)."
  },
  {
    id: "beg-6",
    question: "Budi ___ play football very well.",
    options: ["can", "cans", "canning", "to can"],
    correctIndex: 0,
    explanation: "Modal verb 'can' (bisa) tidak pernah berubah bentuk, apapun subjeknya."
  },
  // Present Continuous
  {
    id: "beg-7",
    question: "Listen! The baby is ___.",
    options: ["cry", "cries", "crying", "cried"],
    correctIndex: 2,
    explanation: "Kata 'Listen!' menandakan sesuatu sedang terjadi sekarang (Present Continuous). Rumus: To Be + Verb-ing."
  },
  {
    id: "beg-8",
    question: "They ___ watching TV right now.",
    options: ["is", "am", "are", "be"],
    correctIndex: 2,
    explanation: "Subjek 'They' berpasangan dengan To Be 'are'."
  },
  // Simple Past
  {
    id: "beg-9",
    question: "I ___ nasi goreng yesterday morning.",
    options: ["eat", "eats", "ate", "eaten"],
    correctIndex: 2,
    explanation: "Keterangan waktu 'yesterday' (kemarin) menunjukkan masa lampau. Gunakan Verb 2 (ate)."
  },
  {
    id: "beg-10",
    question: "Did you ___ him at the party?",
    options: ["see", "saw", "seen", "seeing"],
    correctIndex: 0,
    explanation: "Setelah kata bantu tanya 'Did', kata kerja kembali ke bentuk dasar (Verb 1)."
  },
  // Prepositions & Articles
  {
    id: "beg-11",
    question: "The cat is sleeping ___ the sofa.",
    options: ["in", "on", "at", "to"],
    correctIndex: 1,
    explanation: "Untuk posisi benda yang menempel di atas permukaan benda lain, gunakan preposisi 'on'."
  },
  {
    id: "beg-12",
    question: "I have ___ idea!",
    options: ["a", "an", "the", "two"],
    correctIndex: 1,
    explanation: "Kata 'idea' diawali bunyi vokal (ai-di-a), jadi gunakan artikel 'an'."
  },
  {
    id: "beg-13",
    question: "My birthday is ___ August.",
    options: ["on", "at", "in", "by"],
    correctIndex: 2,
    explanation: "Untuk bulan (tanpa tanggal spesifik), gunakan preposisi 'in'."
  },
  {
    id: "beg-14",
    question: "See you ___ Monday!",
    options: ["in", "at", "on", "for"],
    correctIndex: 2,
    explanation: "Untuk hari (Monday, Tuesday, dst), selalu gunakan preposisi 'on'."
  },
  // Questions
  {
    id: "beg-15",
    question: "___ are you going?",
    options: ["Who", "Why", "Where", "What"],
    correctIndex: 2,
    explanation: "Menanyakan tempat/tujuan (ke mana), gunakan 'Where'."
  },
  {
    id: "beg-16",
    question: "___ bag is this?",
    options: ["Who", "Whose", "Where", "When"],
    correctIndex: 1,
    explanation: "Menanyakan kepemilikan (tas siapa), gunakan 'Whose'."
  },
  // Adjectives & Adverbs
  {
    id: "beg-17",
    question: "This test is very ___.",
    options: ["easily", "easy", "ease", "easier"],
    correctIndex: 1,
    explanation: "Setelah To Be (is), kita membutuhkan kata sifat (Adjective), yaitu 'easy'."
  },
  {
    id: "beg-18",
    question: "He drives ___.",
    options: ["careful", "carefully", "care", "caring"],
    correctIndex: 1,
    explanation: "Menjelaskan BAGAIMANA dia menyetir (kata kerja). Gunakan kata keterangan (Adverb) berakhiran -ly."
  },
  // Common Vocabulary Context
  {
    id: "beg-19",
    question: "Can I ___ some water, please?",
    options: ["have", "do", "make", "put"],
    correctIndex: 0,
    explanation: "Frasa sopan untuk meminta sesuatu adalah 'Can I have...'."
  },
  {
    id: "beg-20",
    question: "My father is a doctor. He works in a ___.",
    options: ["school", "hospital", "bank", "shop"],
    correctIndex: 1,
    explanation: "Konteks pekerjaan: Dokter bekerja di rumah sakit (hospital)."
  },
  {
    id: "beg-21",
    question: "It is raining. Take your ___.",
    options: ["glasses", "wallet", "umbrella", "shoes"],
    correctIndex: 2,
    explanation: "Konteks cuaca: Hujan memerlukan payung (umbrella)."
  },
  {
    id: "beg-22",
    question: "I am ___ tired to go out.",
    options: ["to", "two", "too", "top"],
    correctIndex: 2,
    explanation: "'Too' artinya 'terlalu' (terlalu lelah)."
  },
  {
    id: "beg-23",
    question: "Please ___ the door.",
    options: ["close", "closed", "closing", "closes"],
    correctIndex: 0,
    explanation: "Kalimat perintah (Imperative) selalu menggunakan Verb 1."
  },
  {
    id: "beg-24",
    question: "___ old are you?",
    options: ["What", "How", "Who", "When"],
    correctIndex: 1,
    explanation: "Menanyakan umur menggunakan frasa 'How old'."
  },
  {
    id: "beg-25",
    question: "There ___ two cars in the garage.",
    options: ["is", "are", "am", "be"],
    correctIndex: 1,
    explanation: "Karena bendanya jamak (two cars), gunakan 'There are'."
  },
  {
    id: "beg-26",
    question: "He usually ___ up at 6 AM.",
    options: ["get", "getting", "gets", "got"],
    correctIndex: 2,
    explanation: "Kebiasaan (usually) + Subjek 'He' = Verb + s (gets)."
  },
  {
    id: "beg-27",
    question: "I don't have ___ money.",
    options: ["some", "any", "many", "no"],
    correctIndex: 1,
    explanation: "Kalimat negatif menggunakan 'any' untuk menyatakan tidak ada sama sekali."
  },
  {
    id: "beg-28",
    question: "Jakarta is ___ than Surabaya.",
    options: ["big", "bigger", "biggest", "more big"],
    correctIndex: 1,
    explanation: "Perbandingan (Comparative) 'lebih besar' untuk kata satu suku kata, tambahkan -er (bigger)."
  },
  {
    id: "beg-29",
    question: "This is the ___ movie ever!",
    options: ["good", "better", "best", "goodest"],
    correctIndex: 2,
    explanation: "Superlative (Paling bagus) dari 'good' adalah 'best'."
  },
  {
    id: "beg-30",
    question: "Would you like ___ tea?",
    options: ["some", "any", "a", "an"],
    correctIndex: 0,
    explanation: "Tawaran (offer) menggunakan 'some' meskipun kalimat tanya, agar lebih sopan."
  }
];

// --- LEVEL 2: INTERMEDIATE (Lanjutan) ---
export const intermediateQuestions: GrammarQuestion[] = [
  // Present Perfect
  {
    id: "int-1",
    question: "I ___ to Bali three times this year.",
    options: ["go", "went", "have been", "was"],
    correctIndex: 2,
    explanation: "Present Perfect Tense (have + V3) digunakan untuk pengalaman hidup tanpa waktu spesifik atau kejadian berulang dalam periode yang belum selesai."
  },
  {
    id: "int-2",
    question: "She ___ here since 2010.",
    options: ["lives", "lived", "has lived", "is living"],
    correctIndex: 2,
    explanation: "Kata kunci 'since' menandakan aksi dimulai di masa lalu dan masih berlanjut (Present Perfect)."
  },
  // Past Continuous
  {
    id: "int-3",
    question: "I was sleeping when you ___ me.",
    options: ["call", "called", "calling", "was calling"],
    correctIndex: 1,
    explanation: "Kejadian yang menyela (Simple Past) saat kejadian lain sedang berlangsung (Past Continuous)."
  },
  // Passive Voice
  {
    id: "int-4",
    question: "Borobudur Temple ___ in the 9th century.",
    options: ["built", "was built", "is built", "building"],
    correctIndex: 1,
    explanation: "Kalimat Pasif (Passive Voice) lampau. Rumus: Was/Were + Verb 3."
  },
  {
    id: "int-5",
    question: "The letter ___ sent tomorrow.",
    options: ["will", "will be", "is", "was"],
    correctIndex: 1,
    explanation: "Kalimat Pasif masa depan. Rumus: Will be + Verb 3."
  },
  // Conditionals
  {
    id: "int-6",
    question: "If it rains, I ___ stay at home.",
    options: ["would", "will", "am", "had"],
    correctIndex: 1,
    explanation: "Conditional Type 1 (Real possibility). If + Present, Subject + Will + Verb."
  },
  {
    id: "int-7",
    question: "If I ___ rich, I would buy an island.",
    options: ["am", "was", "were", "have been"],
    correctIndex: 2,
    explanation: "Conditional Type 2 (Imaginary). Gunakan 'were' untuk semua subjek dalam pengandaian."
  },
  // Gerunds & Infinitives
  {
    id: "int-8",
    question: "I enjoy ___ books on weekends.",
    options: ["read", "to read", "reading", "reads"],
    correctIndex: 2,
    explanation: "Kata kerja 'enjoy' selalu diikuti oleh Gerund (Verb-ing)."
  },
  {
    id: "int-9",
    question: "She decided ___ to the party.",
    options: ["go", "to go", "going", "went"],
    correctIndex: 1,
    explanation: "Kata kerja 'decide' selalu diikuti oleh To Infinitive (to + V1)."
  },
  // Relative Clauses
  {
    id: "int-10",
    question: "The man ___ lives next door is a chef.",
    options: ["which", "who", "whom", "whose"],
    correctIndex: 1,
    explanation: "Relative Pronoun untuk orang (sebagai subjek) adalah 'who'."
  },
  {
    id: "int-11",
    question: "This is the laptop ___ I bought yesterday.",
    options: ["who", "whom", "where", "which"],
    correctIndex: 3,
    explanation: "Relative Pronoun untuk benda adalah 'which' (atau 'that')."
  },
  // Modals Perfect
  {
    id: "int-12",
    question: "You look tired. You ___ slept earlier last night.",
    options: ["should", "should have", "must", "must have"],
    correctIndex: 1,
    explanation: "'Should have + V3' digunakan untuk penyesalan atau saran di masa lalu yang tidak dilakukan."
  },
  // Tag Questions
  {
    id: "int-13",
    question: "You are Indonesian, ___?",
    options: ["aren't you", "don't you", "are you", "do you"],
    correctIndex: 0,
    explanation: "Question Tag positif ('You are') diikuti ekor negatif ('aren't you')."
  },
  {
    id: "int-14",
    question: "She doesn't like coffee, ___?",
    options: ["does she", "doesn't she", "is she", "isn't she"],
    correctIndex: 0,
    explanation: "Kalimat negatif ('doesn't') diikuti ekor positif ('does she')."
  },
  // Phrasal Verbs
  {
    id: "int-15",
    question: "Please ___ your shoes before entering.",
    options: ["take on", "take off", "put on", "put off"],
    correctIndex: 1,
    explanation: "'Take off' artinya melepas (pakaian/sepatu). 'Put on' memakai."
  },
  {
    id: "int-16",
    question: "We ran ___ of gas on the highway.",
    options: ["out", "over", "away", "into"],
    correctIndex: 0,
    explanation: "'Run out of' artinya kehabisan."
  },
  // Conjunctions
  {
    id: "int-17",
    question: "___ it was raining, we went out.",
    options: ["Because", "Although", "Despite", "So"],
    correctIndex: 1,
    explanation: "'Although' (Meskipun) diikuti oleh kalimat lengkap (S+V) untuk menunjukkan pertentangan."
  },
  {
    id: "int-18",
    question: "I stayed home ___ the rain.",
    options: ["because", "because of", "although", "despite"],
    correctIndex: 1,
    explanation: "'Because of' diikuti oleh kata benda (noun phrase), sedangkan 'Because' diikuti kalimat."
  },
  // Reported Speech
  {
    id: "int-19",
    question: "He said that he ___ busy.",
    options: ["is", "was", "will be", "has been"],
    correctIndex: 1,
    explanation: "Dalam Reported Speech, jika kata pengantar lampau ('said'), tenses mundur satu langkah (Present -> Past)."
  },
  // Future Forms
  {
    id: "int-20",
    question: "Look at those clouds! It ___ rain.",
    options: ["will", "is going to", "shall", "might"],
    correctIndex: 1,
    explanation: "'Going to' digunakan untuk prediksi masa depan berdasarkan bukti fisik yang terlihat saat ini."
  },
  // Used to
  {
    id: "int-21",
    question: "I ___ play badminton when I was a kid.",
    options: ["use to", "used to", "was used to", "am used to"],
    correctIndex: 1,
    explanation: "'Used to' (dulu terbiasa) digunakan untuk kebiasaan masa lampau yang sekarang tidak dilakukan lagi."
  },
  // Causative
  {
    id: "int-22",
    question: "I had my hair ___ yesterday.",
    options: ["cut", "cutting", "to cut", "cuts"],
    correctIndex: 0,
    explanation: "Causative 'Have/Get something done'. Rumus: Had + Object + Verb 3."
  },
  // Comparatives with 'The'
  {
    id: "int-23",
    question: "The harder you work, the ___ you get.",
    options: ["lucky", "luckier", "luckiest", "more lucky"],
    correctIndex: 1,
    explanation: "Pola 'The comparative ..., the comparative ...' (Semakin ..., semakin ...)."
  },
  // Preposition + Gerund
  {
    id: "int-24",
    question: "He is good ___ speaking English.",
    options: ["in", "at", "on", "of"],
    correctIndex: 1,
    explanation: "Pasangan kata 'good' untuk keahlian adalah 'at' (good at), diikuti Gerund."
  },
  // Neither/Either
  {
    id: "int-25",
    question: "I don't like papaya, and ___ does she.",
    options: ["so", "neither", "either", "too"],
    correctIndex: 1,
    explanation: "Untuk menyetujui kalimat negatif dengan inversi, gunakan 'neither' (neither + aux + S)."
  },
  {
    id: "int-26",
    question: "I have never ___ such a beautiful view.",
    options: ["saw", "see", "seen", "seeing"],
    correctIndex: 2,
    explanation: "Present Perfect (have + V3)."
  },
  {
    id: "int-27",
    question: "She asked me ___ I was okay.",
    options: ["that", "if", "what", "did"],
    correctIndex: 1,
    explanation: "Reported speech untuk pertanyaan Yes/No menggunakan 'if' atau 'whether'."
  },
  {
    id: "int-28",
    question: "Unless you ___, you will be late.",
    options: ["hurry", "don't hurry", "will hurry", "hurried"],
    correctIndex: 0,
    explanation: "'Unless' sudah bermakna negatif (If not), jadi tidak perlu 'don't' lagi."
  },
  {
    id: "int-29",
    question: "I wish I ___ the answer.",
    options: ["know", "knew", "known", "knowing"],
    correctIndex: 1,
    explanation: "'Wish' tentang masa sekarang menggunakan Past Tense (Subjunctive)."
  },
  {
    id: "int-30",
    question: "It is time we ___ home.",
    options: ["go", "went", "gone", "going"],
    correctIndex: 1,
    explanation: "Frasa 'It is time' diikuti Past Tense untuk menunjukkan sesuatu yang seharusnya sudah dilakukan sekarang."
  }
];