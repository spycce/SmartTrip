import React from 'react';
import { Car } from 'lucide-react';

const CabBooking: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <Car size={40} className="text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Cab Booking</h2>
            <p className="mt-2">Book cabs like Ola and Uber directly.</p>
            <span className="mt-4 px-4 py-2 bg-slate-100 rounded-full text-sm font-medium">Coming Soon</span>
        </div>
    );
};

export default CabBooking;
