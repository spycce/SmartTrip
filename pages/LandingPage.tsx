import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPublicFeed } from '../services/api';
import { Trip, Photo } from '../types';
import { Search, MapPin, Camera, ArrowRight, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const [data, setData] = useState<{ trips: Trip[], photos: Photo[] }>({ trips: [], photos: [] });
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    useEffect(() => {
        getPublicFeed().then(setData).catch(console.error);
    }, []);

    // Floating animation variants
    const floatVariants = {
        initial: { y: 0 },
        animate: {
            y: [0, -20, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden font-sans text-slate-900">

            {/* Header / Nav */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center space-x-2 text-blue-600">
                    <MapPin size={28} />
                    <span className="text-2xl font-bold font-caveat">SmartTrip</span>
                </div>
                <div className="flex items-center space-x-4">
                    {isAuthenticated ? (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm hover:bg-white text-slate-700 font-medium transition-all"
                        >
                            <LayoutDashboard size={18} className="mr-2" />
                            Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center bg-blue-600 text-white px-6 py-2.5 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all font-medium"
                        >
                            <LogIn size={18} className="mr-2" />
                            Login / Sign Up
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center">

                {/* Left Content */}
                <div className="w-full md:w-1/2 z-20 mb-12 md:mb-0">
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
                        className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed"
                    >
                        Explore shared journeys, visualize stunning destinations, and plan your next perfect adventure with AI.
                    </motion.p>

                    {/* Search Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative max-w-md bg-white p-2 rounded-2xl shadow-xl shadow-blue-900/5 ring-1 ring-slate-100"
                    >
                        <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Where do you want to go?"
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                            Search
                        </button>
                    </motion.div>
                </div>

                {/* Right Collage (Floating Photos) */}
                <div className="w-full md:w-1/2 relative h-[500px]">
                    {data.photos.slice(0, 5).map((photo, i) => (
                        <motion.div
                            key={photo._id}
                            initial={{ opacity: 0, scale: 0.5, x: 100 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                x: 0,
                                y: [0, i % 2 === 0 ? -15 : 15, 0] // Floating effect
                            }}
                            transition={{
                                duration: 6,
                                delay: i * 0.1,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            }}
                            className={`absolute rounded-xl overflow-hidden shadow-2xl border-4 border-white transform rotate-${(i % 3) * 3} hover:z-50 hover:scale-110 transition-transform duration-300 cursor-pointer`}
                            style={{
                                width: i === 0 ? 240 : 160,
                                height: i === 0 ? 320 : 200,
                                top: i === 0 ? 40 : i === 1 ? -20 : 200,
                                left: i === 0 ? 100 : i === 1 ? 300 : i === 2 ? 0 : 250,
                                zIndex: 10 - i
                            }}
                        >
                            <img src={photo.image} alt={photo.caption} className="w-full h-full object-cover" />
                            {photo.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-xs truncate">
                                    {photo.caption}
                                </div>
                            )}
                        </motion.div>
                    ))}

                    {/* Fallback pattern/blobs if no photos */}
                    {data.photos.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <div className="w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob"></div>
                            <div className="w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000 ml-10"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Shared Trips Section */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <h2 className="text-3xl font-bold text-slate-900 mb-10 flex items-center">
                    <ArrowRight className="bg-blue-100 text-blue-600 rounded-full p-2 mr-3" size={40} />
                    Popular Itineraries
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {data.trips.map(trip => (
                        <div key={trip.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-slate-100 overflow-hidden group">
                            {/* Trip Preview - Using first itinerary image if available */}
                            <div className="h-48 bg-slate-200 relative overflow-hidden">
                                {trip.itinerary && trip.itinerary[0]?.imageUrl ? (
                                    <img src={trip.itinerary[0].imageUrl} alt={trip.to} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                        <MapPin size={40} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800">
                                    {trip.totalDays} Days
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{trip.to}</h3>
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{trip.mode}</span>
                                </div>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{trip.summary}</p>
                                <div className="flex items-center justify-between text-sm text-slate-400 mt-auto pt-4 border-t border-slate-50">
                                    <span>From {trip.from}</span>
                                    <span className="text-green-600 font-semibold">₹{trip.totalCost?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data.trips.length === 0 && (
                        <div className="col-span-3 text-center py-10 text-slate-400">
                            No shared trips yet. Be the first to share!
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default LandingPage;
