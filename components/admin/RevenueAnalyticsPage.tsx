import React, { useState, useMemo } from 'react';

interface Transaction {
    id: string;
    date: string;
    projectId: string;
    projectTitle: string;
    projectImage: string;
    buyerId: string;
    buyerName: string;
    buyerEmail: string;
    sellerId: string;
    sellerName: string;
    sellerEmail: string;
    totalAmount: number;
    commission: number;
    sellerEarnings: number;
    status: 'paid' | 'pending';
}

interface SellerRevenue {
    sellerId: string;
    sellerName: string;
    sellerEmail: string;
    totalRevenue: number;
    commissionEarned: number;
    transactions: number;
}

const RevenueAnalyticsPage: React.FC = () => {
    const [selectedSeller, setSelectedSeller] = useState<string | null>(null);

    const [transactions] = useState<Transaction[]>([
        {
            id: 'txn-1',
            date: '2024-11-20',
            projectId: 'proj-1',
            projectTitle: 'E-commerce Platform',
            projectImage: 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
            buyerId: 'buyer-1',
            buyerName: 'Alice Buyer',
            buyerEmail: 'alice@example.com',
            sellerId: 'seller-1',
            sellerName: 'John Doe',
            sellerEmail: 'john.doe@example.com',
            totalAmount: 49.99,
            commission: 4.99,
            sellerEarnings: 45.00,
            status: 'paid',
        },
        {
            id: 'txn-2',
            date: '2024-11-19',
            projectId: 'proj-2',
            projectTitle: 'Social Media App',
            projectImage: 'https://images.unsplash.com/photo-1611162617213-6d22e4f13374?q=80&w=1974&auto=format&fit=crop',
            buyerId: 'buyer-2',
            buyerName: 'Bob Buyer',
            buyerEmail: 'bob@example.com',
            sellerId: 'seller-2',
            sellerName: 'Jane Smith',
            sellerEmail: 'jane.smith@example.com',
            totalAmount: 59.99,
            commission: 5.99,
            sellerEarnings: 54.00,
            status: 'paid',
        },
        {
            id: 'txn-3',
            date: '2024-11-18',
            projectId: 'proj-3',
            projectTitle: 'Task Management Tool',
            projectImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=1964&auto=format&fit=crop',
            buyerId: 'buyer-3',
            buyerName: 'Charlie Buyer',
            buyerEmail: 'charlie@example.com',
            sellerId: 'seller-1',
            sellerName: 'John Doe',
            sellerEmail: 'john.doe@example.com',
            totalAmount: 79.99,
            commission: 7.99,
            sellerEarnings: 72.00,
            status: 'pending',
        },
        {
            id: 'txn-4',
            date: '2024-11-17',
            projectId: 'proj-4',
            projectTitle: 'Portfolio Template',
            projectImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
            buyerId: 'buyer-4',
            buyerName: 'David Buyer',
            buyerEmail: 'david@example.com',
            sellerId: 'seller-2',
            sellerName: 'Jane Smith',
            sellerEmail: 'jane.smith@example.com',
            totalAmount: 29.99,
            commission: 2.99,
            sellerEarnings: 27.00,
            status: 'paid',
        },
    ]);

    const sellerRevenue = useMemo(() => {
        const sellerMap = new Map<string, SellerRevenue>();
        transactions.forEach(txn => {
            const existing = sellerMap.get(txn.sellerId);
            if (existing) {
                existing.totalRevenue += txn.totalAmount;
                existing.commissionEarned += txn.commission;
                existing.transactions += 1;
            } else {
                sellerMap.set(txn.sellerId, {
                    sellerId: txn.sellerId,
                    sellerName: txn.sellerName,
                    sellerEmail: txn.sellerEmail,
                    totalRevenue: txn.totalAmount,
                    commissionEarned: txn.commission,
                    transactions: 1,
                });
            }
        });
        return Array.from(sellerMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [transactions]);

    const totalRevenue = useMemo(() => {
        return transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    }, [transactions]);

    const totalCommission = useMemo(() => {
        return transactions.reduce((sum, t) => sum + t.commission, 0);
    }, [transactions]);

    const paidRevenue = useMemo(() => {
        return transactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.totalAmount, 0);
    }, [transactions]);

    const pendingRevenue = useMemo(() => {
        return transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.totalAmount, 0);
    }, [transactions]);

    const monthlyRevenue = [
        { month: 'Jan', revenue: 12500, commission: 1250 },
        { month: 'Feb', revenue: 18900, commission: 1890 },
        { month: 'Mar', revenue: 15200, commission: 1520 },
        { month: 'Apr', revenue: 22300, commission: 2230 },
        { month: 'May', revenue: 19800, commission: 1980 },
        { month: 'Jun', revenue: 25600, commission: 2560 },
        { month: 'Jul', revenue: 28900, commission: 2890 },
        { month: 'Aug', revenue: 31200, commission: 3120 },
        { month: 'Sep', revenue: 27500, commission: 2750 },
        { month: 'Oct', revenue: 29800, commission: 2980 },
        { month: 'Nov', revenue: 32400, commission: 3240 },
        { month: 'Dec', revenue: 0, commission: 0 },
    ];

    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));

    const selectedSellerTransactions = selectedSeller 
        ? transactions.filter(t => t.sellerId === selectedSeller)
        : [];

    if (selectedSeller) {
        const seller = sellerRevenue.find(s => s.sellerId === selectedSeller);
        return (
            <div className="space-y-6">
                <button
                    onClick={() => setSelectedSeller(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Analytics
                </button>

                {seller && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                {seller.sellerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{seller.sellerName}</h2>
                                <p className="text-gray-600">{seller.sellerEmail}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-200">
                                <p className="text-sm text-blue-700 font-medium mb-1">Total Revenue</p>
                                <p className="text-3xl font-bold text-blue-900">₹{seller.totalRevenue.toFixed(2)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 border border-orange-200">
                                <p className="text-sm text-orange-700 font-medium mb-1">Commission Earned</p>
                                <p className="text-3xl font-bold text-orange-900">₹{seller.commissionEarned.toFixed(2)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border border-green-200">
                                <p className="text-sm text-green-700 font-medium mb-1">Transactions</p>
                                <p className="text-3xl font-bold text-green-900">{seller.transactions}</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-4">Transaction Details</h3>
                        <div className="space-y-4">
                            {selectedSellerTransactions.map((txn) => (
                                <div key={txn.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <div className="flex gap-4">
                                        <img src={txn.projectImage} alt={txn.projectTitle} className="w-20 h-20 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 mb-2">{txn.projectTitle}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Buyer</p>
                                                    <p className="font-semibold text-gray-900">{txn.buyerName}</p>
                                                    <p className="text-gray-600 text-xs">{txn.buyerEmail}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Date</p>
                                                    <p className="font-semibold text-gray-900">{txn.date}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Total Amount</p>
                                                    <p className="font-semibold text-gray-900">₹{txn.totalAmount.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Commission</p>
                                                    <p className="font-semibold text-orange-600">₹{txn.commission.toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500">Seller: ₹{txn.sellerEarnings.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                    txn.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {txn.status === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-orange-700 font-medium">Commission</p>
                            <p className="text-2xl font-bold text-orange-900">₹{totalCommission.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-green-700 font-medium">Paid</p>
                            <p className="text-2xl font-bold text-green-900">₹{paidRevenue.toLocaleString()}</p>
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
                            <p className="text-sm text-yellow-700 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-yellow-900">₹{pendingRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Revenue & Commission</h3>
                <div className="flex items-end justify-between gap-2 h-64">
                    {monthlyRevenue.map((month, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col items-center justify-end h-full gap-1">
                                <div
                                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg hover:from-orange-600 hover:to-orange-500 transition-all cursor-pointer relative group"
                                    style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                                    title={`${month.month}: Revenue ₹${month.revenue.toLocaleString()}, Commission ₹${month.commission.toLocaleString()}`}
                                >
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        ₹{month.revenue.toLocaleString()}
                                    </div>
                                </div>
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer"
                                    style={{ height: `${(month.commission / maxRevenue) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                            <span className="text-xs font-medium text-gray-700 mt-1">₹{(month.revenue / 1000).toFixed(0)}k</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-500"></div>
                        <span className="text-sm text-gray-600">Revenue</span>
            </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                        <span className="text-sm text-gray-600">Commission</span>
                    </div>
                </div>
            </div>

            {/* Seller Revenue */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Revenue by Seller</h3>
                        </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Revenue</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Commission</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Transactions</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sellerRevenue.map((seller) => (
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
                                        <span className="text-sm font-bold text-gray-900">₹{seller.totalRevenue.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-bold text-orange-600">${seller.commissionEarned.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900">{seller.transactions}</span>
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
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Buyer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Commission</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <img src={txn.projectImage} alt={txn.projectTitle} className="w-10 h-10 rounded-lg object-cover" />
                                            <span className="text-sm font-medium text-gray-900">{txn.projectTitle}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{txn.buyerName}</div>
                                            <div className="text-xs text-gray-500">{txn.buyerEmail}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{txn.sellerName}</div>
                                            <div className="text-xs text-gray-500">{txn.sellerEmail}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{txn.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">₹{txn.commission.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            txn.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RevenueAnalyticsPage;
