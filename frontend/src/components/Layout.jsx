import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] lg:flex">
            {/* Mobile Header */}
            <div className="lg:hidden p-4 border-b border-[rgba(0,255,255,0.1)] bg-[var(--bg-secondary)] flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-pink)] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                        <Zap className="w-5 h-5 text-black" />
                    </div>
                    <h1 className="font-bold text-lg gradient-text font-['Orbitron']">IntelliDesk</h1>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-lg hover:bg-[rgba(0,255,255,0.1)] transition-colors border border-[rgba(0,255,255,0.2)] hover:border-[var(--neon-cyan)]"
                >
                    {isSidebarOpen ? (
                        <X className="w-6 h-6 text-[var(--neon-cyan)]" />
                    ) : (
                        <Menu className="w-6 h-6 text-[var(--neon-cyan)]" />
                    )}
                </button>
            </div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-md"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="flex-1 min-w-0 min-h-screen transition-all duration-300">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
