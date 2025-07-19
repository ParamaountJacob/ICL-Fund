import React, { useState } from 'react';

const FILES = {
    deal: [
        { icon: '📝', name: 'ICL_One_Pager.pdf', path: '/files/ICL_One_Pager.pdf' },
        { icon: '📊', name: 'Investor Deck Q3 2025.pdf', path: '/files/Investor_Deck_Q3_2025.pdf' },
        { icon: '🧠', name: 'Capital Structure & Returns.pdf', path: '/files/Capital_Structure_Returns.pdf' },
        { icon: '📈', name: 'Capital Flow Explainer.pdf', path: '/files/Capital_Flow_Explainer.pdf' },
    ],
    legal: [
        { icon: '🧾', name: 'Subscription_Agreement_ICL.pdf', path: '/files/Subscription_Agreement_ICL.pdf' },
        { icon: '🧾', name: 'Promissory_Note_24_Month_Sample.pdf', path: '/files/Promissory_Note_24_Month_Sample.pdf' },
        { icon: '📄', name: 'Investor Accreditation Guide.pdf', path: '/files/Investor_Accreditation_Guide.pdf' },
        { icon: '🔒', name: 'Privacy & Disclosures Summary.pdf', path: '/files/Privacy_Disclosures_Summary.pdf' },
    ],
    sales: [
        { icon: '🗣️', name: 'Tim_Script_Outline.pdf', path: '/files/Tim_Script_Outline.pdf' },
        { icon: '🧰', name: 'Objection Handling Cheatsheet.pdf', path: '/files/Objection_Handling_Cheatsheet.pdf' },
        { icon: '📤', name: 'Capital Raise Funnel Flowchart.png', path: '/files/Capital_Raise_Funnel_Flowchart.png' },
        { icon: '🗓️', name: 'Sample Discovery Call Agenda.pdf', path: '/files/Sample_Discovery_Call_Agenda.pdf' },
    ],
    faq: [
        { icon: '❓', name: 'Fund FAQ Sheet.pdf', path: '/files/Fund_FAQ_Sheet.pdf' },
        { icon: '💬', name: 'Talking Points: Institutional vs. Retail.pdf', path: '/files/Talking_Points_Institutional_vs_Retail.pdf' },
        { icon: '🧩', name: 'Gris Fund Payout Example.pdf', path: '/files/Gris_Fund_Payout_Example.pdf' },
        { icon: '🧭', name: 'Licensing & Compliance Notes.pdf', path: '/files/Licensing_Compliance_Notes.pdf' },
    ],
};

const PASSWORD = 'timaccess2025'; // Change this to your real password

export default function TimsRoom() {
    const [authed, setAuthed] = useState(false);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');

    if (!authed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
                <div className="bg-black/70 p-8 rounded-xl shadow-lg max-w-sm w-full">
                    <h2 className="text-2xl font-bold text-gold mb-4 text-center">Tim’s Capital Access Room</h2>
                    <p className="mb-6 text-white/80 text-center">Enter password to access this private data room.</p>
                    <input
                        type="password"
                        className="w-full p-3 rounded bg-gray-800 text-white border border-gold/30 focus:outline-none focus:border-gold mb-3"
                        placeholder="Password"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { if (input === PASSWORD) { setAuthed(true); setError(''); } else { setError('Incorrect password'); } } }}
                    />
                    <button
                        className="w-full py-2 rounded bg-gold text-black font-semibold hover:bg-yellow-500 transition"
                        onClick={() => { if (input === PASSWORD) { setAuthed(true); setError(''); } else { setError('Incorrect password'); } }}
                    >
                        Access Room
                    </button>
                    {error && <div className="text-red-400 text-center mt-2 text-sm">{error}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
            <div className="max-w-2xl mx-auto bg-black/70 rounded-xl shadow-xl p-8 mt-8">
                <h1 className="text-3xl font-bold text-gold mb-2">Tim’s Capital Access Room</h1>
                <div className="mb-6 text-white/80">
                    <strong>Welcome, Tim.</strong> This room contains all core documents, pitch assets, and reference materials for capital partner outreach, webinars, and investor calls. Documents are updated manually — please confirm before forwarding anything externally.
                </div>
                {/* Section 1 */}
                <Section title="Deal Materials & Overview">
                    {FILES.deal.map(f => <FileLink key={f.name} {...f} />)}
                </Section>
                {/* Section 2 */}
                <Section title="Legal + Fund Docs">
                    {FILES.legal.map(f => <FileLink key={f.name} {...f} />)}
                </Section>
                {/* Section 3 */}
                <Section title="Sales & Pitch Resources">
                    {FILES.sales.map(f => <FileLink key={f.name} {...f} />)}
                </Section>
                {/* Section 4 */}
                <Section title="FAQ & Strategy Notes">
                    {FILES.faq.map(f => <FileLink key={f.name} {...f} />)}
                </Section>
                {/* Optional Section */}
                <div className="mt-8 mb-4">
                    <div className="font-semibold text-gold mb-2">Optional: Request or Upload</div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a href="mailto:wayne@icl.com" className="px-4 py-2 rounded bg-gold/90 text-black font-semibold hover:bg-yellow-500 transition">📤 Request a Doc</a>
                        <a href="mailto:wayne@icl.com" className="px-4 py-2 rounded border border-gold/40 text-gold font-semibold hover:bg-gold/10 transition">📬 Contact Wayne</a>
                    </div>
                </div>
                <div className="text-xs text-white/50 mt-8 border-t border-gold/10 pt-4">
                    🛡️ This page is private and for strategic partner use only. Please do not forward or publicly post links without approval.
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <div className="text-lg font-semibold text-gold mb-2 mt-6">{title}</div>
            <div className="flex flex-col gap-2">{children}</div>
        </div>
    );
}

function FileLink({ icon, name, path }: { icon: string, name: string, path: string }) {
    return (
        <a href={path} download className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gold/10 text-white/90 border border-gold/10 hover:border-gold/40 transition">
            <span className="text-xl">{icon}</span>
            <span>{name}</span>
        </a>
    );
}
