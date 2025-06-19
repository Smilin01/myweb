import React from 'react';
import { motion } from 'framer-motion';
import { TestimonialsColumn } from '../ui/testimonials-columns-1';

const testimonials = [
  {
    text: "Working with John felt like working with a co-founder. He understood our startup's vision and turned it into a sleek, functional web app that our users love.",
    image: "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Aarav Mehta",
    role: "Co-founder, LaunchVerse"
  },
  {
    text: "I had a rough idea for my business website, but John brought it to life with smooth UI, fast performance, and a clean design. He also helped me understand the tech side patiently.",
    image: "https://images.pexels.com/photos/937481/pexels-photo-937481.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Pooja Sharma",
    role: "Founder, EarthSoul Organics"
  },
  {
    text: "John redesigned our internal dashboard, and our team productivity shot up. He listens, suggests better options, and delivers faster than expected. Solid guy.",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Rohit Iyer",
    role: "Tech Head, NovaLogiX"
  },
  {
    text: "We needed a modern portfolio site for our creative agency and John absolutely nailed it. He mixed animations, speed, and SEO in a perfect blend. Clients often compliment our site!",
    image: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Kritika Jain",
    role: "Creative Director, Studio Arka"
  },
  {
    text: "John is more than just a developer. He's a problem-solver. Our custom inventory solution works like a charm now. Plus, his post-delivery support is top notch.",
    image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Siddharth Reddy",
    role: "COO, Bharat Distributors"
  },
  {
    text: "The app John built for our NGO is helping us reach more people every day. His passion shows in the quality of work he delivers. Forever grateful!",
    image: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Anjali Menon",
    role: "Project Lead, Aasha Foundation"
  },
  {
    text: "John created our product landing page within days and it's converting like magic! His ideas on layout and content flow made a real difference.",
    image: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Yash Gupta",
    role: "Marketing Manager, ZentoKart"
  },
  {
    text: "We approached John for a quick MVP, and he delivered something way more polished than we expected. Fast, reliable, and very easy to work with.",
    image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Nisha Pillai",
    role: "Founder, CareerBloom"
  },
  {
    text: "John transformed our clunky legacy website into a beautiful, fast, mobile-friendly platform. He's got a great eye for UX and really cares about the details.",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Manoj Chauhan",
    role: "IT Manager, VedaMart Retail"
  },
  {
    text: "We hired John for a short freelance gig. Ended up working with him for 3 months! He's proactive, creative, and genuinely passionate about what he builds.",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Meera Desai",
    role: "CEO, NurtureGen"
  },  
  
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Testimonials: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border border-gray-300 py-1 px-4 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Testimonials</span>
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mt-6 text-center">
            What My Clients Say
          </h2>
          <p className="text-center mt-5 text-gray-600 text-lg">
            See what our customers have to say about working with us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-16 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;