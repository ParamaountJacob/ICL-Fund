import React from 'react';
import Hero from '../components/Hero';
import HeroDetails from '../components/HeroDetails';
import MarketContext from '../components/MarketContext';
import About from '../components/About';
import Process from '../components/Process';
import Leadership from '../components/Leadership';
import Philosophy from '../components/Philosophy';
import Trust from '../components/Trust';
import NewsletterSignup from '../components/NewsletterSignup';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <div style={{ position: 'relative', zIndex: 20 }}>
        <HeroDetails />
        <Trust />
        <About />
        <Process />
        <Leadership />
        <Philosophy />
        <MarketContext />

        {/* Newsletter Section */}
        <section className="py-12 md:py-32 bg-premium-gradient from-surface to-background bg-premium-pattern">
          <div className="section">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="heading-lg mb-6">Stay Ahead of the Market</h2>
              <p className="text-lg sm:text-xl text-text-secondary leading-relaxed">
                Join our exclusive newsletter for insights on private lending opportunities,
                market trends, and investment strategies from our expert team.
              </p>
            </div>
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
              <NewsletterSignup />
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;