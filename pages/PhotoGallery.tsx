import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTripPhotos, uploadPhoto, togglePhotoShare, deletePhoto, updatePhoto } from '../services/api';
import { Photo } from '../types';
import { Camera, Upload, Share2, Globe, Lock, Loader2, ArrowLeft, Trash2, Edit2, X, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const PhotoGallery = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCaption, setEditCaption] = useState('');
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
        formData.append('caption', '');
        formData.append('isShared', 'false');

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

    const handleDelete = async (photoId: string) => {
        if (!confirm("Are you sure you want to delete this memory?")) return;
        try {
            await deletePhoto(photoId);
            setPhotos(photos.filter(p => p._id !== photoId));
            notify('success', 'Photo deleted');
        } catch (error) {
            notify('error', 'Failed to delete photo');
        }
    };

    const startEditing = (photo: Photo) => {
        setEditingId(photo._id);
        setEditCaption(photo.caption || '');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditCaption('');
    };

    const saveCaption = async (photoId: string) => {
        try {
            const updated = await updatePhoto(photoId, editCaption);
            // Preserve the existing image data if the response doesn't include it (to avoid re-fetching heavy base64)
            setPhotos(photos.map(p => p._id === photoId ? { ...updated, image: updated.image || p.image } : p));
            setEditingId(null);
            notify('success', 'Caption updated');
        } catch (error) {
            notify('error', 'Failed to update caption');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 min-h-screen bg-slate-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-caveat font-bold text-slate-900 flex items-center">
                            Trip Memories
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 ml-1">Capture the moments that matter</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center"
                    >
                        {uploading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Upload className="mr-2" size={20} />}
                        Add Photo
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-slate-400" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence>
                        {photos.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
                                <Camera size={64} className="mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-caveat text-2xl">No photos yet. Start capturing memories!</p>
                            </div>
                        )}

                        {photos.map((photo, index) => (
                            <motion.div
                                key={photo._id}
                                layout
                                initial={{ opacity: 0, y: 20, rotate: (index % 2 === 0 ? -1 : 1) * Math.random() * 3 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white p-4 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative group"
                                style={{ transform: `rotate(${(index % 2 === 0 ? -2 : 2)}deg)` }}
                            >
                                {/* Polaroid Image Area */}
                                <div className="aspect-square bg-slate-100 overflow-hidden mb-4 relative">
                                    <img
                                        src={photo.image}
                                        alt="Trip memory"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />

                                    {/* Overlay Actions */}
                                    <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => handleShareToggle(photo)}
                                            className={`p-2 rounded-full shadow-md backdrop-blur-md transition-all ${photo.isShared ? 'bg-green-500 text-white' : 'bg-white/90 text-slate-600 hover:bg-white'}`}
                                            title={photo.isShared ? 'Shared publicly' : 'Private'}
                                        >
                                            {photo.isShared ? <Globe size={16} /> : <Lock size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(photo._id)}
                                            className="p-2 rounded-full bg-white/90 text-red-500 hover:bg-white hover:text-red-600 shadow-md backdrop-blur-md transition-colors"
                                            title="Delete photo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Caption Area */}
                                <div className="min-h-[3rem] flex items-start justify-between">
                                    {editingId === photo._id ? (
                                        <div className="flex-1 flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={editCaption}
                                                onChange={(e) => setEditCaption(e.target.value)}
                                                className="flex-1 border-b border-slate-300 focus:border-blue-500 outline-none px-1 py-1 text-sm font-handwriting"
                                                autoFocus
                                                placeholder="Add a caption..."
                                            />
                                            <button onClick={() => saveCaption(photo._id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1 rounded">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex-1 group/caption cursor-pointer" onClick={() => startEditing(photo)}>
                                            <p className={`font-caveat text-xl text-slate-700 leading-tight ${!photo.caption && 'text-slate-300 italic'}`}>
                                                {photo.caption || 'Add a caption...'}
                                            </p>
                                        </div>
                                    )}

                                    {!editingId && (
                                        <button
                                            onClick={() => startEditing(photo)}
                                            className="ml-2 text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default PhotoGallery;
