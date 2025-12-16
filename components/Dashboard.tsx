import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, Search, Grid, MoreVertical, Folder, List as ListIcon, 
  FileText, Clock, Trash2, Plus, LayoutGrid, RotateCcw, X, LogOut, UserPlus, Settings
} from 'lucide-react';
import { Draft, TemplateType, TEMPLATE_CONFIGS } from '../types';

interface DashboardProps {
  drafts: Draft[];
  onTemplateSelect: (template: TemplateType) => void;
  onDraftSelect: (draft: Draft) => void;
  onDeleteDraft: (e: React.MouseEvent, id: string) => void; // Soft delete
  onRestoreDraft: (e: React.MouseEvent, id: string) => void; // Restore
  onPermanentDelete: (e: React.MouseEvent, id: string) => void; // Hard delete
  onRenameDraft: (id: string, newTitle: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  drafts, onTemplateSelect, onDraftSelect, onDeleteDraft, onRestoreDraft, onPermanentDelete, onRenameDraft 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<'active' | 'trash'>('active');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase());
    const isDeleted = draft.isDeleted === true;
    
    if (currentFolder === 'active') {
      return matchesSearch && !isDeleted;
    } else {
      return matchesSearch && isDeleted;
    }
  });

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(timestamp));
  };

  const getPreviewText = (html: string) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const text = doc.body.textContent || "";
      return text.replace(/\s+/g, ' ').trim().slice(0, 250);
  };

  const TemplateCard = ({ type, color }: { type: TemplateType, color: string }) => {
    const config = TEMPLATE_CONFIGS[type];
    return (
      <div 
        onClick={() => onTemplateSelect(type)}
        className="cursor-pointer group flex flex-col gap-2 w-36 sm:w-40 flex-shrink-0"
      >
        <div className="h-48 sm:h-52 bg-white border border-gray-300 rounded hover:border-blue-500 hover:shadow transition-all relative overflow-hidden">
          <div className="p-4 space-y-2 opacity-50 select-none pointer-events-none">
            <div className={`w-3/4 h-2 rounded ${color}`} />
            <div className="w-1/2 h-2 bg-gray-200 rounded" />
            <div className="space-y-1 mt-4">
              <div className="w-full h-1 bg-gray-100 rounded" />
              <div className="w-full h-1 bg-gray-100 rounded" />
              <div className="w-2/3 h-1 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 truncate" title={config.name}>
            {config.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">
             {config.name === 'IMRAD Araştırma Makalesi' ? 'Bilimsel Makale' : 
              config.name === 'Tez / Bitirme Projesi' ? 'Tez' : 
              config.name === 'TÜBİTAK Proje Önerisi' ? 'Proje' :
              config.name === 'Literatür Taraması' ? 'Literatür' : 'Rapor'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden relative">
      
      {/* Sidebar Drawer */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] shadow-xl transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-blue-600">
           <FileText size={24} />
           <span className="text-xl font-medium text-gray-700">Dokümanlar</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
           <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Klasörler</div>
           <button 
             onClick={() => { setCurrentFolder('active'); setIsSidebarOpen(false); }}
             className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${currentFolder === 'active' ? 'bg-blue-50 text-blue-700 rounded-r-full' : 'text-gray-700 hover:bg-gray-100 rounded-r-full'}`}
           >
              <FileText size={18} />
              Dokümanlarım
           </button>
           <button 
             onClick={() => { setCurrentFolder('trash'); setIsSidebarOpen(false); }}
             className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${currentFolder === 'trash' ? 'bg-red-50 text-red-700 rounded-r-full' : 'text-gray-700 hover:bg-gray-100 rounded-r-full'}`}
           >
              <Trash2 size={18} />
              Çöp Kutusu
           </button>

           <div className="mt-6 px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Son Dosyalar</div>
           {drafts.filter(d => !d.isDeleted).slice(0, 8).map(d => (
             <button
               key={d.id}
               onClick={() => { onDraftSelect(d); setIsSidebarOpen(false); }}
               className="w-full flex items-center gap-3 px-6 py-2 text-sm text-gray-600 hover:bg-gray-100 truncate"
             >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                   d.template === TemplateType.IMRAD ? 'bg-blue-400' :
                   d.template === TemplateType.THESIS ? 'bg-purple-400' : 
                   d.template === TemplateType.TUBITAK ? 'bg-red-400' :
                   d.template === TemplateType.LITERATURE ? 'bg-yellow-400' : 'bg-emerald-400'
                }`} />
                <span className="truncate">{d.title}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white px-4 py-2 flex items-center justify-between shadow-sm border-b border-gray-200 h-16">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => setIsSidebarOpen(true)} className="p-3 rounded-full hover:bg-gray-100 text-gray-600">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-10 bg-blue-600 rounded flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            <span className="text-xl text-gray-600 font-medium hidden sm:block">
               {currentFolder === 'active' ? 'Dokümanlar' : 'Çöp Kutusu'}
            </span>
          </div>
        </div>

        <div className="flex-grow max-w-2xl px-4 hidden md:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-500 group-focus-within:text-black" />
            </div>
            <input
              type="text"
              placeholder="Arama"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-none rounded-lg leading-5 bg-[#f1f3f4] text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-200 focus:shadow-md transition-all sm:text-base"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button 
             onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
             className="p-3 rounded-full hover:bg-gray-100 text-gray-600"
             title={viewMode === 'grid' ? "Liste görünümü" : "Izgara görünümü"}
          >
             {viewMode === 'grid' ? <ListIcon size={24} /> : <LayoutGrid size={24} />}
          </button>
          <button className="p-3 rounded-full hover:bg-gray-100 text-gray-600">
             <Grid size={24} />
          </button>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <div 
               onClick={() => setIsProfileOpen(!isProfileOpen)}
               className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-600 rounded-full text-white flex items-center justify-center font-medium text-sm border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-gray-200 select-none"
            >
              E
            </div>

            {isProfileOpen && (
               <div className="absolute right-0 top-12 w-[350px] bg-[#eef1f6] rounded-[28px] shadow-xl z-50 p-4 border border-gray-200 animate-in fade-in slide-in-from-top-2">
                  <button 
                     onClick={() => setIsProfileOpen(false)} 
                     className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                     <X size={20} />
                  </button>
                  <div className="text-center mb-4">
                     <p className="text-sm font-medium text-gray-600 mb-4">akbuluteslengul@gmail.com</p>
                     <div className="relative inline-block">
                        <div className="w-20 h-20 bg-purple-600 rounded-full text-white flex items-center justify-center text-4xl font-normal mx-auto mb-2">
                           E
                        </div>
                        <div className="absolute bottom-2 right-0 bg-white p-1 rounded-full shadow-md cursor-pointer text-gray-700">
                           <div className="bg-transparent">📷</div>
                        </div>
                     </div>
                     <h2 className="text-xl font-normal text-gray-800">Merhaba Eslen Gül!</h2>
                  </div>
                  
                  <div className="flex justify-center mb-6">
                     <button className="border border-gray-400 rounded-full px-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors bg-transparent">
                        Google Hesabınızı yönetin
                     </button>
                  </div>

                  <div className="flex bg-white rounded-3xl overflow-hidden shadow-sm">
                      <button className="flex-1 flex items-center justify-center gap-2 py-4 hover:bg-gray-50 border-r border-gray-100 transition-colors">
                          <UserPlus size={20} className="text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Hesap ekle</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-4 hover:bg-gray-50 transition-colors">
                          <LogOut size={20} className="text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Oturumu kapat</span>
                      </button>
                  </div>
                  
                  <div className="flex justify-center gap-4 mt-4 text-[11px] text-gray-500">
                      <a href="#" className="hover:text-gray-700">Gizlilik Politikası</a>
                      <span>•</span>
                      <a href="#" className="hover:text-gray-700">Hizmet Şartları</a>
                  </div>
               </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Template Gallery (Only in Active View) */}
        {currentFolder === 'active' && (
            <div className="bg-[#f1f3f4] py-4 pb-8">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-base text-gray-800 font-medium">Yeni bir doküman hazırlamaya başlayın</h2>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                    <MoreVertical size={20} />
                </button>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                <TemplateCard type={TemplateType.IMRAD} color="bg-blue-200" />
                <TemplateCard type={TemplateType.THESIS} color="bg-purple-200" />
                <TemplateCard type={TemplateType.REPORT} color="bg-emerald-200" />
                <TemplateCard type={TemplateType.TUBITAK} color="bg-red-200" />
                <TemplateCard type={TemplateType.LITERATURE} color="bg-yellow-200" />
                </div>
            </div>
            </div>
        )}

        {/* Content Section */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-gray-800">
               {currentFolder === 'active' ? 'Son dokümanlar' : 'Çöp Kutusu (30 gün sonra otomatik silinir)'}
            </h2>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
                <span className="text-sm font-medium">Sıralama</span>
                <MoreVertical size={16} />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded">
                 <Folder size={20} />
              </button>
            </div>
          </div>

          {filteredDrafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                {currentFolder === 'active' ? <FileText size={32} className="text-gray-300" /> : <Trash2 size={32} className="text-gray-300" />}
              </div>
              <p>
                 {currentFolder === 'active' ? 'Henüz bir doküman bulunmuyor.' : 'Çöp kutusu boş.'}
              </p>
            </div>
          ) : (
             viewMode === 'grid' ? (
                // GRID VIEW
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredDrafts.sort((a, b) => b.lastModified - a.lastModified).map((draft) => (
                    <div 
                    key={draft.id}
                    onClick={() => { if(currentFolder === 'active') onDraftSelect(draft); }}
                    className={`group cursor-pointer border border-gray-200 rounded-lg bg-white transition-all flex flex-col h-72 relative shadow-sm hover:shadow-md ${currentFolder === 'active' ? 'hover:border-blue-500' : 'opacity-80'}`}
                    >
                    <div className="flex-1 bg-white p-4 overflow-hidden relative border-b border-gray-100">
                        <div className="text-[10px] text-gray-500 select-none leading-relaxed overflow-hidden h-full">
                            {getPreviewText(draft.content)}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    </div>
                    
                    <div className="p-3 bg-white">
                        {currentFolder === 'active' ? (
                            <input 
                            type="text"
                            defaultValue={draft.title || 'Adsız Belge'}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => onRenameDraft(draft.id, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                            className="text-sm font-medium text-gray-700 truncate mb-1 pr-6 w-full border border-transparent rounded hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-1 -ml-1 py-0.5 transition-colors bg-transparent"
                            />
                        ) : (
                            <h3 className="text-sm font-medium text-gray-700 truncate mb-1">{draft.title || 'Adsız Belge'}</h3>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                        <div className={`p-0.5 rounded ${
                            draft.template === TemplateType.IMRAD ? 'bg-blue-100 text-blue-600' :
                            draft.template === TemplateType.THESIS ? 'bg-purple-100 text-purple-600' :
                            draft.template === TemplateType.TUBITAK ? 'bg-red-100 text-red-600' :
                            draft.template === TemplateType.LITERATURE ? 'bg-yellow-100 text-yellow-600' :
                            'bg-emerald-100 text-emerald-600'
                        }`}>
                            <FileText size={12} />
                        </div>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                            {formatDate(draft.lastModified)}
                        </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {currentFolder === 'active' ? (
                        <button 
                            onClick={(e) => onDeleteDraft(e, draft.id)}
                            className="absolute bottom-3 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Çöp Kutusuna Taşı"
                        >
                            <Trash2 size={16} />
                        </button>
                    ) : (
                        <div className="absolute bottom-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => onRestoreDraft(e, draft.id)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                                title="Geri Yükle"
                             >
                                <RotateCcw size={16} />
                            </button>
                            <button 
                                onClick={(e) => onPermanentDelete(e, draft.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                title="Kalıcı Olarak Sil"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                    </div>
                ))}
                </div>
             ) : (
                // LIST VIEW
                <div className="flex flex-col border border-gray-200 rounded-lg bg-white">
                    {filteredDrafts.sort((a, b) => b.lastModified - a.lastModified).map((draft, idx) => (
                         <div 
                           key={draft.id}
                           onClick={() => { if(currentFolder === 'active') onDraftSelect(draft); }}
                           className={`flex items-center p-3 border-b border-gray-100 last:border-none hover:bg-blue-50/50 cursor-pointer group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                         >
                            <div className={`p-1.5 rounded mr-3 ${
                                draft.template === TemplateType.IMRAD ? 'bg-blue-100 text-blue-600' :
                                draft.template === TemplateType.THESIS ? 'bg-purple-100 text-purple-600' :
                                draft.template === TemplateType.TUBITAK ? 'bg-red-100 text-red-600' :
                                draft.template === TemplateType.LITERATURE ? 'bg-yellow-100 text-yellow-600' :
                                'bg-emerald-100 text-emerald-600'
                            }`}>
                                <FileText size={16} />
                            </div>
                            <div className="flex-1 min-w-0 mr-4">
                                {currentFolder === 'active' ? (
                                    <input 
                                        type="text"
                                        defaultValue={draft.title || 'Adsız Belge'}
                                        onClick={(e) => e.stopPropagation()}
                                        onBlur={(e) => onRenameDraft(draft.id, e.target.value)}
                                        className="text-sm font-medium text-gray-800 bg-transparent truncate w-full hover:underline focus:no-underline focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1"
                                    />
                                ) : (
                                    <span className="text-sm font-medium text-gray-800">{draft.title || 'Adsız Belge'}</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 w-32 hidden sm:block">
                                {draft.collaborators.length > 0 ? 'Ben, ' + draft.collaborators[0] : 'Sadece ben'}
                            </div>
                            <div className="text-xs text-gray-500 w-24 text-right mr-4">
                                {formatDate(draft.lastModified)}
                            </div>
                            <div className="flex items-center justify-end w-16 opacity-0 group-hover:opacity-100 transition-opacity">
                                {currentFolder === 'active' ? (
                                    <button 
                                        onClick={(e) => onDeleteDraft(e, draft.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-full"
                                        title="Çöp Kutusuna Taşı"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={(e) => onRestoreDraft(e, draft.id)}
                                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-full"
                                            title="Geri Yükle"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => onPermanentDelete(e, draft.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-full"
                                            title="Kalıcı Olarak Sil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                         </div>
                    ))}
                </div>
             )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;