export interface ChapterContent {
  name: string;
  number: number;
  url: string;
}

export interface ProductContent {
  chapters: {
    [chapterId: string]: {
      en: ChapterContent;
      es: ChapterContent;
      pl: ChapterContent;
    };
  };
}

export interface ProductLanguage {
  enabled: boolean;
  name: string;
  description: string;
  content: ProductContent;
}

export interface Product {
  id: string;
  name: {
    en: string;
    es: string;
    pl: string;
  };
  description: {
    en: string;
    es: string;
    pl: string;
  };
  content: ProductContent;
  basePrices: {
    pnl: number;
    usd: number;
    eur: number;
  };
  typeProduct: string;
  createdAt: string | Date;
  isActive?: boolean;
  
  // Environment tag: 'test' or 'prod'
  environment: 'test' | 'prod';
  
  // Nueva información de las tarjetas
  lessons?: number;
  duration?: {
    hours: number;
    minutes: number;
  };
  pages?: number;
  rating?: number;
  totalReviews?: number;
  
  // Control de idiomas por producto
  languages: {
    en: ProductLanguage;
    es: ProductLanguage;
    pl: ProductLanguage;
  };
  
  // Configuración específica por tipo
  coachingConfig?: {
    supportedLanguages: string[];
    sessionDuration: number; // en minutos
    maxSessionsPerDay: number;
  };
}

export interface CreateProductData {
  name: {
    en: string;
    es: string;
    pl: string;
  };
  description: {
    en: string;
    es: string;
    pl: string;
  };
  content: ProductContent;
  basePrices: {
    pnl: number;
    usd: number;
    eur: number;
  };
  typeProduct: string;
  environment?: 'test' | 'prod'; // Default to current environment
  
  // Nueva información de las tarjetas
  lessons?: number;
  duration?: {
    hours: number;
    minutes: number;
  };
  pages?: number;
  
  // Control de idiomas por producto
  languages: {
    en: ProductLanguage;
    es: ProductLanguage;
    pl: ProductLanguage;
  };
  
  // Configuración específica por tipo
  coachingConfig?: {
    supportedLanguages: string[];
    sessionDuration: number;
    maxSessionsPerDay: number;
  };
}

export interface UpdateProductData extends Partial<CreateProductData> {
  isActive?: boolean;
}
