import './TutorAccount.css';
import { useAuth } from '../../../hooks/AuthProvider';
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaRegEdit, FaSignOutAlt, FaUserEdit } from 'react-icons/fa';
import ConfirmDialog from '../../../components/dialog/ConfirmDialog';
import { getCitiesByState, getCountries, getStatesByCountry } from '../../../data/modules/location-module';
import MultiSelect from '../../../components/multiselect/MultiSelect';
import { getCategories, getSubCategories } from '../../../data/modules/dynamic-module';
import { submitTutorForm } from '../../../data/modules/auth-module';
import Loading from "../../../components/loading/Loading";
import SlotSelector from '../../../components/slot_selector/slot_selector';
import { useNavigate } from 'react-router-dom';

export default function TutorAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    contactNumber: user.contactNumber || '',
    emailId: user.email || '',
    country: user.country || '',
    state: user.state || '',
    city: user.city || '',
    pincodes: user.pincodes || '',
    timezone: user.timezone || '',
    avl_days: user.avl_days || [],
    avl_time: user.avl_time || [],
    class_duration: user.class_duration || '',
    students_per_class: user.students_per_class || '',
    tutoring_mode: user.tutoring_mode || [],
    category: user.category || '',
    subcategory: user.subcategory || [],
    teaching_level: user.teaching_level || '',
    age_group: user.age_group || [],
    headline: user.headline || '',
    bio: user.bio || '',
    achievement: user.achievement || '',
    languages: user.languages || [],
    currency: user.currency || '',
    min_hour_charge: user.min_hour_charge || '',
    max_hour_charge: user.max_hour_charge || '',
  });
  const [showSidebar, setShowSidebar] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState({});

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [spokenLanguages, setSpokenLanguages] = useState([]);

  const selectingAvailabilityRef = useRef(false);
  const [selectingAvailability, setSelectingAvailability] = useState(selectingAvailabilityRef.current);

  const handleSetSelectingAvailability = (type, open) => {
    selectingAvailabilityRef.current = open;
    // console.log(`handleSetSelectingAvailability(${type}, ${open}) - ${JSON.stringify(selectingAvailabilityRef)}`);
    setSelectingAvailability(selectingAvailabilityRef.current);
  };

  const indiaOptions = [
    { label: "₹200–₹500 (Starter Tutor)", value: "200-500" },
    { label: "₹500–₹1,000 (Skilled Tutor)", value: "500-1000" },
    { label: "₹1,000–₹2,000 (Experienced Tutor)", value: "1000-2000" },
    { label: "₹2,000–₹4,000 (Premium Mentor)", value: "2000-4000" },
    { label: "₹4,000+ (Elite Coach)", value: "4000-" },
  ];

  const otherOptions = [
    { label: "$5–$15(Beginner Tutors)", value: "5-15" },
    { label: "$15–$30(Intermediate Tutors)", value: "15-30" },
    { label: "$30–$60(Experienced Tutors)", value: "30-60" },
    { label: "$60+(Expert Tutors)", value: "60-" },
  ];

  const fetchCountries = async () => {
    const data = await getCountries();
    setCountries(data);
  };

  const fetchStates = async (country) => {
    const data = await getStatesByCountry({ country });
    if (Array.isArray(data) && !data.includes(formData.state)) {
      setFormData(prev => ({ ...prev, state: '', city: '' }));
      setCities([]);
    }
    setStates(data);
  };

  const fetchCities = async (country, state) => {
    const data = await getCitiesByState({ country, state });
    if (Array.isArray(data) && !data.includes(formData.city)) {
      setFormData(prev => ({ ...prev, city: '' }));
    }
    setCities(data);
  };

  const fetchCategories = async (args) => {
    const data = await getCategories();
    setCategories(data);

    if (args && args.all === true) {
      try {
        const allSubCategories = await Promise.all(
          data.map(cat => getSubCategories({ category: cat }))
        );
        // Flatten the array of arrays
        setSubCategories(allSubCategories.flat());
      } catch (error) {
        console.error("Failed to fetch all subcategories:", error);
      }
    }
  };

  const fetchSubCategories = async (category) => {
    const data = await getSubCategories({ category });
    if (Array.isArray(data) && Array.isArray(formData.subcategory)) {
      const filteredSubcats = formData.subcategory.filter(subcat => data.includes(subcat));
      if (filteredSubcats.length !== formData.subcategory.length) {
        setFormData(prev => ({ ...prev, subcategory: filteredSubcats }));
      }
    }
    setSubCategories(data);
  };

  const fetchSpokenLanguages = async () => {
    const data = await getSubCategories({ category: 'Languages' });
    setSpokenLanguages(data);
  };

  // Country change effect
  useEffect(() => {
    const selectedCountry = formData.country;
    if (selectedCountry && countries.includes(selectedCountry)) {
      fetchStates(selectedCountry);
    }
  }, [formData.country, countries]);

  // State change effect
  useEffect(() => {
    const selectedCountry = formData.country;
    const selectedState = formData.state;
    if (selectedCountry && selectedState && countries.includes(selectedCountry) && states.includes(selectedState)) {
      fetchCities(selectedCountry, selectedState);
    }
  }, [formData.state, formData.country, states, countries]);

  // Category change effect
  useEffect(() => {
    if (formData.category && categories.includes(formData.category)) {
      fetchSubCategories(formData.category);
    }
  }, [formData.category, categories]);

  // Set currency based on country
  useEffect(() => {
    if (formData.country && formData.country !== "") {
      const newCurrency = formData.country === "India" ? "INR" : "USD";
      setFormData(prev => ({ ...prev, currency: newCurrency }));
    }
  }, [formData.country]);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth <= 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);

    // Initial fetch of countries
    fetchCountries();
    fetchStates(formData.country || "India");
    fetchCities(formData.country || "India", formData.state || "Karnataka");
    fetchCategories({});
    fetchSubCategories(formData.category || "");
    fetchSpokenLanguages();

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const showErrorDialog = (title, message) => {
    setDialogData({
      title,
      message,
      color: "#dc2626",
      confirmText: "Okay",
    });
    setShowDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        showErrorDialog("Invalid File Type", "Please select a valid image file (jpg, jpeg, png, gif).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showErrorDialog("File Too Large", "Please select an image smaller than 5MB.");
        return;
      }

      const fileObject = URL.createObjectURL(file);
      setPreview(fileObject);
      try {
        await submitTutorForm({ ...user, emailId: formData.emailId, profilePhoto: file });
      } catch (error) {
        showErrorDialog('Update Error', error.toString());
      }
    }
  }

  const handleLogout = () => {
    setDialogData({
      title: "Logout",
      message: 'Are you sure you want to logout?',
      color: "#dc2626",
      confirmText: "Logout",
      onConfirm: () => {
        setShowDialog(false);
        logout();
      }
    });
    setShowDialog(true);
  };

  // --- VALIDATION FUNCTION ---
  const validateForm = () => {
    const errors = [];
    
    // --- Personal Details ---
    if (!formData.fullName) errors.push('Full Name is required.');
    if (!formData.country) errors.push('Country is required.');
    if (!formData.state) errors.push('State is required.');
    if (!formData.city) errors.push('City is required.');

    // --- Availability ---
    if (!formData.avl_days || formData.avl_days.length === 0) {
        errors.push('Availability (Days) is required.');
    }
    if (!formData.avl_time || formData.avl_time.length === 0) {
        errors.push('Availability (Time) is required.');
    }
    if (!formData.class_duration) errors.push('Class Duration is required.');
    if (!formData.students_per_class) {
        errors.push('Students Per Class is required.');
    } else if (parseInt(formData.students_per_class, 10) > 10 || parseInt(formData.students_per_class, 10) < 1) {
        errors.push('Students Per Class must be between 1 and 10.');
    }

    // --- Teaching Preferences ---
    if (!formData.tutoring_mode || formData.tutoring_mode.length === 0) {
        errors.push('Tutoring Mode is required (select at least one).');
    }
    
    const showPincodes = formData.tutoring_mode?.length !== 1 || formData.tutoring_mode?.includes('Online Tutoring') !== true;
    if (showPincodes && (!formData.pincodes || formData.pincodes.trim() === '')) {
        errors.push('Pin Codes are required.');
    }

    if (!formData.category) errors.push('Teaching Category is required.');
    if (!formData.subcategory || formData.subcategory.length === 0) {
        errors.push('Sub Category is required (select at least one).');
    }
    if (!formData.teaching_level) errors.push('Teaching Level is required.');

    if (formData.teaching_level?.toLowerCase() === "grade/class" && (!formData.age_group || formData.age_group.length === 0)) {
        errors.push('Age Group is required when Teaching Level is "Grade/Class".');
    }

    // --- Public Profile ---
    if (!formData.headline) {
        errors.push('Profile Headline is required.');
    } else if (formData.headline.length > 512) { // <-- UPDATED CHECK
        errors.push('Profile Headline must be 512 characters or less.');
    }

    if (!formData.bio) errors.push('About You (Bio) is required.');
    if (!formData.languages || formData.languages.length === 0) {
        errors.push('Spoken Languages are required (select at least one).');
    }
    if (!formData.currency) errors.push('Currency is required.');
    if (!formData.min_hour_charge) errors.push('Hourly Charge is required.');

    // --- Return errors ---
    if (errors.length > 0) {
        // Show the first error or a summary
        showErrorDialog('Missing Information', errors.join('\n'));
        return false; // Validation failed
    }

    return true; // Validation passed
  };

  // --- UPDATED SUBMIT FUNCTION ---
  const submitForm = async (e) => {
    // Prevent default form submission if it's an event
    if (e) e.preventDefault(); 

    // --- 1. Run Validation ---
    if (!validateForm()) {
        setLoading(false); // Make sure loading spinner stops
        return; // Stop submission if validation fails
    }

    // --- 2. Submit if validation passed ---
    try {
      setLoading(true);
      await submitTutorForm(formData);
      // Optional: Show success dialog
      setDialogData({
        title: "Success",
        message: "Your profile has been updated successfully!",
        color: "#16a34a", // Green
        confirmText: "ok",
      });
      setShowDialog(true);
    } catch (error) {
      showErrorDialog('Update Error', error.toString());
    } finally {
      setLoading(false);
    }
  };


  const getRangeValue = () => {
    const min = formData.min_hour_charge;
    const max = formData.max_hour_charge;
    if (!min) return "";
    if (!max || max === "") return `${min}-`;
    return `${min}-${max}`;
  };

  const handleRateRangeChange = (e) => {
    const range = e.target.value;
    if (!range) {
      setFormData((prev) => ({ ...prev, min_hour_charge: "", max_hour_charge: "" }));
      return;
    }
    const parts = range.split("-");
    const min = parseInt(parts[0], 10);
    const max = parts[1] ? parseInt(parts[1], 10).toString() : "";
    setFormData((prev) => ({
      ...prev,
      min_hour_charge: min.toString(),
      max_hour_charge: max,
    }));
  };

  const tutoringModes = formData.tutoring_mode || [];
  const showPincodes = !(tutoringModes.length === 1 && tutoringModes.includes('Online Tutoring'));

  return (
    <div className="tutor-account-container">
      <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
      <main className="tutor-account-content">
        <div className='tutor-account-header'>
          <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>&#9776;</button>
          <div className="title">Account</div>
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt />{isMobile ? '' : '   Logout'}
          </button>
        </div>
        <form className='form-details' onSubmit={submitForm}>
          {loading ? (<Loading />) : (
            <>
              <div className='personal-details'>
                <p className='header-title'>Personal Details</p>
                <div className='avatar'>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  {user.profilePhoto ? (
                    <img src={preview || `${import.meta.env.VITE_APP_BASE_URL}/${user.profilePhoto}`} alt="Profile" className="avatar-img" />
                  ) : (
                    user.fullName
                      ? user.fullName
                        .split(' ')
                        .map(name => name[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                      : '??'
                  )}
                  <FaUserEdit className='edit-icon' onClick={() => (fileInputRef.current.click())} />
                </div>
                <div className="form-group">
                  <label htmlFor="fullName" className="required">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender" className="required">
                    Gender
                  </label>
                  <select id="gender" name="gender" value={formData.gender} onChange={handleChange} disabled required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>


                <div className="form-group">
                  <label htmlFor="dateOfBirth" className="required">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={
                      formData.dateOfBirth && formData.dateOfBirth.includes("T")
                        ? formData.dateOfBirth.split("T")[0]
                        : formData.dateOfBirth || ""
                    }
                    onChange={handleChange}
                    required={true}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber" className="required">
                    Contact Number
                  </label>
                  <input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    placeholder="Contact Number"
                    pattern="\d*"
                    value={(formData.contactNumber || "").replace(/[^0-9]/g, "").slice(0, 17)}
                    onChange={handleChange}
                    required
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="required">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    pattern="\d*"
                    value={formData.emailId || ""}
                    onChange={handleChange}
                    required
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="required">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="state" className="required">
                    State
                  </label>
                  <select id="state" name="state" value={formData.state} onChange={handleChange} required>
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="city" className="required">
                    City
                  </label>
                  <select id="city" name="city" value={formData.city} onChange={handleChange} required>
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {showPincodes && (
                  <div className="form-group">
                    <label htmlFor="pincodes" className="required">
                      Preferred Locations (Pin Codes Upto 5)
                    </label>
                    <input
                      id="pincodes"
                      name="pincodes"
                      placeholder="Pin codes (Separated by comma)"
                      value={
                        (formData.pincodes || "")
                          .replace(/[^0-9,]/g, "") // allow only digits and commas
                          .replace(/(,{2,})/g, ",") // collapse multiple commas
                          .replace(/^,|,$/g, "") // trim leading/trailing commas
                          .replace(/(\d{6})(?=\d)/g, "$1,") // insert comma after every 6 digits if missing
                      }
                      maxLength={34}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="timezone" className="required">
                    Timezone
                  </label>
                  <input
                    id="timezone"
                    name="timezone"
                    placeholder="Timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    disabled
                    required
                  />
                </div>
              </div>
              <div className='other-details'>

                <p className='header-title'>Availability & Schedule</p>

                {/* --- MODIFICATION: Replaced two MultiSelects with one input --- */}
                <div className="form-group">
                  <label htmlFor="availability" className="required">
                    Availability
                  </label>
                  <input
                    type="text"
                    id="availability"
                    name="availability"
                    readOnly
                    onClick={() => handleSetSelectingAvailability('combined', true)}
                    value={
                      (formData.avl_days || []).length > 0 && (formData.avl_time || []).length > 0
                        ? `${formData.avl_days.join(', ')} · ${formData.avl_time.join(', ')}`
                        : "" // Let placeholder do the work
                    }
                    placeholder="Select your available days and times"
                    style={{ cursor: 'pointer' }}
                    required // Keep it required as the original fields were
                  />
                </div>
                {/* --- END MODIFICATION --- */}

                <div className="grid-2">
                  <div className="form-group">
                    <label className="required" htmlFor="class_duration">
                      Preferred Class Duration
                    </label>
                    <select
                      id="class_duration"
                      name="class_duration"
                      value={formData.class_duration}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Class Duration</option>
                      <option value="45 min">45 min</option>
                      <option value="60 min">60 min</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="students_per_class" className="required">
                      Max Students Per Class
                    </label>
                    <input
                      id="students_per_class"
                      name="students_per_class"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="Enter max students per class"
                      value={formData.students_per_class}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <p className='header-title'>Teaching Preferences</p>

                <div className="form-group">
                  <label htmlFor="tutoring_mode" className="required">
                    Tutoring Mode
                  </label>
                  <MultiSelect
                    name="tutoring_mode"
                    placeholder="Select Tutoring Mode"
                    options={["Home Tutoring", "At Tutor Place", "Online Tutoring"]}
                    value={formData.tutoring_mode || []}
                    onChange={(items) => setFormData((prev) => ({ ...prev, tutoring_mode: items }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category" className="required">
                    Teaching Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subcategory" className="required">
                    Sub Category
                  </label>
                  <MultiSelect
                    name="subcategory"
                    placeholder="Select Sub Category"
                    options={subCategories}
                    max={3}
                    value={formData.subcategory || []}
                    onChange={(items) => setFormData((prev) => ({ ...prev, subcategory: items }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="teaching_level" className="required">
                    Teaching Level
                  </label>
                  <select
                    id="teaching_level"
                    name="teaching_level"
                    value={formData.teaching_level}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Teaching Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Grade/Class">Grade/Class</option>
                  </select>
                </div>

                {formData.teaching_level.toLowerCase() === "grade/class" && (
                  <div className="form-group">
                    <label htmlFor="age_group" className="required">
                      Age Group
                    </label>
                    <MultiSelect
                      name="age_group"
                      placeholder="Select Age Groups"
                      max={3}
                      options={["Kids (5–12)", "Teens (13–18)", "College Students", "Working Professionals", "Adults (Hobby Learners)"]}
                      value={formData.age_group || []}
                      onChange={(items) => setFormData((prev) => ({ ...prev, age_group: items }))}
                    />
                  </div>
                )}


                <p className='header-title'>Public Profile Info</p>

                <div className="form-group">
                  <label htmlFor="headline" className="required">
                    Profile Headline
                  </label>
                  <input
                    id="headline"
                    name="headline"
                    placeholder="e.g., PhD in Mathematics with 10+ years of teaching"
                    value={formData.headline}
                    onChange={handleChange}
                    required
                    maxLength={512} // <-- UPDATED PROP
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio" className="required">
                    About You
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    placeholder="Mention background, teaching style, achievements etc"
                    value={formData.bio}
                    onChange={handleChange}
                    maxLength={2500}
                    required
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="achievement">
                    Achievements
                  </label>
                  <input
                    id="achievement"
                    name="achievement"
                    placeholder="Describe Your Achievements"
                    value={formData.achievement}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="languages" className="required">
                    Spoken Languages
                  </label>
                  <MultiSelect
                    name="languages"
                    placeholder="Select Spoken Languages"
                    options={spokenLanguages || []}
                    max={10}
                    value={formData.languages || []}
                    onChange={(items) => setFormData((prev) => ({ ...prev, languages: items }))}
                  />
                </div>

                <div className='grid-2'>
                  <div className="form-group">
                  <label htmlFor="currency" className="required">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Currency</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rateRange" className="required">
                    Hourly Charge ({formData.currency})
                  </label>
                  {(() => {
                    const isINR = formData.currency === "INR";
                    const options = isINR ? indiaOptions : otherOptions;
                    const currentRangeValue = getRangeValue();
                    return (
                      <select
                        id="rateRange"
                        name="rateRange"
                        value={currentRangeValue}
                        onChange={handleRateRangeChange}
                        required
                      >
                        <option value="">Select your rate range</option>
                        {options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
                </div>
                <p style={{
                  color: 'red',
                  fontSize: 'var(--font-size-sm)'
                }}>Rate will be updated automatically based on the duration selected by the student.</p>
              </div>
            </>
          )}
        </form>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignContent: 'end',
          marginLeft: 'auto',
          gap: '16px'
        }}>
        <button className='save-btn' onClick={submitForm}>Save Changes</button>
        </div>
      </main>
      <SlotSelector
        initialDays={formData.avl_days || []}
        initialSlots={formData.avl_time || []}
        onSelectionChange={(data) => {
          setSelectingAvailability(false);
          setFormData((form) => ({ ...form, ...data }))
        }}
        show={selectingAvailability}
      />
      <ConfirmDialog
        isOpen={showDialog}
        title={dialogData.title}
        message={dialogData.message || "No Message"}
        confirmText={dialogData.confirmText}
        cancelText="Cancel"
        confirmColor={dialogData.color}
        onConfirm={dialogData.onConfirm ||(() => {
          setShowDialog(false);
          navigate('/');
        })}
        onCancel={() => setShowDialog(false)}
      />
    </div>
  );
}