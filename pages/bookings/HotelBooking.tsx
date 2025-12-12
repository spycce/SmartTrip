import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Users, Star, Heart, ArrowRight, Loader2, X, Shield } from 'lucide-react';
import { searchHotels } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Hotel {
    id: string;
    name: string;
    location: string;
    primaryInfo?: string | null;
    rating: number;
    reviews: number | string;
    price: number;
    priceDisplay?: string | null;
    image: string;
    amenities: string[];
    isSponsored?: boolean;
    provider?: string;
    link?: string;
}

interface HotelDetails {
    title: string;
    rating: number;
    ratingCount: string | number;
    ranking: string;
    price: string;
    photos: string[];
    about: string;
    amenities: { title: string; items: { title: string }[] }[];
    address: string;
    reviews: { title: string; text: string; user: string; rating: number; date: string }[];
}

const HotelBooking: React.FC = () => {
    const [destination, setDestination] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');

    // Guest state
    const [openGuestSelector, setOpenGuestSelector] = useState(false);
    const guestSelectorRef = React.useRef<HTMLDivElement>(null);
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [rooms, setRooms] = useState(1);

    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState(false);
    const { notify } = useNotification();

    // Modal State
    const [selectedHotel, setSelectedHotel] = useState<HotelDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);


    // Close guest selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (guestSelectorRef.current && !guestSelectorRef.current.contains(event.target as Node)) {
                setOpenGuestSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCheckIn = e.target.value;
        setCheckIn(newCheckIn);

        // Auto-set checkout to next day if empty or invalid
        if (newCheckIn && (!checkOut || newCheckIn >= checkOut)) {
            const date = new Date(newCheckIn);
            date.setDate(date.getDate() + 1);
            setCheckOut(date.toISOString().split('T')[0]);
        }
    };

    const handleSearch = async () => {
        if (!destination) {
            notify('warning', 'Please enter a destination');
            return;
        }

        setLoading(true);
        setHotels([]);
        try {
            const results = await searchHotels(destination, checkIn, checkOut);
            if (Array.isArray(results)) {
                setHotels(results);
                if (results.length === 0) {
                    notify('info', 'No hotels found. Try a major city like "Mumbai" or "London".');
                }
            } else {
                setHotels([]);
                notify('error', 'Received invalid data from server.');
            }
        } catch (error) {
            console.error('Search error:', error);
            notify('error', 'Failed to fetch hotels. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDeal = async (hotelId: string) => {
        setModalLoading(true);
        setSelectedHotel(null);
        setIsModalOpen(true);

        try {
            const params = new URLSearchParams({
                hotelId,
                checkIn: checkIn || '',
                checkOut: checkOut || '',
                adults: (adults + children).toString(),
                rooms: rooms.toString()
            });

            const res = await fetch(`/api/hotels/details?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to fetch: ${res.status} ${res.statusText} - ${text}`);
            }
            const data = await res.json();
            console.log('Hotel Details:', data);
            setSelectedHotel(data);
        } catch (error) {
            console.error('Error fetching details:', error);
            // Notify with the specific error message if available
            notify('error', error instanceof Error ? error.message : 'Failed to fetch hotel details');
            setIsModalOpen(false);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="min-h-screen bg-slate-50 relative pb-20">
            {/* Hero Section */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop")' }}
                >
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center items-center text-white text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Stay</h1>
                    <p className="text-lg text-slate-200 mb-8 max-w-2xl">Discover top-rated hotels, resorts, and vacation rentals</p>
                </div>
            </div>

            {/* Glass Search Bar */}
            <div className="px-4 -mt-24 relative z-20 max-w-6xl mx-auto mb-12">
                <div className="bg-white rounded-2xl shadow-2xl p-4 flex flex-col lg:flex-row gap-4">
                    {/* Destination */}
                    <div className="flex-1 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2 transition-colors border border-transparent focus-within:border-emerald-500 focus-within:bg-white">
                        <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Where</label>
                        <div className="flex items-center">
                            <MapPin size={18} className="text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="City, hotel, or place"
                                className="w-full bg-transparent border-none outline-none text-slate-900 font-medium placeholder:text-slate-400"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Check-in/out */}
                    <div className="flex flex-[1.5] gap-2">
                        <div className="flex-1 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2 transition-colors border border-transparent focus-within:border-emerald-500 focus-within:bg-white cursor-pointer relative" onClick={() => (document.getElementById('checkInInput') as HTMLInputElement)?.showPicker?.()}>
                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Check-in</label>
                            <div className="flex items-center">
                                <Calendar size={18} className="text-slate-400 mr-2" />
                                <input
                                    id="checkInInput"
                                    type="date"
                                    className="w-full bg-transparent border-none outline-none text-slate-900 font-medium cursor-pointer"
                                    value={checkIn}
                                    onChange={handleCheckInChange}
                                />
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2 transition-colors border border-transparent focus-within:border-emerald-500 focus-within:bg-white cursor-pointer relative" onClick={() => (document.getElementById('checkOutInput') as HTMLInputElement)?.showPicker?.()}>
                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Check-out</label>
                            <div className="flex items-center">
                                <Calendar size={18} className="text-slate-400 mr-2" />
                                <input
                                    id="checkOutInput"
                                    type="date"
                                    className="w-full bg-transparent border-none outline-none text-slate-900 font-medium cursor-pointer"
                                    value={checkOut}
                                    onChange={(e) => setCheckOut(e.target.value)}
                                    min={checkIn}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Guests */}
                    <div className="flex-1 relative" ref={guestSelectorRef}>
                        <button
                            type="button"
                            className="w-full h-full bg-slate-50 hover:bg-slate-100 rounded-xl px-4 py-2 text-left transition-colors border border-transparent focus:border-emerald-500 focus:bg-white"
                            onClick={() => setOpenGuestSelector(!openGuestSelector)}
                        >
                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Guests</label>
                            <div className="flex items-center">
                                <Users size={18} className="text-slate-400 mr-2" />
                                <span className="font-medium text-slate-900">{adults + children} Guests · {rooms} Room</span>
                            </div>
                        </button>

                        {openGuestSelector && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl p-4 border border-slate-100 z-50 min-w-[280px]">
                                <div className="space-y-4">
                                    {[
                                        { label: 'Adults', val: adults, set: setAdults, min: 1 },
                                        { label: 'Children', val: children, set: setChildren, min: 0 },
                                        { label: 'Rooms', val: rooms, set: setRooms, min: 1 }
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <span className="font-medium text-slate-700">{item.label}</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                                                    onClick={() => item.set(Math.max(item.min, item.val - 1))}
                                                    disabled={item.val <= item.min}
                                                >-</button>
                                                <span className="w-6 text-center font-medium">{item.val}</span>
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 rounded-full border border-emerald-200 text-emerald-600 flex items-center justify-center hover:bg-emerald-50"
                                                    onClick={() => item.set(item.val + 1)}
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="w-full py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-colors"
                                        onClick={() => setOpenGuestSelector(false)}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-2 font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center min-w-[120px]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results Grid */}
            <div className="max-w-7xl mx-auto px-4">
                {/* Loader State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl h-96 animate-pulse p-4 shadow-sm border border-slate-100">
                                <div className="h-48 bg-slate-200 rounded-xl mb-4"></div>
                                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && hotels.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
                    >
                        {hotels.map((hotel, index) => (
                            <motion.div
                                key={hotel.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-slate-100 h-full flex flex-col"
                            >
                                <div className="relative h-60 overflow-hidden">
                                    <img
                                        src={hotel.image}
                                        alt={hotel.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?fit=crop&w=800&q=80';
                                        }}
                                    />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        {hotel.isSponsored && (
                                            <span className="bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded text-slate-500 border border-slate-200 shadow-sm">
                                                SPONSORED
                                            </span>
                                        )}
                                        <div className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-bold shadow-sm flex items-center gap-1">
                                            {hotel.rating} <Star size={10} fill="currentColor" />
                                        </div>
                                    </div>
                                    <button className="absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-white text-white hover:text-red-500 backdrop-blur-sm transition-all duration-200">
                                        <Heart size={18} />
                                    </button>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">{hotel.name}</h3>
                                    </div>

                                    <div className="flex items-center text-slate-500 text-sm mb-3">
                                        <MapPin size={14} className="mr-1 shrink-0" />
                                        <span className="truncate">{hotel.location}</span>
                                    </div>

                                    {hotel.primaryInfo && (
                                        <div className="mb-4">
                                            <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded-md border border-green-100">
                                                {hotel.primaryInfo}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                                        <span>{hotel.reviews} reviews</span>
                                        <span>•</span>
                                        <span>{hotel.provider}</span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                                        <div>
                                            {hotel.price > 0 ? (
                                                <>
                                                    <p className="text-xs text-slate-500 mb-0.5">Price per night</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-bold text-slate-900">₹{hotel.price.toLocaleString('en-IN')}</span>
                                                        {hotel.priceDisplay && <span className="text-xs text-slate-400 line-through"></span>}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-sm font-medium text-slate-500">View details for price</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleViewDeal(hotel.id)}
                                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-200 hover:shadow-emerald-200 flex items-center gap-2"
                                        >
                                            View Deal <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>


            {/* Hotel Details Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative border-b border-slate-100 p-4 flex items-center justify-between bg-white z-10">
                                <h2 className="text-xl font-bold text-slate-900 truncate pr-8">
                                    {modalLoading ? 'Loading Details...' : selectedHotel?.title || 'Hotel Details'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 p-6">
                                {modalLoading ? (
                                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                        <Loader2 size={48} className="text-emerald-600 animate-spin" />
                                        <p className="text-slate-500 font-medium">Fetching best rates & details...</p>
                                    </div>
                                ) : selectedHotel ? (
                                    <div className="space-y-8">
                                        {/* Image Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px] md:h-[400px]">
                                            <div className="h-full rounded-2xl overflow-hidden">
                                                <img
                                                    src={selectedHotel.photos[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                                                    alt="Main"
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 h-full">
                                                {selectedHotel.photos.slice(1, 5).map((photo, i) => (
                                                    <div key={i} className="rounded-xl overflow-hidden h-full">
                                                        <img
                                                            src={photo}
                                                            alt={`View ${i + 1}`}
                                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Header Info */}
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm flex items-center gap-1">
                                                        {selectedHotel.rating} <Star size={12} fill="currentColor" />
                                                    </div>
                                                    <span className="text-slate-500 text-sm font-medium">{selectedHotel.ratingCount} Reviews</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-600 text-sm font-medium">{selectedHotel.ranking}</span>
                                                </div>
                                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedHotel.title}</h1>
                                                <div className="flex items-center text-slate-500">
                                                    <MapPin size={16} className="mr-1 text-emerald-600" />
                                                    {selectedHotel.address}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500 mb-1">Price per night</p>
                                                    <p className="text-4xl font-bold text-slate-900">{selectedHotel.price}</p>
                                                </div>
                                                <button className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-200 flex items-center gap-2">
                                                    Book Now <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* About */}
                                        <div className="prose prose-slate max-w-none">
                                            <h3 className="text-xl font-bold text-slate-900 mb-3">About this property</h3>
                                            <div className="text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedHotel.about }} />
                                        </div>

                                        {/* Amenities */}
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-4">Popular Amenities</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {selectedHotel.amenities.slice(0, 8).flatMap(grp => grp.items).slice(0, 8).map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                                                            <Shield size={14} />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 decoration-slice">{typeof item === 'string' ? item : item.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Reviews */}
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-4">Guest Reviews</h3>
                                            <div className="space-y-4">
                                                {selectedHotel.reviews.slice(0, 3).map((review, i) => (
                                                    <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                                                    {review.user?.[0] || 'G'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{review.title}</p>
                                                                    <p className="text-xs text-slate-500">{review.user} • {review.date}</p>
                                                                </div>
                                                            </div>
                                                            <div className="bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1">
                                                                {review.rating} <Star size={10} fill="currentColor" />
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-600 text-sm leading-relaxed">{review.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                        <p>No details available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HotelBooking;
