import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Clock, LayoutGrid, Zap, Award, CheckCircle2, RefreshCcw, TrendingUp, Loader2,
    Megaphone, Activity, Trophy, PlusCircle, ChevronRight, Wallet, FileText, Navigation
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import PageHeader from '../../components/PageHeader';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────
   HoverCard & StatCard Components (Matching Citizen EXACTLY)
 ───────────────────────────────────────────────────────────────── */
const cardBaseStyle = {
    transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease, border-color 0.28s ease',
};
const cardHoverStyle = {
    transform: 'scale(1.04) translateY(-4px)',
    boxShadow: '0 20px 40px -8px rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
};

const HoverCard = ({ children, className, delay, rKey }) => {
    const [hovered, setHovered] = React.useState(false);
    return (
        <motion.div
            key={rKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay || 0, ease: 'easeOut' }}
            className={className}
            style={{ ...cardBaseStyle, ...(hovered ? cardHoverStyle : {}) }}
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
                <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                    <p className="sm:text-[15px] text-[10px] font-black text-gray-500 dark:text-gray-400 leading-tight mb-1 sm:mb-1.5 truncate block max-w-full">{label}</p>
                    <div className="flex items-baseline gap-1 sm:gap-1.5 overflow-hidden">
                        <h3 className="sm:text-xl text-[15px] font-black text-[#1a202c] dark:text-white leading-tight truncate">
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

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;

    const Row = ({ label, value, color }) => (
        <div className="flex items-center justify-between gap-6">
            <span className="text-[13px] font-bold" style={{ color }}>{label}:</span>
            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200">{value}</span>
        </div>
    );

    return (
        <div className="relative z-[50] bg-white dark:bg-[#0d1a2e] border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl shadow-2xl min-w-[200px]">
            <div className="absolute w-3 h-3 bg-white dark:bg-[#0d1a2e] border-b border-l border-gray-200 dark:border-gray-700 -bottom-[7px] left-3 rotate-[-45deg]" />
            <p className="text-[11px] font-black text-emerald-500 tracking-wider mb-2 pb-1.5 border-b border-gray-100 dark:border-white/10">
                {label}
            </p>
            <div className="space-y-1.5">
                <Row label="Total Reports" value={d.total ?? 0} color="#6366f1" />
                <Row label="Total Badges" value={d.badges ?? 0} color="#f59e0b" />
                <div className="border-t border-gray-100 dark:border-white/10 my-1" />
                <Row label="Resolved" value={d.resolved ?? 0} color="#10b981" />
                <Row label="In Progress" value={d.inProgress ?? 0} color="#3b82f6" />
                <Row label="Pending" value={d.pending ?? 0} color="#f97316" />
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

const CollectorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeframe, setTimeframe] = useState('7D');

    const quotes = [
        "Small acts, when multiplied by millions of people, can transform the world.",
        "The greatest threat to our planet is the belief that someone else will save it.",
        "Be the change you wish to see in your surroundings.",
        "Every report counts. Every cleanup matters."
    ];
    const todayQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

    const fetchDashboardData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/dashboard/collector?t=${Date.now()}`, {
                headers: {
                    'x-auth-token': token,
                    'Cache-Control': 'no-cache'
                }
            });
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            // Only toast if it's a critical initial failure or manual refresh
            if (!data || isRefresh) {
                const errMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : 'EcoPulse Sync: Database connection pending...');
                toast.error(errMsg.substring(0, 100));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // 🔥 Smart Background Sync
        const interval = setInterval(() => fetchDashboardData(true), 15000);

        // 🔥 Instant Sync on Tab Focus
        const handleFocus = () => fetchDashboardData(true);
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const stats = {
        assigned: data?.stats?.assigned || 0,
        completed: data?.stats?.completed || 0,
        pending: data?.stats?.pending || 0,
        inProgress: data?.stats?.inProgress || 0,
        totalScore: data?.stats?.totalScore || 0,
        dailyScore: data?.stats?.dailyScore || 0,
        totalBadges: data?.stats?.totalBadges || 0,
        totalReports: data?.stats?.totalReports || 0,
        completionRate: data?.stats?.completionRate || 0
    };

    const totalBadges = stats.totalBadges;
    const totalImpactScore = stats.totalScore;
    const dailyImpactScore = stats.dailyScore;
    const totalReports = stats.totalReports;
    const inProgress = stats.inProgress;
    const completionRate = stats.completionRate;

    const nextBadgeIndex = totalBadges;
    const badgeNames = [
        "First Pickup", "Route Rookie", "Street Saver", "Bin Buster", "Swift Sweeper",
        "Clean Captain", "Waste Wizard", "Truck Titan", "Haul Hero", "Eco Picker",
        "Zone Master", "Alley Ally", "Pavement Pilot", "Track Tracer", "Sector Sentinel",
        "Neighborhood Knight", "District Defender", "Urban Uplifter", "City Cycler", "Green Gear",
        "Efficient Hauler", "Rapid Responder", "Direct Driver", "Service Star", "Public Protector",
        "Duty Defender", "Mission Mapper", "Task Terminator", "Job Giant", "Reliable Runner",
        "Speedy Savior", "Always Alerts", "Perfect Pickup", "Graceful Gear", "Steady Steer",
        "Safe Streets", "Pure Path", "Clean Crawler", "Metal Master", "Organic Orbit",
        "Plastic Professional", "Paper Patriot", "Glass Guardian", "Cardboard King", "Bottle Baron",
        "Eco Engine", "Zero Zenith", "Sustainable Steer", "Green Glide", "Earth Engine",
        "Climate Crew", "Verve Van", "Turbo Truck", "Elite Eco", "Grand Gear",
        "Super Sweeper", "Apex Ally", "Prime Picker", "Ultra Uplift", "Final Frontier",
        "Route Ranger", "Nav Master", "Precision Pilot", "Compass King", "Atlas Ace",
        "Globe Guard", "Eco Expert", "Waste Warden", "Pollution Police", "Cleanup Commando",
        "Bio Baron", "Green General", "Trash Terminator", "Eco Emperor", "Nature Knight",
        "Wild Warden", "Field Friend", "Trail Blazer", "Path Picker", "Sky Sailor",
        "Ocean Orbit", "Reef Ranger", "Beach Boss", "Sand Saver", "River Runner",
        "Creek Captain", "Stream Soul", "Current Cleaner", "Flow Finder", "Pure Pilot",
        "Green Giant", "Eco Elite", "World Watcher", "Gaia Guard", "Eden Engine", "Legendary Loader"
    ];

    const growthChartData = useMemo(() => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();

        if (timeframe === '7D') {
            const raw = data?.dailyStats || [];
            return Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                const key = d.toISOString().split('T')[0];
                const found = raw.find(r => r.name === key);
                return {
                    name: dayNames[d.getDay()],
                    score: found ? Math.round(found.score) : 0,
                    total: found ? found.total : 0,
                    resolved: found ? found.resolved : 0,
                    inProgress: found ? found.inProgress : 0,
                    pending: found ? found.pending : 0,
                    badges: found ? found.badges : 0
                };
            });
        }

        if (timeframe === '1M') {
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
                    badges: found ? found.badges : 0
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
                    badges: found ? found.badges : 0
                };
            });
        }
        return [];
    }, [data, timeframe]);


    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-[var(--text-main)]">
            <PageHeader
                title={`Hello, ${user?.name || 'Swachhta Mitra'}!`}
                subtitle={`"${todayQuote}"`}
                icon={LayoutGrid}
            />

            {/* ── Stats Grid: 8 Boxes ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                <StatCard
                    label={<><span className="hidden sm:inline">Total Operation Score</span><span className="sm:hidden">Total Score</span></>}
                    value={totalImpactScore}
                    icon={Wallet}
                    colorClass="text-emerald-500"
                    rKey="impact-score"
                />
                <StatCard
                    label={<><span className="hidden sm:inline">Daily Performance Score</span><span className="sm:hidden">Daily Score</span></>}
                    value={dailyImpactScore}
                    icon={Zap}
                    colorClass="text-amber-500"
                    delay={0.05}
                    rKey="daily-impact"
                />
                <StatCard label="Total Reports" value={totalReports} icon={FileText} colorClass="text-slate-600" delay={0.1} rKey="total-reports" />
                <StatCard label="Total Badges" value={totalBadges} icon={Trophy} colorClass="text-amber-500" delay={0.15} rKey="total-badges" />
                <StatCard label="Resolved" value={stats.completed} icon={CheckCircle2} colorClass="text-emerald-500" delay={0.2} rKey="resolved" />
                <StatCard label="In Progress" value={inProgress} icon={RefreshCcw} colorClass="text-blue-500" delay={0.25} rKey="in-progress" />
                <StatCard label="Pending" value={stats.pending} icon={Clock} colorClass="text-amber-500" delay={0.3} rKey="pending" />
                <HoverCard delay={0.35} rKey="resolution-rate" className="glass-card bg-white dark:bg-[#0B1121] border-2 border-slate-100 dark:border-white/5 rounded-[0.8rem] sm:p-4 p-3 flex flex-col justify-center shadow-lg h-full min-h-[70px] sm:min-h-[85px]">
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                        <p className="sm:text-[15px] text-[10px] font-black text-gray-500 dark:text-gray-400 leading-none">Result</p>
                        <h3 className="sm:text-xl text-[15px] font-black text-emerald-600 leading-none">{completionRate}%</h3>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                </HoverCard>
            </div>

            {/* ── Main Layout: Exact Citizen Replica ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-stretch">
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
                                        Contribute to a cleaner city by resolving waste in 3 simple steps. Your cleanup work is verified by citizens for immediate response.
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                                        Properly documenting waste helps our team build a cleaner ecosystem. By providing clear photos and locations, you give us actionable data that ensures your neighborhood stays healthy.
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { step: '1', title: 'View Task', desc: 'Navigate to your active pickup queue.' },
                                            { step: '2', title: 'Verify Spot', desc: 'Confirm the waste location on site.' },
                                            { step: '3', title: 'Update Evidence', desc: 'Upload cleanup photos to earn +50 points.' }
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
                            <button onClick={() => navigate('/swachhta-mitra/pickups')} className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[13px] rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                <Navigation size={15} /> View all Pickups
                            </button>
                        </HoverCard>

                        {/* Box 2: Community impact */}
                        <HoverCard className="glass-card bg-white dark:bg-[#0B1121] border-2 border-slate-50 dark:border-white/5 rounded-[1.2rem] p-6 shadow-xl flex flex-col justify-between group h-full">
                            <div>
                                <h3 className="text-[17px] font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                        <Activity size={16} className="text-blue-600" />
                                    </div>
                                    Community impact
                                </h3>
                                <p className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Your effort is recorded and verified by the citizen community. As you resolve tasks, you earn points that boost your city-wide reputation rank and professional status.
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-6">
                                    Your performance scores are used to help prioritize zones for faster cleanup and track operational excellence. High rankers qualify for exclusive professional awards and environmental leadership recognition.
                                </p>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {[{ l: 'Report Resolved', p: '+50', c: 'emerald' }, { l: 'Badge Earned', p: '+100', c: 'amber' }].map(r => (
                                        <div key={r.l} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 transition-all">
                                            <span className="text-[11.5px] font-black text-slate-600 dark:text-slate-300">{r.l}</span>
                                            <span className={`text-[12px] font-black text-${r.c}-600`}>{r.p} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[12px] font-bold text-slate-400 mt-6 pt-4 border-t italic">Reach higher milestones and unlock rare badges for exclusive city-wide recognition.</p>
                        </HoverCard>
                    </div>
                </div>

                {/* Column 3: Next Achievement */}
                <div className="lg:col-span-1">
                    <HoverCard className="glass-card bg-white dark:bg-[#0B1121] border-2 border-gray-50 dark:border-white/5 rounded-[1.2rem] p-6 shadow-xl flex flex-col justify-between h-full overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 opacity-[0.03] rounded-full -mr-12 -mt-12" />
                        <div className="flex items-center gap-3 mb-6 relative">
                            <Trophy size={18} className="text-emerald-500" />
                            <h3 className="text-[17px] font-black text-gray-800 dark:text-gray-200 tracking-tight">Next Achievement</h3>
                        </div>
                        <div className="flex flex-col items-center text-center px-2">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 relative">
                                <Trophy size={36} className="text-emerald-500" strokeWidth={2.5} />
                                <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                            </div>
                            <h4 className="text-[19px] font-black text-[#1a202c] dark:text-white mb-1.5 px-4 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full inline-block">
                                {badgeNames[nextBadgeIndex] || "Eco Champion"}
                            </h4>
                            <p className="text-[12.5px] font-bold mb-6 leading-relaxed text-gray-500 dark:text-gray-400">
                                {stats.completed % 2 === 0 ? (
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
                            <div className="w-full space-y-2">
                                <div className="flex items-center justify-between text-[12px] font-black tracking-wider"><span className="text-gray-400">Progress</span><span className="text-[#10b981]">{stats.completed % 2}/2</span></div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.completed % 2) * 50}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                </div>
                            </div>
                        </div>
                        <button onClick={() => navigate('/swachhta-mitra/badges')} className="w-full mt-6 py-2.5 border-2 border-slate-100 dark:border-white/5 rounded-xl text-[12px] font-black text-gray-500 hover:text-emerald-500 transition-all tracking-widest">View all Badges</button>
                    </HoverCard>
                </div>
            </div>

            {/* ── Impact Momentum Graph (EXACT CITIZEN REPLICA) ── */}
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
                                    dx={-10}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorImpact)"
                                    activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
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

export default CollectorDashboard;
