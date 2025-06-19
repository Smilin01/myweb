"use client";
import React from "react";
import { motion } from "framer-motion";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={i}>
                  <div>{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5">{name}</div>
                      <div className="leading-5 opacity-60 tracking-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

const testimonials = [
  {
    text: "Working with John was an absolute game-changer for our business. His technical expertise and creative vision transformed our outdated website into a modern, high-converting platform.",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Sarah Johnson",
    role: "CEO, TechStart Inc",
  },
  {
    text: "The SaaS platform John built for us exceeded all expectations. The user interface is intuitive, and the backend is incredibly robust. Our productivity increased by 40%.",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Michael Chen",
    role: "CTO, InnovateLab",
  },
  {
    text: "John's attention to detail and commitment to quality is unmatched. He delivered our project on time and within budget, with features we didn't even know we needed.",
    image: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Emily Rodriguez",
    role: "Product Manager, GrowthCo",
  },
  {
    text: "The custom software solution John developed streamlined our entire workflow. What used to take hours now takes minutes. Absolutely phenomenal work!",
    image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "David Thompson",
    role: "Operations Director, FlowTech",
  },
  {
    text: "John's expertise in full-stack development is evident in every aspect of our application. The performance, security, and scalability are all top-notch.",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Lisa Park",
    role: "Founder, DataDrive Solutions",
  },
  {
    text: "From concept to deployment, John guided us through every step. His communication is excellent, and he truly understands business needs beyond just technical requirements.",
    image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Robert Kim",
    role: "Marketing Director, BrandBoost",
  },
  {
    text: "The landing page John created for our campaign generated a 300% increase in conversions. His understanding of user psychology and design is remarkable.",
    image: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Amanda Foster",
    role: "Digital Marketing Lead, ConvertPro",
  },
  {
    text: "John doesn't just build software; he builds solutions. Our custom CRM has transformed how we manage client relationships and increased our sales by 50%.",
    image: "https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "James Wilson",
    role: "Sales Manager, ClientFirst",
  },
  {
    text: "The AI-powered features John integrated into our platform have given us a significant competitive advantage. His knowledge of modern technologies is impressive.",
    image: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150",
    name: "Rachel Green",
    role: "Innovation Lead, FutureTech",
  },
];