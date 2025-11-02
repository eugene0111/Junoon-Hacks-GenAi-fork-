import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axiosConfig";

import AnimatedSection from "../../components/ui/AnimatedSection";
import {
  SparklesIcon,
  LightBulbIcon,
  PencilIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  RadioButtonIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
} from "../../components/common/Icons";

const SkeletonBase = ({ className = "" }) => (
  <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`}></div>
);
const SkeletonSidebarCard = () => <SkeletonBase className="h-44 md:h-48" />;
const SkeletonForm = () => <SkeletonBase className="h-[40rem]" />;

const FormInput = ({ label, id, ...props }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {label}
    </label>{" "}
    {}
    <input
      id={id}
      {...props}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
                 focus:outline-none focus:ring-1 focus:ring-google-blue focus:border-google-blue sm:text-sm
                 disabled:bg-gray-50 disabled:text-gray-500"
    />
  </div>
);

const FormSelect = ({ label, id, children, ...props }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {label}
    </label>{" "}
    {}
    <select
      id={id}
      {...props}
      className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm 
                 focus:outline-none focus:ring-1 focus:ring-google-blue focus:border-google-blue sm:text-sm"
    >
      {children}
    </select>
  </div>
);

const ProductFormFields = ({
  initialData,
  onSubmit,
  onFormDataChange,

  imageFile,
  setImageFile,
  imagePreview,
  setImagePreview,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Other",
    status: "draft",
    inventory: { quantity: 1, isUnlimited: false },
    images: [{ url: "", alt: "" }],
  });

  const [formLoading, setFormLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [error, setError] = useState("");

  const location = useLocation();

  useEffect(() => {
    const ideaData = location.state?.ideaData;
    let effectiveData = {};

    if (ideaData) {
      effectiveData = {
        ...formData,
        name: ideaData.name || "",
        description: ideaData.description || "",
        category: ideaData.category || "Other",
      };
    } else if (initialData) {
      effectiveData = {
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        category: initialData.category || "Other",
        status: initialData.status || "draft",
        inventory: {
          quantity: initialData.inventory?.quantity ?? 1,
          isUnlimited: initialData.inventory?.isUnlimited || false,
        },
        images: initialData.images?.length
          ? initialData.images
          : [{ url: "", alt: "" }],
      };
    } else {
      effectiveData = { ...formData };
    }

    setFormData(effectiveData);

    onFormDataChange(effectiveData);
  }, [initialData, location.state]);

  const categories = [
    "Pottery",
    "Textiles",
    "Painting",
    "Woodwork",
    "Metalwork",
    "Sculpture",
    "Jewelry",
    "Other",
  ];
  const statuses = ["draft", "active", "inactive"];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newFormData = { ...formData };

    if (name.startsWith("inventory.")) {
      const key = name.split(".")[1];
      newFormData.inventory = {
        ...newFormData.inventory,
        [key]: type === "checkbox" ? checked : value,
      };
    } else if (name === "images.0.url") {
      newFormData.images = [{ ...newFormData.images[0], url: value }];
    } else {
      newFormData = { ...newFormData, [name]: value };
    }

    setFormData(newFormData);
    onFormDataChange(newFormData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      onFormDataChange({ ...formData, images: [{ url: "file_selected" }] });
    } else {
      setImageFile(null);

      const initialImageUrl = initialData?.images?.[0]?.url || "";
      setImagePreview(initialImageUrl);

      onFormDataChange({ ...formData, images: [{ url: initialImageUrl }] });
    }
  };

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const response = await api.post("/ai/generate-description", {
        name: formData.name,
        category: formData.category,
        existingDescription: formData.description,
      });
      const aiDescription = response.data.description;
      setFormData((prev) => ({ ...prev, description: aiDescription }));
      onFormDataChange({ ...formData, description: aiDescription });
    } catch (err) {
      console.error("AI Description Error:", err);
      setError("Failed to generate AI description.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestPrice = async () => {
    setIsSuggestingPrice(true);
    setPriceSuggestion(null);
    setError("");
    try {
      const response = await api.post("/ai/suggest-price", {
        name: formData.name,
        category: formData.category,
        description: formData.description,
      });
      setPriceSuggestion(response.data);
    } catch (err) {
      console.error("AI Price Suggestion Error:", err);
      setError("Failed to suggest price.");
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      await onSubmit();
    } catch (err) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200 space-y-8"
    >
      {error && (
        <div className="text-red-700 bg-red-50 p-3 rounded-md text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      {}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Core Details</h2>
          <p className="mt-1 text-xs text-gray-500">
            This is the essential information for your product listing.
          </p>
        </div>
        <FormInput
          label="Product Name"
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g., Hand-Painted Ceramic Mug"
        />
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGenerating || !formData.name}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-google-blue px-2 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SparklesIcon className="w-3.5 h-3.5" /> {}
              {isGenerating ? "Generating..." : "Generate with AI"}
            </button>
          </div>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            placeholder="Tell a story about your product, its inspiration, and the creation process."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-google-blue focus:border-google-blue sm:text-sm"
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Price (INR)
              </label>
              <button
                type="button"
                onClick={handleSuggestPrice}
                disabled={
                  isSuggestingPrice || !formData.name || !formData.description
                }
                className="flex items-center gap-1 text-xs font-semibold text-white bg-google-green px-2 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <LightBulbIcon className="w-3.5 h-3.5" /> {}
                {isSuggestingPrice ? "Analyzing..." : "Suggest Price"}
              </button>
            </div>
            <FormInput
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="e.g., 500 Rupees"
            />
            {priceSuggestion && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="font-bold text-yellow-800">
                  AI Suggestion: ₹{priceSuggestion.suggestedPriceRange}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {priceSuggestion.justification}
                </p>
              </div>
            )}
          </div>
          <FormSelect
            label="Category"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </FormSelect>
        </div>
      </div>

      {}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Inventory & Status
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Manage stock and marketplace visibility.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <FormInput
              label="Available Quantity"
              id="inventory.quantity"
              name="inventory.quantity"
              type="number"
              value={formData.inventory.quantity}
              onChange={handleChange}
              min="0"
              disabled={formData.inventory.isUnlimited}
            />
            <div className="flex items-center mt-3">
              <input
                type="checkbox"
                id="inventory.isUnlimited"
                name="inventory.isUnlimited"
                checked={formData.inventory.isUnlimited}
                onChange={handleChange}
                className="h-4 w-4 text-google-blue border-gray-300 rounded focus:ring-google-blue"
              />
              <label
                htmlFor="inventory.isUnlimited"
                className="ml-2 block text-sm text-gray-700"
              >
                Made to order (Unlimited)
              </label>
            </div>{" "}
            {}
          </div>
          <FormSelect
            label="Product Status"
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            {statuses.map((stat) => (
              <option key={stat} value={stat}>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}
              </option>
            ))}
          </FormSelect>
        </div>
      </div>

      {}
      <div className="space-y-6">
        <div className="pb-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Product Image</h2>
          <p className="mt-1 text-xs text-gray-500">
            Upload a high-quality image for your product.
          </p>
        </div>
        <div>
          <label
            htmlFor="productImage"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Upload Image
          </label>
          <input
            id="productImage"
            name="productImage"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-google-blue hover:file:bg-blue-100"
          />
        </div>

        {}
        {imagePreview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Image Preview
            </p>
            <img
              src={imagePreview}
              alt="Product Preview"
              className="h-40 w-40 rounded-lg object-cover border border-gray-200"
            />
          </div>
        )}
      </div>
      {}

      {}
      <div className="flex justify-end items-center gap-3 pt-5 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate("/artisan/products")}
          className="bg-white text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formLoading}
          className="bg-google-blue text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
        >
          {formLoading && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {formLoading
            ? "Saving..."
            : initialData
            ? "Update Product"
            : "Create Product"}
        </button>
      </div>
    </form>
  );
};

const ChecklistItem = ({ text, isComplete }) => (
  <div
    className={`flex items-start gap-2 transition-colors ${
      isComplete ? "text-gray-700" : "text-gray-400"
    }`}
  >
    <div className="flex-shrink-0 mt-0.5">
      {isComplete ? (
        <CheckCircleIcon className="w-4 h-4 text-google-green" />
      ) : (
        <RadioButtonIcon className="w-4 h-4 text-gray-300" />
      )}
    </div>
    <span className={`text-xs ${isComplete ? "font-medium" : "font-normal"}`}>
      {text}
    </span>
  </div>
);

const ProductEditPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const isEditMode = !!productId;

  const [checklistData, setChecklistData] = useState({});

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (isEditMode) {
      setPageLoading(true);
      const fetchProduct = async () => {
        try {
          const response = await api.get(`/products/${productId}`);
          setInitialData(response.data);
          setChecklistData(response.data);

          setImagePreview(response.data.images?.[0]?.url || "");
          setPageError("");
        } catch (err) {
          setPageError(
            "Failed to fetch product data. Please check the ID or try again."
          );
          console.error(err);
          setInitialData(null);
        } finally {
          setPageLoading(false);
        }
      };
      fetchProduct();
    } else {
      setPageLoading(false);
      setInitialData(null);
      setChecklistData({});
      setImagePreview("");
    }
  }, [productId, isEditMode]);

  const handleFormSubmit = async () => {
    const payload = {
      name: checklistData.name,
      description: checklistData.description,
      price: parseFloat(checklistData.price),
      category: checklistData.category,
      status: checklistData.status,
      inventory: {
        ...checklistData.inventory,
        quantity: checklistData.inventory.isUnlimited
          ? 0
          : parseInt(checklistData.inventory.quantity, 10) || 0,
      },
    };

    if (isNaN(payload.price) || payload.price < 0)
      throw new Error("Invalid price.");
    if (
      !checklistData.inventory.isUnlimited &&
      (isNaN(payload.inventory.quantity) || payload.inventory.quantity < 0)
    )
      throw new Error("Invalid quantity.");

    if (!imageFile && !isEditMode) {
      throw new Error("Please select an image to upload.");
    }

    if (!imageFile && isEditMode && !initialData?.images?.[0]?.url) {
      throw new Error("Please select an image to upload.");
    }

    try {
      if (imageFile) {
        const data = new FormData();

        Object.keys(payload).forEach((key) => {
          if (key === "inventory") {
            data.append(key, JSON.stringify(payload[key]));
          } else if (key !== "productImage") {
            data.append(key, payload[key]);
          }
        });

        data.append("productImage", imageFile);

        if (isEditMode) {
          await api.put(`/products/${productId}`, data);
        } else {
          await api.post("/products", data);
        }
      } else {
        if (isEditMode) {
          payload.images = initialData.images;
          await api.put(`/products/${productId}`, payload);
        } else {
          throw new Error("Image file is required for new products.");
        }
      }

      navigate("/artisan/products");
    } catch (error) {
      console.error("Failed to submit form:", error);
      throw new Error(
        error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.message ||
          "Failed to save product."
      );
    }
  };

  const checklist = useMemo(() => {
    const data = checklistData || {};
    const inventory = data.inventory || {};

    const hasImage =
      (data.images?.[0]?.url || "").length > 10 ||
      (imagePreview &&
        (imagePreview.startsWith("data:") || imagePreview.startsWith("http")));

    return [
      {
        text: "Add a clear product name",
        isComplete: (data.name?.length || 0) >= 5,
      },
      {
        text: "Write a detailed description (min. 50 chars)",
        isComplete: (data.description?.length || 0) >= 50,
      },
      {
        text: "Set a valid price",
        isComplete: (parseFloat(data.price) || 0) > 0,
      },
      {
        text: "Add at least one high-quality image",
        isComplete: hasImage,
      },
      {
        text: "Set inventory (quantity or 'Made to Order')",
        isComplete:
          (parseInt(inventory.quantity, 10) > 0 && !inventory.isUnlimited) ||
          inventory.isUnlimited === true,
      },
      {
        text: "Select 'Active' status to publish",
        isComplete: data.status === "active",
      },
    ];
  }, [checklistData, imagePreview]);

  const isChecklistComplete = checklist.every((item) => item.isComplete);

  if (pageLoading && isEditMode) {
    return (
      <div className="p-6">
        <SkeletonSidebarCard />
        <div className="mt-4">
          <SkeletonForm />
        </div>
      </div>
    );
  }
  if (pageError && isEditMode) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow text-center">
        <ExclamationCircleIcon className="mx-auto h-8 w-8 text-red-500" />
        <h2 className="mt-3 text-lg font-medium text-gray-800">
          Unable to load product
        </h2>
        <p className="mt-2 text-sm text-gray-600">{pageError}</p>
        <div className="mt-4">
          <button
            onClick={() => navigate("/artisan/products")}
            className="inline-flex items-center px-4 py-2 bg-google-blue text-white rounded-md text-sm"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 px-6 md:px-8 py-8 md:py-10 bg-gradient-to-br from-[#F8F9FA] via-[#F1F3F4] to-[#E8F0FE] min-h-screen">
      <div className="flex-grow lg:w-2/3">
        <AnimatedSection className="mb-8 pt-8">
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="mt-1 text-gray-500">
            {isEditMode
              ? `Editing "${initialData?.name || "product"}"`
              : "Fill out the details to list a new creation."}
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <ProductFormFields
            initialData={initialData}
            onSubmit={handleFormSubmit}
            onFormDataChange={setChecklistData}
            imageFile={imageFile}
            setImageFile={setImageFile}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
          />
        </AnimatedSection>
      </div>

      {}
      <aside className="lg:w-80 flex-shrink-0 space-y-6 lg:sticky lg:top-24 self-start mt-4 lg:mt-0">
        {}
        <AnimatedSection>
          <div
            className={`rounded-xl shadow-sm border ${
              isChecklistComplete
                ? "bg-green-50/60 border-green-200/80"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              {isChecklistComplete ? (
                <CheckCircleIcon className="h-6 w-6 text-google-green" />
              ) : (
                <RadioButtonIcon className="h-6 w-6 text-gray-400" />
              )}
              <h3 className="text-base font-medium text-gray-800">
                Publish Checklist
              </h3>
            </div>
            <div className="p-4 space-y-2.5">
              {checklist.map((item) => (
                <ChecklistItem
                  key={item.text}
                  text={item.text}
                  isComplete={item.isComplete}
                />
              ))}
            </div>
            {isChecklistComplete && (
              <div className="p-4 border-t border-green-200/80 text-center">
                <p className="text-sm font-medium text-google-green">
                  Ready to publish!
                </p>
              </div>
            )}
          </div>
        </AnimatedSection>

        {}
        <AnimatedSection>
          <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200/80">
            <div className="flex items-center gap-2.5 mb-2">
              <InformationCircleIcon className="h-5 w-5 text-google-blue" />
              <h3 className="text-sm font-medium text-blue-900">
                Tips for Success
              </h3>
            </div>
            <ul className="list-disc list-outside pl-5 space-y-1.5">
              <li className="text-xs text-gray-700 leading-relaxed">
                Use bright, clear photos against a neutral background.
              </li>
              <li className="text-xs text-gray-700 leading-relaxed">
                Tell the story behind your product in the description.
              </li>
              <li className="text-xs text-gray-700 leading-relaxed">
                Check the AI Price Suggestion to stay competitive.
              </li>
            </ul>
          </div>
        </AnimatedSection>
      </aside>
    </div>
  );
};

export default ProductEditPage;
