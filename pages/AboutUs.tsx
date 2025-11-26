import React from 'react';
import { Map, CheckCircle2, Users, Globe } from 'lucide-react';

const AboutUs: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                    <Map size={32} className="text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-slate-900">About SmartTrip Planner</h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    Revolutionizing travel planning with the power of AI. We turn your dream destinations into detailed, actionable itineraries in seconds.
                </p>
            </div>

            {/* Mission */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
                <p className="text-slate-600 leading-relaxed">
                    At SmartTrip, we believe that planning a trip should be as exciting as the journey itself.
                    Traditional travel planning involves hours of research, spreadsheet management, and uncertainty.
                    Our mission is to eliminate that stress by leveraging advanced Artificial Intelligence to curate
                    personalized travel experiences that fit your budget, timeline, and preferences perfectly.
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-green-600" size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Smart Itineraries</h3>
                    <p className="text-slate-500 text-sm">
                        Get day-by-day plans with optimized routes, activities, and time management.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                        <Users className="text-purple-600" size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Budget Friendly</h3>
                    <p className="text-slate-500 text-sm">
                        Detailed expense estimations to help you manage your travel budget effectively.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                        <Globe className="text-orange-600" size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Global Reach</h3>
                    <p className="text-slate-500 text-sm">
                        Plan trips to any destination worldwide with local insights and recommendations.
                    </p>
                </div>
            </div>

            {/* Team / Contact */}
            <div className="bg-blue-600 rounded-2xl p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to explore?</h2>
                <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                    Join thousands of travelers who are discovering the world smarter, faster, and better with SmartTrip Planner.
                </p>
                <div className="text-sm opacity-80">
                    Built with ❤️ by the SmartTrip Team
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
