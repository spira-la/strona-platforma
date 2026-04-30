export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5 estrellas
  title?: string;
  comment: string;
  language: string; // en, es, pl
  createdAt: string | Date;
  updatedAt?: string | Date;
  isVerified: boolean; // Si el usuario compró el producto
  helpful: number; // Número de usuarios que marcaron como útil
  reported: boolean; // Si fue reportado
}

export interface CreateReviewData {
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title?: string;
  comment: string;
  language: string;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  helpful?: number;
  reported?: boolean;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [rating: number]: number; // 1: 5, 2: 10, 3: 15, 4: 20, 5: 50
  };
  totalHelpful: number;
  verifiedReviews: number;
}
