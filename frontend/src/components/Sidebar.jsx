import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
    LayoutDashboard,
    Plus,
    List,
    BookOpen,
    BarChart3,
    Sun,
    Moon,
    Zap,
    X,
    Mail,
    Database,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/create', icon: Plus, label: 'Create Ticket' },
    { to: '/tickets', icon: List, label: 'Ticket Queue' },
    { to: '/emails', icon: Mail, label: 'Emails (JSON)' },
    { to: '/emails-mongo', icon: Database, label: 'Emails (Mongo)' },
    { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-screen w-[280px] bg-[var(--bg-secondary)] 
                border-r border-[rgba(139,92,246,0.1)] flex flex-col transition-transform duration-300
                backdrop-blur-xl
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:z-auto
            `}
        >
            {/* Glowing top border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent"></div>

            {/* Logo */}
            <div className="p-6 border-b border-[rgba(139,92,246,0.1)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-purple)] flex items-center justify-center
                        shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl gradient-text font-['Orbitron']">IntelliDesk</h1>
                        <p className="text-xs text-[var(--neon-cyan)] uppercase tracking-widest">AI Helpdesk</p>
                    </div>
                </div>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-[rgba(139,92,246,0.1)] transition-colors border border-transparent hover:border-[var(--neon-cyan)]"
                >
                    <X className="w-5 h-5 text-[var(--neon-cyan)]" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-8">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 relative overflow-hidden group
                            ${isActive
                                ? 'bg-[rgba(0,255,255,0.1)] text-[var(--neon-cyan)] border border-[var(--neon-cyan)] shadow-[0_0_20px_rgba(0,255,255,0.2)]'
                                : 'text-[var(--text-secondary)] hover:bg-[rgba(0,255,255,0.05)] hover:text-[var(--neon-cyan)] border border-transparent hover:border-[rgba(0,255,255,0.3)]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_var(--neon-cyan)]' : 'group-hover:drop-shadow-[0_0_8px_var(--neon-cyan)]'}`} />
                                <span className="font-semibold tracking-wide">{label}</span>
                                {isActive && (
                                    <div className="absolute right-4 w-2 h-2 rounded-full bg-[var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Cyber line */}
            <div className="mx-4 h-[1px] bg-gradient-to-r from-transparent via-[var(--neon-pink)] to-transparent"></div>

            {/* Dark mode toggle */}
            <div className="p-4">
                <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] 
                        hover:bg-[rgba(255,0,255,0.1)] hover:text-[var(--neon-pink)] 
                        border border-transparent hover:border-[rgba(255,0,255,0.3)]
                        transition-all duration-300 group"
                >
                    {darkMode ? (
                        <Sun className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_var(--neon-pink)]" />
                    ) : (
                        <Moon className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_var(--neon-pink)]" />
                    )}
                    <span className="font-semibold tracking-wide">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            </div>

            {/* Version badge */}
            <div className="p-4 pt-0">
                <div className="text-center text-xs text-[var(--text-muted)] py-2 border-t border-[rgba(255,255,255,0.05)]">
                    <span className="text-[var(--neon-cyan)]">v1.0.0</span> • Powered by <span className="text-[var(--neon-pink)]">AI</span>
                </div>
            </div>
        </aside>
    );
}
