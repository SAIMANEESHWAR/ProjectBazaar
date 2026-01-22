import React, { useState, useMemo, useEffect } from 'react';

const GET_USER_PAYMENTS_ENDPOINT = 'https://z4utxrtd2e.execute-api.ap-south-2.amazonaws.com/default/get_user_payments';
const GET_ALL_PROJECTS_ENDPOINT = 'https://vwqfgtwerj.execute-api.ap-south-2.amazonaws.com/default/Get_All_Projects_for_Admin_Buyer';

interface Purchase {
    id: string;
    projectId: string;
    projectTitle: string;
    projectImage: string;
    buyerName: string;
    buyerEmail: string;
    purchaseDate: string;
    amount: number;
    commission: number;
    sellerEarnings: number;
}

interface SellerEarnings {
    sellerId: string;
    sellerName: string;
    sellerEmail: string;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    purchases: Purchase[];
}

interface PayoutRequest {
    id: string;
    sellerId: string;
    sellerEmail: string;
    sellerName: string;
    amount: number;
    requestDate: string;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    paymentMethod: string;
    accountDetails: string;
    purchases: Purchase[];
}


interface PaymentApiResponse {
    success: boolean;
    data?: {
        userId: string;
        orders: any[];
        purchases: any[];
        summary: {
            totalOrders: number;
            successfulOrders: number;
            failedOrders: number;
            pendingOrders: number;
            totalSpent: number;
            totalPurchases: number;
        };
    };
    error?: string;
}

interface PaymentInfo {
    userId: string;
    orders: any[];
    purchases: any[];
    summary: {
        totalOrders: number;
        successfulOrders: number;
        failedOrders: number;
        pendingOrders: number;
        totalSpent: number;
        totalPurchases: number;
    };
}

