import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Profile() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const fileInputRef = useRef();
  const router = useRouter();

  // Set default profile photo based on gender
  useEffect(() => {
    if (!profilePhotoUrl && gender) {
      setProfilePhotoUrl(gender === 'Male' ? '/male-avatar.png' : '/female-avatar.png');
    }
  }, [gender, profilePhotoUrl]);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('name, university, profile_photo, username, bio, gender')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setName(data.name || '');
        setUniversity(data.university || '');
        setProfilePhotoUrl(data.profile_photo || null);
        setUsername(data.username || '');
        setBio(data.bio || '');
        setGender(data.gender || '');
      }
    };

    fetchUserData();
  }, [router]);

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (!username) {
      setUsernameError('Username is required');
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
      setUsernameError('Username must be 3-15 characters, using letters, numbers, or underscores');
      setUsernameAvailable(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .neq('user_id', (await supabase.auth.getUser()).data.user?.id || '');

    if (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
      setUsernameAvailable(null);
      return;
    }

    if (data.length > 0) {
      setUsernameError('Username is already taken');
      setUsernameAvailable(false);
    } else {
      setUsernameError('');
      setUsernameAvailable(true);
    }
  };

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    setFormError('');
    checkUsernameAvailability(newUsername);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size must be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoUrl(URL.createObjectURL(file));
      setFormError('');
    }
  };

  const validateSlide = () => {
    setFormError('');
    if (currentSlide === 1 && (!name || !university)) {
      setFormError('Name and University are required');
      return false;
    }
    if (currentSlide === 2 && (!username || !usernameAvailable)) {
      setFormError('Please choose a valid, unique username');
      return false;
    }
    if (currentSlide === 3 && !gender) {
      setFormError('Gender is required');
      return false;
    }
    if (currentSlide === 4 && (!bio || bio.length > 150)) {
      setFormError('Bio is required and must be 150 characters or less');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateSlide()) {
      setCurrentSlide((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
    setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!name || !university || !username || !usernameAvailable || !bio || bio.length > 150 || !gender) {
      setFormError('Please complete all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      let photoUrl = profilePhotoUrl;
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('student-market-place-profiles')
          .upload(fileName, profilePhoto);

        if (uploadError) {
          throw new Error('Failed to upload profile photo');
        }

        const { data: urlData } = supabase.storage
          .from('student-market-place-profiles')
          .getPublicUrl(fileName);

        photoUrl = urlData.publicUrl;
      } else {
        // Use default avatar if no custom photo
        photoUrl = gender === 'Male' ? '/male-avatar.png' : '/female-avatar.png';
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name,
          university,
          profile_photo: photoUrl,
          username,
          bio,
          gender,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      setFormError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const slides = [
    {
      title: 'Profile Photo',
      subtitle: 'Add your photo',
      content: (
        <div className="text-center">
          <div className="relative group mx-auto w-fit">
            <img
              src={profilePhotoUrl || '/default-profile.png'}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute inset-0 bg-teal-500 bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
              disabled={loading}
            >
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <input
              id="profilePhoto"
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
    
        </div>
      ),
    },
    {
      title: 'Your Details',
      subtitle: 'Basic info',
      content: (
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-inter font-semibold text-gray-900">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="mt-1 w-full px-4 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-300 text-base font-inter"
              placeholder="Your full name"
              value={name}
              onChange={(e) => { setName(e.target.value); setFormError(''); }}
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="university" className="block text-sm font-inter font-semibold text-gray-900">
              University
            </label>
            <input
              id="university"
              type="text"
              className="mt-1 w-full px-4 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-300 text-base font-inter"
              placeholder="Your university"
              value={university}
              onChange={(e) => { setUniversity(e.target.value); setFormError(''); }}
              disabled={loading}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Username',
      subtitle: 'Pick a unique handle',
      content: (
        <div>
          <label htmlFor="username" className="block text-sm font-inter font-semibold text-gray-900">
            Username
          </label>
          <input
            id="username"
            type="text"
            className={`mt-1 w-full px-4 py-2.5 rounded-md border ${usernameError ? 'border-red-500' : 'border-gray-200'} bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-300 text-base font-inter`}
            placeholder="your_username"
            value={username}
            onChange={handleUsernameChange}
            disabled={loading}
          />
          {usernameError && (
            <p className="mt-1 text-sm text-red-500 font-inter">{usernameError}</p>
          )}
          {usernameAvailable === true && (
            <p className="mt-1 text-sm text-teal-500 font-inter">Username available!</p>
          )}
        </div>
      ),
    },
    {
      title: 'Gender',
      subtitle: 'Select your gender',
      content: (
        <div>
          <label htmlFor="gender" className="block text-sm font-inter font-semibold text-gray-900">
            Gender
          </label>
          <select
            id="gender"
            className="mt-1 w-full px-4 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-300 text-base font-inter"
            value={gender}
            onChange={(e) => { setGender(e.target.value); setFormError(''); }}
            disabled={loading}
          >
            <option value="" disabled>Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      ),
    },
    {
      title: 'Bio',
      subtitle: 'About your interests',
      content: (
        <div>
          <label htmlFor="bio" className="block text-sm font-inter font-semibold text-gray-900">
            Bio
          </label>
          <textarea
            id="bio"
            className="mt-1 w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-300 text-base font-inter"
            placeholder="E.g., Trading textbooks & tech, studying CS!"
            rows="4"
            value={bio}
            onChange={(e) => { setBio(e.target.value); setFormError(''); }}
            disabled={loading}
          />
          <p className="mt-1 text-xs font-inter text-gray-500 text-right">
            {bio.length}/150 characters
          </p>
        </div>
      ),
    },
{
  title: 'Review Profile',
  subtitle: 'Ready to trade?',
  content: (
    <div className="flex flex-col items-center px-4 py-6 space-y-6 bg-gradient-to-b from-white via-gray-50 to-white rounded-2xl shadow-lg">
      <img
        src={profilePhotoUrl || '/male-avatar.png'}
        alt="Profile"
        className="h-24 w-24 rounded-full object-cover border-4 border-indigo-300 shadow-md"
      />
      <div className="w-full max-w-md space-y-5 text-left">
        <p className="text-[17px] font-semibold text-gray-800">
          Name:
          <span className="ml-2 text-[16px] font-normal italic text-gray-600">
            {name || 'Not set'}
          </span>
        </p>
        <p className="text-[17px] font-semibold text-gray-800">
          University:
          <span className="ml-2 text-[16px] font-normal italic text-gray-600">
            {university || 'Not set'}
          </span>
        </p>
        <p className="text-[17px] font-semibold text-gray-800">
          Username:
          <span className="ml-2 text-[16px] font-normal italic text-gray-600">
            {username || 'Not set'}
          </span>
        </p>
        <p className="text-[17px] font-semibold text-gray-800">
          Gender:
          <span className="ml-2 text-[16px] font-normal italic text-gray-600">
            {gender || 'Not set'}
          </span>
        </p>
        <p className="text-[17px] font-semibold text-gray-800">
          Bio:
          <span className="ml-2 text-[16px] font-normal italic text-gray-600">
            {bio || 'Not set'}
          </span>
        </p>
      </div>
    </div>
  ),
}

  ];

  return (
    <>
      <Head>
        <title>Profile • Exchangezo</title>
        <meta name="description" content="Set up your Exchangezo profile to trade with students" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10 px-4">
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-md flex overflow-hidden">
          {/* Left Panel */}
          <div className="w-2/5 bg-orange-100 p-10 flex flex-col justify-center">
            <h1 className="text-4xl font-extrabold font-space-grotesk text-gray-900 tracking-wide">
              Join Exchangezo
            </h1>
            <p className="mt-4 text-base font-inter text-gray-700">
              Build your profile to trade textbooks, tech, and more with students on your campus. Connect, swap, and save!
            </p>
            <div className="mt-6 flex space-x-4">
              <svg className="h-8 w-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <svg className="h-8 w-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-3/5 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold font-space-grotesk text-gray-900 tracking-wide">
                {slides[currentSlide].title}
              </h2>
              <p className="text-sm font-inter text-gray-500 mt-1">
                {slides[currentSlide].subtitle}
              </p>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm font-inter text-center">
                {formError}
              </div>
            )}

            {/* Slide Content */}
            <div className="min-h-[280px] flex items-center justify-center">
              {slides[currentSlide].content}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center mt-4 space-x-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentSlide === 0 || loading}
                className={`text-sm font-inter font-semibold transition-all duration-300 ${
                  currentSlide === 0 || loading ? 'text-gray-400 cursor-not-allowed' : 'text-teal-500 hover:text-teal-600'
                }`}
              >
                Back
              </button>
              {currentSlide < slides.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className={`px-5 py-2 rounded-md bg-teal-500 text-white font-inter font-semibold text-sm hover:bg-teal-600 transition-all duration-300 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`px-5 py-2 rounded-md bg-teal-500 text-white font-inter font-semibold text-sm hover:bg-teal-600 transition-all duration-300 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </div>

            {/* Skip Link */}
            <div className="mt-4 text-center text-sm font-inter text-gray-600">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-teal-500 hover:text-teal-600 transition-all duration-300"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .font-space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
      `}</style>
    </>
  );
}