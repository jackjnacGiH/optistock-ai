import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, ScanLine, History, Menu, Package, Languages, Brain } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../i18n/LanguageContext';

const NavItem = ({ to, icon: Icon, label, active }) => (
    <Link
        to={to}
        className={clsx(
            "flex flex-col items-center justify-center w-full py-2 text-xs font-medium transition-colors duration-200 md:flex-row md:justify-start md:px-4 md:py-3 md:text-sm md:gap-3 md:rounded-lg no-select",
            active
                ? "text-primary bg-blue-50 md:bg-blue-50"
                : "text-slate-500 hover:text-primary hover:bg-slate-50"
        )}
    >
        <Icon className={clsx("w-6 h-6 md:w-5 md:h-5", active && "text-primary")} />
        <span>{label}</span>
    </Link>
);

const Layout = () => {
    const location = useLocation();
    const path = location.pathname;
    const { language, toggleLanguage, t } = useLanguage();

    return (
        <div className="flex flex-col h-screen-safe bg-slate-50 md:flex-row overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm h-full">
                <div className="p-6 flex items-center gap-3 flex-shrink-0">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">OptiStock <span className="text-primary">AI</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto scrollable">
                    <NavItem to="/" icon={LayoutDashboard} label={t('nav.dashboard')} active={path === "/"} />
                    <NavItem to="/scan" icon={ScanLine} label={t('nav.scan')} active={path === "/scan"} />
                    <NavItem to="/history" icon={History} label={t('nav.history')} active={path === "/history"} />
                    <NavItem to="/ai-analysis" icon={Brain} label="AI Insights" active={path === "/ai-analysis"} />
                </nav>

                {/* Language Toggle Button */}
                <div className="px-4 pb-4 flex-shrink-0">
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                        <Languages className="w-5 h-5" />
                        <span>{language === 'th' ? 'ไทย' : 'English'}</span>
                    </button>
                </div>

                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                            AD
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700">Admin User</p>
                            <p className="text-xs text-slate-400">admin@example.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollable pb-20 md:pb-0">
                    <div className="max-w-7xl mx-auto p-4 md:p-8">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-1 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex-shrink-0">
                <NavItem to="/" icon={LayoutDashboard} label={t('nav.dashboard')?.split(' ')[0]} active={path === "/"} />
                <NavItem to="/ai-analysis" icon={Brain} label="AI" active={path === "/ai-analysis"} />

                <div className="relative -top-5 mx-2">
                    <Link to="/scan" className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                        <ScanLine className="w-7 h-7" />
                    </Link>
                </div>

                <NavItem to="/history" icon={History} label={t('nav.history')} active={path === "/history"} />

                {/* Mobile Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="flex flex-col items-center justify-center w-full py-2 text-xs font-medium text-slate-500 hover:text-primary transition-colors no-select"
                >
                    <Languages className="w-6 h-6" />
                    <span>{language === 'th' ? 'TH' : 'EN'}</span>
                </button>
            </nav>
        </div>
    );
};

export default Layout;
