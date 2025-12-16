import React, { useState, useEffect, useRef } from 'react';
import { Save, LogOut, Printer, Undo, Redo, FileText, UserPlus, Sidebar } from 'lucide-react';

interface MenuBarProps {
  onSave: () => void;
  onExit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onShare: () => void;
  onToggleSidebar: () => void;
  isSaved: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ 
  onSave, onExit, onUndo, onRedo, onExport, onShare, onToggleSidebar, isSaved 
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const MenuItem: React.FC<{ 
    icon?: React.ReactNode; 
    label: string; 
    shortcut?: string; 
    onClick: () => void;
    disabled?: boolean;
  }> = ({ icon, label, shortcut, onClick, disabled }) => (
    <button 
      onClick={() => {
        onClick();
        setActiveMenu(null);
      }}
      disabled={disabled}
      className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="w-4">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-gray-400 font-medium">{shortcut}</span>}
    </button>
  );

  return (
    <div className="flex gap-1 text-sm text-gray-700 mt-1 select-none relative" ref={menuRef}>
      {/* Dosya Menüsü */}
      <div className="relative">
        <button 
          onClick={() => handleMenuClick('file')}
          className={`px-2 py-0.5 rounded hover:bg-gray-100 transition-colors ${activeMenu === 'file' ? 'bg-gray-200' : ''}`}
        >
          Dosya
        </button>
        {activeMenu === 'file' && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
            <MenuItem icon={<Save size={14} />} label="Kaydet" shortcut="Ctrl+S" onClick={onSave} />
            <MenuItem icon={<FileText size={14} />} label="Yeni Belge Oluştur" onClick={onExit} />
            <div className="h-px bg-gray-200 my-1" />
            <MenuItem icon={<Printer size={14} />} label="Dışa Aktar / Yazdır" shortcut="Ctrl+P" onClick={onExport} />
            <div className="h-px bg-gray-200 my-1" />
            <MenuItem icon={<LogOut size={14} />} label="Ana Ekrana Dön" onClick={onExit} />
          </div>
        )}
      </div>

      {/* Düzenle Menüsü */}
      <div className="relative">
        <button 
          onClick={() => handleMenuClick('edit')}
          className={`px-2 py-0.5 rounded hover:bg-gray-100 transition-colors ${activeMenu === 'edit' ? 'bg-gray-200' : ''}`}
        >
          Düzenle
        </button>
        {activeMenu === 'edit' && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
            <MenuItem icon={<Undo size={14} />} label="Geri Al" shortcut="Ctrl+Z" onClick={onUndo} />
            <MenuItem icon={<Redo size={14} />} label="Yinele" shortcut="Ctrl+Y" onClick={onRedo} />
          </div>
        )}
      </div>

      {/* Görünüm Menüsü */}
      <div className="relative">
        <button 
          onClick={() => handleMenuClick('view')}
          className={`px-2 py-0.5 rounded hover:bg-gray-100 transition-colors ${activeMenu === 'view' ? 'bg-gray-200' : ''}`}
        >
          Görünüm
        </button>
        {activeMenu === 'view' && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
            <MenuItem icon={<Sidebar size={14} />} label="Yan Paneli Aç/Kapat" onClick={onToggleSidebar} />
          </div>
        )}
      </div>

      {/* Ekle Menüsü */}
      <div className="relative">
        <button 
          onClick={() => handleMenuClick('insert')}
          className={`px-2 py-0.5 rounded hover:bg-gray-100 transition-colors ${activeMenu === 'insert' ? 'bg-gray-200' : ''}`}
        >
          Ekle
        </button>
        {activeMenu === 'insert' && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
            <MenuItem icon={<UserPlus size={14} />} label="Kişi Ekle" onClick={onShare} />
          </div>
        )}
      </div>

      <div className="px-2 py-0.5 text-gray-400 cursor-not-allowed">Biçim</div>
      <div className="px-2 py-0.5 text-gray-400 cursor-not-allowed">Araçlar</div>
      <div className="px-2 py-0.5 text-gray-400 cursor-not-allowed">Yardım</div>
    </div>
  );
};

export default MenuBar;