import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTripPhotos, uploadPhoto, togglePhotoShare } from '../services/api';
import { Photo } from '../types';
import { Camera, Upload, Share2, Globe, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { motion } from 'framer-motion';

const PhotoGallery = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            loadPhotos();
        }
    }, [id]);

    const loadPhotos = async () => {
        try {
            const data = await getTripPhotos(id!);
            setPhotos(data);
        } catch (error) {
            console.error(error);
            notify('error', 'Failed to load photos');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!id) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', e.target.files[0]);
        formData.append('caption', ''); // Add caption input later if needed
        formData.append('isShared', 'false'); // Default private

        try {
            const newPhoto = await uploadPhoto(id, formData);
            setPhotos([newPhoto, ...photos]);
            notify('success', 'Photo uploaded!');
        } catch (error) {
            console.error(error);
            notify('error', 'Failed to upload photo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleShareToggle = async (photo: Photo) => {
        try {
            const res = await togglePhotoShare(photo._id);
            setPhotos(photos.map(p => p._id === photo._id ? { ...p, isShared: res.isShared } : p));
            notify('success', res.isShared ? 'Photo shared publicly' : 'Photo made private');
        } catch (error) {
            notify('error', 'Failed to update share status');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <Camera className="mr-3 text-blue-600" size={32} />
                        Trip Gallery
                    </h1>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-blue-600/20 flex items-center transition-all disabled:opacity-70"
                >
                    {uploading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Upload className="mr-2" size={20} />}
                    Upload Photo
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {photos.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Camera size={64} className="mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No photos yet. Start capturing memories!</p>
                        </div>
                    )}

                    {photos.map((photo) => (
                        <motion.div
                            key={photo._id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group relative"
                        >
                            <div className="aspect-[4/5] overflow-hidden bg-slate-100">
                                <img src={photo.image} alt="Trip memory" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </div>

                            <div className="absolute top-3 right-3">
                                <button
                                    onClick={() => handleShareToggle(photo)}
                                    className={`p-2 rounded-full backdrop-blur-sm shadow-sm transition-all ${photo.isShared ? 'bg-green-500 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`}
                                    title={photo.isShared ? 'Shared publicly' : 'Private'}
                                >
                                    {photo.isShared ? <Globe size={16} /> : <Lock size={16} />}
                                </button>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs truncate">
                                    {new Date(photo.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhotoGallery;
