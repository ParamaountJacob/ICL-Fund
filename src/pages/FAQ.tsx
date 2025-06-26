import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqs = [
    {
      question: "What fees are associated with investing?",
      answer: "There are no fees charged to investors. We generate our returns through the spread between what borrowers pay and the 11-15% fixed return we provide to investors. We only profit after ensuring our investors receive their guaranteed returns."
    },
    {
      question: "What is the investment process?",
      answer: "The process is straightforward: 1) Request and sign the subscription agreement, 2) Sign the promissory note, 3) Transfer funds. Once completed, you'll receive your chosen payment schedule (monthly, quarterly, or annual) and have access to our investor portal."
    },
    {
      question: "What types of loans do you provide?",
      answer: "Inner Circle Lending provides loans to businesses that value privacy and discretion. While specific details are confidential, we focus on borrowers who prioritize confidentiality and are willing to pay a premium for discreet lending solutions."
    },
    {
      question: "What are the minimum investment requirements?",
      answer: "Our minimum investment starts at $200,000, with enhanced terms available for larger commitments. We work exclusively with accredited investors who value privacy and consistent returns."
    },
    {
      question: "How are my returns protected?",
      answer: "We employ multiple layers of protection including comprehensive due diligence, active portfolio management, and strategic diversification. Every loan is secured and undergoes rigorous vetting."
    },
    {
      question: "What payment schedules are available?",
      answer: "We offer flexible payment schedules including monthly, quarterly, and annual distributions. You can choose the frequency that best suits your financial planning needs."
    },
    {
      question: "How do you maintain borrower privacy while protecting investors?",
      answer: "While we maintain strict borrower confidentiality, we implement robust security measures, including comprehensive guarantees and surety bonding, to protect our investors' interests."
    },
    {
      question: "What is your due diligence process?",
      answer: "Our thorough due diligence includes business performance analysis, asset validation, risk assessment, and ongoing monitoring. We prioritize security while maintaining borrower privacy."
    }
  ];

  return (
    <div className="pt-28">
      <section className="py-24 md:py-32">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto mb-16 text-center"
          >
            <h1 className="heading-xl mb-8">Frequently Asked Questions</h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              Everything you need to know about investing with Inner Circle Lending.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="mb-6"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 bg-surface hover:bg-accent transition-colors duration-300 text-left"
                >
                  <span className="text-lg font-semibold pr-8">{faq.question}</span>
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-gold flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-gold flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="p-6 bg-accent text-text-secondary leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;