import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import LocationPicker from '../../components/ui/LocationPicker';
import DuplicateNudge from '../../components/ui/DuplicateNudge';
import { Cpu } from 'lucide-react';

const AIProcessingOverlay = ({ show }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center font-sans">
      <div className="bg-white px-10 py-12 rounded-3xl shadow-xl flex flex-col items-center border border-outline/20 max-w-md w-full animate-in fade-in zoom-in duration-300">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
          <div className="bg-primary/10 p-4 rounded-full relative">
            <Cpu className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-3 tracking-tight text-center">AI is analyzing...</h2>
        <p className="text-on-surface-variant text-center leading-relaxed">
          Our system is extracting visual features to instantly route your request to the correct UrbanResolve department.
        </p>
      </div>
    </div>
  );
};

// Default location: Vijayawada, Andhra Pradesh
const DEFAULT_POSITION = { lat: 16.5062, lng: 80.6480 };

const NewTicket = () => {
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Position from map picker — pre-set to AP default
  const [position, setPosition] = useState(DEFAULT_POSITION);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [nearbyTickets, setNearbyTickets] = useState([]);
  const [nearbyDismissed, setNearbyDismissed] = useState(false);
  const nearbyDebounceRef = useRef(null);
  const navigate = useNavigate();

  const handleFileDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer?.files[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  // Debounced nearby-ticket fetch when location changes
  const handlePositionChange = useCallback((pos) => {
    setPosition(pos);
    setNearbyDismissed(false);
    if (nearbyDebounceRef.current) clearTimeout(nearbyDebounceRef.current);
    nearbyDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(
          `/tickets/nearby?lat=${pos.lat}&lng=${pos.lng}&radiusKm=0.5`
        );
        setNearbyTickets(res.data.data.nearbyTickets || []);
      } catch {
        // Silently ignore — nudge is non-blocking
        setNearbyTickets([]);
      }
    }, 700);
  }, []);

  // Fetch once on mount for the default location
  useEffect(() => {
    handlePositionChange(DEFAULT_POSITION);
    return () => {
      if (nearbyDebounceRef.current) clearTimeout(nearbyDebounceRef.current);
    };
  }, [handlePositionChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setSubmitError('Please upload a photo of the issue.');
      return;
    }

    setLoading(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('latitude', position.lat.toString());
    formData.append('longitude', position.lng.toString());
    formData.append('description', description);
    formData.append('visibility', visibility);

    try {
      const response = await apiClient.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        navigate('/citizen');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow pt-12 pb-12 px-6 flex justify-center w-full relative">
      <AIProcessingOverlay show={loading} />
      <div className="w-full max-w-2xl">

        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-center mb-10">
          <nav className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-container rounded-full shadow-ambient-sm">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold">1</span>
              <span className="text-sm font-semibold text-primary">Upload & Details</span>
            </div>
            <div className="w-8 h-px bg-outline-variant/40"></div>
            <div className="flex items-center gap-2 px-4 py-2 opacity-60 grayscale">
              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-outline-variant text-on-surface-variant text-xs font-bold">2</span>
              <span className="text-sm font-medium text-on-surface-variant">Review</span>
            </div>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-extrabold font-display tracking-tight text-on-surface mb-2">Citizen Report Wizard</h1>
          <p className="text-on-surface-variant">Help us improve your neighborhood by reporting maintenance issues.</p>
        </div>

        {/* Main Card */}
        <div className="data-slate border border-surface-container overflow-hidden p-8">

          {submitError && (
            <div className="flex items-center gap-3 p-4 mb-8 bg-error-container/20 text-error border border-error/10 rounded-lg">
              <span className="material-symbols-outlined">error</span>
              <span className="text-sm font-semibold">{submitError}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="flex gap-4 p-4 bg-secondary-container/30 rounded-xl mb-8 border border-secondary/10">
            <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>info</span>
            <div className="text-sm text-on-surface">
              <p className="font-bold mb-1 font-display">Before you upload:</p>
              <ul className="list-disc list-inside space-y-1 opacity-90 marker:text-primary">
                <li>Ensure the photo is clear and well-lit.</li>
                <li>Include surrounding context if possible.</li>
                <li>Pin the exact location on the map below.</li>
              </ul>
            </div>
          </div>

          {/* Dropzone */}
          <div className="relative group mb-8">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed ${previewUrl ? 'border-primary bg-primary/5' : 'border-outline-variant/50'} rounded-xl p-12 flex flex-col items-center justify-center transition-all hover:border-primary hover:bg-surface-container-low cursor-pointer`}
            >
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-6 shadow-ambient-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
              </div>
              <h3 className="text-lg font-bold font-display mb-2 text-on-surface">Upload Evidence</h3>
              <p className="text-on-surface-variant text-center mb-6 max-w-xs text-sm">
                Drag and drop your photo here, or <span className="text-primary font-semibold">browse files</span>
              </p>
              <div className="flex gap-4 text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest bg-surface-container-high px-4 py-2 rounded-full">
                <span>JPG</span>
                <span>PNG</span>
              </div>
            </div>
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="mb-8 rounded-xl overflow-hidden border border-outline-variant/20 shadow-ambient-sm">
              <div className="text-xs text-center bg-primary-container text-primary font-bold uppercase py-1 tracking-widest">
                Photo Preview
              </div>
              <div className="aspect-video bg-surface-container">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Issue preview" />
              </div>
            </div>
          )}

          {/* Optional Description */}
          <div className="mb-8 p-6 bg-surface-container-low rounded-xl border border-surface-container">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Report Visibility (Required)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  visibility === 'PUBLIC'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface'
                }`}
              >
                <p className="text-sm font-bold">Public</p>
                <p className="text-xs mt-1 text-on-surface-variant">
                  Visible in the community feed for upvotes and verification.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('PRIVATE')}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  visibility === 'PRIVATE'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface'
                }`}
              >
                <p className="text-sm font-bold">Private</p>
                <p className="text-xs mt-1 text-on-surface-variant">
                  Visible only to UrbanResolve staff for sensitive requests.
                </p>
              </button>
            </div>
          </div>

          {/* Optional Description */}
          <div className="mb-8 p-6 bg-surface-container-low rounded-xl border border-surface-container">
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Additional Details (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full bg-surface-container-lowest border-0 rounded-lg p-4 shadow-ambient-sm focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-sm"
              placeholder="Provide any extra context that might help the team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Map Location Picker */}
          <div className="mb-8 p-6 bg-surface-container-low rounded-xl border border-surface-container">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
              Pin Issue Location on Map
            </label>
            <LocationPicker value={position} onChange={handlePositionChange} />
          </div>

          {/* Duplicate Nudge */}
          {nearbyTickets.length > 0 && !nearbyDismissed && (
            <div className="mb-8">
              <DuplicateNudge
                nearbyTickets={nearbyTickets}
                onDismiss={() => setNearbyDismissed(true)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-surface-container pt-8">
            <Link to="/citizen" className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-lg transition-all active:scale-95 group">
              <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span>Back</span>
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className={`px-8 py-3 font-extrabold font-display rounded-xl flex items-center gap-2 transition-all active:scale-95 ${
                loading || !file
                  ? 'bg-surface-container-high text-outline cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:bg-primary-container shadow-ambient-sm group'
              }`}
            >
              <span>{loading ? 'Submitting...' : 'Submit Report'}</span>
              {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col gap-2 border border-surface-container shadow-ambient-sm">
            <span className="material-symbols-outlined text-primary text-3xl">privacy_tip</span>
            <h4 className="text-sm font-bold font-display mt-1">Privacy First</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">Personal details are removed by our AI before official review.</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col gap-2 border border-surface-container shadow-ambient-sm">
            <span className="material-symbols-outlined text-primary text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>speed</span>
            <h4 className="text-sm font-bold font-display mt-1">Intelligent Triage</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">Automated visual analysis ensures your report routes quickly.</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col gap-2 border border-surface-container shadow-ambient-sm">
            <span className="material-symbols-outlined text-primary text-3xl">history</span>
            <h4 className="text-sm font-bold font-display mt-1">Live Tracking</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">Track the real-time status entirely from your citizen dashboard.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewTicket;
