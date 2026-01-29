import React from 'react';
import Lottie from 'lottie-react';
import noEarningAnimation from '../lottiefiles/no_earning_animation.json';

const BankIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.8 11.52A14.28 14.28 0 0012 12.5a14.28 14.28 0 004.2-1.02M12 3L2 9l10 6 10-6-10-6z" /></svg>;

const payoutHistory: { id: string; date: string; amount: number; method: string; status: string }[] = [];

interface StatusBadgeProps {
    status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full";
    const statusClasses: { [key: string]: string } = {
        'Completed': 'bg-green-100 text-green-800',
        'Processing': 'bg-yellow-100 text-yellow-800',
        'Failed': 'bg-red-100 text-red-800',
    };
    return <span className={`${baseClasses} ${statusClasses[status] || statusClasses['Completed']}`}>{status}</span>;
}

const PayoutsPage: React.FC = () => {
    return (
        <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 h-full flex flex-col justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Available Balance</p>
                            <p className="text-4xl font-bold text-gray-900 mt-2">₹0.00</p>
                            <p className="text-xs text-gray-400 mt-1">Request a payout when you have balance from sales</p>
                        </div>
                        <button className="w-full mt-6 bg-gray-300 text-gray-500 font-semibold py-3 rounded-lg cursor-not-allowed" disabled>
                            Request Payout
                        </button>
                    </div>
                </div>
                <div className="md:col-span-2">
                     <div className="bg-white border border-gray-200 rounded-xl p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900">Payout Method</h3>
                        <div className="mt-4 p-6 border border-dashed border-gray-200 rounded-lg text-center">
                            <BankIcon />
                            <p className="font-medium text-gray-800 mt-2">No payout method added</p>
                            <p className="text-sm text-gray-500 mt-1">Add a bank account to receive your earnings</p>
                            <button className="mt-4 text-sm font-medium text-blue-600 hover:underline">+ Add payout method</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <h3 className="text-lg font-semibold text-gray-900 p-6">Payout History</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payoutHistory.length > 0 ? (
                                payoutHistory.map((payout) => (
                                    <tr key={payout.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payout.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">₹{payout.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payout.method}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={payout.status} /></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="mx-auto mb-4 w-full max-w-[380px] h-[200px] flex items-center justify-center">
                                                <Lottie
                                                    animationData={noEarningAnimation}
                                                    loop
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <p className="text-gray-500 text-lg font-medium">No payouts yet</p>
                                            <p className="text-gray-400 text-sm mt-1">Your payout history will appear here once you request payouts.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PayoutsPage;