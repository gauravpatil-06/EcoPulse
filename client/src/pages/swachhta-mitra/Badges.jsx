import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Truck, Award, Star, Zap, Shield, Target, Flame, Heart, Leaf, Recycle,
    CheckCircle, Lock, Trophy, MapPin, Navigation, Map, Ruler, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';

const CollectorBadges = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({ completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/dashboard/collector', {
                    headers: { 'x-auth-token': token }
                });
                setStats({ completed: res.data?.stats?.completed || 0 });
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchStats();
    }, [token]);

    const unlockedCount = Math.floor(stats.completed / 2);

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
        "Green Giant", "Eco Elite", "World Watcher", "Gaia Guard", "Eden Engine",
        "Legendary Loader", "Titan of Trash", "Clean Overlord", "Supreme Savior", "Eco Absolute"
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in text-slate-800 dark:text-slate-100">
            <PageHeader title="Eco Achievements" subtitle={`You have unlocked ${unlockedCount} Badges`} icon={Trophy} />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {badgeNames.map((name, i) => {
                    const isUnlocked = stats.completed >= (i + 1) * 2;
                    return (
                        <div key={i} className="flex flex-col items-center text-center group py-2">
                            <div className={`w-32 h-32 sm:w-[150px] sm:h-[150px] rounded-[2rem] flex items-center justify-center transition-all duration-300 relative border-[1.5px] ${isUnlocked
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 shadow-sm scale-100"
                                    : "bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 opacity-40 shadow-inner"
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

export default CollectorBadges;
