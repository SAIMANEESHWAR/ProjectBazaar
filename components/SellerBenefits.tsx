import React from "react";
import { motion } from "motion/react";
import { 
  Percent, 
  Zap, 
  Globe2, 
  TrendingUp, 
  Shield, 
  BarChart3,
  CheckCircle2
} from "lucide-react";

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

const benefits: Benefit[] = [
  {
    icon: <Percent className="w-6 h-6" />,
    title: "Low Platform Fees",
    description: "Keep more of what you earn. We only take 10% - one of the lowest in the industry.",
    highlight: "Only 10%",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Payouts",
    description: "Get paid directly to your bank account or UPI. No waiting periods or minimum thresholds.",
    highlight: "Same Day",
  },
  {
    icon: <Globe2 className="w-6 h-6" />,
    title: "Global Buyer Reach",
    description: "Your projects are visible to thousands of buyers from around the world, 24/7.",
    highlight: "10K+ Buyers",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Passive Income",
    description: "Upload once, earn forever. Your projects keep selling while you focus on creating more.",
    highlight: "Recurring",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Keep Your IP Rights",
    description: "You retain full ownership of your work. We never claim rights to your intellectual property.",
    highlight: "100% Yours",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analytics Dashboard",
    description: "Track views, sales, and earnings with detailed analytics. Know what sells best.",
    highlight: "Real-time",
  },
];

const BenefitCard: React.FC<{ benefit: Benefit; index: number }> = ({ benefit, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="relative h-full p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
        {/* Highlight badge */}
        {benefit.highlight && (
          <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
            {benefit.highlight}
          </div>
        )}
        
        {/* Icon */}
        <div className="inline-flex p-3 rounded-xl bg-orange-500/10 text-orange-400 mb-4 group-hover:bg-orange-500/20 transition-colors duration-300">
          {benefit.icon}
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
          {benefit.title}
        </h3>
        <p className="text-white/60 text-sm leading-relaxed">
          {benefit.description}
        </p>
      </div>
    </motion.div>
  );
};

const SellerBenefits: React.FC = () => {
  const stats = [
    { value: "₹2Cr+", label: "Paid to Sellers" },
    { value: "5,000+", label: "Active Sellers" },
    { value: "50K+", label: "Projects Sold" },
    { value: "4.8★", label: "Seller Rating" },
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#1a1025] to-[#0f0a15]">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-1/4 top-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[200px]" />
        <div className="absolute left-0 bottom-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[150px]" />
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
            <CheckCircle2 className="w-4 h-4" />
            Why Sell on CodeXCareer
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="text-white">Built for </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
              Creator Success
            </span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            We've designed everything to help you succeed. From low fees to instant payouts, 
            we're on your side.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-14"
        >
          {stats.map((stat, _index) => (
            <div 
              key={stat.label}
              className="text-center p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                {stat.value}
              </div>
              <div className="text-white/50 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <BenefitCard key={benefit.title} benefit={benefit} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SellerBenefits;

