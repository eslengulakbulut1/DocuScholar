import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TemplateType, TEMPLATE_CONFIGS } from '../types';
import { PageConfig } from '../App';

interface EditorProps {
  template: TemplateType;
  onContentChange: (content: string) => void;
  formatTrigger: { command: string; value?: string; timestamp: number } | null;
  onSelectionChange: (formats: string[]) => void;
  initialContent?: string;
  pageConfig?: PageConfig;
}

const Editor: React.FC<EditorProps> = ({ 
    template, 
    onContentChange, 
    formatTrigger, 
    onSelectionChange, 
    initialContent,
    pageConfig = { size: 'A4', margin: 'normal' }
}) => {
  // Sayfaların ID'lerini tutuyoruz. Her sayfa ayrı bir contentEditable div olacak.
  const [pageIds, setPageIds] = useState<string[]>(['page-1']);
  const pageRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [initialized, setInitialized] = useState(false);
  
  // Sonsuz döngü ve gereksiz render'ları önlemek için flag
  const isPaginating = useRef(false);

  // --- Helper Functions ---
  const generateId = () => `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Tüm sayfalardaki HTML'i birleştirip tek bir string olarak döndürür
  const getAllContent = useCallback(() => {
    return pageIds.map(id => {
        const el = pageRefs.current[id];
        return el ? el.innerHTML : '';
    }).join('');
  }, [pageIds]);

  // --- Core Pagination Logic ---
  const handlePagination = useCallback(() => {
    if (isPaginating.current) return;
    isPaginating.current = true;

    const activeEl = document.activeElement as HTMLElement;
    let focusedNode = null;
    let focusedOffset = 0;
    
    // İmleç pozisyonunu kaydetmeye çalış (Eğer editör içindeyse)
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (Object.values(pageRefs.current).some(ref => ref && ref.contains(range.startContainer))) {
            focusedNode = range.startContainer;
            focusedOffset = range.startOffset;
        }
    }

    let hasChanges = false;
    const ids = [...pageIds];
    
    // Her sayfayı kontrol et
    for (let i = 0; i < ids.length; i++) {
        const pageId = ids[i];
        const pageEl = pageRefs.current[pageId];
        if (!pageEl) continue;

        // 1. TAŞMA KONTROLÜ (OVERFLOW)
        // Sayfanın içeriği (scrollHeight), görünen alanından (clientHeight) büyükse taşıyacağız.
        // 1px tolerans payı bırakıyoruz.
        while (pageEl.scrollHeight > pageEl.clientHeight + 1) {
            const lastChild = pageEl.lastChild;
            
            // Eğer sayfada taşınacak eleman kalmadıysa (çok büyük tek bir resim vb.) döngüyü kır
            if (!lastChild) break;
            
            // Eğer sayfada sadece 1 eleman varsa ve taşıyorsa, mecburen orada kalacak 
            // (yoksa sonsuz döngüye girer). Ancak metin node'u ise parçalanması gerekebilir (bu örnekte blok taşıyoruz).
            if (pageEl.childNodes.length === 1 && lastChild.nodeType === Node.ELEMENT_NODE) {
                 // Gelişmiş versiyonlarda burada text node split yapılabilir.
                 // Şimdilik büyük blokları olduğu gibi bırakıyoruz veya sonraya atıyoruz.
                 // Eğer zaten tek child varsa ve taşıyorsa yapacak bir şey yok, loop'u kır.
                 break; 
            }

            // Sonraki sayfa var mı? Yoksa oluştur.
            let nextPageId = ids[i + 1];
            let nextPageEl = nextPageId ? pageRefs.current[nextPageId] : null;

            if (!nextPageId || !nextPageEl) {
                const newId = generateId();
                // State'i güncellemeden önce diziyi güncelleyelim ki döngü devam edebilsin
                ids.splice(i + 1, 0, newId);
                // React render döngüsünü beklemeden DOM manipülasyonu için ref eklemesi yapmak zorundayız
                // Ancak burada state güncelleyip return etmek daha güvenli, useEffect tekrar tetiklenecek.
                setPageIds([...ids]);
                isPaginating.current = false;
                return; // Render sonrası tekrar çalışacak
            }

            // Elemanı sonraki sayfanın başına taşı
            if (nextPageEl) {
                nextPageEl.prepend(lastChild);
                hasChanges = true;
            }
        }

        // 2. BOŞLUK DOLDURMA (UNDERFLOW)
        // Eğer bu sayfada boşluk varsa ve bir sonraki sayfada içerik varsa, yukarı çek.
        // Bu işlem "silme" yapıldığında metnin yukarı kaymasını sağlar.
        if (i < ids.length - 1) {
            const nextPageId = ids[i + 1];
            const nextPageEl = pageRefs.current[nextPageId];

            if (nextPageEl && nextPageEl.firstChild) {
                // Sonraki sayfanın ilk elemanını alıp bu sayfaya sığar mı diye bakıyoruz
                // Sadece küçük parçalar halinde deniyoruz
                while (nextPageEl.firstChild) {
                    const nodeToMove = nextPageEl.firstChild;
                    pageEl.appendChild(nodeToMove);

                    // Sığmadıysa geri koy ve döngüyü bitir
                    if (pageEl.scrollHeight > pageEl.clientHeight) {
                        nextPageEl.prepend(nodeToMove);
                        break;
                    }
                    hasChanges = true;
                }

                // Eğer sonraki sayfa tamamen boşaldıysa ve odak orada DEĞİLSE, o sayfayı sil
                if (nextPageEl.childNodes.length === 0 && !nextPageEl.contains(activeEl)) {
                    ids.splice(i + 1, 1);
                    setPageIds([...ids]);
                    isPaginating.current = false;
                    return;
                }
            }
        }
    }

    // İmleci geri yükle (Eğer node taşındıysa tarayıcı odağı kaybedebilir)
    if (focusedNode && document.contains(focusedNode)) {
        const newSelection = window.getSelection();
        const newRange = document.createRange();
        try {
            newRange.setStart(focusedNode, focusedOffset);
            newRange.collapse(true);
            newSelection?.removeAllRanges();
            newSelection?.addRange(newRange);
        } catch (e) {
            // Node yapısı çok değiştiyse sessizce başarısız ol, kullanıcı tıklayıp odaklanabilir
        }
    }

    if (hasChanges) {
        onContentChange(getAllContent());
    }

    isPaginating.current = false;
  }, [pageIds, getAllContent, onContentChange]);

  // Sayfa sayısı değiştiğinde veya içerik değiştiğinde pagination'ı tetikle
  // Ancak sonsuz döngüden kaçınmak için dikkatli olunmalı.
  // useEffect yerine onInput kullanmak daha performanslıdır.
  
  // Initialization
  useEffect(() => {
    if (!initialized && pageIds.length > 0 && pageRefs.current[pageIds[0]]) {
      const firstPage = pageRefs.current[pageIds[0]];
      
      if (initialContent && initialContent.trim() !== '') {
        firstPage!.innerHTML = initialContent;
        // İçerik yüklendikten sonra dağıtımı başlat (biraz bekleyip DOM render olsun)
        setTimeout(handlePagination, 100);
      } else {
        // Şablon içeriği yükleme (Initial Template Logic)
        const config = TEMPLATE_CONFIGS[template];
        let initialHtml = `<h1 style="text-align: center;">${config.name} Başlığı</h1>`;
        
        // (Şablon metinleri buraya - önceki kodla aynı)
        if (template === TemplateType.IMRAD) {
            initialHtml += `<p><strong>Özet:</strong> <em>[Çalışmanın kısa özeti]</em></p><h2>Giriş</h2><p>[Bağlam ve hipotez]</p><h2>Yöntem</h2><p>[Deneysel kurulum]</p><h2>Bulgular</h2><p>[Veri bulguları]</p><h2>Tartışma</h2><p>[Yorumlama]</p><h2>Sonuç</h2><p>[Nihai özet]</p>`;
        } else if (template === TemplateType.THESIS) {
            initialHtml += `<h2>Bölüm 1: Giriş</h2><p>[Çalışmanın arka planı]</p><h2>Bölüm 2: Literatür Taraması</h2><p>[Mevcut araştırmalar]</p><h2>Bölüm 3: Metodoloji</h2><p>[Araştırma tasarımı]</p><h2>Bölüm 4: Bulgular</h2><p>[Sonuçlar]</p><h2>Bölüm 5: Tartışma</h2><p>[Çıkarımlar]</p>`;
        } else if (template === TemplateType.TUBITAK) {
            initialHtml += `<h2>1. Özgün Değer</h2><p><strong>1.1. Konunun Önemi:</strong> [Projenin bilimsel kalitesi]</p><p><strong>1.2. Amaç:</strong> [Somut hedefler]</p><h2>2. Yöntem</h2><p>[Veri toplama]</p><h2>3. Proje Yönetimi</h2><p>[İş paketleri]</p><h2>4. Yaygın Etki</h2><p>[Çıktılar]</p>`;
        } else if (template === TemplateType.LITERATURE) {
            initialHtml += `<h2>Giriş</h2><p>[Kapsam]</p><h2>Metodoloji</h2><p>[Tarama kriterleri]</p><h2>Ana Temalar</h2><p>[Tema 1]</p><h2>Tartışma</h2><p>[Boşluklar]</p><h2>Sonuç</h2><p>[Öneriler]</p>`;
        } else {
            initialHtml += `<h2>Yönetici Özeti</h2><p>[Genel bakış]</p><h2>Giriş</h2><p>[Hedefler]</p><h2>Analiz</h2><p>[Gövde]</p><h2>Bulgular</h2><p>[Sonuçlar]</p>`;
        }
        
        firstPage!.innerHTML = initialHtml;
        setTimeout(handlePagination, 100);
      }
      
      setInitialized(true);
    }
  }, [template, initialized, initialContent, handlePagination]);

  // --- Event Handlers ---
  const handleInput = () => {
      handlePagination();
      // İçerik değişikliğini hemen üst bileşene bildirmiyoruz, pagination bitince çağırıyoruz
      // Ancak anlık yazım güvenliği için buraya da ekleyebiliriz:
      // onContentChange(getAllContent()); 
  };

  const handleBlur = () => {
      onContentChange(getAllContent());
  };

  // Format değişikliğinde de pagination kontrolü gerekir (örn: font büyürse taşabilir)
  useEffect(() => {
    if (formatTrigger) {
      document.execCommand(formatTrigger.command, false, formatTrigger.value);
      checkFormats();
      handlePagination();
    }
  }, [formatTrigger, handlePagination]);

  const checkFormats = useCallback(() => {
    if (!document) return;
    const formats: string[] = [];
    ['bold', 'italic', 'underline', 
     'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 
     'insertUnorderedList', 'insertOrderedList'].forEach(cmd => {
       if (document.queryCommandState(cmd)) formats.push(cmd);
    });
    const blockValue = document.queryCommandValue('formatBlock');
    if (blockValue) formats.push(blockValue.toLowerCase());
    const fontValue = document.queryCommandValue('fontName');
    if (fontValue) formats.push(`fontName:${fontValue}`);
    onSelectionChange(formats);
  }, [onSelectionChange]);

  useEffect(() => {
    document.addEventListener('selectionchange', checkFormats);
    return () => document.removeEventListener('selectionchange', checkFormats);
  }, [checkFormats]);

  // --- Styles ---
  const getDims = () => {
      const isA4 = pageConfig.size === 'A4';
      return {
          width: isA4 ? '210mm' : '215.9mm',
          height: isA4 ? '297mm' : '279.4mm',
          padding: pageConfig.margin === 'narrow' ? '12.7mm' : pageConfig.margin === 'wide' ? '50.8mm' : '25.4mm'
      };
  };
  const dims = getDims();

  // Config değişirse tekrar hesapla
  useEffect(() => {
      setTimeout(handlePagination, 100);
  }, [pageConfig, handlePagination]);

  return (
    <div 
        className="flex-1 bg-[#e9eef6] overflow-y-auto flex flex-col items-center p-8 pb-32 cursor-text gap-6"
        onClick={(e) => {
            // Boşluğa tıklanırsa en son sayfaya odaklan
            if (e.target === e.currentTarget) {
                const lastId = pageIds[pageIds.length - 1];
                const lastEl = pageRefs.current[lastId];
                lastEl?.focus();
            }
        }}
    >
      {pageIds.map((id, index) => (
          <div
            key={id}
            id={id}
            ref={el => { pageRefs.current[id] = el; }}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={handleBlur}
            onFocus={checkFormats}
            onMouseUp={checkFormats}
            onKeyUp={checkFormats}
            onKeyDown={(e) => {
                // Backspace ile sayfa silme kontrolü (boş sayfanın başında backspace)
                if (e.key === 'Backspace' && index > 0) {
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0 && sel.getRangeAt(0).startOffset === 0) {
                        // Bir önceki sayfanın sonuna git
                        const prevId = pageIds[index - 1];
                        const prevEl = pageRefs.current[prevId];
                        if (prevEl) {
                            // Focus oraya taşınacak, handlePagination underflow'u halledecek
                            e.preventDefault();
                            const range = document.createRange();
                            range.selectNodeContents(prevEl);
                            range.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    }
                }
            }}
            className="bg-white shadow-lg outline-none text-gray-800 font-serif text-lg leading-relaxed print:shadow-none print:mb-0 print:break-after-page"
            style={{
                width: dims.width,
                height: dims.height,
                minHeight: dims.height, // Fixed height is crucial for overflow detection
                padding: dims.padding,
                boxSizing: 'border-box',
                overflow: 'hidden', // İçerik taşarsa JS ile taşınmalı, görsel olarak sarkmamalı
                position: 'relative'
            }}
          />
      ))}
    </div>
  );
};

export default Editor;