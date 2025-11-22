import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { GoogleGenAI } from '@google/genai'; // Import needed for typing if using chat session object directly

const ChatTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'model', text: 'Halo! Saya tutor Bahasa Inggris pribadimu. Kita bisa ngobrol santai atau role-play. Mau bahas topik apa hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null); // Store the chat session instance
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    const session = GeminiService.createChat();
    setChatSession(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatSession) return;

    const userText = input;
    setInput('');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Fix: Pass object with message property
      const result = await chatSession.sendMessage({ message: userText });
      // Fix: Access text directly via getter property
      const modelText = result.text;
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: modelText 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Maaf, terjadi kesalahan koneksi. Coba lagi ya.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-brand-50 p-4 border-b border-brand-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Tutor Chat</h2>
          <p className="text-xs text-brand-600">A.I. Tutor yang sabar & membantu</p>
        </div>
        <button 
            onClick={() => {
                setMessages([{ id: 'intro', role: 'model', text: 'Halo! Saya tutor Bahasa Inggris pribadimu. Kita bisa ngobrol santai atau role-play. Mau bahas topik apa hari ini?' }]);
                const session = GeminiService.createChat();
                setChatSession(session);
            }}
            className="text-brand-600 hover:bg-brand-100 p-2 rounded-full"
            title="Reset Chat"
        >
            <RefreshCw size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
                ${msg.role === 'user' ? 'bg-brand-100 text-brand-600' : 'bg-emerald-100 text-emerald-600'}
              `}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`
                p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                ${msg.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}
                ${msg.isError ? 'border-red-300 bg-red-50 text-red-600' : ''}
              `}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex gap-2 items-center ml-10 bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2 items-end relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesanmu di sini..."
            className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none min-h-[50px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Gunakan Bahasa Indonesia atau Inggris. AI akan memperbaiki jika ada kesalahan.
        </p>
      </div>
    </div>
  );
};

export default ChatTutor;