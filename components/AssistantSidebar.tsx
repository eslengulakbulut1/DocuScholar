import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2, AlertCircle, MessageSquare, Users, PlusCircle } from 'lucide-react';
import { ChatMessage, Comment, TemplateType, TEMPLATE_CONFIGS } from '../types';
import { generateAssistantResponse, analyzeDocument } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface AssistantSidebarProps {
  template: TemplateType;
  documentContent: string;
  comments: Comment[];
  onAddComment: (text: string, author: string) => void;
  collaborators: string[];
}

type Tab = 'assistant' | 'team';

const AssistantSidebar: React.FC<AssistantSidebarProps> = ({ 
  template, 
  documentContent, 
  comments, 
  onAddComment,
  collaborators 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('assistant');
  
  // Assistant State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Merhaba! Ben **${TEMPLATE_CONFIGS[template].name}** şablonu için Akademik Yazma Asistanınızım. Bugün belgenizi yapılandırmanıza nasıl yardımcı olabilirim?`,
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Comments State
  const [commentInput, setCommentInput] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('Sen');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, activeTab, comments]);

  // --- Assistant Logic ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    const responseText = await generateAssistantResponse(
      [...messages, newUserMsg],
      documentContent,
      template
    );

    const newModelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newModelMsg]);
    setIsTyping(false);
  };

  const handleQuickAnalyze = async () => {
    setIsTyping(true);
    const analysis = await analyzeDocument(documentContent, template);
    
    const newModelMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `**Hızlı Belge Analizi:**\n\n${analysis}`,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, newModelMsg]);
    setIsTyping(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Comments Logic ---
  const handleSubmitComment = () => {
    if (!commentInput.trim()) return;
    onAddComment(commentInput, selectedAuthor);
    setCommentInput('');
  };

  const allAuthors = ['Sen', ...collaborators];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full md:w-[350px] lg:w-[400px] shadow-xl z-20">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'assistant' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Sparkles size={16} />
          Asistan
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'team' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users size={16} />
          Ekip & Yorumlar
          {comments.length > 0 && (
            <span className="bg-gray-200 text-gray-700 text-xs py-0.5 px-2 rounded-full">
              {comments.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'assistant' ? (
        <>
          {/* Quick Actions */}
          <div className="p-3 bg-gray-50 border-b border-gray-100">
             <button 
               onClick={handleQuickAnalyze}
               disabled={isTyping}
               className="w-full py-2 px-3 bg-white border border-blue-200 text-blue-600 text-xs font-medium rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Sparkles size={14} />
               Mevcut Belgeyi Analiz Et
             </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'model' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
                </div>
                
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.role === 'model' ? (
                     <div className="prose prose-sm prose-blue max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                   <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none p-3 text-xs italic shadow-sm">
                  Yapı analiz ediliyor ve öneriler oluşturuluyor...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Alıntılar, ton veya yapı hakkında sor..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 pr-10 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all max-h-32 min-h-[50px]"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute bottom-2 right-2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
              <AlertCircle size={10} />
              Yapay zeka önerileri hatalı olabilir. Alıntıları her zaman doğrulayın.
            </p>
          </div>
        </>
      ) : (
        // --- TEAM / COMMENTS TAB ---
        <div className="flex flex-col h-full bg-gray-50/30">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Bu belgedeki kişiler</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">
                Sen (Yazar)
              </div>
              {collaborators.map((collab, idx) => (
                <div key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200 flex items-center gap-1">
                  <User size={12} />
                  {collab}
                </div>
              ))}
              {collaborators.length === 0 && (
                <span className="text-xs text-gray-400 italic">Henüz kimse eklenmedi.</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <MessageSquare size={32} className="opacity-20" />
                <p className="text-sm">Henüz yorum yok.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-800">{comment.author}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(comment.timestamp))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
             {/* Author Selector (Simulation) */}
             {collaborators.length > 0 && (
               <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                 <span>Kim olarak yazıyorsun?</span>
                 <select 
                    value={selectedAuthor} 
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="bg-gray-100 border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                 >
                   {allAuthors.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                 </select>
               </div>
             )}
            <div className="relative">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                    }
                }}
                placeholder="Yorum ekle..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 pr-10 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all max-h-32 min-h-[50px]"
                rows={2}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentInput.trim()}
                className="absolute bottom-2 right-2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantSidebar;