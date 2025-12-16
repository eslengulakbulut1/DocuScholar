import React from 'react';
import { TemplateType, TEMPLATE_CONFIGS } from '../types';
import { BookOpen, GraduationCap, FileText } from 'lucide-react';

interface TemplateSelectorProps {
  onSelect: (template: TemplateType) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Akademik Şablonunuzu Seçin</h1>
          <p className="text-gray-600">Akademik Asistanınızı başlatmak için bir yapı seçin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* IMRAD */}
          <button
            onClick={() => onSelect(TemplateType.IMRAD)}
            className="group relative flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left"
          >
            <div className="p-4 bg-blue-100 rounded-full text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{TEMPLATE_CONFIGS[TemplateType.IMRAD].name}</h3>
            <p className="text-sm text-gray-600 text-center mb-4">{TEMPLATE_CONFIGS[TemplateType.IMRAD].description}</p>
            <div className="w-full border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Odak:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                <li>Bilimsel Yapı</li>
                <li>Yöntem & Bulgular</li>
                <li>Tartışma Mantığı</li>
              </ul>
            </div>
          </button>

          {/* Thesis */}
          <button
            onClick={() => onSelect(TemplateType.THESIS)}
            className="group relative flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 text-left"
          >
            <div className="p-4 bg-purple-100 rounded-full text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{TEMPLATE_CONFIGS[TemplateType.THESIS].name}</h3>
            <p className="text-sm text-gray-600 text-center mb-4">{TEMPLATE_CONFIGS[TemplateType.THESIS].description}</p>
            <div className="w-full border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Odak:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                <li>Bölüm Derinliği</li>
                <li>Literatür Taraması</li>
                <li>Metodolojik Titizlik</li>
              </ul>
            </div>
          </button>

          {/* Report */}
          <button
            onClick={() => onSelect(TemplateType.REPORT)}
            className="group relative flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 text-left"
          >
            <div className="p-4 bg-emerald-100 rounded-full text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{TEMPLATE_CONFIGS[TemplateType.REPORT].name}</h3>
            <p className="text-sm text-gray-600 text-center mb-4">{TEMPLATE_CONFIGS[TemplateType.REPORT].description}</p>
            <div className="w-full border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Odak:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                <li>Netlik & Kısalık</li>
                <li>Görsel Veri</li>
                <li>Resmi Ton</li>
              </ul>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;