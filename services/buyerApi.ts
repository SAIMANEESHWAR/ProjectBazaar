/**
 * API service for buyer actions (like, cart, purchase)
 */

const LAMBDA_ENDPOINT = 'https://tcladht447.execute-api.ap-south-2.amazonaws.com/default/Like_Addtocart_purcaseproject_for_Buyer';
const GET_USER_DETAILS_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';
const GET_PROJECT_DETAILS_ENDPOINT = 'https://8y8bbugmbd.execute-api.ap-south-2.amazonaws.com/default/Get_project_details_by_projectId';
const REPORT_PROJECT_ENDPOINT = 'https://r6tuhoyrr2.execute-api.ap-south-2.amazonaws.com/default/Report_projects_by_buyerId';
const UPDATE_PROJECT_ENDPOINT = 'https://dihvjwfsk0.execute-api.ap-south-2.amazonaws.com/default/Update_projectDetils_and_likescounts_by_projectId';
const CREATE_PAYMENT_INTENT_ENDPOINT = 'https://cuzvm2pbdl.execute-api.ap-south-2.amazonaws.com/default/create_payment_intent';
const FETCH_HACKATHONS_ENDPOINT = 'https://zv6v6bsuie.execute-api.ap-south-2.amazonaws.com/default/get_hackathons_details';

export interface CartItem {
  projectId: string;
  addedAt: string;
}

export interface Purchase {
  projectId: string;
  priceAtPurchase: number;
  purchasedAt: string;
  paymentId: string;
  orderStatus: string;
}

export interface UserData {
  userId: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  status?: string;
  isPremium?: boolean;
  credits?: number;
  projectsCount?: number;
  totalPurchases?: number;
  totalSpent?: number;
  wishlist?: string[];
  cart?: CartItem[];
  purchases?: Purchase[];
  lastLoginAt?: string;
  loginCount?: number;
  createdBy?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ProjectDetails {
  projectId: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  sellerId: string;
  sellerEmail: string;
  status: string;
  adminApproved?: boolean;
  adminApprovalStatus?: string; // "approved" | "rejected" | "disabled"
  uploadedAt: string;
  documentationUrl?: string;
  youtubeVideoUrl?: string;
  purchasesCount?: number;
  likesCount?: number;
  viewsCount?: number;
  originalPrice?: number;
}

export interface ProjectDetailsResponse {
  success: boolean;
  data?: ProjectDetails;
  error?: string;
}

/**
 * Fetch user data including wishlist, cart, and purchases
 */
export const fetchUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const response = await fetch(GET_USER_DETAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        userId: data.data.userId || userId,
        email: data.data.email,
        phoneNumber: data.data.phoneNumber,
        role: data.data.role,
        status: data.data.status,
        isPremium: data.data.isPremium,
        credits: data.data.credits,
        projectsCount: data.data.projectsCount,
        totalPurchases: data.data.totalPurchases,
        totalSpent: data.data.totalSpent,
        wishlist: data.data.wishlist || [],
        cart: data.data.cart || [],
        purchases: data.data.purchases || [],
        lastLoginAt: data.data.lastLoginAt,
        loginCount: data.data.loginCount,
        createdBy: data.data.createdBy,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

/**
 * Update project counters (wishlist, cart, likes)
 */
const updateProjectCounters = async (projectId: string, increments: Record<string, number>): Promise<void> => {
  try {
    await fetch(UPDATE_PROJECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        increments,
      }),
    });
  } catch (error) {
    console.error('Error updating project counters:', error);
    // Don't throw - this is a secondary update, user table update is primary
  }
};

/**
 * Like a project
 */
