import React from 'react';
import { Plane } from 'lucide-react';

const FlightBooking: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Plane size={40} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Flight Booking</h2>
            <p className="mt-2">Search and book flights to anywhere in the world.</p>
            <span className="mt-4 px-4 py-2 bg-slate-100 rounded-full text-sm font-medium">Coming Soon</span>
        </div>
    );
};

export default FlightBooking;
