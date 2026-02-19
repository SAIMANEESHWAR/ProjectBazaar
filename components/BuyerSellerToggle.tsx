import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  BadgeIndianRupee, 
  Rocket, 
  Search, 
  ShoppingCart, 
  Download,
  ArrowRight,
  Percent,
  Zap,
  Globe2,
  Shield,
  BarChart3,
  Clock,
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Users
} from "lucide-react";
import { useNavigation } from "../App";
import { useDashboard } from "../context/DashboardContext";

type Mode = "buyer" | "seller";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

const buyerSteps: Step[] = [
  {
    icon: <Search className="w-7 h-7" />,
    title: "Browse & Discover",
    description: "Explore thousands of ready-to-use projects across web, mobile, AI, and more.",
  },
  {
    icon: <ShoppingCart className="w-7 h-7" />,
    title: "Purchase Securely",
    description: "Pay safely with our secure checkout. All transactions are protected.",
  },
  {
    icon: <Download className="w-7 h-7" />,
    title: "Download & Build",
    description: "Get instant access to source code and start building immediately.",
  },
];

const sellerSteps: Step[] = [
  {
    icon: <Upload className="w-7 h-7" />,
    title: "Upload Your Project",
    description: "Share your code, designs, or templates. Set up in under 5 minutes.",
  },
  {
    icon: <BadgeIndianRupee className="w-7 h-7" />,
    title: "Set Your Price",
    description: "You're in control. Set competitive prices and offer discounts.",
  },
  {
    icon: <Rocket className="w-7 h-7" />,
    title: "Get Paid Instantly",
    description: "Receive payments directly to your bank or UPI. No waiting period.",
  },
];

const buyerBenefits: Benefit[] = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Quality Verified",
    description: "All projects are reviewed for quality and functionality.",
    highlight: "Verified",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Save Time",
    description: "Skip weeks of development with ready-made solutions.",
    highlight: "10x Faster",
  },
  {
    icon: <HeartHandshake className="w-5 h-5" />,
    title: "Seller Support",
    description: "Get help from sellers for customization and queries.",
    highlight: "Direct Chat",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Money Back Guarantee",
    description: "Not satisfied? Get a full refund within 7 days.",
    highlight: "7 Days",
  },
];

const sellerBenefits: Benefit[] = [
  {
    icon: <Percent className="w-5 h-5" />,
    title: "Low Platform Fees",
    description: "Keep more of what you earn. Industry-lowest fees.",
    highlight: "Only 10%",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Instant Payouts",
    description: "Get paid directly to bank or UPI. Same day.",
    highlight: "Same Day",
  },
  {
    icon: <Globe2 className="w-5 h-5" />,
    title: "Global Reach",
    description: "Your projects visible to buyers worldwide.",
    highlight: "10K+ Buyers",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Analytics Dashboard",
    description: "Track views, sales, and earnings in real-time.",
    highlight: "Real-time",
  },
];

