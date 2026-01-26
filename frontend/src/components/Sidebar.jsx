import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
    ChevronRight,
    ChevronLeft,
    LogOut,
    User,
    Settings,
    HelpCircle,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/create', icon: Plus, label: 'Create Ticket' },
    { to: '/tickets', icon: List, label: 'Ticket Queue' },
    { to: '/emails', icon: Mail, label: 'Email (SQLite)' },
    { to: '/emails-mongo', icon: Mail, label: 'Emails (Mongo)' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/organizations', icon: Building2, label: 'Organizations' },
    { to: '/sales', icon: TrendingUp, label: 'Sales & Outreach' },
    { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar({ isOpen, onClose, isCollapsed, toggleCollapse }) {
    const { darkMode, toggleDarkMode } = useTheme();
    const { logout, user, isAdmin } = useAuth();
    const navigate = useNavigate();

    // Popup State
    const [showPopup, setShowPopup] = useState(false);
    const popupRef = useRef(null);

    // Filtered Nav Items
    const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowPopup(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-screen bg-[var(--bg-secondary)] 
                border-r border-[var(--border-color)] flex flex-col transition-all duration-300
                shadow-xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto
                ${isCollapsed ? 'w-[80px]' : 'w-[240px]'}
            `}
        >
            {/* Logo and Toggle */}
            <div className={`p-6 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-3">
                    {/* Brand Logo */}
                    {!isCollapsed && (
                        <div className="flex items-center gap-3">
                            <div>
                                <h1 className="font-bold text-xl font-['Orbitron'] text-[var(--text-primary)] tracking-wide">IntelliDesk</h1>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold pl-0.5">AI Helpdesk</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Collapse Toggle */}
                <button
                    onClick={toggleCollapse}
                    className={`hidden lg:flex p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-color)] ${isCollapsed ? '' : 'ml-2'}`}
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto scrollbar-thin">
                {filteredNavItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        title={isCollapsed ? label : ''}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative
                            ${isActive
                                ? 'bg-[var(--bg-tertiary)] text-[var(--neon-purple)] font-semibold shadow-sm'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                            }
                            ${isCollapsed ? 'justify-center px-2' : ''}
                            `
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    className={`w-5 h-5 transition-colors shrink-0 ${isActive ? 'text-[var(--neon-purple)]' : 'text-[var(--text-muted)] group-hover:text-[var(--neon-purple)]'}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {!isCollapsed && (
                                    <span className="tracking-wide text-sm whitespace-nowrap overflow-hidden transition-opacity duration-300 opacity-100">{label}</span>
                                )}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--neon-purple)] rounded-r-full"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Section */}
            <div className="p-4 border-t border-[var(--border-color)] relative" ref={popupRef}>
                {user && (
                    <>
                        {/* Profile Popup Menu */}
                        {showPopup && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden animate-fade-up z-[70] min-w-[240px]">
                                {/* Popup Actions */}
                                <div className="p-2 space-y-1">
                                    {isAdmin && (
                                        <button
                                            onClick={() => { setShowPopup(false); navigate('/profile'); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--neon-purple)] transition-all group"
                                        >
                                            <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold">Admin</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setShowPopup(false); navigate('/profile?edit=true'); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span className="text-xs font-medium">Settings</span>
                                    </button>
                                </div>

                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-all font-bold"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-xs">Log out</span>
                                </button>
                            </div>
                        )}

                        {/* Profile Button */}
                        <div
                            onClick={() => setShowPopup(!showPopup)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] hover:border-[var(--neon-cyan)]/30 transition-all cursor-pointer select-none
                                ${showPopup ? 'border-[var(--neon-cyan)] shadow-[0_0_20px_rgba(124,58,237,0.1)] bg-[var(--bg-tertiary)]' : ''}
                                ${isCollapsed ? 'justify-center px-2' : ''}
                            `}
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-purple)] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-[var(--neon-cyan)]/10">
                                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name || 'Member'}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] truncate opacity-70">{user.email}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

        </aside >
    );
}
