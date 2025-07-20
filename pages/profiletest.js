import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pufrzqbnaeaclfoudrot.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TestUpload() {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
      setImage(file);
      setMessage('');
    } else {
      setMessage('Select a valid image under 5MB');
      setImage(null);
      fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setMessage('No image selected');
      return;
    }

    setLoading(true);
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (!session?.user || authError) {
        throw new Error('Not authenticated');
      }
      console.log('User:', session.user.id, 'Role:', (await supabase.auth.getUser()).data.user?.role);

      const fileName = `test-${session.user.id}-${Date.now()}.${image.name.split('.').pop()}`;
      console.log('Uploading to item bucket:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('item')
        .upload(fileName, image, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      setMessage('Image uploaded successfully!');
      setImage(null);
      fileRef.current.value = '';
    } catch (error) {
      console.error('Test upload failed:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Test Image Upload</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileRef}
          className="block w-full text-sm"
        />
        <button
          type="submit"
          disabled={loading || !image}
          className="w-full bg-blue-500 text-white py-2 rounded disabled:bg-gray-300"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
        {message && <p className={message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}>{message}</p>}
      </form>
    </div>
  );
}