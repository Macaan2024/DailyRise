import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Profile = () => {
  const navigate = useNavigate();
  const { userProfile, signOut, updateProfile, updatePassword } = useAuth();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState(null);
  
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    age: '',
    gender: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        firstname: userProfile.firstname || '',
        lastname: userProfile.lastname || '',
        age: userProfile.age || '',
        gender: userProfile.gender || '',
      });
    }
  }, [userProfile]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await updateProfile(profileData);
    
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    
    const { error } = await updatePassword(passwordData.currentPassword, passwordData.newPassword);
    
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (file.size > 2040 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const img = new Image();
          img.onload = async () => {
            // Compress image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            
            const sourceSize = Math.min(img.width, img.height);
            const sx = (img.width - sourceSize) / 2;
            const sy = (img.height - sourceSize) / 2;
            
            ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
            setImagePreview(compressedBase64);
            setMessage({ type: '', text: '' });
          };
          img.onerror = () => {
            setMessage({ type: 'error', text: 'Invalid image file' });
          };
          img.src = reader.result;
        } catch (error) {
          console.error('Compression error:', error);
          setMessage({ type: 'error', text: 'Failed to process image' });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    }
  };

  const handleImageConfirm = async () => {
    if (!imagePreview) return;

    setLoading(true);
    const { error } = await updateProfile({ image: imagePreview });
    setLoading(false);

    if (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } else {
      setMessage({ type: 'success', text: 'Profile photo updated!' });
      setImagePreview(null);
    }
  };

  const handleImageCancel = () => {
    setImagePreview(null);
    setMessage({ type: '', text: '' });
    fileInputRef.current.value = '';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Layout>
      <Header title="Profile" showProfile={false} showBack={true} />
      
      <div className="px-4 py-4 pb-32">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary overflow-hidden flex items-center justify-center">
              {userProfile?.image ? (
                <img 
                  src={userProfile.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-medium">
                  {userProfile?.firstname?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <h2 className="text-heading font-poppins mt-3">
            {userProfile?.firstname} {userProfile?.lastname}
          </h2>
          <p className="text-body text-gray-500">{userProfile?.email}</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 rounded-lg text-body font-medium transition-all ${
              activeTab === 'profile' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 rounded-lg text-body font-medium transition-all ${
              activeTab === 'password' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Password
          </button>
        </div>

        {imagePreview && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-body text-blue-600 mb-3 font-medium">Preview your photo:</p>
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleImageConfirm}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-body font-medium"
              >
                {loading ? 'Uploading...' : 'Confirm & Upload'}
              </button>
              <button
                type="button"
                onClick={handleImageCancel}
                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-body font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-body ${
            message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message.text}
          </div>
        )}

        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-body text-gray-600 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstname"
                  value={profileData.firstname}
                  onChange={handleProfileChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-body text-gray-600 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  value={profileData.lastname}
                  onChange={handleProfileChange}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-body text-gray-600 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={profileData.age}
                onChange={handleProfileChange}
                className="input-field"
                placeholder="Enter your age"
              />
            </div>

            <div>
              <label className="block text-body text-gray-600 mb-1">Gender</label>
              <select
                name="gender"
                value={profileData.gender}
                onChange={handleProfileChange}
                className="input-field"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-body text-gray-600 mb-1">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="input-field"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-body text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="input-field"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-body text-gray-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="input-field"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-lg bg-red-50 text-red-500 text-body font-medium hover:bg-red-100 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
