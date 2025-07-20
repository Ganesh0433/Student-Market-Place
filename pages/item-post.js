import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload as UploadIcon,
  Tag as TagIcon,
  DollarSign as DollarSignIcon,
  MapPin as MapPinIcon,
  ChevronRight,
  Check,
  Loader2 as LoaderIcon
} from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Anon Key is missing. Check environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PostItem() {
  const [form, setForm] = useState({
    category: '',
    name: '',
    description: '',
    price: '',
    condition: 'Like New',
    location: ''
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const steps = [
    { title: 'Details', icon: <TagIcon size={24} /> },
    { title: 'Photos', icon: <UploadIcon size={24} /> },
    { title: 'Pricing', icon: <DollarSignIcon size={24} /> },
    { title: 'Location', icon: <MapPinIcon size={24} /> }
  ];

  const categories = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Other'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  // Validation for each step
  const isStepValid = () => {
    if (currentStep === 0) return form.category && form.name && form.description;
    if (currentStep === 2) return form.price && form.condition;
    if (currentStep === 3) return form.location;
    return true;
  };

  const handleNext = () => {
    if (!isStepValid()) {
      alert('Please fill in all required fields.');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Submitting form:', form);
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/success');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input ref is not defined');
    }
  };

  // Debug state changes
  useEffect(() => {
    console.log(`Current step: ${currentStep}, Form state:`, form);
  }, [currentStep, form]);

  // Error boundary fallback
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-inter">
        <div className="bg-orange-50 rounded-2xl shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 font-inter relative overflow-hidden">
      <Head>
        <title>List New Item | Campus Marketplace</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Bubbles Animation */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-[-120px] rounded-full opacity-30"
            style={{
              left: `${20 + i * 15}%`,
              width: `${40 + i * 20}px`,
              height: `${40 + i * 20}px`,
              background: i % 2 === 0 ? 'radial-gradient(circle, rgba(255, 127, 80, 0.4), rgba(255, 127, 80, 0))' : 'radial-gradient(circle, rgba(45, 212, 191, 0.4), rgba(45, 212, 191, 0))',
              animation: `float ${10 + i * 1.5}s infinite ease-in-out ${i * 0.5}s`
            }}
          />
        ))}
        <style jsx global>{`
          @keyframes float {
            0% { transform: translateY(0) scale(1); opacity: 0.3; }
            50% { opacity: 0.5; }
            100% { transform: translateY(-120vh) scale(1.3); opacity: 0; }
          }
        `}</style>
      </div>

      <motion.div 
        className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md hover:shadow-lg w-full max-w-6xl overflow-hidden relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Create Your Listing</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-gray-200 pb-3">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                className="flex items-center gap-2"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.4, type: "spring", stiffness: 140 }}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${i <= currentStep ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i < currentStep ? <Check size={18} /> : step.icon}
                </div>
                <span className={`text-base font-semibold ${i <= currentStep ? "text-gray-900" : "text-gray-500"}`}>
                  {step.title}
                </span>
              </motion.div>
            ))}
          </div>

          <div className={currentStep === 0 ? "h-[340px] sm:h-[400px] overflow-hidden flex flex-col" : "max-h-[460px] sm:max-h-[520px] overflow-hidden"}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: currentStep > 0 ? 50 : -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: currentStep > 0 ? -50 : 50 }}
                transition={{ duration: 0.3, ease: "easeInOut", type: "spring", stiffness: 140 }}
                className="space-y-2 mt-4 bg-orange-50 rounded-xl p-4 sm:p-5"
              >
                {currentStep === 0 && (
                  <div className="space-y-2 flex-1">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-800">Category*</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map((cat) => (
                          <motion.button
                            key={cat}
                            type="button"
                            whileHover={{ scale: 1.05, backgroundColor: "#fef3c7" }}
                            whileTap={{ scale: 0.95 }}
                            className={`py-2.5 px-4 sm:px-5 rounded-lg border text-base sm:text-lg font-medium transition-colors ${form.category === cat ? "border-coral-500 bg-coral-50 text-coral-700 shadow-inner" : "border-gray-200 hover:border-coral-400"}`}
                            onClick={() => setForm({ ...form, category: cat })}
                          >
                            {cat}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-800">Item Name*</label>
                      <motion.input
                        type="text"
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-4 focus:ring-orange-200 focus:border-orange-400 text-gray-900 text-base sm:text-lg shadow-sm"
                        placeholder="e.g. Calculus Textbook 3rd Edition"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      />
                    </div>
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-800">Description*</label>
                      <motion.textarea
                        rows={3}
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-4 focus:ring-orange-200 focus:border-orange-400 text-gray-900 text-base sm:text-lg resize-none shadow-sm"
                        placeholder="Describe your item..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      />
                    </div>
                  </div>
                )}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:border-coral-400 transition-colors bg-coral-50 shadow-inner"
                      onClick={handleFileInputClick}
                    >
                      <UploadIcon className="mx-auto h-10 w-10 text-coral-600 mb-3" />
                      <p className="text-base sm:text-lg font-semibold text-gray-800">Drag & drop photos here</p>
                      <p className="text-base text-gray-500">or click to browse (max 5MB each)</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            console.log('Selected files:', Array.from(e.target.files).map(file => file.name));
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-800">Price*</label>
                      <div className="relative">
                        <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <motion.input
                          type="number"
                          className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-4 focus:ring-orange-200 focus:border-orange-400 text-gray-900 text-base sm:text-lg shadow-sm"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          min="0"
                          step="0.01"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-800">Condition*</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {conditions.map((cond) => (
                          <motion.button
                            key={cond}
                            type="button"
                            whileHover={{ scale: 1.05, backgroundColor: "#fef3c7" }}
                            whileTap={{ scale: 0.95 }}
                            className={`py-2.5 px-4 sm:px-5 rounded-lg border text-base sm:text-lg font-medium ${form.condition === cond ? "border-coral-500 bg-coral-50 text-coral-700 shadow-inner" : "border-gray-200 hover:border-coral-400"}`}
                            onClick={() => setForm({ ...form, condition: cond })}
                          >
                            {cond}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-800">Pickup Location*</label>
                      <motion.input
                        type="text"
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-4 focus:ring-orange-200 focus:border-orange-400 text-gray-900 text-base sm:text-lg shadow-sm"
                        placeholder="e.g. Dorm 3A, Library, Campus Center"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      />
                    </div>
                    <div className="p-3 sm:p-4 bg-coral-50 rounded-lg shadow-inner">
                      <h3 className="text-base sm:text-lg font-semibold text-coral-800">Ready to publish!</h3>
                      <p className="text-base sm:text-lg text-coral-700">Review your details before listing</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex justify-between">
              {currentStep > 0 ? (
                <motion.button
                  type="button"
                  className="px-6 sm:px-7 py-3 sm:py-3.5 text-gray-800 font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-base sm:text-lg shadow-md"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  whileHover={{ x: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back
                </motion.button>
              ) : (
                <div />
              )}
              <motion.button
                type="button"
                className={`px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold flex items-center gap-2 bg-orange-400 text-white shadow-md transition-colors text-base sm:text-lg ${isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:bg-orange-500"}`}
                onClick={handleNext}
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
              >
                {isSubmitting ? (
                  <>
                    <LoaderIcon className="h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {currentStep === steps.length - 1 ? "Publish Listing" : "Continue"}
                    <ChevronRight size={20} />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}