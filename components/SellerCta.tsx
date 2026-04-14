import React from "react";
import { motion } from "motion/react";
import {
  Rocket,
  Check,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { useNavigation } from "../App";

const SellerCta: React.FC = () => {
  const { navigateTo } = useNavigation();

  const benefits = [
    { icon: <Zap className="w-4 h-4" />, text: "Start selling in under 5 minutes" },
    { icon: <Shield className="w-4 h-4" />, text: "No upfront costs or hidden fees" },
    { icon: <TrendingUp className="w-4 h-4" />, text: "Keep 90% of every sale" },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-20 -top-20 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] bg-orange-900/30 rounded-full blur-[120px]" />

        {/* Floating shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[15%] w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-[10%] w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm border border-white/20"
        />
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-1/3 right-[20%] w-12 h-12 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white py-2 px-5 rounded-full text-sm font-medium mb-8 border border-white/30"
          >
            <Rocket className="w-4 h-4" />
            Join 5,000+ Sellers Earning on ProjectBazaar
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Ready to Turn Your
            <br />
            <span className="text-white/90">Projects Into Profit?</span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Stop letting your hard work collect dust. Upload your projects today and start earning passive income from buyers worldwide.
          </motion.p>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-6 mb-10"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-white/90"
              >
                <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigateTo('browseProjects')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-orange-600 font-bold rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group"
            >
              Start Selling Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('how-it-works-seller');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all duration-300 border border-white/30"
            >
              See How It Works
            </button>
          </motion.div>

          {/* Trust note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-white/60 text-sm mt-8"
          >
            No credit card required • Free to join • Cancel anytime
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default SellerCta;

