import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTrips } from '../services/api';
import { Trip, DayPlan } from '../types';
import MapComponent from '../components/Map';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowLeft, Calendar, MapPin, IndianRupee, CheckCircle2, Plane, Bus, Train, Car } from 'lucide-react';
import ReviewSection from '../components/ReviewSection';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Reusing the Attractive Timeline Component
// Reusing the Attractive Timeline Component
const TimelineItem = ({ day }: { day: DayPlan }) => (
    <div className="relative pl-8 sm:pl-32 py-8 group">
        {/* Day Label */}
        <div className="font-caveat font-bold text-3xl text-blue-600 mb-2 sm:mb-0 sm:absolute sm:left-0 sm:w-24 sm:text-right sm:top-8">
            Day {day.day}
        </div>

        {/* Line & Dot */}
        <div className="hidden sm:block absolute left-[7.5rem] top-0 bottom-0 w-px bg-slate-200 ml-[0.5rem] -translate-x-1/2 group-last:bottom-auto group-last:h-8"></div>
        <div className="absolute left-2 sm:left-[7.5rem] top-9 w-4 h-4 bg-blue-600 border-4 border-white rounded-full shadow-sm sm:ml-[0.5rem] -translate-x-1/2 z-10"></div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow sm:ml-8 flex flex-col">

            {/* Images - Prefer static loaded URL, fall back to Placeholder */}
            {day.imageUrl ? (
                <div className="h-48 w-full overflow-hidden relative group">
                    <img
                        src={day.imageUrl}
                        alt={day.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-sm font-medium">{day.title}</span>
                    </div>
                </div>
            ) : (
                <div className="h-48 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50 opacity-50 patterned-bg"></div>
                    <MapPin size={48} className="mb-2 text-slate-300 group-hover:text-blue-200 transition-colors" />
                    <span className="text-sm font-medium relative z-10">Explore {day.title}</span>
                </div>
            )}

            <div className="p-6 bg-white relative z-10">
                <h4 className="text-2xl font-bold text-slate-900 mb-2">{day.title}</h4>

                {/* Stats Row */}
                {(day.distance || day.travelTime) && (
                    <div className="flex items-center space-x-4 text-sm font-medium text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg inline-flex">
                        {day.distance && <span>📍 Distance: {day.distance}</span>}
                        {day.distance && day.travelTime && <span>•</span>}
                        {day.travelTime && <span>⏱️ Drive Time: {day.travelTime}</span>}
                    </div>
                )}

                {day.description && (
                    <p className="text-slate-600 mb-4 leading-relaxed">{day.description}</p>
                )}

                {/* Route */}
                {day.route && (
                    <div className="mb-6">
                        <h5 className="font-bold text-slate-900 text-sm mb-1">Route</h5>
                        <p className="text-slate-600 text-sm">{day.route}</p>
                    </div>
                )}

                {/* Sections (Suggested Stops, etc) */}
                {day.sections && day.sections.map((section, idx) => (
                    <div key={idx} className="mb-4 last:mb-0">
                        <h5 className="font-bold text-slate-900 text-base mb-2">{section.title}</h5>
                        <ul className="space-y-2">
                            {section.items.map((item, i) => (
                                <li key={i} className="flex items-start text-slate-600 text-sm">
                                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {/* Fallback Activities if no sections */}
                {(!day.sections || day.sections.length === 0) && day.activities && (
                    <ul className="space-y-2 mt-4">
                        {day.activities.map((act, idx) => (
                            <li key={idx} className="flex items-start text-slate-600">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                                <span>{act}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    </div>
);

const TripDetails: React.FC = () => {
    const { id } = useParams();
    const [trip, setTrip] = useState<Trip | null>(null);

    useEffect(() => {
        const loadTrip = async () => {
            const trips = await fetchTrips();
            const found = trips.find(t => t.id === id);
            setTrip(found || null);
        };
        loadTrip();
    }, [id]);

    if (!trip) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/" className="text-slate-500 hover:text-blue-600 flex items-center mb-2 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        {trip.from} to {trip.to} <span className="text-slate-300 mx-3">/</span> <span className="text-slate-500 text-xl font-medium">By {trip.mode}</span>
                    </h1>
                </div>
                <div className="flex items-center space-x-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-4 border-r border-slate-200">
                        <div className="text-xs text-slate-500 uppercase font-semibold">Total Cost</div>
                        <div className="text-lg font-bold text-green-600">₹{trip.totalCost.toLocaleString()}</div>
                    </div>
                    <div className="px-4">
                        <div className="text-xs text-slate-500 uppercase font-semibold">Duration</div>
                        <div className="text-lg font-bold text-slate-900">{trip.totalDays} Days</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Itinerary */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Map Section */}
                    <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 h-80 z-0 relative">
                        {trip.from && trip.to && (
                            <MapComponent from={trip.from} to={trip.to} />
                        )}
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                        <h3 className="text-blue-800 font-semibold mb-2 flex items-center">
                            <CheckCircle2 size={18} className="mr-2" /> AI Summary
                        </h3>
                        <p className="text-slate-700 leading-relaxed">{trip.summary}</p>
                    </div>

                    {/* Transport Hubs Card */}
                    {trip.transportHubs && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <span className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-2">
                                    <MapPin size={20} />
                                </span>
                                Transportation Hubs
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {trip.transportHubs.airport && (
                                    <div className="flex items-start p-3 bg-slate-50 rounded-xl">
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500 mr-3">
                                            <Plane size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase">Airport</div>
                                            <div className="font-medium text-slate-900 text-sm">{trip.transportHubs.airport.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">{trip.transportHubs.airport.address}</div>
                                        </div>
                                    </div>
                                )}
                                {trip.transportHubs.railwayStation && (
                                    <div className="flex items-start p-3 bg-slate-50 rounded-xl">
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-orange-500 mr-3">
                                            <Train size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase">Railway Station</div>
                                            <div className="font-medium text-slate-900 text-sm">{trip.transportHubs.railwayStation.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">{trip.transportHubs.railwayStation.address}</div>
                                        </div>
                                    </div>
                                )}
                                {trip.transportHubs.busStand && (
                                    <div className="flex items-start p-3 bg-slate-50 rounded-xl">
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-green-500 mr-3">
                                            <Bus size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase">Bus Stand</div>
                                            <div className="font-medium text-slate-900 text-sm">{trip.transportHubs.busStand.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">{trip.transportHubs.busStand.address}</div>
                                        </div>
                                    </div>
                                )}
                                {trip.transportHubs.taxiStand && (
                                    <div className="flex items-start p-3 bg-slate-50 rounded-xl">
                                        <div className="bg-white p-2 rounded-lg shadow-sm text-yellow-500 mr-3">
                                            <Car size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500 uppercase">Taxi Stand</div>
                                            <div className="font-medium text-slate-900 text-sm">{trip.transportHubs.taxiStand.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">{trip.transportHubs.taxiStand.address}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Day-by-Day */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                            <Calendar className="mr-3 text-blue-500" />
                            Itinerary
                        </h3>
                        <div className="relative">
                            {trip.itinerary.map((day) => (
                                <TimelineItem key={day.day} day={day} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Info & Expenses */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                            <IndianRupee size={20} className="mr-2 text-green-500" />
                            Estimated Expenses
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={trip.expenses as any}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="amount"
                                    >
                                        {trip.expenses.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 space-y-3">
                            {trip.expenses.map((exp, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    <span className="font-medium" style={{ color: COLORS[idx % COLORS.length] }}>{exp.category}</span>
                                    <span className="font-semibold text-slate-900">₹{exp.amount}</span>
                                </div>
                            ))}
                            <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span className="text-green-600">₹{trip.totalCost}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold mb-2">Trip Details</h3>
                            <div className="space-y-4 text-sm text-slate-300">
                                <div className="flex items-center">
                                    <MapPin size={16} className="mr-3 text-blue-400" />
                                    <span>From: {trip.from}</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin size={16} className="mr-3 text-red-400" />
                                    <span>To: {trip.to}</span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar size={16} className="mr-3 text-yellow-400" />
                                    <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative blob */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600 blur-3xl opacity-50 rounded-full"></div>
                    </div>

                    {/* Review Section */}
                    {trip && (
                        <ReviewSection
                            tripId={trip.id}
                            reviews={trip.reviews}
                            onReviewAdded={(newReviews) => setTrip(prev => prev ? { ...prev, reviews: newReviews } : null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TripDetails;