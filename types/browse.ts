export interface Freelancer {
  id: string;
  profileImage: string;
  name: string;
  username: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  successRate: number;
  hourlyRate: number;
  currency: string;
  location: {
    country: string;
    city: string;
  };
  skills: string[];
}

export interface BrowseProject {
  id: string;
  title: string;
  description: string;
  type: 'fixed' | 'hourly';
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  skills: string[];
  bidsCount: number;
  postedAt: string; // ISO date string
  postedTimeAgo: string; // e.g., "1 minute ago"
  // Requirement owner info
  ownerId: string;
  ownerEmail: string;
  ownerName?: string;
  ownerProfilePicture?: string;
  thumbnailUrl?: string;
  // Optional fields
  category?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  estimatedDuration?: string;
}

