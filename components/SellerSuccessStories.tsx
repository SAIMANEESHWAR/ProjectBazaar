import React from "react";
import { motion } from "motion/react";
import { Star, TrendingUp, Calendar, ShoppingBag, Quote } from "lucide-react";

interface SuccessStory {
  name: string;
  avatar: string;
  role: string;
  college?: string;
  beforeEarnings: string;
  afterEarnings: string;
  timeframe: string;
  projectsSold: number;
  quote: string;
  topProject: string;
  rating: number;
}

const successStories: SuccessStory[] = [
  {
    name: "Rahul Verma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    role: "Full Stack Developer",
    college: "IIT Delhi",
    beforeEarnings: "₹0",
    afterEarnings: "₹4.2L",
    timeframe: "8 months",
    projectsSold: 89,
    quote: "I started by uploading my final year project. Within a week, I made my first sale. Now I have a steady passive income while I focus on my job.",
    topProject: "MERN E-commerce Platform",
    rating: 4.9,
  },
  {
    name: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    role: "UI/UX Designer",
    college: "NID Ahmedabad",
    beforeEarnings: "₹0",
    afterEarnings: "₹3.1L",
    timeframe: "6 months",
    projectsSold: 67,
    quote: "As a design student, I never thought my Figma files could earn money. CodeXCareer changed that. My UI kits are now bought by startups worldwide!",
    topProject: "Fintech Mobile UI Kit",
    rating: 5.0,
  },
  {
    name: "Arjun Mehta",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    role: "ML Engineer",
    college: "BITS Pilani",
    beforeEarnings: "₹0",
    afterEarnings: "₹2.8L",
    timeframe: "5 months",
    projectsSold: 54,
    quote: "My machine learning projects from college were just sitting on GitHub. Now they generate ₹50K+ monthly. Best decision I ever made.",
    topProject: "Stock Price Predictor AI",
    rating: 4.8,
  },
];

const StoryCard: React.FC<{ story: SuccessStory; index: number }> = ({ story, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="relative h-full p-8 rounded-3xl border border-white/10 bg-black/80 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-500 overflow-hidden">
        {/* Quote icon */}
        <Quote className="absolute top-6 right-6 w-10 h-10 text-orange-500/20" />
        
        {/* Profile */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={story.avatar}
            alt={story.name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-orange-500/20"
          />
          <div>
            <h3 className="text-xl font-semibold text-white">{story.name}</h3>
            <p className="text-white/50 text-sm">{story.role}</p>
            {story.college && (
              <p className="text-orange-400/70 text-xs mt-0.5">{story.college}</p>
            )}
          </div>
        </div>

        {/* Quote */}
        <p className="text-white/70 leading-relaxed mb-6 italic">
          "{story.quote}"
        </p>

        {/* Earnings transformation */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 mb-6">
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">Before</div>
            <div className="text-white/70 font-semibold">{story.beforeEarnings}</div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-orange-400" />
          </div>
          <div className="text-center">
            <div className="text-orange-400 text-xs mb-1">After</div>
            <div className="text-orange-400 font-bold text-xl">{story.afterEarnings}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white font-semibold">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              {story.timeframe}
            </div>
            <div className="text-white/40 text-xs mt-0.5">Time</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white font-semibold">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
              {story.projectsSold}
            </div>
            <div className="text-white/40 text-xs mt-0.5">Sold</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white font-semibold">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              {story.rating}
            </div>
            <div className="text-white/40 text-xs mt-0.5">Rating</div>
          </div>
        </div>

        {/* Top project badge */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-white/40 text-xs mb-1">Top Selling Project</div>
          <div className="text-orange-400 font-medium text-sm">{story.topProject}</div>
        </div>
      </div>
    </motion.div>
  );
};

const SellerSuccessStories: React.FC = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-black">
      {/* Background decorations - orange only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/4 top-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[200px]" />
        <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-orange-600/8 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/10 text-orange-400 py-1.5 px-5 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            Real Success Stories
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="text-white">From </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">₹0</span>
            <span className="text-white"> to </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
              Lakhs
            </span>
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            See how students and developers like you turned their projects into real income. 
            These are real stories from our top sellers.
          </p>
        </motion.div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {successStories.map((story, index) => (
            <StoryCard key={story.name} story={story} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <p className="text-white/50 mb-4">Ready to write your success story?</p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40">
            Start Your Journey Today
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default SellerSuccessStories;

