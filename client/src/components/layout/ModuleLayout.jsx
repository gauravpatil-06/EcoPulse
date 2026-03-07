import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import ModuleSidebar from './ModuleSidebar';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ModuleLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#060B18] transition-colors duration-300">
            {/* Desktop & Mobile Sidebar */}
            <ModuleSidebar 
                role={user?.role} 
                isMobileOpen={sidebarOpen} 
                closeMobile={() => setSidebarOpen(false)} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-40 flex items-center px-4 py-3 bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 transition-all">
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="ml-3 font-black text-slate-800 dark:text-white capitalize">{user?.role} Portal</span>
                </header>

                {/* Page View with Smooth Scroll */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar page-layout-spacing relative transition-all duration-300">
                    <div className="max-w-[1550px] mx-auto min-h-full">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ModuleLayout;
