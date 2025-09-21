"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Save, 
  X, 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Gamepad2,
  UserIcon,
  Upload,
  Camera,
  Link,
  Zap,
  Star,
  Activity,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { User, UserEdit } from '@/types';
import NextImage from "next/image";
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from "@/components/Spinner";
import React from "react";
import { use } from "react";

interface ProfileProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: ProfileProps) {
  const { username } = use(params);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserEdit>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadType, setUploadType] = useState<'avatar' | 'banner' | null>(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/user/${username}`);
        const userData = response.data;
        setProfileUser(userData);
        if (isOwnProfile) {
          setEditForm({
            username: userData.username,
            email: userData.email,
            display_name: userData.display_name || '',
            avatar_url: userData.avatar_url || '',
            banner_url: userData.banner_url || '',
            bio: userData.bio || ''
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, isOwnProfile]);

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const imageUrl = response.data.url;
      
      if (type === 'avatar') {
        setEditForm(prev => ({ ...prev, avatar_url: imageUrl }));
      } else {
        setEditForm(prev => ({ ...prev, banner_url: imageUrl }));
      }
      
      setShowUploadOptions(false);
      setUploadType(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = (type: 'avatar' | 'banner') => {
    if (!urlInput.trim()) return;
    
    if (type === 'avatar') {
      setEditForm(prev => ({ ...prev, avatar_url: urlInput }));
    } else {
      setEditForm(prev => ({ ...prev, banner_url: urlInput }));
    }
    
    setUrlInput('');
    setShowUploadOptions(false);
    setUploadType(null);
  };

  const openUploadOptions = (type: 'avatar' | 'banner') => {
    setUploadType(type);
    setShowUploadOptions(true);
    setUploadMode('file');
    setUrlInput('');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowUploadOptions(false);
    setUploadType(null);
    if (profileUser) {
      setEditForm({
        username: profileUser.username,
        email: profileUser.email,
        display_name: profileUser.display_name || '',
        avatar_url: profileUser.avatar_url || '',
        banner_url: profileUser.banner_url || '',
        bio: profileUser.bio || ''
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.post(`/auth/edit`, editForm);
      const updatedUser = response.data;
      setProfileUser(updatedUser);
      setIsEditing(false);
      setShowUploadOptions(false);
      setUploadType(null);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRelative = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950 flex items-center justify-center">
        <Spinner  />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon size={32} className="text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">The user @{username} could not be found.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadType) {
            handleFileUpload(file, uploadType);
          }
        }}
        className="hidden"
      />

      {/* Banner Section */}
      <div className="relative overflow-hidden">
        <motion.div 
          className="h-48 sm:h-64 md:h-80 xl:h-96 relative"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Banner Background */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20"
            style={{
              backgroundImage: (editForm.banner_url || profileUser.banner_url) 
                ? `linear-gradient(135deg, rgba(52, 211, 153, 0.3), rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3)), url(${editForm.banner_url || profileUser.banner_url})` 
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'overlay'
            }}
          />
          
          {/* Animated overlay patterns */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          
          {/* Glass morphism overlay for editing */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openUploadOptions('banner')}
                className="flex items-center space-x-3 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-2xl font-medium transition-all hover:bg-white/30 shadow-xl"
              >
                <Camera size={20} />
                <span>Change Banner</span>
              </motion.button>
            </motion.div>
          )}

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  delay: i * 2,
                }}
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${20 + i * 10}%`,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Profile Content */}
        <div className="relative px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col xl:flex-row xl:items-end xl:space-x-8 space-y-6 xl:space-y-0">
              {/* Avatar Section */}
              <motion.div
                className="relative -mt-16 sm:-mt-20 md:-mt-24 flex justify-center xl:justify-start"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full p-1 bg-gradient-to-tr from-primary-500 via-secondary-500 to-accent-500 shadow-2xl">
                    <div className="w-full h-full rounded-full border-4 border-surfacel-500 dark:border-surfaced-500 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                      {(editForm.avatar_url || profileUser.avatar_url) ? (
                        <NextImage 
                          src={(editForm.avatar_url || profileUser.avatar_url) as string} 
                          alt={profileUser.display_name || profileUser.username}
                          width={192}
                          height={192}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          unoptimized
                        />
                      ) : (
                        <UserIcon size={48} className="text-gray-400" />
                      )}
                      
                      {/* Status indicator */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-surfacel-500 dark:border-surfaced-500 flex items-center justify-center ${
                          profileUser.in_game 
                            ? 'bg-red-500' 
                            : 'bg-green-500'
                        }`}
                      >
                        {profileUser.in_game ? (
                          <Gamepad2 size={14} className="text-white" />
                        ) : (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Avatar edit overlay */}
                  {isEditing && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openUploadOptions('avatar')}
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-medium transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <Camera size={20} />
                        <span className="hidden sm:inline">Change</span>
                      </div>
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* User Info */}
              <motion.div 
                className="flex-1 text-center xl:text-left space-y-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-center xl:justify-start space-x-3 flex-wrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.display_name || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="Display Name"
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-surfacel-500 dark:bg-surfaced-500 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                        {profileUser.display_name || profileUser.username}
                      </h1>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      {profileUser.is_verified && (
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Award className="text-blue-500" size={28} />
                        </motion.div>
                      )}
                      {profileUser.current_streak > 5 && (
                        <motion.div
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Zap className="text-yellow-500" size={24} />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                    @{profileUser.username}
                  </div>
                </div>

                {/* Bio */}
                <div className="max-w-3xl">
                  {isEditing ? (
                    <textarea
                      value={editForm.bio || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell everyone about yourself..."
                      rows={3}
                      className="w-full bg-surfacel-500 dark:bg-surfaced-500 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all text-lg"
                    />
                  ) : (
                    profileUser.bio && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                      >
                        {profileUser.bio}
                      </motion.p>
                    )
                  )}
                </div>

                {/* Meta info */}
                <motion.div 
                  className="flex flex-wrap items-center justify-center xl:justify-start gap-6 text-sm text-gray-500 dark:text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Joined {formatDate(profileUser.created_at)}</span>
                  </div>
                  {profileUser.last_login && (
                    <div className="flex items-center space-x-2">
                      <Clock size={16} />
                      <span>Active {formatDateRelative(profileUser.last_login)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Activity size={16} />
                    <span className={`font-medium ${
                      profileUser.in_game 
                        ? 'text-red-500' 
                        : 'text-green-500'
                    }`}>
                      {profileUser.in_game ? 'In Game' : 'Online'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <motion.div 
                  className="flex justify-center xl:justify-end space-x-3"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  {isEditing ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                      >
                        <Save size={18} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        <X size={18} />
                        <span>Cancel</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEdit}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      <Edit3 size={18} />
                      <span>Edit Profile</span>
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Options Modal */}
      <AnimatePresence>
        {showUploadOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploadOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surfacel-500 dark:bg-surfaced-500 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Update {uploadType === 'avatar' ? 'Profile Picture' : 'Banner'}
              </h3>
              
              {/* Mode Selection */}
              <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    uploadMode === 'file'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Upload size={16} className="inline mr-2" />
                  Upload File
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    uploadMode === 'url'
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Link size={16} className="inline mr-2" />
                  From URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors disabled:opacity-50"
                  >
                    <div className="text-center">
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {uploading ? 'Uploading...' : 'Click to select image'}
                      </p>
                    </div>
                    {uploading && <Spinner small={true} className="mt-2" />}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter image URL..."
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surfacel-500 dark:bg-surfaced-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => uploadType && handleUrlSubmit(uploadType)}
                    disabled={!urlInput.trim()}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors"
                  >
                    Set Image
                  </button>
                </motion.div>
              )}
              
              <button
                onClick={() => setShowUploadOptions(false)}
                className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center"
          >
            Gaming Statistics
          </motion.h2>
          
          {/* Primary Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[
              { 
                icon: Gamepad2, 
                label: 'Games Played', 
                value: profileUser.games_played.toLocaleString(),
                color: 'primary',
                gradient: 'from-primary-500 to-emerald-500'
              },
              { 
                icon: Trophy, 
                label: 'Games Won', 
                value: profileUser.games_won.toLocaleString(),
                color: 'green',
                gradient: 'from-green-500 to-emerald-500'
              },
              { 
                icon: Target, 
                label: 'Games Lost', 
                value: profileUser.games_lose.toLocaleString(),
                color: 'red',
                gradient: 'from-red-500 to-orange-500'
              },
              { 
                icon: TrendingUp, 
                label: 'Win Rate', 
                value: `${profileUser.win_rate.toFixed(1)}%`,
                color: 'blue',
                gradient: 'from-blue-500 to-secondary-500'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="bg-surfacel-500 dark:bg-surfaced-500 p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                        <stat.icon size={20} />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {[
              { 
                icon: Award, 
                label: 'Best Streak', 
                value: profileUser.best_streak,
                gradient: 'from-purple-500 to-accent-500'
              },
              { 
                icon: Star, 
                label: 'Total Score', 
                value: profileUser.total_score.toLocaleString(),
                gradient: 'from-orange-500 to-red-500'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="bg-surfacel-500 dark:bg-surfaced-500 p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                        <stat.icon size={20} />
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detailed Performance Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Current Performance */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="bg-surfacel-500 dark:bg-surfaced-500 p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg">
                      <Activity size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Performance</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Current Streak</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{profileUser.current_streak}</span>
                        {profileUser.current_streak > 3 && <Zap size={16} className="text-yellow-500" />}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Average Score</span>
                      <span className="font-bold text-gray-900 dark:text-white text-lg">{profileUser.average_score.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Game Status</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          profileUser.in_game ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                        }`} />
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          profileUser.in_game 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        }`}>
                          {profileUser.in_game ? 'In Game' : 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Account Information */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="bg-surfacel-500 dark:bg-surfaced-500 p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-secondary-500 to-accent-500 text-white shadow-lg">
                      <Users size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Details</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Member Since</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatDate(profileUser.created_at)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Account Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        profileUser.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                      }`}>
                        {profileUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Verification</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          profileUser.is_verified 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                        }`}>
                          {profileUser.is_verified ? 'Verified' : 'Unverified'}
                        </span>
                        {profileUser.is_verified && <CheckCircle size={16} className="text-blue-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Achievement Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              whileHover={{ y: -5 }}
              className="group lg:col-span-2 xl:col-span-1"
            >
              <div className="bg-surfacel-500 dark:bg-surfaced-500 p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 text-white shadow-lg">
                      <Trophy size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Achievements</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Win Rate Achievement */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className={`p-2 rounded-lg ${
                        profileUser.win_rate >= 70 ? 'bg-green-100 dark:bg-green-900/30' :
                        profileUser.win_rate >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Trophy size={16} className={`${
                          profileUser.win_rate >= 70 ? 'text-green-600' :
                          profileUser.win_rate >= 50 ? 'text-yellow-600' :
                          'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {profileUser.win_rate >= 70 ? 'Master Player' :
                           profileUser.win_rate >= 50 ? 'Skilled Player' :
                           'Learning Player'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {profileUser.win_rate.toFixed(1)}% win rate
                        </div>
                      </div>
                    </div>

                    {/* Streak Achievement */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className={`p-2 rounded-lg ${
                        profileUser.best_streak >= 10 ? 'bg-purple-100 dark:bg-purple-900/30' :
                        profileUser.best_streak >= 5 ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Zap size={16} className={`${
                          profileUser.best_streak >= 10 ? 'text-purple-600' :
                          profileUser.best_streak >= 5 ? 'text-blue-600' :
                          'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {profileUser.best_streak >= 10 ? 'Unstoppable Force' :
                           profileUser.best_streak >= 5 ? 'Hot Streak' :
                           'Getting Started'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {profileUser.best_streak} game streak
                        </div>
                      </div>
                    </div>

                    {/* Games Played Achievement */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className={`p-2 rounded-lg ${
                        profileUser.games_played >= 100 ? 'bg-orange-100 dark:bg-orange-900/30' :
                        profileUser.games_played >= 50 ? 'bg-green-100 dark:bg-green-900/30' :
                        'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Gamepad2 size={16} className={`${
                          profileUser.games_played >= 100 ? 'text-orange-600' :
                          profileUser.games_played >= 50 ? 'text-green-600' :
                          'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {profileUser.games_played >= 100 ? 'Veteran Player' :
                           profileUser.games_played >= 50 ? 'Regular Player' :
                           'Newcomer'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {profileUser.games_played} games played
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}