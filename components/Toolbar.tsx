import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  AlignJustify, List, ListOrdered, Undo, Redo, 
  Heading1, Heading2, Quote, Baseline, Layout, ChevronDown, Check
} from 'lucide-react';
import { PageConfig } from '../App';

interface ToolbarProps {
  onFormat: (command: string, value?: string) => void;
  activeFormats: string[];
  pageConfig?: PageConfig;
  onPageConfigChange?: (config: PageConfig) => void;
}

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Lora', value: 'Lora, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
];

const FONT_SIZES = [
    { label: 'Çok Küçük (8pt)', value: '1' },
    { label: 'Küçük (10pt)', value: '2' },
    { label: 'Normal (12pt)', value: '3' },
    { label: 'Orta (14pt)', value: '4' },
    { label: 'Büyük (18pt)', value: '5' },
    { label: 'Çok Büyük (24pt)', value: '6' },
    { label: 'Dev (36pt)', value: '7' },
];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
];

const ToolbarButton: React.FC<{ 
  icon: React.ReactNode; 
  onClick: () => void; 
  tooltip: string;
  isActive?: boolean;
}> = ({ icon, onClick, tooltip, isActive }) => (
  <button
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`p-1.5 rounded-[4px] transition-colors duration-200 flex items-center justify-center ${
      isActive 
        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
    title={tooltip}
  >
    {icon}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-300 mx-2" />;

const Toolbar: React.FC<ToolbarProps> = ({ onFormat, activeFormats, pageConfig, onPageConfigChange }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target as Node)) {
        setShowLayoutMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentBlock = activeFormats.find(f => ['p', 'h1', 'h2', 'h3', 'blockquote'].includes(f)) || 'p';
  
  // Try to find the active font
  const activeFontRaw = activeFormats.find(f => f.startsWith('fontName:'))?.replace('fontName:', '').replace(/['"]/g, '');
  const currentFontOption = FONT_OPTIONS.find(opt => 
    activeFontRaw && opt.value.replace(/['"]/g, '').toLowerCase().includes(activeFontRaw.toLowerCase())
  );
  const currentFontValue = currentFontOption ? currentFontOption.value : FONT_OPTIONS[0].value;

  return (
    <div className="bg-[#edf2fa] px-4 py-2 flex items-center justify-center border-b border-gray-300 shadow-sm sticky top-0 z-30 min-h-[50px]">
      <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-gray-200 shadow-sm overflow-visible max-w-full flex-wrap justify-center sm:justify-start">
        
        {/* Undo / Redo */}
        <ToolbarButton icon={<Undo size={18} />} onClick={() => onFormat('undo')} tooltip="Geri Al" />
        <ToolbarButton icon={<Redo size={18} />} onClick={() => onFormat('redo')} tooltip="Yinele" />
        
        <Divider />
        
        {/* Font Family */}
        <select 
          className="bg-transparent text-sm outline-none text-gray-700 w-28 sm:w-32 cursor-pointer font-medium hover:text-blue-600 transition-colors truncate"
          onChange={(e) => onFormat('fontName', e.target.value)}
          value={currentFontValue}
          title="Yazı Tipi"
        >
            {FONT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
                {opt.label}
            </option>
            ))}
        </select>

        {/* Font Size */}
        <select
            className="bg-transparent text-sm outline-none text-gray-700 w-12 cursor-pointer font-medium hover:text-blue-600 transition-colors ml-1"
            onChange={(e) => onFormat('fontSize', e.target.value)}
            defaultValue="3"
            title="Yazı Boyutu"
        >
            {FONT_SIZES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.value}</option>
            ))}
        </select>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Block Type */}
        <select 
            className="bg-transparent text-sm outline-none text-gray-700 w-24 sm:w-28 cursor-pointer font-medium hover:text-blue-600 transition-colors"
            onChange={(e) => onFormat('formatBlock', e.target.value)}
            value={currentBlock}
            title="Stiller"
        >
            <option value="p">Normal</option>
            <option value="h1">Başlık 1</option>
            <option value="h2">Başlık 2</option>
            <option value="h3">Başlık 3</option>
            <option value="blockquote">Alıntı</option>
        </select>

        <Divider />

        {/* Text Formatting */}
        <ToolbarButton isActive={activeFormats.includes('bold')} icon={<Bold size={18} />} onClick={() => onFormat('bold')} tooltip="Kalın (Ctrl+B)" />
        <ToolbarButton isActive={activeFormats.includes('italic')} icon={<Italic size={18} />} onClick={() => onFormat('italic')} tooltip="İtalik (Ctrl+I)" />
        <ToolbarButton isActive={activeFormats.includes('underline')} icon={<Underline size={18} />} onClick={() => onFormat('underline')} tooltip="Altı Çizili (Ctrl+U)" />
        
        {/* Color Picker */}
        <div className="relative" ref={colorPickerRef}>
            <button
                className="p-1.5 rounded-[4px] hover:bg-gray-100 flex items-center justify-center gap-0.5 text-gray-700"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Yazı Rengi"
            >
                <div className="flex flex-col items-center">
                    <Baseline size={15} />
                    <div className="w-4 h-1 bg-black rounded-sm mt-0.5" style={{ backgroundColor: '#000' }}></div>
                </div>
                <ChevronDown size={10} className="text-gray-500" />
            </button>
            
            {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-48 animate-in fade-in zoom-in-95 duration-100">
                    <div className="grid grid-cols-5 gap-1">
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                className="w-8 h-8 rounded hover:scale-110 transition-transform border border-gray-100"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                    onFormat('foreColor', color);
                                    setShowColorPicker(false);
                                }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>

        <Divider />
        
        {/* Alignment */}
        <ToolbarButton isActive={activeFormats.includes('justifyLeft')} icon={<AlignLeft size={18} />} onClick={() => onFormat('justifyLeft')} tooltip="Sola Hizala" />
        <ToolbarButton isActive={activeFormats.includes('justifyCenter')} icon={<AlignCenter size={18} />} onClick={() => onFormat('justifyCenter')} tooltip="Ortala" />
        <ToolbarButton isActive={activeFormats.includes('justifyRight')} icon={<AlignRight size={18} />} onClick={() => onFormat('justifyRight')} tooltip="Sağa Hizala" />
        <ToolbarButton isActive={activeFormats.includes('justifyFull')} icon={<AlignJustify size={18} />} onClick={() => onFormat('justifyFull')} tooltip="İki Yana Yasla" />
        
        <Divider />
        
        {/* Lists */}
        <ToolbarButton isActive={activeFormats.includes('insertUnorderedList')} icon={<List size={18} />} onClick={() => onFormat('insertUnorderedList')} tooltip="Madde İşaretleri" />
        <ToolbarButton isActive={activeFormats.includes('insertOrderedList')} icon={<ListOrdered size={18} />} onClick={() => onFormat('insertOrderedList')} tooltip="Numaralı Liste" />
        
        <Divider />
        
        {/* Page Layout */}
        {pageConfig && onPageConfigChange && (
            <div className="relative" ref={layoutMenuRef}>
                 <button
                    className="p-1.5 rounded-[4px] hover:bg-gray-100 flex items-center justify-center gap-1 text-gray-700"
                    onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                    title="Sayfa Düzeni"
                >
                    <Layout size={18} />
                    <ChevronDown size={12} className="text-gray-500" />
                </button>

                {showLayoutMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kağıt Boyutu</div>
                        <button 
                            onClick={() => { onPageConfigChange({ ...pageConfig, size: 'A4' }); setShowLayoutMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                        >
                            <span>A4 (21cm x 29.7cm)</span>
                            {pageConfig.size === 'A4' && <Check size={14} className="text-blue-600" />}
                        </button>
                        <button 
                            onClick={() => { onPageConfigChange({ ...pageConfig, size: 'Letter' }); setShowLayoutMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                        >
                            <span>Letter (21.6cm x 28cm)</span>
                            {pageConfig.size === 'Letter' && <Check size={14} className="text-blue-600" />}
                        </button>

                        <div className="h-px bg-gray-100 my-1" />

                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kenar Boşlukları</div>
                         <button 
                            onClick={() => { onPageConfigChange({ ...pageConfig, margin: 'normal' }); setShowLayoutMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                        >
                            <span>Normal (2.5cm)</span>
                            {pageConfig.margin === 'normal' && <Check size={14} className="text-blue-600" />}
                        </button>
                        <button 
                            onClick={() => { onPageConfigChange({ ...pageConfig, margin: 'narrow' }); setShowLayoutMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                        >
                            <span>Dar (1.27cm)</span>
                            {pageConfig.margin === 'narrow' && <Check size={14} className="text-blue-600" />}
                        </button>
                        <button 
                            onClick={() => { onPageConfigChange({ ...pageConfig, margin: 'wide' }); setShowLayoutMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                        >
                            <span>Geniş (5cm)</span>
                            {pageConfig.margin === 'wide' && <Check size={14} className="text-blue-600" />}
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default Toolbar;