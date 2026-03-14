import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Truck, Recycle, ShieldCheck, ArrowRight } from 'lucide-react';

const AdminSelectionPage = () => {
    const navigate = useNavigate();
    const [selectedModule, setSelectedModule] = useState(null);

    const handleModuleClick = (module, path) => {
        setSelectedModule(module);
        // 🔥 Save choice for Sidebar customization
        sessionStorage.setItem('adminModule', module);
        
        // Small delay to show the "clicked" effect before navigating
        setTimeout(() => {
            navigate(path);
        }, 250);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f9ff] dark:bg-[#020617] py-12 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-500 font-sans">
            {/* Background Decorations - Sync with Auth.jsx */}
            <div className="absolute w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] -top-20 -left-20 animate-pulse pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[100px] -bottom-20 -right-20 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

            <div className="max-w-4xl w-full animate-fade-in sm:px-0 relative z-10 transition-all duration-500">
                {/* Main Card - Top Bar Removed */}
                <div className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white dark:border-white/5 transition-all duration-500">

                    {/* Header Section */}
                    <div className="mb-8 sm:mb-12 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                            <Recycle size={24} className="sm:w-8 sm:h-8" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">EcoPulse Admin</h2>
                        <p className="mt-2 sm:mt-3 text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm px-2">Select a module to begin managing EcoPulse operations.</p>
                    </div>

                    {/* Module Selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">

                        {/* 1. Citizen Module */}
                        <div
                            onClick={() => handleModuleClick('citizen', '/admin/dashboard')}
                            className={`group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer transition-all duration-300 border-2 
                                ${selectedModule === 'citizen'
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10'
                                    : 'border-transparent bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-xl'
                                }`}
                        >
                            <div className="flex flex-col h-full">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 mb-4 sm:mb-6 
                                    ${selectedModule === 'citizen' ? 'bg-emerald-600 text-white' : 'bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                                    <UsersIcon size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 text-center sm:text-left transition-colors">Citizen</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 sm:mb-6 text-center sm:text-left transition-colors font-medium">
                                    Oversee citizen engagement, verify waste reports with GPS proof, and audit impact scores across all zones.
                                </p>
                                <div className={`mt-auto flex items-center justify-center sm:justify-start gap-2 text-sm font-bold transition-all ${selectedModule === 'citizen' ? 'text-emerald-700 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-500 group-hover:gap-4'}`}>
                                    <span>Enter Module</span>
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Swachhta Mitra Module */}
                        <div
                            onClick={() => handleModuleClick('mitra', '/admin/dashboard')}
                            className={`group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] cursor-pointer transition-all duration-300 border-2 
                                ${selectedModule === 'mitra'
                                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 shadow-lg shadow-teal-500/10'
                                    : 'border-transparent bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-900/50 hover:shadow-xl'
                                }`}
                        >
                            <div className="flex flex-col h-full">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 mb-4 sm:mb-6 
                                    ${selectedModule === 'mitra' ? 'bg-teal-600 text-white' : 'bg-teal-100/50 dark:bg-teal-900/20 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'}`}>
                                    <Truck size={20} className="sm:w-6 sm:h-6" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-1 sm:mb-2 text-center sm:text-left transition-colors">Swachhta Mitra</h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 sm:mb-6 text-center sm:text-left transition-colors font-medium">
                                    Monitor collection performance, manage pickup fulfillment, and track regional cleanliness rankings.
                                </p>
                                <div className={`mt-auto flex items-center justify-center sm:justify-start gap-2 text-sm font-bold transition-all ${selectedModule === 'mitra' ? 'text-teal-700 dark:text-teal-400' : 'text-teal-600 dark:text-teal-500 group-hover:gap-4'}`}>
                                    <span>Enter Module</span>
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminSelectionPage;