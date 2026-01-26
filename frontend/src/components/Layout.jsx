import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] lg:flex">
            {/* Mobile Header */}
            <div className="lg:hidden p-4 border-b border-[rgba(0,255,255,0.1)] bg-[var(--bg-secondary)] flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="font-bold text-xl font-['Orbitron'] text-[var(--text-primary)] tracking-wide">IntelliDesk</h1>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold pl-0.5">AI Helpdesk</p>
                    </div>
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

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

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