const ToggleSwitch: React.FC<{ mode: Mode; setMode: (mode: Mode) => void }> = ({ mode, setMode }) => {
  return (
    <div className="inline-flex items-center p-1.5 bg-white/5 rounded-full border border-white/10">
      <button
        onClick={() => setMode("buyer")}
        className={`relative px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
          mode === "buyer" ? "text-white" : "text-white/50 hover:text-white/70"
        }`}
      >
        {mode === "buyer" && (
          <motion.div
            layoutId="toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          I'm a Buyer
        </span>
      </button>
      <button
        onClick={() => setMode("seller")}
        className={`relative px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
          mode === "seller" ? "text-white" : "text-white/50 hover:text-white/70"
        }`}
      >
        {mode === "seller" && (
          <motion.div
            layoutId="toggle-bg"
            className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          I'm a Seller
        </span>
      </button>
    </div>
  );
};

const StepCard: React.FC<{ step: Step; index: number; mode: Mode }> = ({ step, index, mode }) => {
  const gradients = {
    buyer: ["from-orange-500 to-orange-600", "from-amber-500 to-orange-500", "from-orange-600 to-amber-500"],
    seller: ["from-orange-500 to-amber-500", "from-orange-600 to-orange-500", "from-amber-500 to-orange-600"],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="text-center"
    >
      {/* Step number */}
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/60 text-sm font-bold mb-4">
        {index + 1}
      </div>
      
      {/* Icon */}
      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradients[mode][index]} text-white mb-4 shadow-lg mx-auto`}>
        {step.icon}
      </div>
      
      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {step.title}
      </h3>
      <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
        {step.description}
      </p>
    </motion.div>
  );
};

const BenefitCard: React.FC<{ benefit: Benefit; index: number; mode: Mode }> = ({ benefit, index, mode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 group"
    >
      {/* Highlight badge */}
      {benefit.highlight && (
        <div className={`absolute -top-2.5 right-3 px-2.5 py-0.5 text-xs font-bold rounded-full shadow-lg ${
          mode === "buyer" 
            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" 
            : "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
        }`}>
          {benefit.highlight}
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          "bg-orange-500/20 text-orange-400"
        }`}>
          {benefit.icon}
        </div>
        <div>
          <h4 className="text-white font-medium mb-1">{benefit.title}</h4>
          <p className="text-white/50 text-sm">{benefit.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const BuyerSellerToggle: React.FC = () => {
  const { dashboardMode: mode, setDashboardMode: setMode } = useDashboard();
  const { navigateTo } = useNavigation();

  const steps = mode === "buyer" ? buyerSteps : sellerSteps;
  const benefits = mode === "buyer" ? buyerBenefits : sellerBenefits;

  return (
    <section className="relative py-24 overflow-hidden bg-black">
      {/* Background decorations - orange only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: mode === "buyer" ? -100 : 100,
            opacity: mode === "buyer" ? 0.08 : 0.04,
          }}
          transition={{ duration: 0.8 }}
          className="absolute left-0 top-1/4 w-[500px] h-[500px] bg-orange-500 rounded-full blur-[200px]"
        />
        <motion.div
          animate={{
            x: mode === "seller" ? -100 : 100,
            opacity: mode === "seller" ? 0.08 : 0.04,
          }}
          transition={{ duration: 0.8 }}
          className="absolute right-0 bottom-1/4 w-[500px] h-[500px] bg-orange-600 rounded-full blur-[200px]"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header with Toggle */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 text-white/70 py-1.5 px-5 rounded-full text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Choose Your Path
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-white">How </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={mode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400"
                >
                  {mode === "buyer" ? "Buyers" : "Sellers"}
                </motion.span>
              </AnimatePresence>
              <span className="text-white"> Win</span>
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              {mode === "buyer" 
                ? "Find the perfect project and start building in minutes." 
                : "Turn your projects into passive income with ease."}
            </p>
          </motion.div>

          {/* Toggle Switch */}
          <ToggleSwitch mode={mode} setMode={setMode} />
        </div>

        {/* How It Works Steps */}
        <div className="mb-16">
          <h3 className="text-center text-white/40 text-sm uppercase tracking-wider mb-8">
            {mode === "buyer" ? "Your Buying Journey" : "Your Selling Journey"}
          </h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + "-steps"}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              {steps.map((step, index) => (
                <StepCard key={step.title} step={step} index={index} mode={mode} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Connector line on desktop */}
        <div className="hidden md:flex justify-center mb-16">
          <div className="h-0.5 w-48 rounded-full bg-gradient-to-r from-orange-500/50 to-amber-500/50" />
        </div>

        {/* Benefits Grid */}
        <div className="mb-16">
          <h3 className="text-center text-white/40 text-sm uppercase tracking-wider mb-8">
            {mode === "buyer" ? "Why Buy Here" : "Why Sell Here"}
          </h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + "-benefits"}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto"
            >
              {benefits.map((benefit, index) => (
                <BenefitCard key={benefit.title} benefit={benefit} index={index} mode={mode} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + "-cta"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="inline-flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={() => navigateTo('auth')}
                className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-full transition-all duration-300 shadow-lg group bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:shadow-orange-500/40"
              >
                {mode === "buyer" ? "Start Browsing Projects" : "Start Selling Today"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigateTo('auth')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full transition-all duration-300"
              >
                <CheckCircle2 className="w-5 h-5" />
                {mode === "buyer" ? "View All Projects" : "See Success Stories"}
              </button>
            </motion.div>
          </AnimatePresence>

          <p className="text-white/40 text-sm mt-6">
            {mode === "buyer" 
              ? "Join 10,000+ developers who found their perfect projects" 
              : "Join 5,000+ sellers earning passive income"}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default BuyerSellerToggle;

