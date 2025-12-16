
export enum TemplateType {
  IMRAD = 'IMRAD',
  THESIS = 'THESIS',
  REPORT = 'REPORT',
  TUBITAK = 'TUBITAK',
  LITERATURE = 'LITERATURE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface TemplateConfig {
  name: string;
  description: string;
  sections: string[];
  rules: string[];
}

export interface Draft {
  id: string;
  title: string;
  template: TemplateType;
  content: string;
  lastModified: number;
  collaborators: string[]; // İsim listesi
  comments: Comment[];
  isDeleted?: boolean;
}

export const TEMPLATE_CONFIGS: Record<TemplateType, TemplateConfig> = {
  [TemplateType.IMRAD]: {
    name: 'IMRAD Araştırma Makalesi',
    description: 'Standart bilimsel format: Giriş, Yöntem, Bulgular, Tartışma.',
    sections: ['Giriş', 'Yöntem', 'Bulgular', 'Tartışma', 'Sonuç'],
    rules: [
      'Bölümler arasında net ayrım yapılmasını sağla.',
      'Metodoloji detay seviyesini öner.',
      'Bulgular kısmında yorum yapılıyorsa uyar.',
      'Tartışma bölümünün bulguları tekrar etmek yerine yorumlamasını teşvik et.'
    ]
  },
  [TemplateType.THESIS]: {
    name: 'Tez / Bitirme Projesi',
    description: 'Lisans veya Lisansüstü dereceleri için kapsamlı akademik belge.',
    sections: ['Özet', 'Giriş', 'Literatür Taraması', 'Metodoloji', 'Bulgular', 'Tartışma', 'Sonuç'],
    rules: [
      'Bölüm tabanlı yapıyı uygula.',
      'Bölümler arasında akademik tutarlılığı koru.',
      'Literatür taramasının derinliğini vurgula.',
      'Metodolojik gerekçelendirmeyi teşvik et.'
    ]
  },
  [TemplateType.REPORT]: {
    name: 'Akademik / Teknik Rapor',
    description: 'Ders tabanlı veya teknik ödevler için yapılandırılmış rapor.',
    sections: ['Yönetici Özeti', 'Giriş', 'Analiz', 'Bulgular', 'Öneriler'],
    rules: [
      'Netlik ve kısalığı vurgula.',
      'Tablo, şekil ve özet kullanımını teşvik et.',
      'Resmi ancak pratik bir tonu koru.'
    ]
  },
  [TemplateType.TUBITAK]: {
    name: 'TÜBİTAK Proje Önerisi',
    description: '2209 veya 1001 formatlarına uygun proje başvuru taslağı.',
    sections: ['Özgün Değer', 'Yöntem', 'Proje Yönetimi', 'Yaygın Etki'],
    rules: [
      'Özgün değerin (hipotez/araştırma sorusu) netliğini vurgula.',
      'Yöntem bölümünün iş paketleri ile uyumlu olmasını sağla.',
      'Yaygın etkinin somut ve ölçülebilir olmasını öner.',
      'Risk yönetimi ve B planlarını hatırlat.'
    ]
  },
  [TemplateType.LITERATURE]: {
    name: 'Literatür Taraması',
    description: 'Belirli bir konuda mevcut kaynakların sistematik analizi.',
    sections: ['Giriş', 'Metodoloji', 'Tematik Analiz', 'Boşluklar', 'Sonuç'],
    rules: [
      'Kaynakların sadece listelenmesi yerine sentezlenmesini teşvik et.',
      'Tematik veya kronolojik bir akış öner.',
      'Araştırma boşluklarının (research gaps) vurgulanmasını sağla.'
    ]
  }
};
