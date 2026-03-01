// Replace string with actual deployed API Endpoint once deployed
const FREELANCER_INTERACTIONS_API_ENDPOINT = 'https://eprkn8kyxf.execute-api.ap-south-2.amazonaws.com/default/freelancer_interactions_handler';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    message?: string;
}

export interface Interaction {
    interactionId: string;
    type: 'message' | 'invitation' | 'review';
    senderId: string;
    senderName?: string;
    senderImage?: string;
    receiverId?: string;
    targetId?: string;
    content: string;
    status?: string;
    rating?: number;
    createdAt: string;
}

async function apiRequest<T>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(FREELANCER_INTERACTIONS_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action,
                ...body,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error in interactions API (${action}):`, error);
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: error instanceof Error ? error.message : 'Network error occurred',
            },
        };
    }
}

/**
 * Send a contact message to a freelancer
 */
export const sendFreelancerMessage = async (
    senderId: string,
    receiverId: string,
    message: string
): Promise<boolean> => {
    try {
        const response = await apiRequest<{ interactionId: string }>('SEND_MESSAGE', {
            senderId,
            receiverId,
            message
        });

        if (response.success) {
            return true;
        }

        throw new Error(response.error?.message || 'Failed to send message');
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

/**
 * Send an invitation to bid on a project
 */
export const sendFreelancerInvitation = async (
    senderId: string,
    receiverId: string,
    projectId: string,
    message: string
): Promise<boolean> => {
    try {
        const response = await apiRequest<{ interactionId: string }>('SEND_INVITATION', {
            senderId,
            receiverId,
            projectId,
            message
        });

        if (response.success) {
            return true;
        }

        throw new Error(response.error?.message || 'Failed to send invitation');
    } catch (error) {
        console.error('Error sending invitation:', error);
        throw error;
    }
};

/**
 * Add a review for a freelancer
 */
export const addFreelancerReview = async (
    reviewerId: string,
    reviewerName: string,
    reviewerProfileImage: string | undefined,
    freelancerId: string,
    rating: number,
    comment: string
): Promise<boolean> => {
    try {
        const response = await apiRequest<{ interactionId: string }>('ADD_REVIEW', {
            reviewerId,
            reviewerName,
            reviewerProfileImage,
            freelancerId,
            rating,
            comment
        });

        if (response.success) {
            return true;
        }

        throw new Error(response.error?.message || 'Failed to add review');
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
};

/**
 * Get reviews for a freelancer
 */
export const getFreelancerReviews = async (freelancerId: string): Promise<{
    reviews: Interaction[],
    count: number,
    averageRating: number
}> => {
    try {
        const response = await apiRequest<{
            reviews: Interaction[],
            count: number,
            averageRating: number
        }>('GET_FREELANCER_REVIEWS', { freelancerId });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error?.message || 'Failed to fetch reviews');
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [], count: 0, averageRating: 0 };
    }
};

/**
 * Get all interactions (messages, invitations) sent to a user
 */
export const getUserInteractions = async (userId: string): Promise<{
    interactions: Interaction[],
    count: number
}> => {
    try {
        const response = await apiRequest<{
            interactions: Interaction[],
            count: number
        }>('GET_USER_INTERACTIONS', { userId });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error?.message || 'Failed to fetch interactions');
    } catch (error) {
        console.error('Error fetching interactions:', error);
        return { interactions: [], count: 0 };
    }
};

/**
 * Get interactions (messages, invitations) sent by the user
 */
export const getSentInteractions = async (userId: string): Promise<{
    interactions: Interaction[],
    count: number
}> => {
    try {
        const response = await apiRequest<{
            interactions: Interaction[],
            count: number
        }>('GET_SENT_INTERACTIONS', { userId });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error?.message || 'Failed to fetch sent interactions');
    } catch (error) {
        console.error('Error fetching sent interactions:', error);
        return { interactions: [], count: 0 };
    }
};

/**
 * Get all messages between current user and another user (for chat thread)
 */
export const getConversation = async (userId: string, otherUserId: string): Promise<{
    messages: Interaction[],
    count: number
}> => {
    try {
        const response = await apiRequest<{
            messages: Interaction[],
            count: number
        }>('GET_CONVERSATION', { userId, otherUserId });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error?.message || 'Failed to fetch conversation');
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return { messages: [], count: 0 };
    }
};

/**
 * Update the status of a specific interaction
 */
export const updateInteractionStatus = async (
    interactionId: string,
    status: 'read' | 'accepted' | 'declined'
): Promise<boolean> => {
    try {
        const response = await apiRequest<any>('UPDATE_INTERACTION_STATUS', {
            interactionId,
            status
        });

        if (response.success) {
            return true;
        }

        throw new Error(response.error?.message || 'Failed to update status');
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};
