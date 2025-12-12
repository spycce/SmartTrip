import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlbums } from '../services/api';
import { Camera, Calendar, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Album {
    tripId: string;
    title: string;
    startDate: string;
    photoCount: number;
    coverImage: string | null;
}

const GalleryAlbums = () => {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlbums();
    }, []);

    const loadAlbums = async () => {
        try {
            const data = await getAlbums();
            setAlbums(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 min-h-screen bg-slate-50">
            <div className="mb-12">
                <h1 className="text-4xl font-caveat font-bold text-slate-900 flex items-center mb-2">
                    <Camera className="mr-3 text-blue-600" size={32} />
                    My Trip Albums
                </h1>
                <p className="text-slate-500">All your adventures in one place</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-pulse text-slate-400">Loading albums...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {albums.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No albums found. Create a trip and upload photos!</p>
                        </div>
                    )}

                    {albums.map((album, index) => (
                        <motion.div
                            key={album.tripId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(`/trips/${album.tripId}/gallery`)}
                            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border border-slate-100"
                        >
                            {/* Cover Image Area */}
                            <div className="h-48 bg-slate-100 overflow-hidden relative">
                                {album.coverImage ? (
                                    <img
                                        src={album.coverImage}
                                        alt={album.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon size={48} className="mb-2 opacity-50" />
                                        <span className="text-xs">No photos yet</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                            </div>

                            {/* Info Area */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors">
                                    {album.title}
                                </h3>

                                <div className="flex items-center justify-between text-slate-500 text-sm">
                                    <div className="flex items-center">
                                        <Calendar size={14} className="mr-2" />
                                        {new Date(album.startDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center bg-slate-100 px-2 py-1 rounded-full">
                                        <Camera size={14} className="mr-1.5" />
                                        {album.photoCount} Photos
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
                                    View Album <ArrowRight size={16} className="ml-1" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GalleryAlbums;
