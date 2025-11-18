import React from 'react';

const sellerProjects = [
    { id: 'sp-1', title: 'E-commerce Platform', status: 'Live', sales: 45, price: 49.99, category: 'Web Development' },
    { id: 'sp-2', title: 'Social Media App', status: 'Live', sales: 32, price: 59.99, category: 'Mobile App' },
    { id: 'sp-3', title: 'Sales Prediction AI', status: 'In Review', sales: 0, price: 79.99, category: 'Data Science' },
    { id: 'sp-4', title: 'Task Management Tool', status: 'Live', sales: 18, price: 44.99, category: 'Web Application' },
    { id: 'sp-5', title: '2D Platformer Game', status: 'Draft', sales: 0, price: 39.99, category: 'Game Development' },
    { id: 'sp-6', title: 'Fintech App UI Kit', status: 'Live', sales: 61, price: 29.99, category: 'UI/UX Design' },
];

const StatusBadge = ({ status }: { status: string }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full";
    const statusClasses = {
        'Live': 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
        'In Review': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
        'Draft': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
}

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


const MyProjectsPage: React.FC = () => {
    return (
        <div className="mt-8">
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Title</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sales</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-800">
                            {sellerProjects.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{project.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.category}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={project.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{project.sales}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">${project.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                       <div className="flex items-center gap-2">
                                            <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"><EditIcon /></button>
                                            <button className="p-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"><DeleteIcon /></button>
                                       </div>
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

export default MyProjectsPage;