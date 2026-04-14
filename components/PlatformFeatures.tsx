import React from "react";
import { motion } from "motion/react";
import {
  Users,
  Gavel,
  Trophy,
  FileText,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigation } from "../App";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
  color: string;
  gradient: string;
  bgGlow: string;
  action: string;
  page: 'browseProjects' | 'buildPortfolio' | 'auth';
}

const features: Feature[] = [
  {
    icon: <Users className="w-8 h-8" />,
    title: "View Top Talent",
    description: "Browse through skilled developers, designers, and creators. Find the perfect talent for your project needs.",
    highlight: "500+ Experts",
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-orange-600/10",
    bgGlow: "bg-orange-500/20",
    action: "View Projects",
    page: 'browseProjects',
  },
  {
    icon: <Gavel className="w-8 h-8" />,
    title: "Place & Receive Bids",
    description: "Post your project requirements and receive competitive bids from talented freelancers. Choose the best offer.",
    highlight: "Competitive Pricing",
    color: "text-orange-400",
    gradient: "from-orange-600/20 to-orange-500/10",
    bgGlow: "bg-orange-600/20",
    action: "Post a Project",
    page: 'browseProjects',
  },
  {
    icon: <Trophy className="w-8 h-8" />,
    title: "Explore Hackathons",
    description: "Discover exciting hackathons, compete with peers, win prizes, and showcase your skills to potential employers.",
    highlight: "Live Events",
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-orange-500/10",
    bgGlow: "bg-amber-500/20",
    action: "View Hackathons",
    page: 'auth',
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Build Portfolio in Seconds",
    description: "Create a stunning professional portfolio instantly. Showcase your projects, skills, and achievements effortlessly.",
    highlight: "AI-Powered",
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-orange-600/10",
    bgGlow: "bg-orange-500/20",
    action: "Build Now",
    page: 'buildPortfolio',
  },
];

const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
  const { navigateTo } = useNavigation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className={`relative h-full p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm hover:border-white/20 transition-all duration-300 overflow-hidden`}>
        {/* Background glow effect */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 ${feature.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />

        {/* Highlight badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 bg-white/10 ${feature.color} text-xs font-bold rounded-full`}>
          {feature.highlight}
        </div>

        {/* Icon */}
        <div className={`inline-flex p-4 rounded-xl bg-white/5 ${feature.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
          {feature.icon}
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-orange-300 transition-colors">
          {feature.title}
        </h3>
        <p className="text-white/50 text-sm leading-relaxed mb-5">
          {feature.description}
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigateTo(feature.page)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 ${feature.color} text-sm font-medium rounded-full transition-all duration-300 group/btn`}
        >
          {feature.action}
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

const PlatformFeatures: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden bg-[#0a0a0a]">
      {/* Background decorations - orange only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/4 top-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[200px]" />
        <div className="absolute right-0 bottom-1/3 w-[400px] h-[400px] bg-orange-600/8 rounded-full blur-[150px]" />
        <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/10 text-orange-400 py-1.5 px-5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            More Than Just a Marketplace
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="text-white">Everything You Need to </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
              Succeed
            </span>
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            From hiring talent to building your portfolio — discover all the powerful features
            that make ProjectBazaar the ultimate platform for creators and buyers.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-orange-600/10 to-orange-500/10 border border-white/10 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                500+
              </div>
              <div className="text-white/70 text-sm mt-1">Active Freelancers</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                1,200+
              </div>
              <div className="text-white/70 text-sm mt-1">Bids Placed</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                50+
              </div>
              <div className="text-white/70 text-sm mt-1">Live Hackathons</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-500">
                2,000+
              </div>
              <div className="text-white/70 text-sm mt-1">Portfolios Built</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
