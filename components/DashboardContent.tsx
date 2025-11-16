import React from 'react';
import DashboardHeader from './DashboardHeader';
import ProjectDashboardCard from './ProjectDashboardCard';

const featuredApps = [
    { name: 'Zapier', domain: 'zapier.com', description: 'Automation: No-code tool that connects your CRM to 5,000+ other apps, instantly automatin...', logo: 'https://cdn.worldvectorlogo.com/logos/zapier.svg' },
    { name: 'Slack', domain: 'slack.com', description: 'Communication: A messaging platform designed for teams, offering channels, direct messaging,...', logo: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg' },
    { name: 'Trello', domain: 'trello.com', description: 'Project Management: Visual tool for organizing tasks and projects using boards, lists, and card...', logo: 'https://cdn.worldvectorlogo.com/logos/trello.svg' },
    { name: 'Asana', domain: 'asana.com', description: 'Task Management: A platform that helps teams plan, organize, and track their work through cus...', logo: 'https://cdn.worldvectorlogo.com/logos/asana-1.svg' },
    { name: 'Monday.com', domain: 'monday.com', description: 'Work OS: A flexible project management tool that allows teams to build custom workflows, track p...', logo: 'https://cdn.worldvectorlogo.com/logos/monday-1.svg' },
    { name: 'Notion', domain: 'notion.so', description: 'All-in-one Workspace: A versatile tool for note-taking, project management, and collaboration,...', logo: 'https://cdn.worldvectorlogo.com/logos/notion-1.svg' }
];

const dataSalesIntelApps = [
    { name: 'ZoomInfo', domain: 'zoominfo.com', description: 'Data Enrichment: Automatically fills in missing B2B contact and company details (phone, indus...', logo: 'https://images.g2crowd.com/uploads/product/image/large_detail/large_detail_1526065528/zoominfo.png' },
    { name: 'DocuSign', domain: 'docusign.com', description: 'E-Signature: Manages the contract lifecycle, allowing sales reps to generate, send, and track...', logo: 'https://cdn.worldvectorlogo.com/logos/docusign.svg' },
    { name: 'Make', domain: 'make.com', description: 'Advanced Automation: A visual builder for complex, multi-step workflows, offering granula...', logo: 'https://cdn.worldvectorlogo.com/logos/integromat.svg' }
];


const DashboardContent: React.FC = () => {
    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-black">
            <div className="container mx-auto px-6 py-8">
                <DashboardHeader />
                
                <div className="mt-8">
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Featured Projects</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Streamline work, save your time and growth easier.</p>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredApps.map((app, index) => (
                           <ProjectDashboardCard key={index} {...app} />
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                     <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Data & Sales Intel</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Integrate data and sales intelligence for seamless growth and efficiency.</p>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {dataSalesIntelApps.map((app, index) => (
                           <ProjectDashboardCard key={index} {...app} />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default DashboardContent;
