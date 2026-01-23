import './StudentAccount.css';
import { useAuth } from '../../../hooks/AuthProvider';
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaRegEdit, FaSignOutAlt, FaUserEdit } from 'react-icons/fa';
import ConfirmDialog from '../../../components/dialog/ConfirmDialog';
import { getCitiesByState, getCountries, getStatesByCountry } from '../../../data/modules/location-module';
import MultiSelect from '../../../components/multiselect/MultiSelect';
import { getCategories, getSubCategories } from '../../../data/modules/dynamic-module';
import { submitStudentForm, submitTutorForm } from '../../../data/modules/auth-module';
import Loading from "../../../components/loading/Loading";
import SlotSelector from '../../../components/slot_selector/slot_selector';
import { useNavigate } from 'react-router-dom';

export default function StudentAccount() {
  const navigate = useNavigate();
  // --- FIX 3: Get setUser to update context on save ---
  const { user, logout, setUser } = useAuth();

  // --- FIX 1: Add ref to stop useEffects from running on initial load ---
  const isInitialMount = useRef(true);

  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    emailId: user.email || '',
    contactNumber: user.contactNumber || '',
    country: user.country,
    state: user.state || '',
    city: user.city || '',
    pincodes: user.pincodes || '',
    timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    avl_days: user.avl_days || [],
    avl_time: user.avl_time || [],
    tutoring_mode: user.tutoring_mode || [],
    category: user.category || '',
    subcategory: user.subcategory || [],
    student_type: user.student_type || ''
  });

  const [isMobile, setIsMobile] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState({});

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const selectingAvailabilityRef = useRef(false);
  const [selectingAvailability, setSelectingAvailability] = useState(selectingAvailabilityRef.current);

  const handleSetSelectingAvailability = (type, open) => {
    selectingAvailabilityRef.current = open;
    setSelectingAvailability(selectingAvailabilityRef.current);
  };

  const fetchCountries = async () => {
    const data = await getCountries();
    setCountries(data);
    return data;
  };

  const fetchStates = async (country) => {
    const data = await getStatesByCountry({ country });
    setStates(data);
    return data;
  };

  const fetchCities = async (country, state) => {
    const data = await getCitiesByState({ country, state });
    setCities(data);
    return data;
  };

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
    return data;
  };

  const fetchSubCategories = async (category) => {
    const data = await getSubCategories({ category });
    setSubCategories(data);
    // Keep existing subcategories if they are valid for the new category
    if (Array.isArray(data) && Array.isArray(formData.subcategory)) {
      const filteredSubcats = formData.subcategory.filter(subcat => data.includes(subcat));
      setFormData(prev => ({ ...prev, subcategory: filteredSubcats }));
    }
    return data;
  };


  // --- FIX 1: Country change effect ---
  useEffect(() => {
    if (isInitialMount.current) return; // Don't run on initial load

    const selectedCountry = formData.country;
    if (selectedCountry && countries.includes(selectedCountry)) {
      fetchStates(selectedCountry);
    }
    setFormData(prev => ({
      ...prev,
      state: "",
      city: "",
    }));
    setStates([]);
    setCities([]);
  }, [formData.country]); // Only run when form's country value changes

  // --- FIX 1: State change effect ---
  useEffect(() => {
    if (isInitialMount.current) return; // Don't run on initial load

    const selectedCountry = formData.country;
    const selectedState = formData.state;
    if (selectedCountry && selectedState && countries.includes(selectedCountry) && states.includes(selectedState)) {
      fetchCities(selectedCountry, selectedState);
    }
    setFormData(prev => ({
      ...prev,
      city: "",
    }));
    setCities([]);
  }, [formData.state]); // Only run when form's state value changes

  // --- Category change effect ---
  useEffect(() => {
    if (isInitialMount.current) return; // Don't run on initial load

    if (formData.category && categories.includes(formData.category)) {
      fetchSubCategories(formData.category);
    } else {
      setSubCategories([]);
    }
  }, [formData.category]);


  // --- FIX 1: Modified Initial Load useEffect ---
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth <= 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);

    // Chain fetches to load data in order, THEN set isInitialMount to false
    const loadData = async () => {
      await fetchCountries();
      await fetchCategories();

      // Now that countries/categories are loaded, fetch dependent data from user
      if (user.country) {
        await fetchStates(user.country);
      }
      if (user.country && user.state) {
        await fetchCities(user.country, user.state);
      }
      if (user.category) {
        await fetchSubCategories(user.category);
      }

      // After all initial data is loaded, set initial mount to false
      isInitialMount.current = false;
    };

    loadData();

    return () => window.removeEventListener("resize", checkScreen);
  }, []); // Run only once

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
      // ... file validation ...
      const fileObject = URL.createObjectURL(file);
      setPreview(fileObject);
      try {
        const result = await submitStudentForm({ ...user, emailId: formData.emailId, profilePhoto: file });
        // --- FIX 3: Update user context ---
        if (result) {
          setUser(result);
        }
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

  // --- FIX 3: Modified submitForm ---
  const submitForm = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      setLoading(true);
      const result = await submitStudentForm(formData);
      if (result) {
        setUser(result); // Update the global user state
        setDialogData({
          title: "Success",
          message: "Your profile has been updated successfully!",
          color: "#16a34a", // Green
          confirmText: "Back To Search",
        });
        setShowDialog(true);
      }
    } catch (error) {
      showErrorDialog('Update Error', error.toString());
    }
    setLoading(false);
  };

  return (
    <div className="tutor-account-container">
      <main className="tutor-account-content">
        <div className='tutor-account-header'>
          <div className="title">Account</div>
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt />{isMobile ? '' : '   Logout'}
          </button>
        </div>
        {/* Reverted to your original form structure */}
        <form className='form-details'>
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
                    <img src={preview || `${import.meta.env.VITE_APP_BASE_URL}/${user.profilePhoto}`} alt="Profile" onError={(e) => { e.target.onerror = null; e.target.src = import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER; }} className="avatar-img" />
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
                  {/* <FaUserEdit className='edit-icon' onClick={() => (fileInputRef.current.click())} /> */}
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
                    disabled={!!user.contactNumber}
                  />
                </div>



                <div className="form-group">
                  <label htmlFor="student_type" className="required">
                    Role
                  </label>
                  <select
                    id="student_type"
                    name="student_type"
                    value={formData.student_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Role</option>
                    {/* --- FIX 2: Values are now lowercase --- */}
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>


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
                    Category
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
                    Subjects
                  </label>
                  <MultiSelect
                    name="subcategory"
                    placeholder="Select Subjects"
                    options={subCategories}
                    max={15}
                    value={formData.subcategory || []}
                    onChange={(items) => setFormData((prev) => ({ ...prev, subcategory: items }))}
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

                <div className='grid-2'>
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


                </div>

                {formData.tutoring_mode?.includes('Online Tutoring') === true && formData.tutoring_mode?.length === 1 ? (
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
                ) : <>
                  <div className='grid-2'>
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
                    <div className="form-group">
                      <label htmlFor="pincodes" className="required">
                        Preferred Pincode
                      </label>
                      <input
                        id="pincodes"
                        name="pincodes"
                        placeholder="Pin code"
                        value={
                          (formData.pincodes || "")
                            .replace(/[^0-9,]/g, "") // allow only digits and commas
                            .replace(/(,{2,})/g, ",") // collapse multiple commas
                            .replace(/^,|,$/g, "") // trim leading/trailing commas
                            .replace(/(\d{6})(?=\d)/g, "$1,") // insert comma after every 6 digits if missing
                        }
                        maxLength={6}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </>}


                <p className='header-title'>Schedule & Availability</p>

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
                    required
                  />
                </div>

              </div>
            </>
          )}
        </form>
        {/* Reverted to your original button */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignContent: 'end',
          marginLeft: 'auto',
          gap: '16px'
        }}>
          <button className='secondary-btn' type="button" onClick={() => navigate('/')}>Explore Tutors</button>
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
          if (dialogData.confirmText === 'Back To Search') {
          navigate('/');
          }
        })}
        onCancel={() => setShowDialog(false)}
      />
    </div>
  );
}

