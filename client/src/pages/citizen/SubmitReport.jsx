import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AlertCircle,
    Camera,
    MapPin,
    Trash2,
    Send,
    Info,
    CheckCircle2,
    FileText,
    ArrowLeft,
    X,
    ChevronDown,
    CloudUpload
} from 'lucide-react';
import axios from 'axios';
import { compressImage } from '../../utils/imageUtils';
import toast from 'react-hot-toast';

const SubmitReport = ({ isEdit = false }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        garbageType: 'Household',
        location: '',
        city: 'Pune',
        area: '',
        landmark: '',
        zone: '',
        contactNumber: '',
        description: '',
        urgency: 'Medium',
        photos: []
    });

    const [isLocatingCoords, setIsLocatingCoords] = useState(false);
    const [isDetectingAddress, setIsDetectingAddress] = useState(false);

    const [previews, setPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isEdit && id) {
            fetchReportData();
        }
    }, [isEdit, id]);

    const fetchReportData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/reports/${id}`, {
                headers: { 'x-auth-token': token }
            });
            const { garbageType, location, city, area, landmark, zone, contactNumber, description, photos, urgency } = res.data;
            setFormData({
                garbageType,
                location,
                city: city || 'Pune',
                area: area || '',
                landmark: landmark || '',
                zone: zone || '',
                contactNumber: contactNumber || '',
                description,
                urgency,
                photos: []
            });
            if (photos && photos.length > 0) setPreviews(photos);
        } catch (err) {
            setError('Failed to fetch report data.');
            console.error(err);
        }
    };

    const onChange = (e) => {
        let { name, value } = e.target;
        
        if (name === 'contactNumber') {
            // Only digits, strictly max 10
            value = value.replace(/\D/g, '').slice(0, 10);
        }
        
        setFormData({ ...formData, [name]: value });
    };

    const onFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + previews.length > 3) {
            setError('You can only upload up to 3 photos.');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const compressed = await compressImage(reader.result);
                setPreviews(prev => [...prev, compressed]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        const newPreviews = previews.filter((_, i) => i !== index);
        const newPhotos = formData.photos.filter((_, i) => i !== index);
        setPreviews(newPreviews);
        setFormData({ ...formData, photos: newPhotos });
    };

    const geolocate = (mode = 'coordinates') => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        if (mode === 'coordinates') setIsLocatingCoords(true);
        else setIsDetectingAddress(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                if (mode === 'address') {
                    try {
                        const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

                        if (!GOOGLE_KEY) {
                            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                            const addr = res.data.address;

                            const cityVal = addr.county || addr.city_district || addr.state_district || 'Pune';
                            const areaVal = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || addr.town || addr.road || '';
                            const landmarkVal = res.data.display_name || '';

                            // Deep Zone Scan
                            let zoneVal = '';
                            const fullAddr = (landmarkVal || '').toLowerCase();
                            if (fullAddr.match(/akurdi|pimpri/)) zoneVal = 'East';
                            else if (fullAddr.match(/wakad|hinjewadi/)) zoneVal = 'West';
                            else if (fullAddr.match(/nigdi|bhosari/)) zoneVal = 'North';
                            else if (fullAddr.match(/hadapsar/)) zoneVal = 'South';

                            setFormData(prev => ({
                                ...prev,
                                city: cityVal,
                                area: areaVal || (landmarkVal.split(',')[0]),
                                zone: zoneVal || prev.zone,
                                landmark: landmarkVal
                            }));
                            return;
                        }

                        // Use Google Maps API
                        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`);
                        const data = response.data;

                        if (data.status === 'OK' && data.results.length > 0) {
                            const result = data.results[0];
                            const components = result.address_components;

                            let cityVal = 'Pune';
                            let areaVal = '';

                            const district = components.find(c => c.types.includes('administrative_area_level_2'));
                            if (district) cityVal = district.long_name;

                            const sublocality = components.find(c => c.types.includes('sublocality') || c.types.includes('sublocality_level_1'));
                            const neighborhood = components.find(c => c.types.includes('neighborhood'));
                            const locality = components.find(c => c.types.includes('locality'));

                            if (sublocality) areaVal = sublocality.long_name;
                            else if (neighborhood) areaVal = neighborhood.long_name;
                            else if (locality) areaVal = locality.long_name;

                            const landmarkVal = result.formatted_address;

                            // Deep Zone Scan
                            let zoneVal = '';
                            const fullAddr = (landmarkVal || '').toLowerCase();
                            if (fullAddr.match(/akurdi|pimpri/)) zoneVal = 'East';
                            else if (fullAddr.match(/wakad|hinjewadi/)) zoneVal = 'West';
                            else if (fullAddr.match(/nigdi|bhosari/)) zoneVal = 'North';
                            else if (fullAddr.match(/hadapsar/)) zoneVal = 'South';

                            setFormData(prev => ({
                                ...prev,
                                city: cityVal,
                                area: areaVal || (landmarkVal.split(',')[0]),
                                zone: zoneVal || prev.zone,
                                landmark: landmarkVal
                            }));
                        } else {
                            throw new Error(data.status);
                        }
                    } catch (err) {
                        console.warn('Primary geocoding failed, falling back to basic detection.');
                        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                        const addr = res.data.address;
                        const fullAddr = res.data.display_name || '';
                        const areaVal = addr.suburb || addr.neighbourhood || addr.village || addr.town || (fullAddr.split(',')[0]) || '';
                        
                        let zoneVal = '';
                        if (fullAddr.match(/akurdi|pimpri/i)) zoneVal = 'East';
                        else if (fullAddr.match(/wakad|hinjewadi/i)) zoneVal = 'West';
                        else if (fullAddr.match(/nigdi|bhosari/i)) zoneVal = 'North';
                        else if (fullAddr.match(/hadapsar/i)) zoneVal = 'South';

                        setFormData(prev => ({
                            ...prev,
                            city: addr.county || addr.city_district || 'Pune',
                            area: areaVal,
                            zone: zoneVal || prev.zone,
                            landmark: fullAddr
                        }));
                    } finally {
                        setIsDetectingAddress(false);
                    }
                } else {
                    setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }));
                    setIsLocatingCoords(false);
                }
            },
            (error) => {
                setIsLocatingCoords(false);
                setIsDetectingAddress(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError('Location permission denied. Please enable it in your browser.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError('Location information is unavailable.');
                        break;
                    case error.TIMEOUT:
                        setError('Location request timed out. Please try again.');
                        break;
                    default:
                        setError('Unable to retrieve your location. Please enter it manually.');
                        break;
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const onSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!formData.location || !formData.zone || !formData.area || !formData.description) {
            setError('Please fill in required fields (Location, Zone, Area, and Description)');
            setIsSubmitting(false);
            return;
        }

        if (previews.length === 0) {
            setError('Please upload at least one photo');
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                ...formData,
                photos: previews,
                initialPhotoCount: previews.length
            };

            let res;
            if (isEdit) {
                res = await axios.put(`/api/reports/${id}`, dataToSend, {
                    headers: { 'x-auth-token': token }
                });
            } else {
                res = await axios.post('/api/reports', dataToSend, {
                    headers: { 'x-auth-token': token }
                });
            }

            toast.success(res.data?.message || (isEdit ? 'Report updated successfully!' : 'Report submitted successfully!'));
            
            // ⚡ System will refetch on next dashboard visit
            navigate('/citizen/my-reports');
        } catch (err) {
            console.error('Submission error:', err);
            const message = err.response?.data?.message || err.message || 'Failed to submit report. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50/10 min-h-screen py-10 px-4 flex items-center justify-center">
            <div className="max-w-xl w-full mx-auto">
                <div className="bg-white dark:bg-[#0B1121] rounded-[0.8rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0B1121]">
                        <h2 className="text-[17px] font-black text-slate-800 dark:text-white tracking-tight">
                            {isEdit ? 'Edit Report' : 'Submit Report'}
                        </h2>
                        <button
                            onClick={() => navigate('/citizen/my-reports')}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        >
                            <X size={24} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* Form Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar pl-6 pt-6 pb-6 pr-5">
                        <p className="text-[0.75rem] text-slate-500 mb-6" style={{ fontWeight: 400 }}>
                            * Indicates required
                        </p>

                        <form className="space-y-6">
                            {error && (
                                <div className="flex items-center space-x-1.5 text-rose-600 animate-fade-in mb-2">
                                    <AlertCircle size={14} strokeWidth={3} />
                                    <p className="text-[11px] font-black tracking-tight">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="flex items-center space-x-1.5 text-emerald-600 animate-fade-in mb-2">
                                    <CheckCircle2 size={14} strokeWidth={3} />
                                    <p className="text-[11px] font-black tracking-tight">
                                        {typeof success === 'string' ? success : (isEdit ? 'Report updated successfully!' : 'Report submitted successfully!')}
                                    </p>
                                </div>
                            )}

                            {/* Section: Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                {/* Garbage Type */}
                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        Garbage Type *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="garbageType"
                                            value={formData.garbageType}
                                            onChange={onChange}
                                            className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all appearance-none"
                                        >
                                            <option value="Household">Household Waste</option>
                                            <option value="Industrial">Industrial Waste</option>
                                            <option value="Medical">Medical Waste</option>
                                            <option value="Construction">Construction Waste</option>
                                            <option value="E-Waste">E-Waste</option>
                                            <option value="Plastic">Plastic Waste</option>
                                            <option value="Organic">Organic / Food Waste</option>
                                            <option value="Hazardous">Hazardous Waste</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                                    </div>
                                </div>

                                {/* Urgency Level */}
                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        Urgency Level *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="urgency"
                                            value={formData.urgency}
                                            onChange={onChange}
                                            className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all appearance-none"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                                    </div>
                                </div>

                                {/* Location Field with Top-Level Button */}
                                <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0">
                                        <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                            Location (Auto / Map / Link) *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => geolocate('coordinates')}
                                            disabled={isLocatingCoords}
                                            className="ml-auto md:ml-0 text-[0.75rem] flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-50"
                                        >
                                            <MapPin size={14} /> {isLocatingCoords ? 'Tracking...' : 'Use My Location'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        name="location"
                                        placeholder="Paste Google Maps link OR auto detect"
                                        required
                                        value={formData.location}
                                        onChange={onChange}
                                        className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
                                    />
                                </div>

                                {/* Section Action Button (Targets Geography Fields) */}
                                <div className="flex flex-col text-right md:col-span-2 -mb-2">
                                    <button
                                        type="button"
                                        onClick={() => geolocate('address')}
                                        disabled={isDetectingAddress}
                                        className="ml-auto w-fit text-[0.8125rem] flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-50"
                                    >
                                        {isDetectingAddress ? (
                                            <>Detecting Details...</>
                                        ) : (
                                            <> Auto-Fill Details</>
                                        )}
                                    </button>
                                </div>

                                {/* City (Fixed Pune) */}
                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        required
                                        value={formData.city}
                                        onChange={onChange}
                                        placeholder="e.g. Pune"
                                        className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
                                    />
                                </div>

                                {/* Zone */}
                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        Zone *
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="zone"
                                            required
                                            value={formData.zone}
                                            onChange={onChange}
                                            className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all appearance-none"
                                        >
                                            <option value="">Select Zone</option>
                                            <option value="North">North Zone</option>
                                            <option value="South">South Zone</option>
                                            <option value="East">East Zone</option>
                                            <option value="West">West Zone</option>
                                            <option value="Central">Central Zone</option>
                                        </select>
                                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                                    </div>
                                </div>

                                {/* Area */}
                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        Area *
                                    </label>
                                    <input
                                        type="text"
                                        name="area"
                                        placeholder="e.g. Akurdi, Pimpri"
                                        required
                                        value={formData.area}
                                        onChange={onChange}
                                        className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        Landmark (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="landmark"
                                        placeholder="e.g. Near City Bank"
                                        value={formData.landmark}
                                        onChange={onChange}
                                        className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
                                    />
                                </div>



                                {/* Contact Number */}
                                <div className="flex flex-col gap-1.5 text-left md:col-span-2">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        Contact Number (Optional)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            inputMode="numeric"
                                            placeholder="e.g. 9876543210 (10-digit mobile number)"
                                            value={formData.contactNumber}
                                            onChange={onChange}
                                            className="w-full h-[2.5rem] px-3 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all tracking-wider"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Description */}
                            <div className="flex flex-col gap-1.5 text-left mt-4">
                                <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    placeholder="Briefly describe the issue..."
                                    value={formData.description}
                                    onChange={onChange}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-[#b8b8b8] dark:border-slate-700 rounded-[0.4rem] text-slate-900 dark:text-white text-[0.875rem] focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all resize-none"
                                />
                            </div>


                            {/* Section: Photos */}
                            <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-8">
                                <div className="flex flex-col gap-1.5 text-left">
                                    <label className="text-[0.875rem] text-[#666666] dark:text-slate-400 font-medium ml-0.5">
                                        Upload Photos (1–3) *
                                    </label>
                                    
                                    <div className="flex flex-col gap-4 mt-2">
                                        {previews.length === 0 ? (
                                            <label className="relative border-2 border-dashed rounded-[1rem] p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[#eafef3] hover:border-emerald-500 bg-white border-slate-200">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={onFileChange}
                                                    className="hidden"
                                                />
                                                {/* Green Cloud Upload Icon */}
                                                <div className="w-[56px] h-[56px] bg-[#e3fdf0] rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105">
                                                    <CloudUpload className="text-[#0eac6b] w-6 h-6" strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[13px] font-black text-slate-800">Tap or click to drop photos</span>
                                                <span className="text-[11px] font-bold text-slate-400 mt-0.5">PNG, JPG up to 10MB</span>
                                            </label>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1 w-full">
                                                {previews.map((prev, idx) => (
                                                    <div key={idx} className="relative group aspect-square w-full rounded-xl overflow-hidden border-2 border-emerald-500/20 shadow-md">
                                                        <img src={prev} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removePhoto(idx)}
                                                            className="absolute top-1.5 right-1.5 bg-rose-500 text-white p-1.5 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {previews.length < 3 && (
                                                    <label className="aspect-square w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={onFileChange}
                                                            className="hidden"
                                                        />
                                                        <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                            <Camera size={20} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-emerald-600">Add Another</span>
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex p-4 mt-2 bg-[#f0fdf4] border border-[#d1fae5] rounded-[0.8rem] items-start gap-3 w-full">
                                            <Info size={20} className="text-[#10b981] shrink-0 mt-0.5" strokeWidth={2.5} />
                                            <div className="text-left w-full">
                                                <h4 className="text-[12.5px] font-black text-[#065f46] mb-1 tracking-tight">Note:</h4>
                                                <p className="text-[11.5px] font-bold text-[#064e3b] leading-snug">
                                                    Upload 1 to 3 photos of the waste. High quality photos help us resolve issues faster.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 flex justify-end border-t border-gray-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className={`h-[2rem] px-5 rounded-lg font-bold text-[0.8125rem] transition-all transform active:scale-95 shadow-md disabled:opacity-50 ${isEdit ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        >
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Submit Report')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmitReport;
