import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  reasoning?: string;
  sql?: string;
  data?: any[];
  error?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('ecommerce_chats');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('ecommerce_chats');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed[0].id : null;
    }
    return null;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  const suggestedQuestions = [
    "Quais são os top 10 produtos mais vendidos?",
    "Qual a receita total por categoria de produto?",
    "Qual a quantidade de pedidos por status?"
  ];

  useEffect(() => {
    localStorage.setItem('ecommerce_chats', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "Nova Conversa...",
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita que o click selecione a sessão enquanto apagamos
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const startEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleInput(session.title);
  };

  const saveEditedTitle = (id: string) => {
    if (editTitleInput.trim() !== '') {
      setSessions(prev => prev.map(s =>
        s.id === id ? { ...s, title: editTitleInput.trim() } : s
      ));
    }
    setEditingSessionId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveEditedTitle(id);
    if (e.key === 'Escape') setEditingSessionId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    let currentSessionId = activeSessionId;
    let isFirstMessage = false;

    if (!currentSessionId) {
      currentSessionId = Date.now().toString();
      setActiveSessionId(currentSessionId);
      isFirstMessage = true;
    } else {
      const sess = sessions.find(s => s.id === currentSessionId);
      isFirstMessage = !sess || sess.messages.length === 0;
    }

    const chatTitle = isFirstMessage ? userText.slice(0, 30) + "..." : undefined;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };

    setSessions(prevSessions => {
      const exists = prevSessions.some(s => s.id === currentSessionId);
      if (!exists) {
        return [{
          id: currentSessionId,
          title: chatTitle || "Nova Conversa...",
          messages: [userMsg]
        }, ...prevSessions];
      }

      return prevSessions.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            title: chatTitle || session.title,
            messages: [...session.messages, userMsg]
          };
        }
        return session;
      });
    });

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: userText })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.erro || 'Falha ao comunicar com o servidor.');
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        reasoning: result.raciocinio,
        sql: result.sql,
        data: result.dados,
        error: result.erro
      };

      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === currentSessionId) {
          return { ...session, messages: [...session.messages, aiMsg] };
        }
        return session;
      }));

    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        error: error.message || 'Erro desconhecido ao processar a consulta.'
      };

      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === currentSessionId) {
          return { ...session, messages: [...session.messages, errorMsg] };
        }
        return session;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return <p className="text-gray-500 text-sm italic mt-4">Nenhum dado encontrado para esta consulta.</p>;
    const headers = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50">
            <tr>{headers.map(h => <th key={h} className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {headers.map(h => <td key={h} className="px-4 py-3 text-gray-600 whitespace-nowrap">{row[h] !== null ? String(row[h]) : <span className="text-gray-400 italic">null</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">

      <aside className="w-72 bg-gray-900 text-gray-300 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            <span>+</span> Nova Consulta
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Histórico</p>
          {sessions.length === 0 && <p className="text-sm px-2 text-gray-500">Nenhuma conversa ainda.</p>}
          {sessions.map(session => (
            <div
              key={session.id}
              className={`group flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${session.id === activeSessionId ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/50'
                }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              {editingSessionId === session.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  onBlur={() => saveEditedTitle(session.id)}
                  onKeyDown={(e) => handleEditKeyDown(e, session.id)}
                  className="bg-gray-700 text-white px-2 py-1 flex-1 outline-none text-sm rounded shadow-inner"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="truncate flex-1 pr-2">💬 {session.title}</div>
              )}

              {/* Botões de Ação que aparecem no hover */}
              {editingSessionId !== session.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => startEditing(e, session)}
                    className="p-1 cursor-pointer hover:text-blue-400" title="Renomear"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="p-1 cursor-pointer hover:text-red-400" title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content (Área de Chat Atual) */}
      <div className="flex flex-col flex-1 relative">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm z-10">
          <h1 className="text-xl font-bold font-sans flex items-center gap-2 text-gray-800">
            V-Commerce Chat Bot
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 flex flex-col">
          <div className="max-w-4xl mx-auto space-y-6 flex-1 flex flex-col w-full">

            {(!activeSession || messages.length === 0) && (
              <div className="flex flex-col items-center justify-center flex-1 animate-fade-in" style={{ marginTop: '-80px' }}>
                <img
                  src="/v-commerce_png_digital_logo.png"
                  alt="Logo do E-Commerce"
                  className="w-80 h-80 object-contain -mb-16"
                />
                <div className="text-center -mt-4">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-2">Como posso ajudar a analisar os dados hoje?</h2>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-0">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all text-sm font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-5 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-md' : 'bg-white border border-gray-100 shadow-sm rounded-tl-none'}`}>
                  {msg.role === 'user' && <p className="text-[15px] leading-relaxed">{msg.text}</p>}

                  {msg.role === 'ai' && msg.error && (
                    <div className="text-red-500 flex items-start gap-2"><span>⚠️</span><p className="text-sm font-medium">{msg.error}</p></div>
                  )}

                  {msg.role === 'ai' && !msg.error && (
                    <div className="space-y-4">
                      {msg.reasoning && (
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><span>🧠</span> Raciocínio</h4>
                          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{msg.reasoning}</p>
                        </div>
                      )}
                      {msg.sql && (
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><span>⚙️</span> SQL</h4>
                          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto shadow-inner"><code className="text-sm font-mono whitespace-pre-wrap">{msg.sql}</code></pre>
                        </div>
                      )}
                      {msg.data !== undefined && renderTable(msg.data)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none p-5 max-w-[85%] flex items-center gap-3">
                  <span className="text-sm text-gray-500 font-medium">Processando e gerando SQL...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} placeholder="Faça uma pergunta..." className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-blue-500 focus:border-blue-500 block pl-5 pr-14 py-3.5 shadow-inner transition-all disabled:opacity-50" />
            <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}