import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTripPlan } from '../services/gemini';
import { createTrip } from '../services/api';
import { TravelMode, Trip, DayPlan } from '../types';
import { useNotification } from '../context/NotificationContext';
import {
  Loader2, Plane, Car, Train, Bus, MapPin, Calendar,
  ArrowLeft, ArrowRight, Save, RotateCcw, History
} from 'lucide-react';
import MapComponent from '../components/Map';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Helper for Timeline
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

      {/* Images Carousel / Grid */}
      {day.image_keywords && day.image_keywords.length > 0 && (
        <div className={`grid gap-1 h-48 shrink-0 relative w-full ${day.image_keywords.slice(0, 3).length === 1 ? 'grid-cols-1' : 'grid-cols-3'
          }`}>
          {day.image_keywords.slice(0, 3).map((keyword, idx) => (
            <img
              key={idx}
              src={`https://image.pollinations.ai/prompt/${encodeURIComponent(keyword)}?width=400&height=300&nologo=true`}
              alt={keyword}
              className={`w-full h-full object-cover ${day.image_keywords!.slice(0, 3).length === 2 && idx === 0 ? 'col-span-2' : 'col-span-1'
                }`}
              loading="lazy"
            />
          ))}
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

const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'review'>('form');

  // History State
  const [generatedPlans, setGeneratedPlans] = useState<Partial<Trip>[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(-1);

  const [formData, setFormData] = useState({
    from: '',
    to: '',
    startDate: '',
    endDate: '',
    mode: TravelMode.FLIGHT
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const plan = await generateTripPlan(
        formData.from,
        formData.to,
        formData.startDate,
        formData.endDate,
        formData.mode
      );

      const totalDays = calculateDays(formData.startDate, formData.endDate);
      const totalCost = plan.expenses?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

      const fullTripData = {
        ...formData,
        ...plan,
        totalDays,
        totalCost
      } as Partial<Trip>;

      // Update History
      const newHistory = [...generatedPlans, fullTripData];
      setGeneratedPlans(newHistory);
      setCurrentPlanIndex(newHistory.length - 1);

      setStep('review');
      notify('success', 'Itinerary generated successfully!');
    } catch (error) {
      console.error('Failed to create trip', error);
      notify('error', 'Failed to generate trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (currentPlanIndex < 0) return;
    setLoading(true);
    try {
      const tripToSave = generatedPlans[currentPlanIndex];
      const newTrip = await createTrip(tripToSave);
      notify('success', 'Trip saved successfully!');
      navigate(`/trips/${newTrip.id}`);
    } catch (error) {
      notify('error', 'Failed to save trip.');
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentPlanIndex > 0) {
      setCurrentPlanIndex(prev => prev - 1);
      notify('info', 'Showing previous draft');
    }
  };

  const handleReplan = () => {
    handleGenerate();
  };

  const currentPlan = generatedPlans[currentPlanIndex];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {step === 'form' ? 'Plan Your Next Journey' : 'Review Your Itinerary'}
        </h1>
        <p className="text-slate-500 mt-2">
          {step === 'form'
            ? 'Let our AI architect the perfect itinerary for you.'
            : `Draft ${currentPlanIndex + 1} of ${generatedPlans.length}`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600">
              <Plane className="animate-pulse" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Crafting your adventure...</h3>
          <p className="text-slate-500 mt-2">Analyzing routes, costs, and best spots.</p>
        </div>
      )}

      {/* Form Step */}
      {step === 'form' && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-3xl mx-auto">
          <form onSubmit={handleGenerate} className="p-8 space-y-8">
            {/* Form Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2">1</span>
                Route
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Origin</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="from"
                      required
                      value={formData.from}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. Pune"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="to"
                      required
                      value={formData.to}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. Gir National Park"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2">2</span>
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="date"
                      name="startDate"
                      required
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      type="date"
                      name="endDate"
                      required
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2">3</span>
                Mode of Travel
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { val: TravelMode.FLIGHT, icon: Plane, label: 'Flight' },
                  { val: TravelMode.CAR, icon: Car, label: 'Car' },
                  { val: TravelMode.TRAIN, icon: Train, label: 'Train' },
                  { val: TravelMode.BUS, icon: Bus, label: 'Bus' },
                ].map((m) => (
                  <div
                    key={m.val}
                    onClick={() => setFormData({ ...formData, mode: m.val })}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition-all ${formData.mode === m.val ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md ring-1 ring-blue-600' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                  >
                    <m.icon size={24} />
                    <span className="text-sm font-medium">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
            >
              <span>Generate Smart Itinerary</span>
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Review Step */}
      {step === 'review' && currentPlan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Action Bar */}
          <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-blue-100 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="font-semibold text-blue-900">Draft {currentPlanIndex + 1}</span>
              <span className="text-slate-300">|</span>
              <span>₹{currentPlan.totalCost?.toLocaleString()} est. cost</span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={handlePrevious}
                disabled={currentPlanIndex === 0}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <History size={18} className="mr-2" /> Previous
              </button>

              <button
                onClick={handleReplan}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <RotateCcw size={18} className="mr-2" /> Replan
              </button>

              <button
                onClick={handleAccept}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all font-semibold"
              >
                <Save size={18} className="mr-2" /> Accept
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <Calendar className="mr-3 text-blue-500" />
                  Trip Timeline
                </h2>
                <div className="relative">
                  {currentPlan.itinerary?.map((day) => (
                    <TimelineItem key={day.day} day={day} />
                  ))}
                </div>
              </div>
            </div>

            {/* Info Column */}
            <div className="space-y-6">
              {/* Map Preview */}
              <div className="bg-slate-100 p-1 rounded-2xl h-64 shadow-inner border border-slate-200">
                {currentPlan.from && currentPlan.to && (
                  <MapComponent from={currentPlan.from} to={currentPlan.to} />
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-bold text-lg mb-2 opacity-90">Trip Summary</h3>
                <p className="text-blue-100 leading-relaxed text-sm">
                  {currentPlan.summary}
                </p>
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm font-medium">
                  <span>{currentPlan.mode}</span>
                  <span>{currentPlan.totalDays} Days</span>
                </div>
              </div>

              {/* Expenses Preview */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Estimated Costs</h3>
                <div className="space-y-3">
                  {currentPlan.expenses?.map((exp, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-medium" style={{ color: COLORS[i % COLORS.length] }}>{exp.category}</span>
                      <span className="font-semibold">₹{exp.amount}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-green-600">₹{currentPlan.totalCost}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTrip;