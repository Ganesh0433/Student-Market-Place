import React, { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload as UploadIcon,
  Tag as TagIcon,
  DollarSign as DollarSignIcon,
  MapPin as MapPinIcon,
  ChevronRight,
  Check,
  Loader2 as LoaderIcon,
} from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
}
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ItemPosting() {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    condition: "",
    conditionNotes: "",
    price: "",
    description: "",
    tags: "",
    hostel: "",
    deliveryOption: "",
    isDigital: false,
    isFree: false,
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const steps = ["Item Details", "Delivery & Location", "Additional Options"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    const newErrors = {};
    if (currentStep === 0) {
      if (!formData.itemName && name !== "itemName") newErrors.itemName = "Item name is required";
      if (!formData.category && name !== "category") newErrors.category = "Category is required";
      if (!formData.condition && name !== "condition") newErrors.condition = "Condition is required";
      if (!formData.price && !formData.isFree && name !== "price" && name !== "isFree") newErrors.price = "Price is required unless free";
      if (!formData.description && name !== "description") newErrors.description = "Description is required";
    } else if (currentStep === 1) {
      if (!formData.deliveryOption && name !== "deliveryOption") newErrors.deliveryOption = "Delivery option is required";
    }
    setErrors(newErrors);
    console.log("Current errors after input change:", newErrors);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, images: "Maximum 5 images allowed" }));
      console.log("Errors after image upload:", { ...errors, images: "Maximum 5 images allowed" });
      return;
    }
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...imageUrls]);
    setErrors((prev) => ({ ...prev, images: "" }));
    validateStep(currentStep);
    console.log("Errors after image upload:", errors);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, images: "" }));
    validateStep(currentStep);
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input ref is not defined");
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.itemName) newErrors.itemName = "Item name is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (!formData.condition) newErrors.condition = "Condition is required";
      if (!formData.price && !formData.isFree) newErrors.price = "Price is required unless free";
      if (!formData.description) newErrors.description = "Description is required";
    } else if (step === 1) {
      if (!formData.deliveryOption) newErrors.deliveryOption = "Delivery option is required";
    }
    setErrors(newErrors);
    console.log("Validation errors on Next click:", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const uploadImagesToSupabase = async (files) => {
    const uploadedUrls = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${file.type.split("/")[1]}`;
      console.log("Uploading file:", fileName);
      const { data, error } = await supabase.storage
        .from("item")
        .upload(`public/${fileName}`, file);
      if (error) {
        console.error("Image upload error:", error.message, error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }
      const { data: urlData } = supabase.storage
        .from("item-images")
        .getPublicUrl(`public/${fileName}`);
      console.log("Uploaded image URL:", urlData.publicUrl);
      uploadedUrls.push(urlData.publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      console.log("Starting image upload process...");
      const imageFiles = await Promise.all(
        images.map(async (url, index) => {
          console.log(`Fetching blob for image ${index + 1}: ${url}`);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch image ${index + 1}`);
          return response.blob();
        })
      );
      console.log("Image blobs fetched:", imageFiles);
      const imageUrls = await uploadImagesToSupabase(imageFiles);

      console.log("Inserting listing into Supabase...");
      const { data, error } = await supabase.from("listings").insert([
        {
          name: formData.itemName,
          category: formData.category,
          condition: formData.condition,
          condition_notes: formData.conditionNotes,
          price: formData.isFree ? 0 : parseFloat(formData.price),
          description: formData.description,
          tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : [],
          hostel: formData.hostel,
          delivery_option: formData.deliveryOption,
          is_digital: formData.isDigital,
          is_free: formData.isFree,
          images: imageUrls,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error.message, error);
        throw new Error(`Failed to create listing: ${error.message}`);
      }

      console.log("Listing created successfully:", data);
      router.push("/listings");
    } catch (error) {
      setSubmissionError(error.message || "An error occurred while submitting");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex items-center justify-center p-4">
      <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Promotional Card */}
        <motion.div
          className="lg:col-span-1 bg-gray-50 rounded-2xl shadow-lg p-8 flex flex-col justify-between"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Student Marketplace</h2>
            <p className="text-sm text-gray-600 mb-6 font-medium">
              Sell your items to students with ease. Add vibrant photos and details to attract buyers quickly.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-700 font-medium">Trusted student community</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSignIcon className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-700 font-medium">Flexible pricing options</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-700 font-medium">Local or digital delivery</span>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <a
              href="#"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200"
            >
              Discover more →
            </a>
          </div>
        </motion.div>

        {/* Right Form Card */}
        <motion.div
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <form onSubmit={handleSubmit}>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Create Your Listing</h1>

            {/* Step Navigation */}
            <div className="flex justify-between mb-6">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      index <= currentStep ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <TagIcon className="w-6 h-6 text-blue-600" />
                    Item Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="itemName"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="itemName"
                        name="itemName"
                        type="text"
                        value={formData.itemName}
                        onChange={handleInputChange}
                        placeholder="e.g., Scientific Calculator"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.itemName ? "border-red-500" : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      />
                      {errors.itemName && (
                        <p className="text-xs text-red-500 mt-1">{errors.itemName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="category"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.category ? "border-red-500" : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ij48L3BvbHlsaW5lPjwvc3ZnPg==')] bg-no-repeat bg-[right_1rem_center] bg-[length:1.5rem]`}
                      >
                        <option value="">Select a category</option>
                        {[
                          "Books",
                          "Electronics",
                          "Hostel Essentials",
                          "Clothing",
                          "Sports / Hobbies",
                          "Digital Files",
                          "Services",
                          "Rental Items",
                          "Event Tickets",
                          "Free Items",
                          "Others",
                        ].map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="condition"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Condition <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.condition ? "border-red-500" : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ij48L3BvbHlsaW5lPjwvc3ZnPg==')] bg-no-repeat bg-[right_1rem_center] bg-[length:1.5rem]`}
                      >
                        <option value="">Select condition</option>
                        {["New", "Like New", "Used - Good", "Used - Acceptable"].map((condition) => (
                          <option key={condition} value={condition}>
                            {condition}
                          </option>
                        ))}
                      </select>
                      {errors.condition && (
                        <p className="text-xs text-red-500 mt-1">{errors.condition}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="conditionNotes"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Condition Notes
                      </label>
                      <input
                        id="conditionNotes"
                        name="conditionNotes"
                        type="text"
                        value={formData.conditionNotes}
                        onChange={handleInputChange}
                        placeholder="e.g., Minor scratches on screen"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="price"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                        <input
                          id="price"
                          name="price"
                          type="number"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="500"
                          disabled={formData.isFree}
                          className={`w-full pl-10 py-3 rounded-xl border ${
                            errors.price ? "border-red-500" : "border-gray-200"
                          } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            formData.isFree ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                      {errors.price && (
                        <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="tags"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Tags
                      </label>
                      <div className="relative">
                        <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                        <input
                          id="tags"
                          name="tags"
                          type="text"
                          value={formData.tags}
                          onChange={handleInputChange}
                          placeholder="e.g., calculator, study, engineering"
                          className="w-full pl-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label
                        htmlFor="description"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your item in detail..."
                        rows="4"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.description ? "border-red-500" : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                      />
                      {errors.description && (
                        <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label
                        htmlFor="images"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Images (Max 5)
                      </label>
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 bg-gray-50 hover:bg-gray-100 ${
                          errors.images ? "border-red-500" : "border-gray-200"
                        }`}
                      >
                        <input
                          id="images"
                          type="file"
                          multiple
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                          ref={fileInputRef}
                        />
                        <div className="space-y-3 text-center">
                          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex items-center justify-center text-sm text-gray-600">
                            <button
                              type="button"
                              onClick={handleFileInputClick}
                              className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 hover:text-blue-700 focus-within:outline-none"
                            >
                              Upload photos
                            </button>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
                        </div>
                      </div>
                      {errors.images && (
                        <p className="text-xs text-red-500 mt-1">{errors.images}</p>
                      )}
                      {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                onClick={() => removeImage(index)}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <MapPinIcon className="w-6 h-6 text-blue-600" />
                    Delivery & Location
                  </h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="deliveryOption"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Delivery Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="deliveryOption"
                        name="deliveryOption"
                        value={formData.deliveryOption}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.deliveryOption ? "border-red-500" : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ij48L3BvbHlsaW5lPjwvc3ZnPg==')] bg-no-repeat bg-[right_1rem_center] bg-[length:1.5rem]`}
                      >
                        <option value="">Select delivery method</option>
                        <option value="pickup">Campus Pickup</option>
                        <option value="delivery">Hostel Delivery</option>
                        <option value="digital">Digital Delivery (for digital items)</option>
                      </select>
                      {errors.deliveryOption && (
                        <p className="text-xs text-red-500 mt-1">{errors.deliveryOption}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="hostel"
                        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        Hostel Name
                      </label>
                      <input
                        id="hostel"
                        name="hostel"
                        type="text"
                        value={formData.hostel}
                        onChange={handleInputChange}
                        placeholder="e.g., Block A, Hostel 5"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <Check className="w-6 h-6 text-blue-600" />
                    Additional Options
                  </h2>
                  <div className="flex flex-wrap gap-8">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="isDigital"
                          checked={formData.isDigital}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Digital Item</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="isFree"
                          checked={formData.isFree}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Free Giveaway</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-200"
                >
                  Previous
                </button>
              )}
              <div className="ml-auto flex gap-4">
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={Object.keys(errors).length > 0}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isSubmitting || Object.keys(errors).length > 0 || images.length > 5}
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderIcon className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Post Your Listing
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {submissionError && (
              <p className="text-sm text-red-500 mt-4 text-center">{submissionError}</p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}