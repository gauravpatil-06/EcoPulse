const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const User = require('../models/User');
const UserBadge = require('../models/UserBadge');

// 🛠️ Stable Scoring Helper
const n = (val) => Number(val) || 0;
const calcScore = (r, t, b = 0) => (n(r) * 50) + (n(t) * 10) + (n(b) * 100);

// 🛠️ ACTIVITY-BASED MOMENTUM CALCULATOR
const getMomentum = async (rawQuery, days = 30, format = "%Y-%m-%d") => {
    const limit = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dateQuery = { ...rawQuery, createdAt: { $gte: limit } };
    const updateQuery = { ...rawQuery, status: 'Resolved', updatedAt: { $gte: limit } };
    const inProgressQuery = { ...rawQuery, status: 'In Progress', createdAt: { $gte: limit } };
    const pendingQuery = { ...rawQuery, status: 'Pending', createdAt: { $gte: limit } };
    
    let badgeQuery = null;
    if (rawQuery.citizenId?.$in) badgeQuery = { userId: { $in: rawQuery.citizenId.$in }, createdAt: { $gte: limit } };
    else if (rawQuery.collectorId?.$in) badgeQuery = { userId: { $in: rawQuery.collectorId.$in }, createdAt: { $gte: limit } };
    else if (rawQuery.citizenId) badgeQuery = { userId: rawQuery.citizenId, createdAt: { $gte: limit } };
    else if (rawQuery.collectorId) badgeQuery = { userId: rawQuery.collectorId, createdAt: { $gte: limit } };

    const [created, resolved, inProgress, pending, badgesData] = await Promise.all([
        Report.aggregate([{ $match: dateQuery }, { $group: { _id: { $dateToString: { format, date: "$createdAt" } }, count: { $sum: 1 } } }]).catch(() => []),
        Report.aggregate([{ $match: updateQuery }, { $group: { _id: { $dateToString: { format, date: "$updatedAt" } }, count: { $sum: 1 } } }]).catch(() => []),
        Report.aggregate([{ $match: inProgressQuery }, { $group: { _id: { $dateToString: { format, date: "$createdAt" } }, count: { $sum: 1 } } }]).catch(() => []),
        Report.aggregate([{ $match: pendingQuery }, { $group: { _id: { $dateToString: { format, date: "$createdAt" } }, count: { $sum: 1 } } }]).catch(() => []),
        badgeQuery ? UserBadge.aggregate([{ $match: badgeQuery }, { $group: { _id: { $dateToString: { format, date: "$createdAt" } }, count: { $sum: 1 } } }]).catch(() => []) : Promise.resolve([])
    ]);

    const map = {};
    const merge = (arr, field) => arr.forEach(item => {
        if (!map[item._id]) map[item._id] = { name: item._id, total: 0, resolved: 0, badges: 0, inProgress: 0, pending: 0 };
        map[item._id][field] = item.count;
    });

    merge(created, 'total');
    merge(resolved, 'resolved');
    merge(inProgress, 'inProgress');
    merge(pending, 'pending');
    merge(badgesData, 'badges');

    const result = Object.values(map)
        .map(m => ({ ...m, score: calcScore(m.resolved, m.total, m.badges) }))
        .sort((a,b) => a.name.localeCompare(b.name));

    // 🗓️ Fill Missing Gaps (Daily, Monthly, Yearly)
    const filled = [];
    const step = format === "%Y-%m-%d" ? "day" : (format === "%Y-%m" ? "month" : "year");
    const count = format === "%Y-%m-%d" ? days : (format === "%Y-%m" ? 12 : 3);
    
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date();
        if (step === "day") d.setDate(d.getDate() - i);
        else if (step === "month") d.setMonth(d.getMonth() - i);
        else if (step === "year") d.setFullYear(d.getFullYear() - i);

        let key;
        if (format === "%Y-%m-%d") key = d.toLocaleDateString('en-CA');
        else if (format === "%Y-%m") key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
        else key = String(d.getFullYear());

        const found = result.find(r => r.name === key);
        filled.push(found || { name: key, total: 0, resolved: 0, inProgress: 0, pending: 0, badges: 0, score: 0 });
    }
    return filled;
};

// @route   GET /api/dashboard/citizen
router.get('/citizen', auth, async (req, res) => {
    try {
        const uId = new mongoose.Types.ObjectId(req.user.id);
        const [total, resolvedCt, pending, inProgress, user, badgesCount] = await Promise.all([
            Report.countDocuments({ citizenId: uId }).catch(() => 0),
            Report.countDocuments({ citizenId: uId, status: 'Resolved' }).catch(() => 0),
            Report.countDocuments({ citizenId: uId, status: 'Pending' }).catch(() => 0),
            Report.countDocuments({ citizenId: uId, status: 'In Progress' }).catch(() => 0),
            User.findById(uId).lean().catch(() => null),
            UserBadge.countDocuments({ userId: uId }).catch(() => 0)
        ]);

        const dailyStats = await getMomentum({ citizenId: uId }, 30);
        
        res.json({
            stats: { total, resolved: resolvedCt, pending, inProgress, totalScore: n(user?.totalScore), dailyScore: (user?.lastScoreUpdate && new Date(user.lastScoreUpdate).toDateString() === new Date().toDateString()) ? n(user?.dailyScore) : 0, totalBadges: badgesCount },
            dailyStats,
            recentReports: await Report.find({ citizenId: uId }).sort({ createdAt: -1 }).limit(5).lean().catch(() => [])
        });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

// @route   GET /api/dashboard/collector
router.get('/collector', auth, async (req, res) => {
    try {
        const uId = new mongoose.Types.ObjectId(req.user.id);
        const user = await User.findById(uId).lean();
        if (!user || !user.zone) return res.json({ stats: { assigned: 0, totalReports: 0, completed: 0, pending: 0, inProgress: 0, totalScore: 0, dailyScore: 0, totalBadges: 0 }, dailyStats: [], pickups: [] });

        const zQ = { zone: user.zone.trim().toLowerCase(), city: user.city.trim().toLowerCase() };
        const [counts, pickups, badgesCount] = await Promise.all([
            Report.aggregate([{ $match: zQ }, { $group: { _id: "$status", count: { $sum: 1 } } }]).catch(() => []),
            Report.find(zQ).sort({ createdAt: -1 }).limit(10).lean().catch(() => []),
            UserBadge.countDocuments({ userId: uId }).catch(() => 0)
        ]);

        const dailyStats = await getMomentum({ collectorId: uId }, 30);
        const getCt = (s) => n(counts.find(c => c._id === s)?.count);
        const total = counts.reduce((a, b) => a + n(b.count), 0);

        res.json({
            stats: { assigned: total, totalReports: total, completed: getCt('Resolved'), pending: getCt('Pending'), inProgress: getCt('In Progress'), totalScore: n(user?.totalScore), dailyScore: (user?.lastScoreUpdate && new Date(user.lastScoreUpdate).toDateString() === new Date().toDateString()) ? n(user?.dailyScore) : 0, totalBadges: badgesCount, completionRate: total > 0 ? Math.round((getCt('Resolved') / total) * 100) : 0 },
            dailyStats,
            pickups
        });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

// @route   GET /api/dashboard/admin
router.get('/admin', auth, async (req, res) => {
    try {
        const today = new Date().toDateString();
        const citizens = await User.find({ role: 'citizen' }).lean() || [];
        const mitras = await User.find({ role: { $in: ['Swachhta Mitra', 'collector'] } }).lean() || [];
        
        const citizenIds = citizens.map(c => c._id);
        const mitraIds = mitras.map(m => m._id);

        const [cStats, mStats, cBadges, mBadges] = await Promise.all([
            Report.aggregate([{ $match: { citizenId: { $in: citizenIds } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]).catch(() => []),
            Report.aggregate([{ $match: { collectorId: { $in: mitraIds } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]).catch(() => []),
            UserBadge.countDocuments({ userId: { $in: citizenIds } }).catch(() => 0),
            UserBadge.countDocuments({ userId: { $in: mitraIds } }).catch(() => 0)
        ]);

        const [cGrowth, mGrowth, cMonthly, mMonthly, cYearly, mYearly] = await Promise.all([
            getMomentum({ citizenId: { $in: citizenIds } }, 30, "%Y-%m-%d"),
            getMomentum({ collectorId: { $in: mitraIds } }, 30, "%Y-%m-%d"),
            getMomentum({ citizenId: { $in: citizenIds } }, 365, "%Y-%m"),
            getMomentum({ collectorId: { $in: mitraIds } }, 365, "%Y-%m"),
            getMomentum({ citizenId: { $in: citizenIds } }, 1095, "%Y"),
            getMomentum({ collectorId: { $in: mitraIds } }, 1095, "%Y")
        ]);

        const getC = (s) => n(cStats.find(r => r._id === s)?.count);
        const getM = (s) => n(mStats.find(r => r._id === s)?.count);

        res.json({
            citizenStats: { totalUsers: citizens.length, totalScore: citizens.reduce((a, b) => a + n(b.totalScore), 0), dailyScore: citizens.reduce((a, b) => (b.lastScoreUpdate && new Date(b.lastScoreUpdate).toDateString() === today) ? a + n(b.dailyScore) : a, 0), totalReports: cStats.reduce((a, b) => a + n(b.count), 0), resolved: getC('Resolved'), inProgress: getC('In Progress'), pending: getC('Pending'), totalBadges: cBadges },
            mitraStats: { totalUsers: mitras.length, totalScore: mitras.reduce((a, b) => a + n(b.totalScore), 0), dailyScore: mitras.reduce((a, b) => (b.lastScoreUpdate && new Date(b.lastScoreUpdate).toDateString() === today) ? a + n(b.dailyScore) : a, 0), totalReports: mStats.reduce((a, b) => a + n(b.count), 0), resolved: getM('Resolved'), inProgress: getM('In Progress'), pending: getM('Pending'), totalBadges: mBadges },
            citizenGrowth: cGrowth,
            mitraGrowth: mGrowth,
            citizenMonthly: cMonthly,
            mitraMonthly: mMonthly,
            citizenYearly: cYearly,
            mitraYearly: mYearly
        });
    } catch (err) { res.status(500).json({ message: 'Error' }); }
});

module.exports = router;
