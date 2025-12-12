import React, { useEffect, useState } from 'react';
import { fetchTrips, deleteTrip } from '../services/api';
import { Trip } from '../types';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, MapPin, Trash2, IndianRupee } from 'lucide-react';

import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from '../components/ConfirmationModal';

const Dashboard: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const { notify } = useNotification();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    const data = await fetchTrips();
    setTrips(data);
    setLoading(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTripToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (tripToDelete) {
      try {
        await deleteTrip(tripToDelete);
        notify('success', 'Trip deleted successfully');
        loadTrips();
      } catch (err) {
        notify('error', 'Failed to delete trip');
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your adventures...</div>;

  const getTripStatus = (start: string, end: string) => {
    const now = new Date();
    // Reset time to start of day for accurate comparison
    now.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) return { label: 'Upcoming', color: 'bg-blue-500 text-white' };
    if (now > endDate) return { label: 'Completed', color: 'bg-slate-500 text-white' };
    return { label: 'Ongoing', color: 'bg-emerald-500 text-white' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Trips</h1>
          <p className="text-slate-500 mt-2">Manage your upcoming adventures and past memories.</p>
        </div>
        <Link
          to="/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all flex items-center"
        >
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <MapPin size={32} />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">No trips planned yet</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Start exploring the world by creating your first AI-powered travel itinerary.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const bgImage = trip.itinerary && trip.itinerary[0]?.imageUrl;
            const status = getTripStatus(trip.startDate, trip.endDate);

            return (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-100 overflow-hidden transition-all hover:-translate-y-1"
              >
                <div
                  className={`h-40 relative p-6 flex flex-col justify-between ${!bgImage ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''}`}
                  style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  <div className={`absolute inset-0 transition-colors ${bgImage ? 'bg-black/40 group-hover:bg-black/50' : 'bg-black/10 group-hover:bg-black/0'}`}></div>
                  <div className="relative z-10 flex justify-between items-start text-white">
                    <div className="flex space-x-2">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/30">
                        {trip.mode}
                      </span>
                      <span className={`backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/10 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(e, trip.id)}
                      className="p-1.5 bg-white/20 hover:bg-red-500 rounded-full backdrop-blur-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="relative z-10 text-white">
                    <div className="flex items-center space-x-2 text-blue-100 text-sm mb-1">
                      <Calendar size={14} />
                      <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-2xl font-bold truncate drop-shadow-md">{trip.to}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-slate-500 text-sm">
                      <span className="font-medium text-slate-900">{trip.totalDays}</span>
                      <span className="ml-1">days</span>
                    </div>
                    <div className="flex items-center text-slate-900 font-bold">
                      <IndianRupee size={14} className="text-green-500 mr-1" />
                      {trip.totalCost.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4">{trip.summary}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    View Itinerary <ChevronRight size={16} className="ml-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Trip"
        message="Are you sure you want to delete this trip? This action cannot be undone."
      />
    </div>
  );
};

export default Dashboard;