export const likeProject = async (userId: string, projectId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(LAMBDA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'LIKE_PROJECT',
        userId,
        projectId,
      }),
    });

    const data = await response.json();
    
    // If user table update succeeded, also update project table
    if (data.success) {
      await updateProjectCounters(projectId, {
        likesCount: 1,
        wishlistCount: 1,
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error liking project:', error);
    return {
      success: false,
      message: 'Failed to like project',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Unlike a project
 */
export const unlikeProject = async (userId: string, projectId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(LAMBDA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'UNLIKE_PROJECT',
        userId,
        projectId,
      }),
    });

    const data = await response.json();
    
    // If user table update succeeded, also update project table
    if (data.success) {
      await updateProjectCounters(projectId, {
        likesCount: -1,
        wishlistCount: -1,
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error unliking project:', error);
    return {
      success: false,
      message: 'Failed to unlike project',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Add project to cart
 */
export const addToCart = async (userId: string, projectId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(LAMBDA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ADD_TO_CART',
        userId,
        projectId,
      }),
    });

    const data = await response.json();
    
    // If user table update succeeded, also update project table
    if (data.success) {
      await updateProjectCounters(projectId, {
        cartCount: 1,
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      message: 'Failed to add to cart',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Remove project from cart
 */
export const removeFromCart = async (userId: string, projectId: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(LAMBDA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'REMOVE_FROM_CART',
        userId,
        projectId,
      }),
    });

    const data = await response.json();
    
    // If user table update succeeded, also update project table
    if (data.success) {
      await updateProjectCounters(projectId, {
        cartCount: -1,
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return {
      success: false,
      message: 'Failed to remove from cart',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Purchase a project
 */
export const purchaseProject = async (
  userId: string,
  projectId: string,
  priceAtPurchase: number,
  paymentId: string,
  orderStatus: string = 'SUCCESS'
): Promise<ApiResponse> => {
  try {
    const response = await fetch(LAMBDA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'PURCHASE_PROJECT',
        userId,
        projectId,
        priceAtPurchase,
        paymentId,
        orderStatus,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error purchasing project:', error);
    return {
      success: false,
      message: 'Failed to purchase project',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Fetch project details by project ID
 */
export const fetchProjectDetails = async (projectId: string): Promise<ProjectDetails | null> => {
  try {
    const response = await fetch(GET_PROJECT_DETAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: projectId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch project details: ${response.statusText}`);
    }
    
    const data: ProjectDetailsResponse = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching project details:', error);
    return null;
  }
};

/**
 * Fetch user details with projects (for seller dashboard)
 */
export const fetchUserDetailsWithProjects = async (userId: string): Promise<{ user: UserData | null; projects: ProjectDetails[] }> => {
  try {
    // Try POST method first (as per fetchUserData pattern)
    const response = await fetch(GET_USER_DETAILS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user details: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Handle different response structures
      const userData = data.data || data.user || {};
      const projectsData = data.projects || data.data?.projects || [];
      
      const user: UserData = {
        userId: userData.userId || userId,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        status: userData.status,
        isPremium: userData.isPremium,
        credits: userData.credits,
        projectsCount: userData.projectsCount,
        totalPurchases: userData.totalPurchases,
        totalSpent: userData.totalSpent,
        wishlist: userData.wishlist || [],
        cart: userData.cart || [],
        purchases: userData.purchases || [],
        lastLoginAt: userData.lastLoginAt,
        loginCount: userData.loginCount,
        createdBy: userData.createdBy,
      };
      
      const projects: ProjectDetails[] = Array.isArray(projectsData) ? projectsData : [];
      
      return { user, projects };
    }
    
    return { user: null, projects: [] };
  } catch (error) {
    console.error('Error fetching user details with projects:', error);
    return { user: null, projects: [] };
  }
};

/**
 * Report a project
 */
export interface ReportProjectRequest {
  buyerId: string;
  projectId: string;
  reason: string;
  description: string;
  attachments?: string[];
}

export interface ReportProjectResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    reportId: string;
    status: string;
  };
}

export const reportProject = async (reportData: ReportProjectRequest): Promise<ReportProjectResponse> => {
  try {
    const response = await fetch(REPORT_PROJECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit report',
        message: data.message,
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error reporting project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to submit report',
    };
  }
};

/**
 * Create payment intent for Razorpay checkout
 */
export interface CreatePaymentIntentRequest {
  userId: string;
  projectIds: string[];
  totalAmount: number;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  orderId?: string; // Internal DB order ID (not used for Razorpay)
  razorpayOrderId?: string; // Razorpay order ID (IMPORTANT - used for checkout)
  amount?: number; // Amount in paise
  currency?: string;
  key?: string; // Razorpay key ID (rzp_test_* or rzp_live_*)
  name?: string;
  description?: string;
  prefill?: {
    email?: string;
    contact?: string;
  };
  error?: string;
  message?: string;
}

export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> => {
  try {
    const response = await fetch(CREATE_PAYMENT_INTENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: request.userId,
        projectIds: request.projectIds,
        totalAmount: request.totalAmount,
        currency: request.currency || 'INR',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to create payment intent',
        message: data.message,
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create payment intent',
    };
  }
};

/**
 * Fetch hackathons from Firecrawl API via Lambda
 */
// API Response format
export interface HackathonApiResponse {
  post_link: string;
  location: string;
  created_at: number;
  end_date: string | null;
  start_date: string | null;
  status: 'live' | 'upcoming' | string;
  PK: string;
  image_link: string | null;
  type: 'online' | 'offline' | string;
}

// Frontend Hackathon format (mapped from API)
export interface Hackathon {
  id: string; // PK
  name: string; // Extracted from URL or generated
  platform: string; // Extracted from post_link domain
  official_url: string; // post_link
  status: 'live' | 'upcoming' | string;
  mode: 'Online' | 'Offline'; // Mapped from type (based on actual API data)
  location: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null; // image_link
  created_at: number;
}

export interface FetchHackathonsResponse {
  success: boolean;
  message?: string;
  data?: {
    hackathons: Hackathon[];
    count: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Helper function to extract platform from URL
const extractPlatformFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('unstop.com')) return 'unstop.com';
    if (hostname.includes('devfolio.co')) return 'devfolio.co';
    if (hostname.includes('hackerearth.com')) return 'hackerearth.com';
    if (hostname.includes('skillenza.com')) return 'skillenza.com';
    if (hostname.includes('techgig.com')) return 'techgig.com';
    return hostname;
  } catch {
    return 'Unknown Platform';
  }
};

// Helper function to extract hackathon name from URL
const extractNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract from path segments
    const segments = pathname.split('/').filter(s => s);
    
    // For unstop.com, usually the last segment before the ID is the name
    if (url.includes('unstop.com')) {
      const hackathonsIndex = segments.indexOf('hackathons');
      if (hackathonsIndex >= 0 && segments[hackathonsIndex + 1]) {
        // Replace hyphens with spaces and capitalize
        const namePart = segments[hackathonsIndex + 1];
        // Remove the ID at the end if present
        const nameWithoutId = namePart.replace(/-\d+$/, '');
        return nameWithoutId.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    // For devfolio.co, usually subdomain or path
    if (url.includes('devfolio.co')) {
      const subdomain = urlObj.hostname.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'devfolio') {
        return subdomain.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
      // Use pathname as fallback
      if (segments.length > 0) {
        return segments[segments.length - 1].split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    // Fallback: use hostname
    return urlObj.hostname;
  } catch {
    return 'Hackathon';
  }
};

// Map API response to frontend format
const mapApiResponseToHackathon = (apiData: HackathonApiResponse): Hackathon => {
  const modeMap: Record<string, 'Online' | 'Offline'> = {
    'online': 'Online',
    'offline': 'Offline',
  };
  
  return {
    id: apiData.PK,
    name: extractNameFromUrl(apiData.post_link),
    platform: extractPlatformFromUrl(apiData.post_link),
    official_url: apiData.post_link,
    status: apiData.status || 'upcoming',
    mode: modeMap[apiData.type?.toLowerCase()] || 'Online', // Default to Online if type is unknown
    location: apiData.location || 'TBA',
    start_date: apiData.start_date,
    end_date: apiData.end_date,
    image_url: apiData.image_link,
    created_at: apiData.created_at,
  };
};

export const fetchHackathons = async (_urls?: string[]): Promise<FetchHackathonsResponse> => {
  try {
    // Try GET first, fallback to POST if needed
    const response = await fetch(FETCH_HACKATHONS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle non-OK responses (4xx, 5xx)
    if (!response.ok) {
      let errorData: any = {};
      let errorMessage = '';
      
      try {
        const responseText = await response.text();
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // If not JSON, use text as message
            errorMessage = responseText;
          }
        }
      } catch (e) {
        // If response body cannot be read
        errorMessage = '';
      }
      
      // Determine error message based on status code and response
      if (response.status === 500) {
        errorMessage = errorData.message || errorData.error?.message || errorMessage || 
          'Server error: The hackathons service is currently unavailable. Please check Lambda configuration and try again later.';
      } else if (response.status === 404) {
        errorMessage = 'Hackathons endpoint not found. Please check the API configuration.';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. Please check API permissions.';
      } else {
        errorMessage = errorData.message || errorData.error?.message || errorData.error || errorMessage || 
          `Failed to fetch hackathons: ${response.status} ${response.statusText}`;
      }
      
      return {
        success: false,
        error: {
          code: response.status === 500 ? 'SERVER_ERROR' : 
                response.status === 404 ? 'NOT_FOUND' : 
                response.status === 403 ? 'FORBIDDEN' : 'FETCH_ERROR',
          message: errorMessage,
        },
      };
    }

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not valid JSON
      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid response format from hackathons API',
        },
      };
    }
    
    // Handle error response
    if (data.success === false || data.error) {
      return {
        success: false,
        error: typeof data.error === 'string' 
          ? { code: 'API_ERROR', message: data.error }
          : (data.error || {
              code: 'API_ERROR',
              message: data.message || 'Failed to fetch hackathons',
            }),
      };
    }
    
    // Handle API response format: { hackathons: [...], count: N } or { success: true, data: { hackathons: [...], count: N } }
    
    // Check if response has nested data structure
    let hackathonsArray: HackathonApiResponse[] = [];
    let count = 0;
    
    if (data.success === true && data.data) {
      // Nested structure: { success: true, data: { hackathons: [...], count: N } }
      hackathonsArray = Array.isArray(data.data.hackathons) ? data.data.hackathons : [];
      count = data.data.count || hackathonsArray.length;
    } else if (data.hackathons && Array.isArray(data.hackathons)) {
      // Direct structure: { hackathons: [...], count: N }
      hackathonsArray = data.hackathons;
      count = data.count || hackathonsArray.length;
    } else if (Array.isArray(data)) {
      // Just an array
      hackathonsArray = data;
      count = data.length;
    }
    
    // Map API response to frontend format
    if (hackathonsArray.length > 0) {
      const mappedHackathons: Hackathon[] = hackathonsArray.map(mapApiResponseToHackathon);
      
      return {
        success: true,
        message: data.message || 'Hackathons fetched successfully',
        data: {
          hackathons: mappedHackathons,
          count: count || mappedHackathons.length,
        },
      };
    }
    
    // If we can't parse the structure, return error
    return {
      success: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Invalid response structure from hackathons API. Expected { hackathons: [...], count: N }',
      },
    };
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch hackathons',
      },
    };
  }
};

