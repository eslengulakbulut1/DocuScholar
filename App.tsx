import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import AssistantSidebar from './components/AssistantSidebar';
import Dashboard from './components/Dashboard';
import MenuBar from './components/MenuBar';
import { TemplateType, Draft, Comment } from './types';
import { FileText, Share2, ArrowLeft, MessageSquare, CloudCheck, Loader2, Save, X, UserPlus, Users } from 'lucide-react';

type ViewState = 'dashboard' | 'editor';

// Sayfa Ayarları Tipi
export interface PageConfig {
  size: 'A4' | 'Letter';
  margin: 'normal' | 'narrow' | 'wide';
}

const App: React.FC = () => {
  // --- State Management ---
  const [view, setView] = useState<ViewState>('dashboard');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  
  // Editor State (Synced to currentDraft)
  const [documentContent, setDocumentContent] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [documentCollaborators, setDocumentCollaborators] = useState<string[]>([]);
  const [documentComments, setDocumentComments] = useState<Comment[]>([]);
  
  // Page Config State (Default A4, Normal)
  const [pageConfig, setPageConfig] = useState<PageConfig>({ size: 'A4', margin: 'normal' });

  // UI State
  const [formatAction, setFormatAction] = useState<{ command: string; value?: string; timestamp: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newCollaboratorName, setNewCollaboratorName] = useState('');

  // --- Initialization ---
  useEffect(() => {
    const storedDraftsStr = localStorage.getItem('scholar_drafts');
    let loadedDrafts: Draft[] = [];

    if (storedDraftsStr) {
      try {
        loadedDrafts = JSON.parse(storedDraftsStr);
      } catch (e) {
        console.error("Failed to parse drafts", e);
      }
    }
    setDrafts(loadedDrafts);
  }, []);

  // --- Persistence ---
  const saveToStorage = (updatedDrafts: Draft[]) => {
    localStorage.setItem('scholar_drafts', JSON.stringify(updatedDrafts));
  };

  const persistCurrentDraft = () => {
    if (!currentDraftId) return;
    
    setSaveStatus('saving');
    const timestamp = Date.now();

    setDrafts(prevDrafts => {
      const updatedDrafts = prevDrafts.map(d => {
        if (d.id === currentDraftId) {
          return {
            ...d,
            content: documentContent,
            title: documentTitle,
            collaborators: documentCollaborators,
            comments: documentComments,
            lastModified: timestamp
          };
        }
        return d;
      });
      saveToStorage(updatedDrafts);
      return updatedDrafts;
    });

    // Short delay to show "Saving..." spinner for UX
    setTimeout(() => {
        setSaveStatus('saved');
    }, 500);
  };

  // Auto-save logic (Debounced)
  useEffect(() => {
    if (view === 'editor' && currentDraftId) {
      setSaveStatus('saving');
      const handler = setTimeout(() => {
        persistCurrentDraft();
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [documentContent, documentTitle, documentCollaborators, documentComments, currentDraftId, view]);

  // Toast Timer
  useEffect(() => {
    if (toast && toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => prev ? { ...prev, visible: false } : null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Handlers ---

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  const handleTemplateSelect = (template: TemplateType) => {
    const newDraft: Draft = {
      id: Date.now().toString(),
      title: 'Adsız Belge',
      template: template,
      content: '',
      lastModified: Date.now(),
      collaborators: [],
      comments: [],
      isDeleted: false
    };

    setDrafts(prev => {
      const updated = [...prev, newDraft];
      saveToStorage(updated);
      return updated;
    });

    setCurrentDraftId(newDraft.id);
    setDocumentContent('');
    setDocumentTitle(newDraft.title);
    setDocumentCollaborators([]);
    setDocumentComments([]);
    setActiveFormats([]); // Reset toolbar state
    setPageConfig({ size: 'A4', margin: 'normal' }); // Reset page config
    setView('editor');
  };

  const handleDraftSelect = (draft: Draft) => {
    if (draft.isDeleted) return; // Deleted drafts cannot be opened directly
    setCurrentDraftId(draft.id);
    setDocumentContent(draft.content);
    setDocumentTitle(draft.title);
    setDocumentCollaborators(draft.collaborators || []);
    setDocumentComments(draft.comments || []);
    setActiveFormats([]); // Reset toolbar state
    // Note: In a real app, page config would also be saved in the Draft object
    setView('editor');
  };

  const handleRenameDraft = (id: string, newTitle: string) => {
    const updatedDrafts = drafts.map(d => 
        d.id === id ? { ...d, title: newTitle, lastModified: Date.now() } : d
    );
    setDrafts(updatedDrafts);
    saveToStorage(updatedDrafts);
  };

  // Soft Delete (Move to Trash)
  const handleSoftDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedDrafts = drafts.map(d => 
      d.id === id ? { ...d, isDeleted: true } : d
    );
    setDrafts(updatedDrafts);
    saveToStorage(updatedDrafts);
    showToast('Dosya çöp kutusuna taşındı.');
  };

  // Restore from Trash
  const handleRestoreDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedDrafts = drafts.map(d => 
      d.id === id ? { ...d, isDeleted: false } : d
    );
    setDrafts(updatedDrafts);
    saveToStorage(updatedDrafts);
    showToast('Dosya geri yüklendi.');
  };

  // Permanent Delete
  const handlePermanentDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Bu belge kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?')) {
      const updatedDrafts = drafts.filter(d => d.id !== id);
      setDrafts(updatedDrafts);
      saveToStorage(updatedDrafts);
    }
  };

  const handleBackToDashboard = () => {
    persistCurrentDraft(); // Ensure saved
    setView('dashboard');
    setCurrentDraftId(null);
    setActiveFormats([]); // Reset toolbar state
  };

  const handleManualSave = () => {
    persistCurrentDraft();
  };

  const handleExport = () => {
    window.print();
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollaboratorName.trim()) {
        setDocumentCollaborators(prev => [...prev, newCollaboratorName.trim()]);
        setNewCollaboratorName('');
        // Modal stays open to add more or can be closed
    }
  };

  const handleAddComment = (text: string, author: string) => {
      const newComment: Comment = {
          id: Date.now().toString(),
          text,
          author,
          timestamp: Date.now()
      };
      setDocumentComments(prev => [...prev, newComment]);
  };

  const handleFormat = (command: string, value?: string) => {
      if (command === 'undo') document.execCommand('undo');
      else if (command === 'redo') document.execCommand('redo');
      else setFormatAction({ command, value, timestamp: Date.now() });
  };

  // --- Render ---

  return (
    <>
      {/* Toast Notification */}
      {toast && toast.visible && (
        <div className="fixed bottom-6 left-6 z-[100] bg-gray-900 text-white px-6 py-3 rounded-md shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <span className="text-sm font-medium">{toast.message}</span>
           <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-white">
             <X size={16} />
           </button>
        </div>
      )}

      {view === 'dashboard' ? (
        <Dashboard 
          drafts={drafts}
          onTemplateSelect={handleTemplateSelect}
          onDraftSelect={handleDraftSelect}
          onDeleteDraft={handleSoftDeleteDraft}
          onRestoreDraft={handleRestoreDraft}
          onPermanentDelete={handlePermanentDelete}
          onRenameDraft={handleRenameDraft}
        />
      ) : (
        // Editor View
        (() => {
          const currentDraft = drafts.find(d => d.id === currentDraftId);
          if (!currentDraft) return <div>Belge bulunamadı.</div>;

          return (
            <div className="flex flex-col h-screen bg-[#f9fbfd] overflow-hidden font-sans text-gray-900">
              
              {/* Share Modal */}
              {isShareModalOpen && (
                  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                          <div className="flex justify-between items-center mb-4">
                              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                  <UserPlus size={24} className="text-blue-600" />
                                  Kişilerle Paylaş
                              </h2>
                              <button onClick={() => setIsShareModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                  <X size={24} />
                              </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                              Belgeye katkıda bulunması için arkadaşlarınızı ekleyin.
                          </p>
                          
                          <form onSubmit={handleAddCollaborator} className="flex gap-2 mb-6">
                              <input 
                                type="text" 
                                value={newCollaboratorName}
                                onChange={(e) => setNewCollaboratorName(e.target.value)}
                                placeholder="İsim girin..."
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <button type="submit" disabled={!newCollaboratorName.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                                  Ekle
                              </button>
                          </form>

                          <div className="space-y-2">
                              <h3 className="text-xs font-semibold text-gray-500 uppercase">Erişimi Olanlar</h3>
                              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                  <div className="w-8 h-8 bg-purple-600 rounded-full text-white flex items-center justify-center text-xs font-bold">Sen</div>
                                  <span className="text-sm font-medium">Sen (Sahip)</span>
                              </div>
                              {documentCollaborators.map((name, i) => (
                                  <div key={i} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg">
                                      <div className="w-8 h-8 bg-gray-200 rounded-full text-gray-600 flex items-center justify-center text-xs font-bold">
                                          {name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-sm font-medium">{name}</span>
                                      <span className="ml-auto text-xs text-gray-400">Düzenleyen</span>
                                  </div>
                              ))}
                          </div>

                          <div className="mt-6 flex justify-end">
                              <button onClick={() => setIsShareModalOpen(false)} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700">
                                  Tamamlandı
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Header */}
              <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200 z-40">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleBackToDashboard}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    title="Ana Sayfa"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  
                  <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <FileText size={24} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="text"
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        className="text-lg font-medium text-gray-800 leading-tight bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-all px-1"
                        placeholder="Belge Başlığı"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        {saveStatus === 'saving' ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Kaydediliyor...</span>
                          </>
                        ) : (
                          <>
                            <CloudCheck size={14} className="text-gray-400" />
                            <span>Kaydedildi</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Functional Menu Bar */}
                    <MenuBar 
                        onSave={handleManualSave}
                        onExit={handleBackToDashboard}
                        onUndo={() => handleFormat('undo')}
                        onRedo={() => handleFormat('redo')}
                        onExport={handleExport}
                        onShare={() => setIsShareModalOpen(true)}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        isSaved={saveStatus === 'saved'}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Manual Save Icon Button (Quick Access) */}
                    <button 
                        onClick={handleManualSave}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Kaydet"
                    >
                        <Save size={20} />
                    </button>

                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`flex items-center justify-center p-2 rounded-full transition-colors ${sidebarOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    title="Asistanı Aç/Kapat"
                  >
                    <div className="relative flex items-center justify-center">
                      <MessageSquare size={26} className="text-current" />
                      <span className="absolute text-[9px] font-extrabold top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-current">
                        AI
                      </span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
                  >
                    <Share2 size={16} />
                    Paylaş
                  </button>
                  
                  <div className="flex -space-x-2 overflow-hidden">
                     <div className="w-8 h-8 bg-purple-600 rounded-full text-white flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm z-10" title="Sen">
                        Sen
                     </div>
                     {documentCollaborators.slice(0, 3).map((collab, idx) => (
                         <div key={idx} className="w-8 h-8 bg-gray-300 rounded-full text-gray-700 flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm" title={collab}>
                             {collab.charAt(0).toUpperCase()}
                         </div>
                     ))}
                     {documentCollaborators.length > 3 && (
                         <div className="w-8 h-8 bg-gray-100 rounded-full text-gray-600 flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
                             +{documentCollaborators.length - 3}
                         </div>
                     )}
                  </div>
                </div>
              </header>

              {/* Main Content Area */}
              <div className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 flex flex-col min-w-0 relative">
                  <Toolbar 
                    onFormat={handleFormat} 
                    activeFormats={activeFormats} 
                    pageConfig={pageConfig}
                    onPageConfigChange={setPageConfig}
                  />
                  <Editor 
                    key={currentDraftId} 
                    template={currentDraft.template} 
                    onContentChange={setDocumentContent}
                    formatTrigger={formatAction}
                    onSelectionChange={setActiveFormats}
                    initialContent={documentContent}
                    pageConfig={pageConfig}
                  />
                </div>

                {/* Sidebar */}
                <div 
                  className={`transition-all duration-300 ease-in-out transform ${
                    sidebarOpen ? 'translate-x-0 w-full md:w-[350px] lg:w-[400px]' : 'translate-x-full w-0'
                  } flex-shrink-0 border-l border-gray-200 shadow-xl z-20 absolute right-0 top-0 bottom-0 md:relative`}
                >
                  {sidebarOpen && (
                    <AssistantSidebar 
                      key={currentDraftId} 
                      template={currentDraft.template} 
                      documentContent={documentContent}
                      comments={documentComments}
                      onAddComment={handleAddComment}
                      collaborators={documentCollaborators}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </>
  );
};

export default App;