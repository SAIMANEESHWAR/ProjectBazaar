
import React from 'react';
import ProjectCard from './ProjectCard';
import type { Project } from './ProjectCard';
import { useNavigation } from '../App';

const projects: Project[] = [
  {
    imageUrl: 'https://picsum.photos/seed/1/600/400',
    category: 'Web Development',
    title: 'E-commerce Platform',
    description: 'A full-stack e-commerce solution built with MERN stack, including payment integration.',
    tags: ['React', 'Node.js', 'MongoDB', 'Express'],
    price: 49.99,
  },
  {
    imageUrl: 'https://picsum.photos/seed/2/600/400',
    category: 'Mobile App',
    title: 'Social Media App Clone',
    description: 'A feature-rich social media app clone developed using React Native and Firebase.',
    tags: ['React Native', 'Firebase', 'UX/UI'],
    price: 59.99,
  },
  {
    imageUrl: 'https://picsum.photos/seed/3/600/400',
    category: 'Data Science',
    title: 'Sales Prediction AI',
    description: 'A machine learning model to predict future sales data with high accuracy using Python.',
    tags: ['Python', 'Scikit-learn', 'Pandas'],
    price: 79.99,
  },
   {
    imageUrl: 'https://picsum.photos/seed/4/600/400',
    category: 'Game Development',
    title: '2D Platformer Game',
    description: 'An engaging 2D platformer game built with Unity engine and C#.',
    tags: ['Unity', 'C#', 'Game Design'],
    price: 39.99,
  },
  {
    imageUrl: 'https://picsum.photos/seed/5/600/400',
    category: 'DevOps',
    title: 'CI/CD Pipeline Automation',
    description: 'Automate your deployment process with this CI/CD pipeline using Jenkins and Docker.',
    tags: ['Jenkins', 'Docker', 'CI/CD'],
    price: 69.99,
  },
  {
    imageUrl: 'https://picsum.photos/seed/6/600/400',
    category: 'UI/UX Design',
    title: 'Fintech App UI Kit',
    description: 'A complete UI kit for a modern fintech application, designed in Figma.',
    tags: ['Figma', 'UI Kit', 'Design System'],
    price: 29.99,
  },
];

const FeaturedProjects: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-4">Featured Projects</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 text-center">
          Explore a selection of high-quality projects from our talented creators.
        </p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
        <div className="text-center mt-12">
            <button onClick={() => navigateTo('auth')} className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300">
                Browse More Projects
            </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
