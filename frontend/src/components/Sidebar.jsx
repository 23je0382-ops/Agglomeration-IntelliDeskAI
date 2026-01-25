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
    Users,
    TrendingUp,
    Building2,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/create', icon: Plus, label: 'Create Ticket' },
    { to: '/tickets', icon: List, label: 'Ticket Queue' },
    { to: '/emails', icon: Mail, label: 'Email (SQLite)' },
    { to: '/emails-mongo', icon: Database, label: 'Emails (Mongo)' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/organizations', icon: Building2, label: 'Organizations' },
    { to: '/sales', icon: TrendingUp, label: 'Sales & Outreach' },
    { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-screen w-[280px] bg-[var(--bg-secondary)] 
                border-r border-[var(--border-color)] flex flex-col transition-all duration-300
                shadow-xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:z-auto
            `}
        >
            {/* Logo */}
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">

                    <div>
                        <h1 className="font-bold text-xl font-['Orbitron'] text-[var(--text-primary)] tracking-wide">IntelliDesk</h1>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold pl-0.5">AI Helpdesk</p>
                    </div>
                </div>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                            ${isActive
                                ? 'bg-[var(--bg-tertiary)] text-[var(--neon-purple)] font-semibold shadow-sm'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    className={`w-5 h-5 transition-colors ${isActive ? 'text-[var(--neon-purple)]' : 'text-[var(--text-muted)] group-hover:text-[var(--neon-purple)]'}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className="tracking-wide text-sm">{label}</span>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--neon-purple)] rounded-r-full"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Section */}

        </aside>
    );
}
