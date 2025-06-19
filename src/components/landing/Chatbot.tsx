import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm John's assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');

  const botResponses: { [key: string]: string } = {
    services: "I specialize in business websites, landing pages, SaaS products, and custom software solutions. Each project is tailored to meet your specific business needs.",
    experience: "I've created multiple SaaS products including an All-in-One Productive Pro app and Pulsly AI feedback analyzer, along with numerous custom websites and landing pages.",
    portfolio: "You can see examples of my work including productivity tools, AI-powered applications, and landing pages in the portfolio section above. Each project showcases different aspects of modern web development.",
    contact: "You can reach me through the contact form above or email me directly at Johnsmilin6@gmail.com. I respond to all inquiries within 24 hours.",
    pricing: "Project costs vary based on complexity and requirements. Landing pages start at ₹4,000, business websites at ₹6,000, SaaS products at ₹15,000, and custom software at ₹20,000. Please fill out the contact form for a detailed quote.",
    timeline: "Most projects are completed within 2-6 weeks depending on scope and requirements. Landing pages typically take 1-2 weeks, while full SaaS applications may take 4-8 weeks."
  };

  const getResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('service') || lowerInput.includes('what do you do')) {
      return botResponses.services;
    } else if (lowerInput.includes('experience') || lowerInput.includes('portfolio') || lowerInput.includes('work')) {
      return botResponses.experience;
    } else if (lowerInput.includes('example') || lowerInput.includes('show me')) {
      return botResponses.portfolio;
    } else if (lowerInput.includes('contact') || lowerInput.includes('reach') || lowerInput.includes('email')) {
      return botResponses.contact;
    } else if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('budget')) {
      return botResponses.pricing;
    } else if (lowerInput.includes('time') || lowerInput.includes('deadline') || lowerInput.includes('long')) {
      return botResponses.timeline;
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm here to help you learn more about John's services. You can ask me about services, pricing, timeline, or portfolio.";
    } else {
      return "I can help you with information about John's services, experience, portfolio, contact details, pricing, and project timelines. What would you like to know?";
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    const botMessage: Message = {
      id: messages.length + 2,
      text: getResponse(inputText),
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <h3 className="font-semibold">Chat with John's Assistant</h3>
              <p className="text-sm opacity-90">Ask me anything about services</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;