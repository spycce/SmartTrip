import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicFeed } from '../services/api';
import { Trip, Photo } from '../types';
import { Search, MapPin, Calendar, LayoutDashboard, LogIn, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface FloatingItem {
    id: string;
    type: 'photo' | 'trip';
    data: Trip | Photo;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    duration: number;
}

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState<FloatingItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<FloatingItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeed();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 3) {
            setFilteredItems(items);
        } else {
            const query = searchQuery.toLowerCase();
            const results = items.filter(item => {
                // Search Active: HIDE PHOTOS, SHOW ONLY TRIPS
                if (item.type === 'photo') return false;

                const trip = item.data as Trip;
                return (
                    trip.from?.toLowerCase().includes(query) ||
                    trip.to?.toLowerCase().includes(query) ||
                    trip.summary?.toLowerCase().includes(query)
                );
            });
            setFilteredItems(results);
        }
    }, [searchQuery, items]);

    const loadFeed = async () => {
        try {
            const { trips, photos } = await getPublicFeed();

            // Combine and sort by date descending
            const allItems = [
                ...photos.map((p: Photo) => ({ type: 'photo' as const, data: p, date: new Date(p.createdAt).getTime() })),
                ...trips.map((t: Trip) => ({ type: 'trip' as const, data: t, date: new Date(t.startDate).getTime() }))
            ].sort((a, b) => b.date - a.date).slice(0, 15);

            // Grid Layout to prevent overlap (4 columns x 4 rows = 16 slots)
            const slots: { r: number, c: number }[] = [];
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    slots.push({ r, c });
                }
            }

            // Shuffle slots
            for (let i = slots.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [slots[i], slots[j]] = [slots[j], slots[i]];
            }

            const newItems: FloatingItem[] = allItems.map((item, index) => {
                const slot = slots[index] || { r: Math.random() * 3, c: Math.random() * 3 };
                // Grid cell size approx 20-25%
                // Add jitter within the cell, but keep within bounds
                const x = (slot.c * 24) + (Math.random() * 5);
                const y = (slot.r * 20) + (Math.random() * 5);

                if (item.type === 'photo') {
                    const photo = item.data as Photo;
                    return {
                        id: photo._id,
                        type: 'photo',
                        data: photo,
                        x,
                        y,
                        rotation: (Math.random() - 0.5) * 20,
                        scale: 0.8 + Math.random() * 0.4,
                        duration: 20 + Math.random() * 20
                    };
                } else {
                    const trip = item.data as Trip;
                    return {
                        id: trip._id || trip.id,
                        type: 'trip',
                        data: trip,
                        x,
                        y,
                        rotation: (Math.random() - 0.5) * 10,
                        scale: 0.9 + Math.random() * 0.2,
                        duration: 25 + Math.random() * 20
                    };
                }
            });

            setItems(newItems);
            setFilteredItems(newItems);
        } catch (error) {
            console.error('Failed to load feed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (item: FloatingItem) => {
        // Disable click for Photos
        if (item.type === 'photo') return;

        let tripId: string | undefined;
        if (item.type === 'trip') {
            const t = item.data as Trip;
            tripId = t._id || t.id;
        }

        if (tripId) {
            navigate(`/view/trip/${tripId}`);
        }
    };

    const getTripImage = (trip: Trip) => {
        if (trip.itinerary && trip.itinerary.length > 0) {
            if (trip.itinerary[0].imageUrl) return trip.itinerary[0].imageUrl;
            if (trip.itinerary[0].images && trip.itinerary[0].images.length > 0) return trip.itinerary[0].images[0];
        }
        return null;
    };

    return (
        <div className="relative w-full h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            {/* Navbar */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-7xl mx-auto pointer-events-none">
                <div className="flex items-center space-x-2 text-blue-600 pointer-events-auto">
                    <MapPin size={28} />
                    <span className="text-2xl font-bold font-caveat">SmartTrip</span>
                </div>
                <div className="pointer-events-auto flex items-center space-x-3">
                    {isAuthenticated ? (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-white/90 backdrop-blur-md text-slate-800 px-6 py-2.5 rounded-full font-bold shadow-sm border border-slate-100 hover:scale-105 transition-transform flex items-center"
                        >
                            <LayoutDashboard className="mr-2" size={20} /> Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center"
                        >
                            <LogIn className="mr-2" size={20} /> Login / Sign Up
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content Area (Split Layout) */}
            <div className="relative z-20 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center h-full pointer-events-none">

                {/* Left Content (Same) */}
                <div className="w-full md:w-1/2 mb-12 md:mb-0 pointer-events-auto">
                    {/* ... (Hero content same) */}
                    {/* Placeholder for diff context matching - ensure I don't delete too much */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight mb-6"
                    >
                        Discover the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            World Together
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed shadow-sm bg-white/30 backdrop-blur-sm p-4 rounded-xl"
                    >
                        Explore shared journeys, visualize stunning destinations, and plan your next perfect adventure with AI.
                    </motion.p>

                    {/* Search Box */}
                    <div className="relative max-w-md bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-slate-100">
                        <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Where do you want to go?"
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                            Search
                        </button>
                    </div>
                </div>

                {/* Right Side (Floating Container) */}
                <div className="w-full md:w-1/2 relative h-[850px] pointer-events-auto">
                    <AnimatePresence>
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: 1,
                                    scale: item.scale,
                                    x: [item.x + "%", (item.x + 5) + "%", (item.x - 5) + "%", item.x + "%"],
                                    y: [item.y + "%", (item.y - 5) + "%", (item.y + 5) + "%", item.y + "%"],
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{
                                    x: { duration: item.duration, repeat: Infinity, ease: "easeInOut" },
                                    y: { duration: item.duration * 1.2, repeat: Infinity, ease: "easeInOut" },
                                    opacity: { duration: 0.5 },
                                    scale: { duration: 0.5 }
                                }}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    rotate: item.rotation,
                                    zIndex: 1
                                }}
                                whileHover={{ scale: 1.1, zIndex: 50, rotate: 0, transition: { duration: 0.2 } }}
                                className={item.type === 'photo' ? 'cursor-default' : 'cursor-pointer'}
                                onClick={() => handleItemClick(item)}
                            >
                                {item.type === 'photo' ? (
                                    // Polaroid Card
                                    <div className="bg-white p-3 shadow-2xl transform transition-transform duration-300 w-48 pb-6">
                                        <div className="aspect-square bg-slate-100 overflow-hidden mb-2 border border-slate-200">
                                            <img
                                                src={(item.data as Photo).image}
                                                alt="Memory"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-center font-caveat text-xl text-slate-800 leading-tight">
                                            {(item.data as Photo).caption || "Untitled"}
                                        </div>
                                    </div>
                                ) : (
                                    // Trip Card (Compact for Grid)
                                    <div className="bg-white rounded-xl shadow-2xl p-0 w-64 border border-slate-100 overflow-hidden">
                                        <div className="h-32 relative bg-slate-200">
                                            {getTripImage(item.data as Trip) ? (
                                                <img
                                                    src={getTripImage(item.data as Trip)!}
                                                    alt={(item.data as Trip).to}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <MapPin size={32} />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                                                {(item.data as Trip).totalDays} Day
                                            </div>
                                        </div>

                                        <div className="p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                                                    {(item.data as Trip).to}
                                                </h3>
                                            </div>
                                            <p className="text-slate-500 text-xs line-clamp-2 mb-2">
                                                {(item.data as Trip).summary}
                                            </p>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
                                                <span className="text-slate-400">
                                                    {(item.data as Trip).mode}
                                                </span>
                                                <span className="text-green-600 font-bold">
                                                    ₹{(item.data as Trip).totalCost?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {searchQuery && filteredItems.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl text-center shadow-xl">
                                <p className="text-slate-500 text-lg">No results found</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
