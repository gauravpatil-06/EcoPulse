import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
    PlusCircle, CheckCircle2, Clock, Loader2,
    Wallet, Trophy, Star, Zap, RefreshCcw,
    BarChart3, FileText, Megaphone, TrendingUp, LayoutGrid, Activity
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';

/* ─────────────────────────────────────────────────────────────────
   HoverCard & StatCard Components
───────────────────────────────────────────────────────────────── */
const cardBaseStyle = {
    transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.28s ease',
};
const cardHoverStyle = {
    transform: 'scale(1.04) translateY(-4px)',
    boxShadow: '0 20px 40px -8px rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
};

const HoverCard = ({ children, className, delay, rKey, extraHover = {} }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay || 0, ease: 'easeOut' }}
            className={className}
            style={{ ...cardBaseStyle, ...(hovered ? { ...cardHoverStyle, ...extraHover } : {}) }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </motion.div>
    );
};

const StatCard = ({ label, value, icon: Icon, colorClass, delay, rKey, subValue }) => {
    return (
        <HoverCard
            rKey={rKey}
            delay={delay}
            className="glass-card bg-white dark:bg-[#0B1121] border-2 border-slate-100 dark:border-white/5 rounded-[0.8rem] sm:p-4 p-3 flex flex-col justify-center shadow-lg h-full min-h-[70px] sm:min-h-[85px] transition-all duration-300"
        >
            <div className="flex items-center gap-2 sm:gap-3">
                <div className={`sm:w-10 sm:h-10 w-8 h-8 rounded-full ${colorClass.replace('text-', 'bg-')}/10 flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={`${colorClass} sm:w-5 sm:h-5 w-4 h-4`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="sm:text-[15px] text-[10px] font-black text-gray-500 dark:text-gray-400 leading-none mb-1 sm:mb-1.5 truncate">{label}</p>
                    <div className="flex items-baseline gap-1 sm:gap-1.5">
                        <h3 className="sm:text-xl text-[15px] font-black text-[#1a202c] dark:text-white leading-tight">
                            {value}
                        </h3>
                        {subValue && (
                            <span className="sm:text-[10px] text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                                {subValue}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </HoverCard>
    );
};

const CustomTooltip = ({ active, payload, label, overallStats }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;

    const Row = ({ label: rowLabel, value, color }) => (
        <div className="flex items-center justify-between gap-6">
            <span className="text-[13px] font-bold" style={{ color }}>{rowLabel}:</span>
            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">{value}</span>
        </div>
    );

    return (
        <div className="relative bg-white dark:bg-[#0d1a2e] border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl shadow-2xl min-w-[200px]">
            {/* Arrow */}
            <div className="absolute w-3 h-3 bg-white dark:bg-[#0d1a2e] border-b border-l border-gray-200 dark:border-gray-700 -bottom-[7px] left-3 rotate-[-45deg]" />

            {/* Period Header */}
            <p className="text-[11px] font-black text-emerald-500 tracking-wider mb-2 pb-1.5 border-b border-gray-100 dark:border-white/10">
                {label}
            </p>

            <div className="space-y-1.5">
                <Row rowLabel="Total Reports" label="Total Reports" value={d.total ?? 0} color="#6366f1" />
                <Row rowLabel="Total Badges" label="Total Badges" value={d.badges ?? 0} color="#f59e0b" />
                <div className="border-t border-gray-100 dark:border-white/10 my-1" />
                <Row rowLabel="Resolved" label="Resolved" value={d.resolved ?? 0} color="#10b981" />
                <Row rowLabel="In Progress" label="In Progress" value={d.inProgress ?? 0} color="#3b82f6" />
                <Row rowLabel="Pending" label="Pending" value={d.pending ?? 0} color="#f97316" />
            </div>
        </div>
    );
};

const EmptyChartState = ({ icon: Icon, title, message }) => (
    <div className="flex flex-col items-center justify-center h-[220px] text-center px-4">
        <div className="bg-gray-50 dark:bg-white/5 p-3.5 rounded-2xl mb-3.5 shadow-sm">
            <Icon size={24} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <p className="text-[13px] font-black text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-[11px] font-bold text-gray-400 max-w-[220px] leading-relaxed italic">{message}</p>
    </div>
);
    const CitizenDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const quotes = [
        "Small acts, when multiplied by millions of people, can transform the world.",
        "The greatest threat to our planet is the belief that someone else will save it.",
        "Your effort in reporting waste contributes to a cleaner neighborhood.",
        "Be the change you wish to see in your surroundings.",
        "Every report counts. Every cleanup matters."
    ];
    const todayQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

    const fetchDashboardData = async (isRefresh = false) => {
        // Only show refreshing indicator (if any) if it's a manual/auto background sync
        if (isRefresh) setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/dashboard/citizen', {
                headers: { 'x-auth-token': token }
            });
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            // Only show toast on manual refresh failure to avoid annoying users during background sync
            if (isRefresh) toast.error('Check your connection');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 60 seconds for real-time feel
        const interval = setInterval(() => fetchDashboardData(true), 60000);
        return () => clearInterval(interval);
    }, []);

    const [timeframe, setTimeframe] = useState('7D');

    // Derived stats from real-time API data
    const stats = data?.stats || { total: 0, resolved: 0, pending: 0, inProgress: 0 };
    const recentReports = data?.recentReports || [];

    // ── Impact Scoring Logic (Synced with Backend) ──
    const totalBadges = stats.totalBadges || 0;
    const totalCredits = stats.totalScore || 0;
    const dailyImpact = stats.dailyScore || 0;
    const completionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

    const growthChartData = useMemo(() => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();

        if (timeframe === '7D') {
            // Last 7 days (oldest → today) with Sun/Mon/… labels
            const raw = data?.dailyStats || [];
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));       // 6 days ago → today
                const key = d.toLocaleDateString('en-CA');  // YYYY-MM-DD local format
                const found = raw.find(r => r.name === key);
                return {
                    name: dayNames[d.getDay()],
                    score: found ? Math.round(found.score) : 0,
                    total: found ? found.total : 0,
                    resolved: found ? found.resolved : 0,
                    inProgress: found ? found.inProgress : 0,
                    pending: found ? found.pending : 0,
                    badges: found ? found.badges : 0,
                };
            });
        }

        if (timeframe === '1M') {
            // All 12 months of the current year — future months show 0
            const raw = data?.monthlyStats || [];
            const year = today.getFullYear();
            return monthNames.map((name, m) => {
                const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
                const found = raw.find(r => r.name === monthKey);
                return {
                    name,
                    score: found ? Math.round(found.score) : 0,
                    total: found ? found.total : 0,
                    resolved: found ? found.resolved : 0,
                    inProgress: found ? found.inProgress : 0,
                    pending: found ? found.pending : 0,
                    badges: found ? found.badges : 0,
                };
            });
        }

        if (timeframe === '1Y') {
            const raw = data?.yearlyStats || [];
            const currentYear = today.getFullYear();
            return [currentYear - 2, currentYear - 1, currentYear].map(yr => {
                const found = raw.find(r => r.name === String(yr));
                return {
                    name: String(yr),
                    score: found ? Math.round(found.score) : 0,
                    total: found ? found.total : 0,
                    resolved: found ? found.resolved : 0,
                    inProgress: found ? found.inProgress : 0,
                    pending: found ? found.pending : 0,
                    badges: found ? found.badges : 0,
                };
            });
        }

        return [];
    }, [data, timeframe]);

    const badgeNames = [
        "First Step", "Clean Starter", "Eco Warrior", "Waste Ninja", "City Helper",
        "Green Citizen", "Recycle Pro", "Sustainability Hero", "Earth Guard", "Nature Friend",
        "Community Star", "Clean Streets", "Green Impact", "Eco Legend", "Waste Buster"
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title={`Hello, ${user?.name || 'Citizen'}!`}
                subtitle={`"${todayQuote}"`}
                icon={LayoutGrid}
            />

            {/* ── Stats Grid: 2 columns on Mobile, 4 on Desktop ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <StatCard
                    label="Total Impact Score"
                    value={totalCredits}
                    icon={Wallet}
                    colorClass="text-emerald-500"
                    delay={0}
                    rKey="impact-score"
                />
                <StatCard
                    label="Daily Impact Score"
                    value={dailyImpact}
                    icon={Zap}
                    colorClass="text-amber-500"
                    delay={0.05}
                    rKey="daily-impact"
                />
                <StatCard
                    label="Total Reports"
                    value={stats.total}
                    icon={FileText}
                    colorClass="text-slate-600"
                    delay={0.1}
                    rKey="total-reports"
                />
                <StatCard
                    label="Total Badges"
                    value={totalBadges}
                    icon={Trophy}
                    colorClass="text-amber-500"
                    delay={0.15}
                    rKey="total-badges"
                />
                <StatCard
                    label="Resolved"
                    value={stats.resolved}
                    icon={CheckCircle2}
                    colorClass="text-emerald-500"
                    delay={0.2}
                    rKey="resolved"
                />
                <StatCard
                    label="In Progress"
                    value={stats.inProgress}
                    icon={RefreshCcw}
                    colorClass="text-blue-500"
                    delay={0.25}
                    rKey="in-progress"
                />
                <StatCard
                    label="Pending"
                    value={stats.pending}
                    icon={Clock}
                    colorClass="text-amber-500"
                    delay={0.3}
                    rKey="pending"
                />

                {/* Resolution Rate Box with ProgressBar */}
                <HoverCard
                    delay={0.35}
                    rKey="resolution-rate"
                    className="glass-card bg-white dark:bg-[#0B1121] border-2 border-slate-100 dark:border-white/5 rounded-[0.8rem] sm:p-4 p-3 flex flex-col justify-center shadow-lg h-full min-h-[70px] sm:min-h-[85px]"
                >
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                        <p className="sm:text-[15px] text-[10px] font-black text-gray-500 dark:text-gray-400 leading-none">Result</p>
                        <h3 className="sm:text-xl text-[15px] font-black text-emerald-600 leading-none">{completionRate}%</h3>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionRate}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            className="h-full bg-emerald-500 rounded-full"
                        />
                    </div>
                </HoverCard>
            </div>

            {/* ── Main Layout: 2/3 Left + 1/3 Right ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-stretch">

                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                        {/* Box 1: Take action */}
                        <HoverCard className="glass-card bg-white dark:bg-[#0B1121] border-2 border-slate-50 dark:border-white/5 rounded-[1.2rem] p-6 shadow-xl flex flex-col justify-between group overflow-hidden h-full">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 opacity-[0.03] rounded-full -mr-8 -mt-8" />
                            <div>
                                <h3 className="text-[17px] font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                                        <Megaphone size={16} className="text-emerald-600" />
                                    </div>
                                    Take action
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-2 border-emerald-500 pl-3">
                                        Contribute to a cleaner city by reporting waste in 3 simple steps. Your reports are linked directly to local Swachhta Mitras for immediate response.
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                                        Properly documenting waste helps our team build a cleaner ecosystem. By providing clear photos and locations, you give us actionable data that ensures your neighborhood stays healthy and sustainable for all citizens.
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { step: '1', title: 'Start Record', desc: 'Click button and enter location details.' },
                                            { step: '2', title: 'Add Evidence', desc: 'Upload clear photos of the waste spot.' },
                                            { step: '3', title: 'Submit', desc: 'Confirm your report to earn +10 points.' }
                                        ].map(s => (
                                            <div key={s.step} className="flex gap-3">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[11px] font-black text-emerald-600 shrink-0">{s.step}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 leading-none mb-1">{s.title}</span>
                                                    <span className="text-[11px] font-bold text-slate-400 leading-tight">{s.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/citizen/report')}
                                className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[13px] rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <PlusCircle size={15} />
                                Submit new report
                            </button>
                        </HoverCard>

                        {/* Box 2: Point Breakdown (Community Impact) */}
                        <HoverCard className="glass-card bg-white dark:bg-[#0B1121] border-2 border-slate-50 dark:border-white/5 rounded-[1.2rem] p-6 shadow-xl flex flex-col justify-between group h-full">
                            <div>
                                <h3 className="text-[17px] font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                        <Activity size={16} className="text-blue-600" />
                                    </div>
                                    Community impact
                                </h3>
                                <p className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Your effort is recorded and verified by our Swachhta Mitras. As you help, you earn points that boost your city-wide reputation rank and community status.
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-6">
                                    Your scores are used to help prioritize zones for faster cleanup. High rankers qualify for exclusive community rewards and environmental awards.
                                </p>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {[
                                        { label: 'New Report Submitted', pts: '+10', color: 'blue' },
                                        { label: 'Report Resolved', pts: '+50', color: 'emerald' },
                                        { label: 'Badge Earned', pts: '+100', color: 'amber' }
                                    ].map((reward) => (
                                        <div key={reward.label} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 transition-all hover:border-emerald-500/10">
                                            <span className="text-[11.5px] font-black text-slate-600 dark:text-slate-300 leading-none">{reward.label}</span>
                                            <span className={`text-[12px] font-black text-${reward.color}-600 leading-none shrink-0`}>{reward.pts} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[12px] font-bold text-slate-400 mt-6 pt-4 border-t border-slate-50 dark:border-white/5 italic">
                                Reach higher milestones and unlock rare badges for exclusive city-wide recognition.
                            </p>
                        </HoverCard>
                    </div>
                </div>

                {/* Right Column (1/3 width) - Next Achievement */}
                <div className="lg:col-span-1">
                    <HoverCard className="glass-card bg-white dark:bg-[#0B1121] border-2 border-gray-50 dark:border-white/5 rounded-[1.2rem] p-6 shadow-xl relative overflow-hidden group h-full flex flex-col justify-between">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 opacity-[0.03] rounded-full -mr-12 -mt-12" />

                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="p-2 bg-emerald-50 rounded-xl dark:bg-emerald-950/20">
                                <Trophy size={18} className="text-emerald-500" />
                            </div>
                            <h3 className="text-[17px] font-black text-gray-800 dark:text-gray-200 tracking-tight">Next Achievement</h3>
                        </div>

                        <div className="flex flex-col items-center text-center px-2">
                            {/* Trophy Icon Box - Emerald Theme */}
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 relative group-hover:scale-110 transition-transform duration-500">
                                <Trophy size={36} className="text-emerald-500" strokeWidth={2.5} />
                                <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                            </div>

                            <h4 className="text-[19px] font-black text-[#1a202c] dark:text-white mb-1.5 px-4 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full inline-block">
                                {badgeNames[totalBadges] || "Eco Champion"}
                            </h4>

                            <p className="text-[12.5px] font-bold mb-6 leading-relaxed text-gray-500 dark:text-gray-400">
                                {stats.resolved % 2 === 0 ? (
                                    <>
                                        <span className="text-emerald-600 dark:text-emerald-400">2 more resolved reports</span>
                                        <span> to unlock the next level.</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-emerald-600 dark:text-emerald-400">Only 1 more resolved</span>
                                        <span> report needed to unlock your next badge!</span>
                                    </>
                                )}
                            </p>

                            {/* Progress Section */}
                            <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-[12px] font-black tracking-wider">
                                    <span className="text-gray-400">Progress</span>
                                    <span className="text-[#10b981]">{stats.resolved % 2}/2</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.resolved % 2) * 50}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/citizen/badges')}
                            className="w-full mt-6 py-2.5 border-2 border-slate-100 dark:border-white/5 rounded-xl text-[12px] font-black text-gray-500 hover:text-emerald-500 hover:border-emerald-500/20 transition-all tracking-widest active:scale-[0.98]"
                        >
                            View all Badges
                        </button>
                    </HoverCard>
                </div>
            </div>
            {/* ── Impact Momentum Graph ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="glass-card bg-white dark:bg-[#0B1121] border-2 border-gray-50 dark:border-white/5 rounded-[1.2rem] p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-emerald-500/20"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3 relative">
                        <div className="p-2 bg-emerald-50 rounded-xl dark:bg-emerald-950/20 text-emerald-600">
                            <TrendingUp size={18} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-[17px] font-black text-gray-800 dark:text-gray-200 tracking-tight">Overall Impact Momentum</h2>
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-white/5 rounded-2xl">
                        {[
                            { id: '7D', label: 'Last 7 Days' },
                            { id: '1M', label: 'Monthly' },
                            { id: '1Y', label: 'Yearly' }
                        ].map(pill => (
                            <button
                                key={pill.id}
                                onClick={() => setTimeframe(pill.id)}
                                className={`px-5 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all ${timeframe === pill.id
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                    }`}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-64 sm:h-72 md:h-80 w-full">
                    {growthChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.4} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={40}
                                />
                                <Tooltip
                                    content={(props) => (
                                        <CustomTooltip
                                            {...props}
                                            overallStats={{
                                                score: totalCredits,
                                                total: stats.total,
                                                badges: totalBadges,
                                                resolved: stats.resolved,
                                                inProgress: stats.inProgress,
                                                pending: stats.pending,
                                            }}
                                        />
                                    )}
                                    cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    name="Impact Progress"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorImpact)"
                                    activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3, shadow: '0 0 10px rgba(16,185,129,0.5)' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChartState
                            icon={TrendingUp}
                            title="No activity data yet"
                            message="Complete your reports and resolve issues to see your eco-impact visualization flourish."
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CitizenDashboard;
