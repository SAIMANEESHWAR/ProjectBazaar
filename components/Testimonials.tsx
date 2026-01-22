import React from "react";
import { TestimonialsColumn, Testimonial } from "./ui/testimonials-columns";
import { motion } from "motion/react";

const testimonials: Testimonial[] = [
  {
    text: "Sold my final year project in just 2 days! ProjectBazaar made it incredibly easy to monetize my hard work. Already earned ₹15,000 from my ML project.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    name: "Rahul Sharma",
    role: "Computer Science Student",
  },
  {
    text: "As a buyer, I found exactly what I needed - a complete e-commerce template that saved me weeks of development. Worth every rupee!",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    name: "Priya Patel",
    role: "Startup Founder",
  },
  {
    text: "The quality of projects here is amazing. Bought a React Native app template and customized it for my client in just 3 days.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    name: "Arjun Mehta",
    role: "Freelance Developer",
  },
  {
    text: "I've made over ₹2,000 selling my college projects here. The platform handles everything - payments, delivery, customer support.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    name: "Sneha Reddy",
    role: "Full Stack Developer",
  },
  {
    text: "Best investment for my startup! Got a complete SaaS boilerplate with authentication, payments, and admin dashboard. Saved months of work.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    name: "Vikram Singh",
    role: "Tech Entrepreneur",
  },
  {
    text: "The referral program is amazing! I've earned ₹8,000 just by sharing my link with classmates. Passive income while studying!",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    name: "Ananya Joshi",
    role: "Engineering Student",
  },
  {
    text: "Purchased a data science project for my internship presentation. The documentation was excellent and the seller even helped me understand the code.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    name: "Karan Agarwal",
    role: "Data Analyst Intern",
  },
  {
    text: "Finally a marketplace that understands students! Low fees, instant payouts, and a huge community of developers. Highly recommended!",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    name: "Meera Nair",
    role: "UI/UX Designer",
  },
  {
    text: "The support team helped me set up my seller profile and optimize my listings. My sales increased by 3x in just one month!",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face",
    name: "Amit Kumar",
    role: "Mobile App Developer",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Testimonials: React.FC = () => {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-[#1a1025] via-[#0f0a15] to-[#1a1025]">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/4 top-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute right-1/4 bottom-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container z-10 mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[600px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-orange-500/30 bg-orange-500/10 text-orange-400 py-1.5 px-5 rounded-full text-sm font-medium">
              ✨ Testimonials
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-6 text-center">
            <span className="text-white">Loved by </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              10,000+ Users
            </span>
          </h2>
          <p className="text-center mt-5 text-white/60 text-lg max-w-md">
            Join thousands of students and developers who are already earning and learning on ProjectBazaar.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-12 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-[700px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

