import React from 'react';
import { motion } from 'framer-motion';
import { FileText, FileCheck, MessageSquare } from 'lucide-react';

const Terms: React.FC = () => {
    return (
        <div className="pt-28">
            <section className="py-24 md:py-32">
                <div className="section">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto mb-16"
                    >
                        <h1 className="heading-xl mb-8">Terms of Service</h1>
                        <p className="text-xl text-text-secondary leading-relaxed">
                            These Terms of Service (the “Terms”) govern your access to and use of Inner Circle Lending’s
                            website, applications, and services. By accessing or using our services, you agree to be bound by
                            these Terms.
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto space-y-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div className="flex items-center mb-6">
                                <FileText className="w-8 h-8 text-gold mr-4" />
                                <h2 className="heading">Key Terms</h2>
                            </div>
                            <div className="space-y-6 text-text-secondary">
                                <h3 className="text-xl font-semibold text-text-primary">Eligibility</h3>
                                <p>
                                    Access to certain offerings is limited to individuals and entities that qualify as accredited
                                    investors under applicable securities laws and regulations. By participating, you represent and
                                    warrant that you meet all eligibility requirements.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">No Investment Advice</h3>
                                <p>
                                    Information provided by Inner Circle Lending is for informational purposes only and does not
                                    constitute investment, legal, or tax advice. You are solely responsible for your investment
                                    decisions and should consult your own advisors.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Risks</h3>
                                <p>
                                    All investments involve risk, including the potential loss of principal. Past performance does not
                                    guarantee future results. You acknowledge and accept these risks before engaging in any offering.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Confidentiality</h3>
                                <p>
                                    You agree to maintain strict confidentiality regarding non-public information shared through the
                                    platform, including investment details, borrower information, business operations, and terms.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <div className="flex items-center mb-6">
                                <FileCheck className="w-8 h-8 text-gold mr-4" />
                                <h2 className="heading">User Responsibilities</h2>
                            </div>
                            <div className="space-y-6 text-text-secondary">
                                <h3 className="text-xl font-semibold text-text-primary">Accurate Information</h3>
                                <p>
                                    You agree to provide accurate, current, and complete information as requested and to promptly
                                    update such information when it changes.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Prohibited Activities</h3>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Attempting to gain unauthorized access to our systems or data</li>
                                    <li>Reverse engineering, scraping, or data mining without consent</li>
                                    <li>Using the services for unlawful, fraudulent, or infringing purposes</li>
                                    <li>Sharing confidential materials without written authorization</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-text-primary">Compliance</h3>
                                <p>
                                    You agree to comply with all applicable laws, regulations, and contractual obligations connected
                                    to your use of the services and any related transactions.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            <div className="space-y-6 text-text-secondary">
                                <h3 className="text-xl font-semibold text-text-primary">Intellectual Property</h3>
                                <p>
                                    All content, trademarks, logos, and materials on this site are the property of Inner Circle
                                    Lending or its licensors and are protected by applicable intellectual property laws. You may not
                                    copy, reproduce, distribute, or create derivative works without explicit permission.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Disclaimers</h3>
                                <p>
                                    The services are provided on an “as is” and “as available” basis without warranties of any kind,
                                    express or implied, including but not limited to warranties of merchantability, fitness for a
                                    particular purpose, or non-infringement.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Limitation of Liability</h3>
                                <p>
                                    To the fullest extent permitted by law, Inner Circle Lending and its affiliates shall not be liable
                                    for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits,
                                    revenue, data, or use arising out of or in connection with the services.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Indemnification</h3>
                                <p>
                                    You agree to indemnify and hold harmless Inner Circle Lending, its affiliates, officers, employees,
                                    and agents from any claims, liabilities, damages, losses, and expenses, including reasonable
                                    attorneys’ fees, arising out of or in any way connected with your use of the services or violation
                                    of these Terms.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Changes to These Terms</h3>
                                <p>
                                    We may update these Terms from time to time. Changes will be effective when posted. Your continued
                                    use of the services after changes are posted constitutes your acceptance of the revised Terms.
                                </p>

                                <h3 className="text-xl font-semibold text-text-primary">Governing Law</h3>
                                <p>
                                    These Terms are governed by the laws of the State of Texas, without regard to its conflict of laws
                                    principles, and applicable federal law.
                                </p>

                                {/* SMS/Text Messaging Terms (A2P Compliance) */}
                                <div className="flex items-center mt-10 mb-6">
                                    <MessageSquare className="w-8 h-8 text-gold mr-4" />
                                    <h2 className="heading">SMS/Text Messaging Terms</h2>
                                </div>
                                <div className="space-y-4 text-text-secondary">
                                    <p>
                                        By providing your mobile phone number and opting in, you agree to receive SMS/text messages related to your investments and account, including updates, alerts, and notifications from Inner Circle Lending. Message frequency may vary based on your activity and preferences.
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Message and data rates may apply.</li>
                                        <li>Reply <span className="font-semibold">STOP</span> to cancel SMS at any time. After you send STOP, you may receive one additional message confirming your opt-out.</li>
                                        <li>Reply <span className="font-semibold">HELP</span> for help or assistance.</li>
                                        <li>Consent to receive messages is not a condition of any investment or purchase.</li>
                                        <li>Carriers are not liable for delayed or undelivered messages. Supported carriers may vary and are subject to change.</li>
                                        <li>You agree that you are the subscriber or customary user of the phone number provided, and you will notify us if you change or deactivate your number.</li>
                                        <li>You can also manage your communication preferences by contacting us or via your account settings (where available).</li>
                                    </ul>
                                    <p>
                                        For more information about how we handle your data, please review our <a href="/privacy" className="text-gold hover:underline">Privacy Policy</a>.
                                    </p>
                                </div>

                                <h3 className="text-xl font-semibold text-text-primary">Contact</h3>
                                <p>
                                    Questions about these Terms? Contact us at <a className="text-gold hover:underline" href="mailto:support@innercirclelending.com">support@innercirclelending.com</a> or call <a className="text-gold hover:underline" href="tel:+17753494682">+1 (775) 349-4682</a>.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Terms;
