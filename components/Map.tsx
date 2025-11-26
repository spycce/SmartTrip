import React from 'react';

interface MapProps {
  from: string;
  to: string;
}

const MapComponent: React.FC<MapProps> = ({ from, to }) => {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 bg-slate-100 relative">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://maps.google.com/maps?saddr=${encodeURIComponent(from)}&daddr=${encodeURIComponent(to)}&output=embed`}
        title="Trip Route"
      ></iframe>
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 text-xs rounded shadow text-slate-500 pointer-events-none">
        Google Maps
      </div>
    </div>
  );
};

export default MapComponent;