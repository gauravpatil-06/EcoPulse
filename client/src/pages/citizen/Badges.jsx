import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Trophy, Award, Star, Zap, Shield, Target, Flame, Heart, Leaf, Recycle,
    CheckCircle, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';

const Badges = () => {
    const { token } = useAuth();
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [stats, setStats] = useState({ resolved: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [dashRes, badgeRes] = await Promise.all([
                    axios.get('/api/dashboard/citizen', { headers: { 'x-auth-token': token } }),
                    axios.get('/api/badges/user', { headers: { 'x-auth-token': token } })
                ]);
                setStats({ resolved: dashRes.data?.stats?.resolved || 0 });
                setEarnedBadges(badgeRes.data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchStats();
    }, [token]);

    // Check if a badge is earned in DB or based on virtual stats for instant feedback
    const isBadgeUnlocked = (index) => {
        // Core Logic: 1 Badge per 2 Resolved Reports
        return stats.resolved >= (index + 1) * 2;
    };

    const unlockedCount = Math.floor(stats.resolved / 2);

    const badgeNames = [
        "First Step", "Clean Starter", "Eco Warrior", "Waste Ninja", "City Helper",
        "Green Citizen", "Recycle Pro", "Sustainability Hero", "Earth Guard", "Nature Friend",
        "Community Star", "Clean Streets", "Green Impact", "Eco Legend", "Waste Buster",
        "Planet Saver", "Pure Heart", "Green Visionary", "City Guardian", "Eco Champion",
        "Neighborhood Hero", "Pollution Fighter", "Sky Watcher", "Water Protector", "Seed Sower",
        "Flower Power", "Forest Keeper", "Garden Sage", "Tree Hugger", "Leaf Specialist",
        "Climate Pilot", "Ocean Saver", "Reef Rescuer", "Beach Cleaner", "Stream Savior",
        "Mountain Guide", "Hillside Guard", "Plain Protector", "Ice Defender", "Arctic Hero",
        "Desert Guard", "Mist Master", "Wind Whisperer", "Solar Seeker", "Lunar Light",
        "Stellar Eco", "Galaxy Guard", "Universal Clean", "Infinity Impact", "Life Bringer",
        "Oxygen Expert", "Carbon Cutter", "Smog Smacker", "Toxin Terminator", "Hazard Hunter",
        "Bottle Baron", "Cardboard King", "Plastic Pirate", "Metal Master", "Glass Genius",
        "Organic Oracle", "Compost Captain", "Zero Hero", "Minimalist Master", "Circular Savvy",
        "Ethical Expert", "Fair Follower", "Kind Keeper", "Smart Strategist", "Clean Catalyst",
        "Spark of Hope", "Beam of Light", "Glow of Earth", "Radiant Runner", "Dazzling Defender",
        "Polished Patriot", "Shining Soul", "Eco Essence", "Nature Nurturer", "Wild Warden",
        "Animal Ally", "Bird Buddy", "Bug Boss", "Fish Friend", "Whale Watcher",
        "Tiger Trust", "Lion Loyal", "Eagle Eye", "Wolf Wisdom", "Panda Peace",
        "Green Giant", "Earth Emperor", "Biosphere Boss", "Gaia Guardian", "Eden Expert",
        "Paradise Planner", "Utopia Unit", "Nature Nexus", "World Wonder", "The Ultimate Green"
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in text-slate-800 dark:text-slate-100">
            <PageHeader title="Eco Achievements" subtitle={`You have unlocked ${unlockedCount} / 100 Badges`} icon={Trophy} />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {badgeNames.map((name, i) => {
                    const isUnlocked = isBadgeUnlocked(i);
                    return (
                        <div key={i} className="flex flex-col items-center text-center group py-2">
                            <div className={`w-32 h-32 sm:w-[150px] sm:h-[150px] rounded-[2rem] flex items-center justify-center transition-all duration-300 relative border-[1.5px] ${isUnlocked
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 shadow-sm scale-100"
                                    : "bg-white dark:bg-[#0B1121] border-dashed border-slate-200 dark:border-white/5 opacity-40 shadow-inner"
                                }`}>
                                <Trophy size={42} className={isUnlocked ? "text-emerald-500" : "text-slate-300"} />
                                {isUnlocked && <CheckCircle className="absolute -top-1 -right-1 text-emerald-500 bg-white dark:bg-slate-900 rounded-full p-0.5 border-2 border-white dark:border-slate-900" size={24} />}
                                {!isUnlocked && <Lock className="absolute top-4 right-4 text-slate-300 opacity-50" size={14} />}
                            </div>
                            <h4 className={`text-[13px] sm:text-[14.5px] font-black capitalize mt-3 tracking-tight ${isUnlocked ? "text-slate-800 dark:text-slate-100" : "text-slate-400"}`}>
                                {name}
                            </h4>
                            <p className="text-[10.5px] font-bold text-slate-400/80 mt-1 uppercase tracking-widest">
                                {isUnlocked ? "Unlocked" : `Resolve ${(i + 1) * 2}`}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Badges;