const PayoutSystemsPage: React.FC = () => {
    const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'requests' | 'history'>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sellerPaymentData, setSellerPaymentData] = useState<Map<string, PaymentInfo>>(new Map());

    // Real data - Seller earnings with purchases (loaded from API)
    const [sellerEarnings, setSellerEarnings] = useState<SellerEarnings[]>([]);

    // Fetch sellers and their payment details using get_user_payments API
    useEffect(() => {
        const fetchSellersWithPayments = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                console.log('Step 1: Fetching projects to get seller IDs...');
                
                // Step 1: Get all projects to extract unique seller IDs
                const projectsResponse = await fetch(GET_ALL_PROJECTS_ENDPOINT, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!projectsResponse.ok) {
                    throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`);
                }

                const projectsData = await projectsResponse.json();
                console.log('Projects data:', projectsData);

                // Extract unique seller IDs from projects
                const sellerMap = new Map<string, { sellerId: string; sellerEmail: string; sellerName: string }>();
                
                if (projectsData.success && Array.isArray(projectsData.data)) {
                    projectsData.data.forEach((project: any) => {
                        if (project.sellerId && !sellerMap.has(project.sellerId)) {
                            sellerMap.set(project.sellerId, {
                                sellerId: project.sellerId,
                                sellerEmail: project.sellerEmail || '',
                                sellerName: project.sellerName || project.sellerEmail?.split('@')[0] || 'Unknown',
                            });
                        }
                    });
                }

                const sellers = Array.from(sellerMap.values());
                console.log('Found sellers:', sellers);

                if (sellers.length === 0) {
                    console.log('No sellers found in projects');
                    setSellerEarnings([]);
                    setIsLoading(false);
                    return;
                }

                // Step 2: Fetch payment details for each seller using get_user_payments API
                console.log('Step 2: Fetching payment details for each seller...');
                const paymentPromises = sellers.map(async (seller) => {
                    try {
                        console.log(`Fetching payment details for seller: ${seller.sellerId}`);
                        const response = await fetch(GET_USER_PAYMENTS_ENDPOINT, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                                userId: seller.sellerId,
                                role: "admin"
                            }),
                        });

                        if (!response.ok) {
                            console.warn(`Failed to fetch payment for seller ${seller.sellerId}`);
                            return null;
                        }

                        const data = await response.json();
                        console.log(`Payment data for ${seller.sellerId}:`, data);

                        if (data.success && data.data) {
                            return {
                                seller,
                                paymentData: data.data
                            };
                        }
                        return null;
                    } catch (err) {
                        console.error(`Error fetching payment for seller ${seller.sellerId}:`, err);
                        return null;
                    }
                });

                const paymentResults = await Promise.all(paymentPromises);
                console.log('Payment results:', paymentResults);

                // Step 3: Process payment data and create seller earnings
                const earningsData: SellerEarnings[] = paymentResults
                    .filter(result => result !== null)
                    .map((result) => {
                        const { seller, paymentData } = result!;
                        const ordersArray = Array.isArray(paymentData.orders) ? paymentData.orders : [];

                        // Calculate earnings from successful orders
                        const successfulOrders = ordersArray.filter((order: any) => order.status === 'SUCCESS');
                        const totalEarnings = successfulOrders.reduce((sum: number, order: any) => {
                            const amount = order.totalAmount || 0;
                            return sum + (amount * 0.85); // 85% to seller
                        }, 0);

                        const pendingEarnings = ordersArray.filter((order: any) => order.status === 'PENDING')
                            .reduce((sum: number, order: any) => {
                                const amount = order.totalAmount || 0;
                                return sum + (amount * 0.85);
                            }, 0);

                        // Map orders to purchases format
                        const purchases: Purchase[] = successfulOrders.map((order: any, index: number) => {
                            const orderAmount = order.totalAmount || 0;
                            return {
                                id: `order-${seller.sellerId}-${index}`,
                                projectId: order.projectIds?.[0] || '',
                                projectTitle: `Project ${order.projectIds?.[0] || 'Unknown'}`,
                                projectImage: 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
                                buyerName: 'Buyer',
                                buyerEmail: order.userId || 'buyer@example.com',
                                purchaseDate: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                                amount: orderAmount,
                                commission: orderAmount * 0.15, // 15% commission
                                sellerEarnings: orderAmount * 0.85, // 85% to seller
                            };
                        });

                        return {
                            sellerId: seller.sellerId,
                            sellerName: seller.sellerName,
                            sellerEmail: seller.sellerEmail,
                            totalEarnings: totalEarnings,
                            pendingEarnings: pendingEarnings,
                            paidEarnings: totalEarnings - pendingEarnings,
                            purchases: purchases,
                        };
                    });

                setSellerEarnings(earningsData);
                console.log('Set seller earnings:', earningsData);
                setIsLoading(false);
                
            } catch (err) {
                console.error('Error fetching sellers:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch sellers');
                setIsLoading(false);
            }
        };

        fetchSellersWithPayments();
    }, []);

    // Fetch payment details for a seller using get_user_payments API
    const fetchSellerPaymentDetails = async (sellerId: string) => {
        try {
            console.log('Fetching payment details for seller:', sellerId);
            const response = await fetch(GET_USER_PAYMENTS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    userId: sellerId,
                    role: "admin"
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch payment details: ${response.statusText}`);
            }

            const data: PaymentApiResponse = await response.json();
            console.log('Payment details response:', data);

            if (data.success && data.data) {
                const paymentData = data.data;
                
                // Calculate earnings from orders (for sellers, orders represent sales)
                const ordersArray = Array.isArray(paymentData.orders) ? paymentData.orders : [];
                
                // For sellers, calculate earnings from successful orders
                const successfulOrders = ordersArray.filter((order: any) => order.status === 'SUCCESS');
                const totalEarnings = successfulOrders.reduce((sum: number, order: any) => {
                    const amount = order.totalAmount || 0;
                    return sum + (amount * 0.85); // 85% to seller
                }, 0);

                // Map orders to purchases format
                const purchases: Purchase[] = successfulOrders.map((order: any, index: number) => {
                    const orderAmount = order.totalAmount || 0;
                    return {
                        id: `order-${sellerId}-${index}`,
                        projectId: order.projectIds?.[0] || '',
                        projectTitle: `Project ${order.projectIds?.[0] || 'Unknown'}`,
                        projectImage: 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
                        buyerName: 'Buyer',
                        buyerEmail: order.userId || 'buyer@example.com',
                        purchaseDate: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        amount: orderAmount,
                        commission: orderAmount * 0.15, // 15% commission
                        sellerEarnings: orderAmount * 0.85, // 85% to seller
                    };
                });

                // Update or add seller to earnings list
                setSellerEarnings(prev => {
                    const existingIndex = prev.findIndex(s => s.sellerId === sellerId);
                    const sellerData = {
                        sellerId: sellerId,
                        sellerName: paymentData.userId || 'Unknown Seller',
                        sellerEmail: paymentData.userId || 'unknown@example.com',
                        totalEarnings: totalEarnings,
                        pendingEarnings: 0, // TODO: Calculate from pending orders
                        paidEarnings: totalEarnings,
                        purchases: purchases,
                    };

                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = sellerData;
                        return updated;
                    } else {
                        return [...prev, sellerData];
                    }
                });

                // Store payment data
                setSellerPaymentData(prev => {
                    const newMap = new Map(prev);
                    newMap.set(sellerId, paymentData);
                    return newMap;
                });
            }
        } catch (err) {
            console.error('Error fetching seller payment details:', err);
        }
    };


    // Fetch payment data for a specific seller when viewing details using get_user_payments API
    const fetchSellerPaymentData = async (sellerId: string) => {
        // Check if we already have payment data cached
        if (sellerPaymentData.has(sellerId)) {
            console.log('Using cached payment data for seller:', sellerId);
            return;
        }

        // Use the fetchSellerPaymentDetails function
        await fetchSellerPaymentDetails(sellerId);
    };

    // Payout requests - will be populated from API or user actions
    const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);

    const totalPendingAmount = useMemo(() => {
        return payoutRequests
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0);
    }, [payoutRequests]);

    const totalRemainingToPay = useMemo(() => {
        return sellerEarnings.reduce((sum, s) => sum + s.pendingEarnings, 0);
    }, [sellerEarnings]);

    const handleApprove = (requestId: string) => {
        setPayoutRequests(payoutRequests.map(p => 
            p.id === requestId ? { ...p, status: 'approved' as const } : p
        ));
    };

    const handleReject = (requestId: string) => {
        setPayoutRequests(payoutRequests.map(p => 
            p.id === requestId ? { ...p, status: 'rejected' as const } : p
        ));
    };

    const handleComplete = (requestId: string) => {
        const request = payoutRequests.find(p => p.id === requestId);
        if (request) {
            setPayoutRequests(payoutRequests.map(p => 
                p.id === requestId ? { ...p, status: 'completed' as const } : p
            ));
            // Update seller earnings
            setSellerEarnings(sellerEarnings.map(s => 
                s.sellerId === request.sellerId 
                    ? { ...s, paidEarnings: s.paidEarnings + request.amount, pendingEarnings: s.pendingEarnings - request.amount }
                    : s
            ));
        }
    };

    const selectedSellerData = sellerEarnings.find(s => s.sellerId === selectedSeller);

    // Fetch payment data when seller is selected
    useEffect(() => {
        if (selectedSeller && !sellerPaymentData.has(selectedSeller)) {
            fetchSellerPaymentData(selectedSeller);
        }
    }, [selectedSeller]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading seller earnings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">Error: {error}</p>
                </div>
            </div>
        );
    }

    if (selectedSeller && selectedSellerData) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedSeller(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Payout Overview
                </button>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {selectedSellerData.sellerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedSellerData.sellerName}</h2>
                            <p className="text-gray-600">{selectedSellerData.sellerEmail}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium mb-1">Total Earnings</p>
                            <p className="text-3xl font-bold text-blue-900">₹{selectedSellerData.totalEarnings.toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-5 border border-yellow-200">
                            <p className="text-sm text-yellow-700 font-medium mb-1">Pending</p>
                            <p className="text-3xl font-bold text-yellow-900">₹{selectedSellerData.pendingEarnings.toFixed(2)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-200">
                            <p className="text-sm text-green-700 font-medium mb-1">Paid</p>
                            <p className="text-3xl font-bold text-green-900">₹{selectedSellerData.paidEarnings.toFixed(2)}</p>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">Purchase Details</h3>
                    <div className="space-y-4">
                        {selectedSellerData.purchases.map((purchase) => (
                            <div key={purchase.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <div className="flex gap-4">
                                    <img src={purchase.projectImage} alt={purchase.projectTitle} className="w-20 h-20 rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 mb-2">{purchase.projectTitle}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Buyer</p>
                                                <p className="font-semibold text-gray-900">{purchase.buyerName}</p>
                                                <p className="text-gray-600 text-xs">{purchase.buyerEmail}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Purchase Date</p>
                                                <p className="font-semibold text-gray-900">{purchase.purchaseDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Total Amount</p>
                                                <p className="font-semibold text-gray-900">₹{purchase.amount.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Seller Earnings</p>
                                                <p className="font-semibold text-green-600">₹{purchase.sellerEarnings.toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">Commission: ₹{purchase.commission.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Remaining</p>
                            <p className="text-2xl font-bold text-gray-900">₹{totalRemainingToPay.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-yellow-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-yellow-700 font-medium">Pending Requests</p>
                            <p className="text-2xl font-bold text-yellow-900">{payoutRequests.filter(p => p.status === 'pending').length}</p>
                            <p className="text-xs text-yellow-600 mt-1">₹{totalPendingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-blue-700 font-medium">Approved</p>
                            <p className="text-2xl font-bold text-blue-900">{payoutRequests.filter(p => p.status === 'approved').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-green-700 font-medium">Completed</p>
                            <p className="text-2xl font-bold text-green-900">{payoutRequests.filter(p => p.status === 'completed').length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('overview')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'overview' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Seller Earnings
                    </button>
                    <button
                        onClick={() => setViewMode('requests')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'requests' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Payment Requests
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'history' 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Payment History
                    </button>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'overview' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {sellerEarnings.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium mb-2">No sellers found</p>
                            <p className="text-gray-400 text-sm">Sellers will appear here once they register and start earning.</p>
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Seller</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Earnings</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Pending</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Purchases</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sellerEarnings.map((seller) => (
                                    <tr key={seller.sellerId} className="hover:bg-orange-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {seller.sellerName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">{seller.sellerName}</div>
                                                    <div className="text-sm text-gray-500">{seller.sellerEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900">₹{seller.totalEarnings.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-yellow-600">₹{seller.pendingEarnings.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-green-600">₹{seller.paidEarnings.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">{seller.purchases.length}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedSeller(seller.sellerId)}
                                                className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg transition-colors font-semibold"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>
            )}

            {viewMode === 'requests' && (
                <div className="space-y-4">
                    {payoutRequests.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium mb-2">No payout requests</p>
                            <p className="text-gray-400 text-sm">Payout requests will appear here when sellers request payouts.</p>
                        </div>
                    ) : (
                        payoutRequests.filter(p => p.status === 'pending' || p.status === 'approved').map((request) => (
                        <div key={request.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                                        {request.sellerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{request.sellerName}</h3>
                                        <p className="text-sm text-gray-500">{request.sellerEmail}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">₹{request.amount.toFixed(2)}</p>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                                        request.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                        'bg-yellow-100 text-yellow-800 border-yellow-300'
                                    }`}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Request Date</p>
                                        <p className="font-semibold text-gray-900">{request.requestDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Payment Method</p>
                                        <p className="font-semibold text-gray-900">{request.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Account Details</p>
                                        <p className="font-semibold text-gray-900">{request.accountDetails}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Purchases</p>
                                        <p className="font-semibold text-gray-900">{request.purchases.length} items</p>
                                    </div>
                                </div>
                            </div>

                            {request.purchases.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Included Purchases:</p>
                                    <div className="space-y-2">
                                        {request.purchases.map((purchase) => (
                                            <div key={purchase.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                                                <img src={purchase.projectImage} alt={purchase.projectTitle} className="w-12 h-12 rounded-lg object-cover" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900">{purchase.projectTitle}</p>
                                                    <p className="text-xs text-gray-500">Buyer: {purchase.buyerName} • ${purchase.sellerEarnings.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {request.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold shadow-md hover:shadow-lg"
                                        >
                                            Approve Request
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold shadow-md hover:shadow-lg"
                                        >
                                            Reject Request
                                        </button>
                                    </>
                                )}
                                {request.status === 'approved' && (
                                    <button
                                        onClick={() => handleComplete(request.id)}
                                        className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold shadow-md hover:shadow-lg"
                                    >
                                        Mark as Paid
                                    </button>
                                )}
                            </div>
                        </div>
                        ))
                    )}
                </div>
            )}

            {viewMode === 'history' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {payoutRequests.filter(p => p.status === 'completed').length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium mb-2">No payment history</p>
                            <p className="text-gray-400 text-sm">Completed payouts will appear here.</p>
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Seller</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payoutRequests.filter(p => p.status === 'completed').map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.requestDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{request.sellerName}</div>
                                                <div className="text-sm text-gray-500">{request.sellerEmail}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900">₹{request.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {request.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PayoutSystemsPage;
