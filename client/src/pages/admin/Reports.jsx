import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText,
    Search,
    Filter,
    Trash2,
    AlertCircle,
    MapPin,
    Clock,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    X,
    ChevronDown,
    LayoutGrid,
    Calendar,
    ChevronLeft,
    ChevronRight,
    FileText as FileTextIcon,
    ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const AdminReports = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const [error, setError] = useState('');

    // Parse status from URL query params
    const queryParams = new URLSearchParams(location.search);
    const initialStatus = queryParams.get('status') || 'All';

    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [urgencyFilter, setUrgencyFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [zoneFilter, setZoneFilter] = useState('');
    const [timeFilter, setTimeFilter] = useState('7d');
    const [sortBy, setSortBy] = useState('newest');
    const [deletingReportId, setDeletingReportId] = useState(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);

    // Sync filter state with URL changes
    useEffect(() => {
        const status = new URLSearchParams(location.search).get('status');
        if (status) {
            setStatusFilter(status);
        }
    }, [location.search]);

    useEffect(() => {
        fetchReports();
    }, [statusFilter, urgencyFilter, zoneFilter, page, timeFilter, sortBy]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/reports`, {
                headers: { 'x-auth-token': token },
                params: {
                    status: statusFilter,
                    urgency: urgencyFilter,
                    zone: zoneFilter,
                    search: searchTerm,
                    page,
                    limit: 10,
                    sortBy,
                    from: (timeFilter !== 'all' ? (function () {
                        const now = new Date();
                        if (timeFilter === '7d') return new Date(now.setDate(now.getDate() - 7)).toISOString();
                        if (timeFilter === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                        if (timeFilter === 'yearly') return new Date(now.getFullYear(), 0, 1).toISOString();
                        return null;
                    })() : null)
                }
            });
            setReports(res.data.reports || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalReports(res.data.totalReports || 0);
        } catch (err) {
            setError('Failed to load reports. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [viewingReport, setViewingReport] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Touch handlers for swipe
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (viewingReport?.photos?.length > 1) {
            if (isLeftSwipe) {
                setActiveImageIndex((prev) => (prev < viewingReport.photos.length - 1 ? prev + 1 : 0));
            }
            if (isRightSwipe) {
                setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : viewingReport.photos.length - 1));
            }
        }
    };

    const handleViewReport = (report) => {
        setViewingReport(report);
        setActiveImageIndex(0);
    };

    const handleDelete = (id) => {
        setDeletingReportId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deletingReportId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/reports/${deletingReportId}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success('Report deleted successfully');
            fetchReports();
        } catch (err) {
            toast.error('Failed to purge report record.');
        } finally {
            setDeletingReportId(null);
        }
    };

    const activeModule = sessionStorage.getItem('adminModule') || 'citizen';

    return (
        <div className="space-y-6 animate-fade-in pb-10 max-w-full">
            {/* Header Area */}
            <PageHeader
                title={activeModule === 'citizen' ? 'All Reports' : 'All Pickups'}
                subtitle={`Manage and monitor all ${activeModule === 'citizen' ? 'garbage issues' : 'mitra pickups'} across zones.`}
                icon={activeModule === 'citizen' ? FileTextIcon : LayoutGrid}
                right={
                    <div className="flex items-center gap-2">
                        <div className="hidden lg:flex items-center gap-3 px-6 py-2.5 bg-emerald-600 rounded-full shadow-lg shadow-emerald-600/25 border border-transparent hover:border-white/50 transition-all cursor-default relative overflow-hidden min-w-[200px]">
                            <div className="relative z-10 w-full text-center sm:text-left">
                                <p className="text-[10px] font-bold text-white/90 tracking-wide uppercase">Total {activeModule === 'citizen' ? 'Reports' : 'Pickups'}</p>
                                <div className="flex items-baseline gap-1.5 justify-center sm:justify-start">
                                    <span className="text-3xl font-black tabular-nums text-white leading-tight">{totalReports}</span>
                                    <span className="text-[11px] font-black text-white/80 uppercase">In System</span>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* High-Fidelity Multi-Tier Filter Hub */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    {/* Primary Row: Search + Zone */}
                    <div className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={12} />
                            <input
                                type="text"
                                placeholder={isMobile ? "Search by area, type..." : "Search by city, area, type..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && fetchReports()}
                                className="w-full pl-9 pr-4 h-[44px] bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 text-[11px] sm:text-[13px] font-black text-slate-700 dark:text-white outline-none transition-all placeholder-slate-400 shadow-sm"
                            />
                        </div>

                        {/* Zone Dropdown (Primary) */}
                        <div className="relative group shrink-0 min-w-[90px] sm:min-w-[130px]">
                            <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${zoneFilter ? 'text-emerald-500' : 'text-slate-400'}`} size={12} />
                            <select
                                value={zoneFilter}
                                onChange={(e) => setZoneFilter(e.target.value)}
                                className={`appearance-none w-full pl-8 pr-7 h-[44px] bg-white dark:bg-[#0B1121] border rounded-xl focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all cursor-pointer shadow-sm text-[11px] sm:text-[12px] font-black ${zoneFilter
                                    ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                    : 'border-slate-200 dark:border-white/10 text-slate-500'
                                    }`}
                            >
                                <option value="">Zone</option>
                                <option value="East">East Zone</option>
                                <option value="West">West Zone</option>
                                <option value="North">North Zone</option>
                                <option value="South">South Zone</option>
                            </select>
                            <ChevronDown size={11} className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none ${zoneFilter ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </div>
                    </div>
                </div>

                {/* Secondary Row: Time + Grouped Filters (Status + Urgency + Sort) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
                    {/* Time Presets - Containerized UI matching Users Page */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-emerald-500/5 rounded-xl border border-slate-100 dark:border-white/5 w-fit overflow-x-auto hide-scrollbar">
                        {[
                            { id: 'all', label: 'All' },
                            { id: '7d', label: '7 Days' },
                            { id: 'monthly', label: 'Monthly' },
                            { id: 'yearly', label: 'Yearly' }
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setTimeFilter(f.id)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-black transition-all whitespace-nowrap active:scale-95 ${timeFilter === f.id
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                    : 'bg-white dark:bg-[#0B1121] text-slate-500 border border-slate-200 dark:border-white/10'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-[1.5px] bg-slate-100 dark:bg-white/5 hidden sm:block" />

                    {/* Grouped Dynamic Filters */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Status Dropdown */}
                        <div className="relative group shrink-0">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={`appearance-none pl-3 pr-7 h-[40px] rounded-xl text-[11px] sm:text-[12px] font-black bg-white dark:bg-[#0B1121] border focus:ring-1 focus:ring-emerald-500/30 outline-none shadow-sm cursor-pointer transition-all ${statusFilter !== 'All'
                                    ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                    : 'border-slate-200 dark:border-white/10 text-slate-500'
                                    }`}
                            >
                                <option value="All">Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                            <ChevronDown size={11} className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none ${statusFilter !== 'All' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </div>

                        {/* Urgency Dropdown */}
                        <div className="relative group shrink-0">
                            <select
                                value={urgencyFilter}
                                onChange={(e) => setUrgencyFilter(e.target.value)}
                                className={`appearance-none pl-3 pr-7 h-[40px] rounded-xl text-[11px] sm:text-[12px] font-black bg-white dark:bg-[#0B1121] border focus:ring-1 focus:ring-emerald-500/30 outline-none shadow-sm cursor-pointer transition-all ${urgencyFilter !== 'All'
                                    ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                    : 'border-slate-200 dark:border-white/10 text-slate-500'
                                    }`}
                            >
                                <option value="All">Urgency</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <ChevronDown size={11} className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none ${urgencyFilter !== 'All' ? 'text-emerald-500' : 'text-slate-400'}`} />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative group shrink-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-3 pr-8 h-[40px] rounded-xl text-[11px] sm:text-[12px] font-black bg-white dark:bg-[#0B1121] border border-slate-200 dark:border-white/10 focus:ring-1 focus:ring-emerald-500/30 outline-none shadow-sm cursor-pointer text-slate-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="priority-hl">Priority H-L</option>
                                <option value="priority-lh">Priority L-H</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Table Content */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1240px]">
                    <thead className="text-center">
                        <tr className="bg-emerald-500/10 dark:bg-emerald-500/5 border-b-2 border-gray-800/20 dark:border-white/30">
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap border-r border-gray-800/10 dark:border-white/20">Date & Time</th>
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap border-r border-gray-800/10 dark:border-white/20">Zone</th>
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap border-r border-gray-800/10 dark:border-white/20">City</th>
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap border-r border-gray-800/10 dark:border-white/20">Area</th>
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap border-r border-gray-800/10 dark:border-white/20">Garbage Type</th>
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap border-r border-gray-800/10 dark:border-white/20">Urgency Level</th>
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap border-r border-gray-800/10 dark:border-white/20">Current Status</th>
                            <th className="px-5 py-4 text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/10 dark:divide-white/20">
                        <AnimatePresence mode='popLayout'>
                            {reports.length > 0 ? reports.map((r, i) => (
                                <motion.tr
                                    key={r._id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: i * 0.03 }}
                                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    {/* Date & Time */}
                                    <td className="px-5 py-4 border-r border-gray-800/10 dark:border-white/20 whitespace-nowrap">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-gray-900 dark:text-white uppercase">
                                                {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {new Date(r.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Zone */}
                                    <td className="px-5 py-4 border-r border-gray-800/10 dark:border-white/20 text-center whitespace-nowrap">
                                        <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 capitalize tracking-wider">
                                            {r.zone} Zone
                                        </span>
                                    </td>

                                    {/* City */}
                                    <td className="px-5 py-4 border-r border-gray-800/10 dark:border-white/20 text-center font-black text-xs text-slate-700 dark:text-slate-300 capitalize whitespace-nowrap">
                                        {r.city || 'Pune'}
                                    </td>

                                    {/* Area */}
                                    <td className="px-5 py-4 border-r border-gray-800/10 dark:border-white/20 text-center font-bold text-xs text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                                        {r.area || 'N/A'}
                                    </td>

                                    {/* Garbage Type */}
                                    <td className="px-5 py-4 border-r border-gray-800/10 dark:border-white/20 text-center whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-tight whitespace-nowrap">
                                            {r.garbageType} Waste
                                        </span>
                                    </td>

                                    {/* Urgency Level */}
                                    <td className="px-5 py-4 border-r border-gray-800/10 dark:border-white/20 text-center whitespace-nowrap">
                                        <span className={`text-[11px] font-black capitalize ${r.urgency === 'High' ? 'text-rose-600' :
                                            r.urgency === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>
                                            {r.urgency}
                                        </span>
                                    </td>

                                    {/* Current Status */}
                                    <td className="px-5 py-4 border-r border-gray-800/10 dark:border-white/20 text-center whitespace-nowrap">
                                        <span className={`text-[10px] font-black capitalize tracking-wider ${r.status === 'Resolved' ? 'text-emerald-700 dark:text-emerald-400' :
                                            r.status === 'In Progress' ? 'text-blue-700 dark:text-blue-400' :
                                                'text-amber-700 dark:text-amber-400'
                                            }`}>
                                            {r.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={() => handleDelete(r._id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-white/5 rounded-xl transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="10" className="py-20 text-center">
                                        <FileText size={40} className="mx-auto text-slate-100 dark:text-white/5 mb-4" />
                                        <p className="text-sm font-bold text-slate-400 italic">No reports found matching your criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Removed Pagination as per user request */}

            {/* ---------- VIEW DETAILS MODAL ---------- */}
            <AnimatePresence>
                {viewingReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center lg:pl-64 p-4 pt-20 sm:pt-4 bg-black/60 backdrop-blur-[2px]"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white dark:bg-[#0B1121] rounded-[2.5rem] w-full max-w-[420px] max-h-[85vh] overflow-hidden shadow-2xl relative border-2 border-slate-100 dark:border-white/5 flex flex-col"
                        >
                            <button
                                onClick={() => {
                                    setViewingReport(null);
                                    setActiveImageIndex(0);
                                }}
                                className="absolute top-6 right-6 z-20 p-2.5 bg-white/90 dark:bg-gray-800 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all shadow-md text-slate-500 hover:text-emerald-600"
                            >
                                <X size={18} />
                            </button>

                            <div className="p-3 pb-8 overflow-y-auto custom-scrollbar flex-1">
                                <div
                                    className="relative group/modalimg w-full h-[240px] rounded-3xl overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shrink-0 mb-6 shadow-inner"
                                    onTouchStart={onTouchStart}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={onTouchEnd}
                                >
                                    {(viewingReport.photos && viewingReport.photos.length > 0) || viewingReport.image ? (
                                        <>
                                            <img
                                                src={viewingReport.photos && viewingReport.photos.length > 0 ? viewingReport.photos[activeImageIndex] : viewingReport.image}
                                                alt={`Evidence`}
                                                className="w-full h-full object-cover"
                                            />

                                            {viewingReport.photos && viewingReport.photos.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : viewingReport.photos.length - 1));
                                                        }}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-all"
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndex((prev) => (prev < viewingReport.photos.length - 1 ? prev + 1 : 0));
                                                        }}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-all"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <FileTextIcon size={40} className="opacity-20 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">No Image</p>
                                        </div>
                                    )}
                                </div>

                                <div className="px-4">
                                    <h2 className="text-[1.5rem] font-black text-slate-800 dark:text-white leading-tight tracking-tighter mb-1 mt-2">
                                        {viewingReport.area || viewingReport.location}
                                    </h2>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">
                                        <Clock size={14} className="text-emerald-500" />
                                        {new Date(viewingReport.createdAt).toLocaleString()}
                                    </div>

                                    <div className="space-y-4 mb-8 bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                        {[
                                            { label: 'Report ID', value: `#${viewingReport._id.slice(-6).toUpperCase()}`, color: 'text-slate-900 dark:text-white' },
                                            { label: 'Type', value: `${viewingReport.garbageType} Waste`, color: 'text-indigo-600 dark:text-indigo-400' },
                                            { label: 'Priority', value: `${viewingReport.urgency} Level`, color: 'text-rose-500' },
                                            { label: 'Status', value: viewingReport.status, color: 'text-emerald-600 dark:text-emerald-400' },
                                            { label: 'Zone', value: `${viewingReport.zone} Zone`, color: 'text-slate-600 dark:text-slate-400' },
                                            { label: 'Landmark', value: viewingReport.landmark || 'N/A', color: 'text-slate-600 dark:text-slate-400' }
                                        ].map((field, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{field.label}</span>
                                                <span className={`text-[12px] font-black ${field.color}`}>{field.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 px-2">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
                                        <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-400 font-bold italic">
                                            "{viewingReport.description || 'No description provided.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ---------- DELETE CONFIRMATION MODAL ---------- */}
            <AnimatePresence>
                {deletingReportId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[4px] p-6 lg:pl-[260px]"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#0B1121] rounded-3xl p-10 w-full max-w-[360px] shadow-2xl text-center border-2 border-slate-100 dark:border-white/5"
                        >
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6 border border-red-100 dark:border-red-500/20">
                                <Trash2 size={28} />
                            </div>

                            <h3 className="text-[1.25rem] font-black text-slate-800 dark:text-white mb-3 tracking-tight">Delete Report?</h3>
                            <p className="text-[14px] font-bold text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                                Are you sure you want to delete this report?
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeletingReportId(null)}
                                    className="flex-1 py-4 text-[14px] font-black bg-[#f8fafc] dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 dark:border-white/5"
                                >
                                    No, keep it
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 py-4 text-[14px] font-black bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    Yes, delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminReports;
