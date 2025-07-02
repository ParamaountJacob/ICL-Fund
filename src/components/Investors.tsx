import React from 'react';

const Investors: React.FC = () => {
  return (
    <section id="investor" className="py-12 md:py-32 bg-premium-gradient from-surface to-background bg-premium-pattern">
      <div className="section">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="heading mb-6">Why Investors Stay:</h2>
            <ul className="space-y-6 text-text-secondary">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mt-3 mr-4"></span>
                <p>They realize privacy protects performance.</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mt-3 mr-4"></span>
                <p>They don't need every detail—they need consistency.</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mt-3 mr-4"></span>
                <p>And they know we deliver.</p>
              </li>
            </ul>
          </div>

          <div className="bg-accent p-8 md:p-10">
            <h3 className="text-2xl font-display font-semibold mb-6">Predictable Returns</h3>
            <div className="mb-8">
              <div className="flex items-baseline space-x-2 mb-3">
                <span className="text-gold text-4xl md:text-5xl font-display font-semibold">11-15%</span>
                <span className="text-text-secondary">Annual Returns</span>
              </div>
              <p className="text-text-secondary text-sm">
                Fixed returns regardless of market conditions
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Monthly Payouts</span>
                <span className="text-gold">Available</span>
              </div>
              <div className="h-px bg-graphite"></div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Quarterly Payouts</span>
                <span className="text-gold">Available</span>
              </div>
              <div className="h-px bg-graphite"></div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Annual Payouts</span>
                <span className="text-gold">Available</span>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <button
                onClick={() => {
                  console.log('Start Investing clicked - navigating to /start-investing');
                  window.location.href = '/start-investing';
                }}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#D4AF37',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                  display: 'block'
                }}
              >
                START INVESTING
              </button>
              <button
                onClick={() => {
                  console.log('Request Investment Details clicked');
                  window.location.href = '/contact';
                }}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#D4AF37',
                  border: '2px solid #D4AF37',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '16px',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                  display: 'block'
                }}
              >
                Request Investment Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Investors;