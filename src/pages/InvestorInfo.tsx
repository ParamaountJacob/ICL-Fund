import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  Award,
  DollarSign,
  Clock,
  Target,
  Calculator,
  Percent,
  Calendar
} from 'lucide-react';

const InvestorInfo: React.FC = () => {
  const navigate = useNavigate();
  const [calculatorAmount, setCalculatorAmount] = useState('1000000'); // Default to $1M as string
  const [selectedTier, setSelectedTier] = useState('1000000'); // Track selected tier
  const [termYears, setTermYears] = useState(2); // Default to 2 years
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleGetStarted = () => {
    // DEMO MODE - No navigation to onboarding
    alert('Demo Mode: Investment process would normally begin here. No backend integration.');
    console.log('Demo Mode: Get Started clicked', {
      calculatorAmount,
      selectedTier,
      termYears
    });
  };

  const getReturnRate = (amount: number, years: number) => {
    let baseRate;
    if (amount >= 1000000) baseRate = 14;      // $1M+ = 14%
    else if (amount >= 500000) baseRate = 13;  // $500K-$999K = 13%
    else if (amount >= 350000) baseRate = 12;  // $350K-$499K = 12%
    else baseRate = 11;                        // $200K-$349K = 11%

    // Add 1% bonus for 2-year terms
    if (years === 1) {
      return { min: baseRate, max: baseRate };
    } else {
      return { min: baseRate + 1, max: baseRate + 1 };
    }
  };

  const calculateReturns = (amount: number, years: number) => {
    const rate = getReturnRate(amount, years);
    const avgRate = rate.min; // Since min and max are the same now
    const monthlyReturn = (amount * avgRate / 100) / 12;
    const annualReturn = amount * avgRate / 100;
    const totalReturn = annualReturn * years;
    const totalValue = amount + totalReturn;
    return { monthlyReturn, annualReturn, totalReturn, totalValue, rate };
  };

  const returns = calculateReturns(Number(calculatorAmount), termYears);

  const handleTierSelect = (tierValue: string) => {
    setSelectedTier(tierValue);
    setShowCustomInput(true);
    setCalculatorAmount(tierValue);
  };

  const getTierLabel = (value: string) => {
    switch (value) {
      case '200000': return '$200K - $349K';
      case '350000': return '$350K - $499K';
      case '500000': return '$500K - $999K';
      case '1000000': return '$1M+';
      default: return value;
    }
  };

  const getTierRange = (value: string) => {
    switch (value) {
      case '200000': return { min: 200000, max: 349999 };
      case '350000': return { min: 350000, max: 499999 };
      case '500000': return { min: 500000, max: 999999 };
      case '1000000': return { min: 1000000, max: 10000000 };
      default: return { min: 200000, max: 10000000 };
    }
  };

  return (
    <div className="pt-0">
      <section className="py-32 md:py-40">
        <div className="max-w-7xl mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-32">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-gold mb-8">
              Investor Information
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
              Discover exclusive investment opportunities designed for qualified investors
              seeking consistent returns and portfolio diversification.
            </p>
          </div>

          {/* Investment Overview */}
          <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-8">
                Premium Investment Opportunities
              </h2>
              <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                Inner Circle Lending offers carefully curated investment opportunities
                that provide stable returns while supporting real estate development
                and business growth initiatives.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Consistent Returns</h3>
                    <p className="text-text-secondary">11-15% annual returns based on investment tier</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Secured Investments</h3>
                    <p className="text-text-secondary">Asset-backed lending with comprehensive due diligence</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">Exclusive Access</h3>
                    <p className="text-text-secondary">Limited to qualified investors only</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-10 rounded-lg border border-graphite">
              <h3 className="text-2xl font-semibold text-gold mb-8">Investment Tiers</h3>

              <div className="space-y-6 md:space-y-8">
                <div className="bg-accent p-4 md:p-6 rounded-lg border border-graphite">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 gap-1 sm:gap-0">
                    <h4 className="font-semibold text-lg md:text-xl">Tier 1</h4>
                    <span className="text-gold font-semibold text-base md:text-lg">11% (12% for 2-year)</span>
                  </div>
                  <p className="text-text-secondary text-sm md:text-base">$200,000 - $349,999</p>
                </div>

                <div className="bg-accent p-4 md:p-6 rounded-lg border border-graphite">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 gap-1 sm:gap-0">
                    <h4 className="font-semibold text-lg md:text-xl">Tier 2</h4>
                    <span className="text-gold font-semibold text-base md:text-lg">12% (13% for 2-year)</span>
                  </div>
                  <p className="text-text-secondary text-sm md:text-base">$350,000 - $499,999</p>
                </div>

                <div className="bg-accent p-4 md:p-6 rounded-lg border border-graphite">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 gap-1 sm:gap-0">
                    <h4 className="font-semibold text-lg md:text-xl">Tier 3</h4>
                    <span className="text-gold font-semibold text-base md:text-lg">13% (14% for 2-year)</span>
                  </div>
                  <p className="text-text-secondary text-sm md:text-base">$500,000 - $999,999</p>
                </div>

                <div className="bg-accent p-4 md:p-6 rounded-lg border border-graphite">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-3 gap-1 sm:gap-0">
                    <h4 className="font-semibold text-lg md:text-xl">Tier 4</h4>
                    <span className="text-gold font-semibold text-base md:text-lg">14% (15% for 2-year)</span>
                  </div>
                  <p className="text-text-secondary text-sm md:text-base">$1,000,000+</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Investment Calculator */}
          <div className="mb-32">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">
                Investment Calculator
              </h2>
              <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto px-4">
                See your potential returns with our investment calculator
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-surface via-surface to-accent p-6 md:p-12 rounded-2xl border border-graphite shadow-2xl">
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                  {/* Input Section */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gold/20 rounded-full flex items-center justify-center">
                        <Calculator className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold">Calculate Your Returns</h3>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                      <div>
                        <label className="block text-xs md:text-sm uppercase tracking-wide text-text-secondary mb-3 md:mb-4">
                          Investment Term
                        </label>
                        <div className="grid grid-cols-2 gap-3 md:gap-3">
                          {[1, 2].map((years) => (
                            <button
                              key={years}
                              onClick={() => setTermYears(years)}
                              className={`p-4 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-300 font-semibold text-base md:text-base ${termYears === years
                                ? 'border-gold bg-gold/10 text-gold shadow-lg'
                                : 'border-graphite bg-accent text-text-secondary hover:border-gold/50 hover:bg-gold/5'
                                }`}
                            >
                              {years} Year{years > 1 ? 's' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs md:text-sm uppercase tracking-wide text-text-secondary mb-3 md:mb-4">
                          Investment Amount
                        </label>
                        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
                          {['200000', '350000', '500000', '1000000'].map((amount) => {
                            const rate = getReturnRate(Number(amount), termYears);
                            return (
                              <button
                                key={amount}
                                onClick={() => handleTierSelect(amount)}
                                className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-300 text-center ${selectedTier === amount
                                  ? 'border-gold bg-gold/10 text-gold shadow-lg'
                                  : 'border-graphite bg-accent text-text-secondary hover:border-gold/50 hover:bg-gold/5'
                                  }`}
                              >
                                <div className="font-semibold text-sm md:text-base mb-1">
                                  {getTierLabel(amount)}
                                </div>
                                <div className="text-xs text-gold">
                                  {rate.min}%
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {showCustomInput && (
                          <div className="space-y-3">
                            <label className="block text-xs uppercase tracking-wide text-text-secondary">
                              Exact Amount
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gold text-lg md:text-xl font-semibold">$</span>
                              <input
                                type="number"
                                value={calculatorAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCalculatorAmount(value);
                                  const range = getTierRange(selectedTier);
                                  if (Number(value) < range.min) {
                                    setCalculatorAmount(range.min.toString());
                                  }
                                }}
                                min={getTierRange(selectedTier).min}
                                max={getTierRange(selectedTier).max}
                                step="1000"
                                className="w-full bg-background border-2 border-graphite rounded-xl pl-8 md:pl-10 pr-3 md:pr-4 py-3 md:py-4 text-lg md:text-xl font-semibold focus:ring-2 focus:ring-gold/20 focus:border-gold text-text-primary transition-all duration-300"
                                placeholder={`Min: $${getTierRange(selectedTier).min.toLocaleString()}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Results Section */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gold/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold">Your Projected Returns</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* Annual Returns Card */}
                      <div className="bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold/20 p-5 md:p-8 rounded-xl md:rounded-2xl">
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                          <Percent className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                          <h4 className="text-lg md:text-xl font-semibold text-gold">Annual Returns</h4>
                        </div>
                        <div className="space-y-4 md:space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-sm md:text-base">Return Rate</span>
                            <span className="text-gold font-bold text-lg md:text-2xl">
                              {returns.rate.min}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-text-secondary text-sm md:text-base">Annual Income</span>
                            <span className="text-text-primary font-bold text-lg md:text-2xl">
                              ${returns.annualReturn.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Returns Card */}
                      <div className="bg-gradient-to-br from-accent to-surface border-2 border-graphite p-5 md:p-8 rounded-xl md:rounded-2xl">
                        <div className="flex items-center gap-3 mb-4 md:mb-6">
                          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                          <h4 className="text-lg md:text-xl font-semibold text-gold">Monthly Income</h4>
                        </div>
                        <div className="space-y-4 md:space-y-4">
                          <div className="text-center">
                            <div className="text-2xl md:text-4xl font-bold text-text-primary mb-2">
                              ${Math.round(returns.monthlyReturn).toLocaleString()}
                            </div>
                            <div className="text-text-secondary text-sm md:text-base">Every Month</div>
                          </div>
                        </div>
                      </div>

                      {/* Total Returns Card */}
                      <div className="md:col-span-2 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/5 border-2 border-gold/30 p-5 md:p-8 rounded-xl md:rounded-2xl">
                        <div className="text-center">
                          <h4 className="text-lg md:text-xl font-semibold text-gold mb-4 md:mb-6">Total Investment Summary</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-6">
                            <div>
                              <div className="text-text-secondary text-xs md:text-sm mb-2">Initial Investment</div>
                              <div className="text-lg md:text-2xl font-bold text-text-primary">
                                ${Number(calculatorAmount).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary text-xs md:text-sm mb-2">Total Returns ({termYears} year{termYears > 1 ? 's' : ''})</div>
                              <div className="text-lg md:text-2xl font-bold text-gold">
                                ${Math.round(returns.totalReturn).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-text-secondary text-xs md:text-sm mb-2">Final Value</div>
                              <div className="text-xl md:text-3xl font-bold text-text-primary">
                                ${Math.round(returns.totalValue).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-8 bg-accent border border-graphite p-4 md:p-6 rounded-lg md:rounded-xl">
                      <p className="text-text-secondary text-xs md:text-sm leading-relaxed">
                        <strong className="text-gold">Disclaimer:</strong> Returns are calculated using the average rate for your investment tier and term length.
                        {termYears === 2 && <span className="text-gold"> 2-year terms receive +1% bonus rate.</span>}
                        Actual returns may vary within the specified range based on market conditions and investment performance.
                        Past performance does not guarantee future results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Features */}
          <div className="mb-32">
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-center mb-16">
              Why Choose Inner Circle Lending
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                </div>
                <h3 className="font-semibold text-xl mb-4">Flexible Terms</h3>
                <p className="text-text-secondary">
                  Choose from 12-24 month terms with monthly, quarterly, or annual payment options
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                </div>
                <h3 className="font-semibold text-xl mb-4">Quick Processing</h3>
                <p className="text-text-secondary">
                  Streamlined application and approval process for qualified investors
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                </div>
                <h3 className="font-semibold text-xl mb-4">Targeted Returns</h3>
                <p className="text-text-secondary">
                  Predictable returns based on your investment amount and chosen terms
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
                </div>
                <h3 className="font-semibold text-xl mb-4">Proven Track Record</h3>
                <p className="text-text-secondary">
                  Years of successful lending with consistent investor returns
                </p>
              </div>
            </div>
          </div>

          {/* Pitch Deck Section */}
          <div className="mb-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">
                Investment Presentation
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                View our comprehensive pitch deck to understand our investment strategy,
                market analysis, and detailed financial projections.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-surface via-surface to-accent p-8 md:p-12 rounded-2xl border border-graphite shadow-2xl text-center">
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <h3 className="text-2xl md:text-3xl font-semibold mb-4">
                  Complete Pitch Deck
                </h3>
                <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
                  Access our detailed presentation covering market opportunity, business model,
                  financial projections, and risk analysis.
                </p>

                <button
                  onClick={() => navigate('/pitch-deck')}
                  className="bg-gold text-background px-8 py-4 text-lg font-semibold rounded-xl hover:bg-gold/90 transition-all duration-300 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  View Pitch Deck
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Prominent Call to Action */}
          <div className="bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 rounded-2xl p-12 text-center mb-20 md:mb-0">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-gold mb-6">
                Ready to Start Earning?
              </h2>
              <p className="text-xl text-text-secondary mb-10 leading-relaxed">
                Join our exclusive group of investors and start earning consistent returns.
                Our streamlined onboarding process makes it easy to begin your investment journey today.
              </p>

              <div className="space-y-6">
                {/* Hidden Start Investing button - focusing on calls/contact only */}
                {/* <button
                  onClick={handleGetStarted}
                  className="fixed md:relative bottom-4 left-4 right-4 md:bottom-auto md:left-auto md:right-auto bg-gold text-background px-12 py-6 text-xl font-semibold rounded-xl hover:bg-gold/90 transition-all duration-300 flex md:inline-flex items-center justify-center gap-4 shadow-lg hover:shadow-xl transform hover:scale-105 z-10"
                >
                  Start Investing
                  <ArrowRight className="w-6 h-6" />
                </button> */}

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    <span>Secure & Confidential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span>2-3 Day Review Process</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gold" />
                    <span>No Hidden Fees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvestorInfo;