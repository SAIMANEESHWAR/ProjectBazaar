/**
 * API service for buyer actions (like, cart, purchase)
 */

const LAMBDA_ENDPOINT = 'https://tcladht447.execute-api.ap-south-2.amazonaws.com/default/Like_Addtocart_purcaseproject_for_Buyer';
const GET_USER_DETAILS_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';
const GET_PROJECT_DETAILS_ENDPOINT = 'https://8y8bbugmbd.execute-api.ap-south-2.amazonaws.com/default/Get_project_details_by_projectId';
const REPORT_PROJECT_ENDPOINT = 'https://r6tuhoyrr2.execute-api.ap-south-2.amazonaws.com/default/Report_projects_by_buyerId';
const UPDATE_PROJECT_ENDPOINT = 'https://dihvjwfsk0.execute-api.ap-south-2.amazonaws.com/default/Update_projectDetils_and_likescounts_by_projectId';

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

