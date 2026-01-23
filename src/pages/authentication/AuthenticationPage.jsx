import React, { useEffect, useRef, useState } from "react";
import "./AuthenticationPage.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/dialog/ConfirmDialog";
import MultiSelect from "../../components/multiselect/MultiSelect";
import GoogleLogin from "../../components/GoogleLogin";
import { submitStudentForm, submitTutorForm, signWithGoogle } from "../../data/modules/auth-module";
import { getCitiesByState, getCountries, getStatesByCountry } from "../../data/modules/location-module";
import { getCategories, getSubCategories } from "../../data/modules/dynamic-module";
import { useAuth } from "../../hooks/AuthProvider";
import SlotSelector from "../../components/slot_selector/slot_selector";
import { FaArrowLeft, FaCertificate, FaChalkboardTeacher, FaCheckCircle, FaListUl, FaMoneyBillWave, FaSearch, FaUserGraduate, FaUsers, FaUserTie } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AuthenticationPage() {
    const [isStudentOfOnlineTutoring, setIsStudentOfOnlineTutoring] = useState();
    const { setIsLoggedIn, setUser, logout } = useAuth(false);

    const location = useLocation();
    const navigate = useNavigate();

    const [formTitle, setFormTitle] = useState("");
    const isLoggingInRef = useRef(true);
    const role = useRef('tutor');
    const [isStudent, setIsStudent] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogData, setDialogData] = useState({});

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const selectingAvailabilityRef = useRef(false);
    const [selectingAvailability, setSelectingAvailability] = useState(selectingAvailabilityRef.current);

    const handleSetSelectingAvailability = (type, open) => {
        selectingAvailabilityRef.current = open;
        // console.log(`handleSetSelectingAvailability(${type}, ${open}) - ${JSON.stringify(selectingAvailabilityRef)}`);
        setSelectingAvailability(selectingAvailabilityRef.current);
    };

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    const [spokenLanguages, setSpokenLanguages] = useState(['Hindi', 'English']);

    const [step, setStep] = useState(1);


    const infoBulletPoints = {
        true: [ // student
            { text: 'Register and create your learning profile', icon: <FaUserGraduate className="infoIcon" /> },
            { text: 'Choose the subject or skill you want', icon: <FaListUl className="infoIcon" /> },
            { text: 'Get matched with the right tutor', icon: <FaSearch className="infoIcon" /> },
            { text: 'Learn online using our interactive board and receive downloadable notes for easy revision', icon: <FaChalkboardTeacher className="infoIcon" /> }
        ],
        false: [ // tutor
            { text: 'Register and complete your profile', icon: <FaUserTie className="infoIcon" /> },
            { text: 'We verify your expertise', icon: <FaCertificate className="infoIcon" /> },
            { text: 'Get matched with students or projects', icon: <FaUsers className="infoIcon" /> },
            { text: 'Teach / deliver work', icon: <FaCheckCircle className="infoIcon" /> },
            { text: 'Receive timely payments', icon: <FaMoneyBillWave className="infoIcon" /> }
        ]
    };

    const [formData, setFormData] = useState({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        profilePhoto: "",
        contactNumber: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        emailId: "",
        city: "",
        state: "",
        country: "",
        tutoring_mode: [],
        teaching_level: "",
        age_group: [],
        category: "",
        subcategory: [],
        highest_qualification: "",
        specialization: "",
        teaching_experience: 0,
        current_occupation: "",
        resume: "",
        certificates: [],
        govt_ids: [],
        addressProof: "",
        students_per_class: 1,
        avl_days: [],
        avl_time: [],
        class_duration: "",
        pincodes: "",
        headline: "",
        bio: "",
        achievement: "",
        languages: [],
        currency: "INR",
        min_hour_charge: "",
        max_hour_charge: "",
    });

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

    // Initialize based on route state
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const authType = searchParams.get('authType') || 'login';
        const userRole = searchParams.get('userRole') || 'tutor';
        role.current = userRole;
        const tutoring_mode = searchParams.get('tutoringMode');

        const isLoggingInNow = authType !== "registration";
        isLoggingInRef.current = isLoggingInNow;
        if (tutoring_mode) {
            setFormData((prev) => ({ ...prev, tutoring_mode: [tutoring_mode || ""] }));
        }
        setIsStudent(userRole === "student");
        const prefix = isLoggingInNow ? "Login With" : "Create";
        setFormTitle(userRole === "student" ? `${prefix} Your Student Account` : `${prefix} Your Tutor Account`);
        setIsStudentOfOnlineTutoring(userRole === 'student' && tutoring_mode === 'Online Tutoring');


        if (userRole !== "student") {
            fetchSpokenLanguages();
        }
    }, [location.search]);

    // Set currency based on country
    useEffect(() => {
        if (formData.country) {
            const newCurrency = formData.country === "India" ? "INR" : "USD";
            setFormData((prev) => ({ ...prev, currency: newCurrency }));
        }
    }, [formData.country]);

    // Fetch countries on mount for registration
    useEffect(() => {
        if (!isLoggingInRef.current) {
            fetchCountries();
        }
    }, [isLoggingInRef.current]);

    // Country change effect
    useEffect(() => {
        const selectedCountry = formData.country;
        if (selectedCountry && countries.includes(selectedCountry)) {
            fetchStates(selectedCountry);
        } else {
            setFormData((prev) => ({
                ...prev,
                state: "",
                city: "",
            }));
            setStates([]);
        }
    }, [formData.country, countries]);

    // State change effect
    useEffect(() => {
        const selectedCountry = formData.country;
        const selectedState = formData.state;
        if (selectedCountry && selectedState && countries.includes(selectedCountry) && states.includes(selectedState)) {
            fetchCities(selectedCountry, selectedState);
        }
        setFormData((prev) => ({
            ...prev,
            city: "",
        }));
        setCities([]);
    }, [formData.state, formData.country, states, countries]);

    // Category change effect
    useEffect(() => {
        if (formData.category && categories.includes(formData.category)) {
            fetchSubCategories(formData.category);
        } else {
            setSubCategories([]);
            setFormData((prev) => ({
                ...prev,
                subcategory: [],
            }));
        }
    }, [formData.category, categories]);

    useEffect(() => {
        // Fetch categories on step 2 for tutors
        if (step === 2 && !isLoggingInRef.current && !isStudent) {
            Promise.all([
                fetchCategories(), // Fetch main categories
                fetchCountries()
            ]);
        }

        if (step === 1) {
            if (isLoggingInRef.current) {
                setFormTitle('Login Into Your Account');
            } else {
                setFormTitle(isStudent ? 'Join Xplooreze — Learn Smarter, Grow Faster' : 'Become a Tutor with Xplooreze');
            }
        } else if (step === 2) {
            setFormTitle("Fill Your Personal Details"); // Title for Tutor
        } else if (step === 3) {
            setFormTitle("Fill Teaching Preferences"); // Title for Tutor
        } else if (step === 4) {
            setFormTitle("Fill Professional Details");
        } else if (step === 5) {
            setFormTitle("Set Availability & Schedule");
        } else if (step === 6) {
            setFormTitle("Setup Public Profile");
        }
    }, [step, isStudent]);

    const fetchCountries = async () => {
        const data = await getCountries();
        setCountries(data);
        setFormData((prev) => ({
            ...prev,
            country: "India",
            state: "",
            city: "",
        }));
    };

    const fetchStates = async (country) => {
        const data = await getStatesByCountry({ country });
        setStates(data);
    };

    const fetchCities = async (country, state) => {
        const data = await getCitiesByState({ country, state });
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
        setSubCategories(data);
        if (!data.some(subcat => (formData.subcategory || []).includes(subCategories))) {
            setFormData(prev => ({ ...prev, subcategory: [] }));
        }
    };

    const fetchSpokenLanguages = async () => {
        const data = await getSubCategories({ category: 'Languages' });
        setSpokenLanguages(data);
    };

    const showErrorDialog = (title, message) => {
        setDialogData({
            title,
            message,
            color: "#dc2626",
            confirmText: "Okay",
        });
        setShowDialog(true);
    };

    const handleGoogleSignIn = async (response) => {
        if (response?.credential) {
            try {
                const result = await signWithGoogle(response.credential, role.current);

                // Block 1: User already exists and has a submitted form
                if ((result.role === 'student' || result.role === 'tutor') && result.isFormSubmitted === true) {
                    if (isLoggingInRef.current || (role.current === 'student' && result.role === 'student') || (role.current === 'tutor' && result.role === 'tutor')) {
                        // Correct login (login page or matching registration role)
                        setUser(result);
                        setIsLoggedIn(true);
                        navigate('/');
                    } else {
                        // Registration role mismatch (e.g., trying to register as tutor but has student account)
                        await logout();
                        showErrorDialog('Account Exists', `You already have an account as ${result.role}.`);
                    }

                    // Block 2: New user or user with incomplete form
                } else {
                    if (isLoggingInRef.current === false) { // === "is registering"

                        // --- THIS IS THE FIX ---
                        // Use role.current (from URL) not isStudent (from state)
                        if (role.current === 'student') {
                            // If they are registering as a student, log them in immediately.
                            setUser(result);
                            setIsLoggedIn(true);
                            navigate('/'); // Go straight to homepage
                        } else {
                            // If they are registering as a TUTOR, go to step 2
                            setFormData((prev) => ({
                                ...prev,
                                fullName: result.fullName,
                                emailId: result.email
                            }));
                            setStep(2);
                        }

                    } else { // === "is logging in"
                        // They tried to log in, but no account exists (or form isn't submitted)

                        if (result.role === 'student') {
                            // They are on the login page, have a student account, but form is not submitted.
                            // Per new request, just log them in.
                            setUser(result);
                            setIsLoggedIn(true);
                            navigate('/');
                        } else {
                            // They are on the login page, have a tutor account (form not submitted), OR no account.
                            // In either case, show "Account Not Found" because they can't log in.
                            showErrorDialog('Account Not Found', 'No account exists with this email. Create one to proceed.');
                        }
                    }
                }
            } catch (error) {
                showErrorDialog("Login Failed", `${error}`);
            }
        } else {
            showErrorDialog("Login Failed", "Google login failed");
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, files, options, multiple } = e.target;

        if (type === "file") {
            if (multiple) {
                const fileArray = Array.from(files);
                if (fileArray.length > 5) {
                    showErrorDialog("Too Many Files", "You can only upload up to 5 files.");
                    e.target.value = "";
                    return;
                }
                setFormData((prev) => ({ ...prev, [name]: fileArray }));
            } else {
                setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
            }
        } else if (multiple) {
            const selectedValues = Array.from(options)
                .filter((option) => option.selected)
                .map((option) => option.value);
            setFormData((prev) => ({ ...prev, [name]: selectedValues }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const validateAge = () => {
        const dob = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age >= 18;
    };

    const handleNextStep = (e) => {
        e.preventDefault();

        if (step === 1) {
            if (isLoggingInRef.current) {
                // This shouldn't happen as login has no submit button
                return;
            }
            setStep(2); // Move to tutor step 2
        } else if (step === 2) {
            // Tutor validation
            if (!validateAge()) {
                showErrorDialog("Error", "You must be at least 18 years old.");
                return;
            }
            fetchCategories();
            setStep(3);
        } else if (step === 3) {
            setStep(4);
        } else if (step === 4) {
            setStep(5);
        } else if (step === 5) {
            // Add validation for tutor availability before moving on
            if (formData.avl_days.length === 0 || formData.avl_time.length === 0) {
                showErrorDialog("Error", "Please select your availability.");
                return;
            }
            setStep(6);
        } else if (step === 6) {
            handleFormSubmit(e);
        }
    };

    const handlePreviousStep = (e) => {
        e.preventDefault();
        const prevStep = step - 1;
        setStep(prevStep);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formData.fullName.trim()) {
            showErrorDialog("Error", "Please enter your full name.");
            return;
        }

        // Tutor-specific validation
        const experience = Number(formData.teaching_experience);
        if (isNaN(experience) || experience < 0) {
            showErrorDialog("Error", "Please enter a valid experience (0 or more).");
            return;
        }

        if (experience > 50) {
            showErrorDialog("Error", "Teaching experience cannot exceed 50 years.");
            return;
        }

        if (formData.avl_days.length === 0 || formData.avl_time.length === 0) {
            showErrorDialog("Error", "Please select your availability (from Step 5).");
            return;
        }

        try {
            // Only tutors will submit this form
            const result = await submitTutorForm(formData);

            setUser(result);
            setIsLoggedIn(true);
            navigate('/');
        } catch (error) {
            showErrorDialog('Account Creation Failed', error.toString());
        }
    };

    const renderStepContent = () => {
        if (isLoggingInRef.current || step === 1) {
            return (
                <div className="actions">
                    <GoogleLogin handleResponse={handleGoogleSignIn} />

                    {/* <button className="back-to-home-btn">Back to home</button> */}

                    <p className="confirmation">
                        By continuing, you agree to our{" "}
                        <Link to="/terms-and-conditions">
                            Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy-policy">
                            Privacy Policy
                        </Link>.
                    </p>
                </div>
            );
        }

        if (step === 2) {
            return (
                <>
                    {/* --- TUTOR STEP 2: Personal Details --- */}
                    <div className="form-group">
                        <label htmlFor="fullName" className="required">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="gender" className="required">
                                Gender
                            </label>
                            <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} required>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="dateOfBirth" className="required">Date of Birth</label>
                            <DatePicker
                                id="dateOfBirth"
                                selected={formData.dateOfBirth}
                                onChange={(date) =>
                                    setFormData((prev) => ({ ...prev, dateOfBirth: date }))
                                }
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select your birthday"
                                className="date-picker-input"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 125))}
                                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                                yearDropdownItemNumber={125}
                                scrollableYearDropdown
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="profilePhoto" className="required">
                            Profile Photo
                        </label>
                        <input
                            type="file"
                            id="profilePhoto"
                            name="profilePhoto"
                            accept="image/*"
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="country" className="required">
                                Country
                            </label>
                            <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="state" className="required">
                                State
                            </label>
                            <select id="state" name="state" value={formData.state} onChange={handleInputChange} required>
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
                            <select id="city" name="city" value={formData.city} onChange={handleInputChange} required>
                                <option value="">Select City</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </>
            );
        }

        if (step === 3) {
            // --- TUTOR STEP 3: Teaching Preferences ---
            const tutoringModes = formData.tutoring_mode || [];

            const requiresAddressProof = true;

            return (
                <>
                    <div className="form-group">
                        <label htmlFor="tutoring_mode" className="required">
                            Tutoring Mode
                        </label>
                        <MultiSelect
                            name="tutoring_mode"
                            placeholder="Select Tutoring Mode"
                            options={["Home Tutoring", "At Tutor Place", "Online Tutoring"]}
                            value={tutoringModes}
                            onChange={(items) => setFormData((prev) => ({ ...prev, tutoring_mode: items }))}
                        />
                    </div>

                    {requiresAddressProof && (
                        <div className="form-group">
                            <label htmlFor="addressProof" className="required">
                                Address Proof
                            </label>
                            <input
                                type="file"
                                id="addressProof"
                                name="addressProof"
                                accept=".pdf,.doc,.docx,.jpg,.png"
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="category" className="required">
                            Teaching Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
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
                            onChange={handleInputChange}
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
                </>
            );
        }

        if (step === 4) {
            // Tutor Only
            return (
                <>
                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="highest_qualification" className="required">
                                Highest Qualification
                            </label>
                            <select
                                id="highest_qualification"
                                name="highest_qualification"
                                value={formData.highest_qualification}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Qualification</option>
                                <option value="10th or below 10th">10th or below 10th</option>
                                <option value="12th Pass">12th Pass</option>
                                <option value="Diploma">Diploma</option>
                                <option value="ITI">ITI</option>
                                <option value="Graduate">Graduate</option>
                                <option value="Post Graduate">Post Graduate</option>
                                <option value="PhD">PhD</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="required" htmlFor="specialization">
                                Specialization
                            </label>
                            <input
                                id="specialization"
                                name="specialization"
                                type="text"
                                placeholder="E.g. Mathematics, Physics, English..."
                                value={formData.specialization}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="required" htmlFor="current_occupation">
                                Current Occupation
                            </label>
                            <select
                                id="current_occupation"
                                name="current_occupation"
                                value={formData.current_occupation}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Occupation</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Freelancer">Freelancer</option>
                                <option value="Working Professional">Working Professional</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="teaching_experience" className="required">
                                Teaching Experience (years)
                            </label>
                            <input
                                id="teaching_experience"
                                name="teaching_experience"
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Enter number of years"
                                value={formData.teaching_experience}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="resume">Upload Resume</label>
                        <input
                            type="file"
                            id="resume"
                            name="resume"
                            accept=".pdf,.doc,.docx"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="required" htmlFor="certificates">
                            Upload Certificates (Degree / Award / Other)
                        </label>
                        <input
                            type="file"
                            id="certificates"
                            name="certificates"
                            accept=".pdf,.jpg,.png"
                            multiple
                            onChange={handleInputChange}
                            required
                        />
                        {/* Added helper text */}
                        <small style={{ color: '#dc2626', textAlign: 'start', fontSize: 'var(--font-size-xs)' }}>
                            Please ensure that the certificates uploaded correspond to the subject(s) you wish to teach.
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="govt_ids" className="required">
                            Government ID Proof (Aadhar / Passport / Pan / Other)
                        </label>
                        <input
                            type="file"
                            id="govt_ids"
                            name="govt_ids"
                            accept=".pdf,.jpg,.png"
                            multiple
                            onChange={handleInputChange}
                            required
                        />
                        {/* Added helper text */}
                        <small style={{ color: '#dc2626', textAlign: 'start', fontSize: 'var(--font-size-xs)' }}>
                            Upload a government ID with address proof (like Aadhaar, Voter ID, or Driving Licence).
                        </small>
                    </div>
                </>
            );
        }

        if (step === 5) {
            // Tutor Only

            // --- UPDATED LOGIC ---
            // Convert all selected modes to lowercase for reliable comparison
            const tutoringModes = (formData.tutoring_mode || []).map(mode => mode.toLowerCase());

            // The pincode field is needed if the user has selected any mode that is NOT "online tutoring"
            // i.e. it doesn't ONLY contain "online tutoring"
            const needsPincodes = tutoringModes.length > 0 && tutoringModes.some(mode => mode !== 'online tutoring');
            // --- END UPDATED LOGIC ---

            return (
                <>
                    <div className="form-group">
                        <label htmlFor="availability-tutor" className="required">
                            Availability
                        </label>
                        <input
                            type="text"
                            id="availability-tutor"
                            name="availability"
                            readOnly
                            onClick={() => handleSetSelectingAvailability('combined', true)}
                            value={
                                (formData.avl_days || []).length > 0 && (formData.avl_time || []).length > 0
                                    ? `${formData.avl_days.join(', ')} · ${formData.avl_time.join(', ')}`
                                    : ""
                            }
                            placeholder="Select your available days and times"
                            style={{ cursor: 'pointer' }}
                        />
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
                            onChange={handleInputChange}
                            disabled
                            required
                        />
                    </div>

                    <div className="grid-2">
                        <div className="form-group">
                            <label className="required" htmlFor="class_duration">
                                Preferred Class Duration
                            </label>
                            <select
                                id="class_duration"
                                name="class_duration"
                                value={formData.class_duration}
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    {/* --- UPDATED CONDITIONAL RENDER --- */}
                    {needsPincodes && (
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
                                onChange={handleInputChange}
                                required={needsPincodes} // Make required conditional
                            />
                        </div>
                    )}
                </>
            );
        }

        if (step === 6) {
            // Tutor Only
            const getRangeValue = () => {
                const min = formData.min_hour_charge;
                const max = formData.max_hour_charge;
                if (!min) return "";
                if (!max || max === "") return `${min}-`;
                return `${min}-${max}`;
            };
            const currentRangeValue = getRangeValue();
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

            return (
                <>
                    <div className="form-group">
                        <label htmlFor="headline" className="required">
                            Profile Headline
                        </label>
                        <input
                            id="headline"
                            name="headline"
                            placeholder="e.g., PhD in Mathematics with 10+ years of teaching"
                            value={formData.headline}
                            onChange={handleInputChange}
                            required
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
                            onChange={handleInputChange}
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
                            onChange={handleInputChange}
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

                    <div className="grid-2">
                        <div className="form-group">
                            <label htmlFor="currency" className="required">
                                Currency
                            </label>
                            <select
                                id="currency"
                                name="currency"
                                value={formData.currency}
                                onChange={handleInputChange}
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
                    {/* Added helper text */}
                        <small style={{ color: '#dc2626', textAlign: 'start', fontSize: 'var(--font-size-xs)' }}>
                            Rate will be updated automatically based on the duration selected by the student. 
                        </small>
                </>
            );
        }

        return null;
    };

    const isFinalStep = step === 6;

    return (
        <div className="authentication-root">
            {(step > 1 || isLoggingInRef.current) && (<div className="side-bar">
                {step > 1 && <FaArrowLeft className="back-icon" onClick={handlePreviousStep} />}
                {isStudentOfOnlineTutoring != null && (<video
                    autoPlay
                    muted
                    // loop
                    playsInline
                    aria-hidden="true"
                    preload="auto"
                >
                    <source src={isStudentOfOnlineTutoring ? '/online-tutoring-animation.mp4' : isStudent ? '/login-animation.mp4' : '/tutor-login-animation.mp4'} type="video/mp4" />
                    {/* Fallback image if video unsupported */}
                </video>)}
                {/* <div className="logo-container">
                    <img src="/app-logo.png" alt="App Logo" />
                </div>
                <img src="/3698692.png" alt="Sidebar Image" /> */}
            </div>)}
            <div className="authentication-container">
                <div className="authentication-box">
                     <img className="login-app-logo" src="/app-logo-black.png" alt="App Logo" />

                    {/* <h2>Hello {selectingAvailability ? 'True' : 'False'}</h2> */}
                    <h2>{formTitle}</h2>

                    {isStudentOfOnlineTutoring != null && step < 2 && !isLoggingInRef.current && (<>
                    <p style={{
                        color: 'black',
  justifyContent: 'center',
  textAlign: 'center'
                    }}>{isStudent ? 'Find tutors for everything — from school academics to college subjects, competitive exams, languages, and real-world skills.' : 'Share your expertise. Earn from anywhere. Teach on your schedule.'}</p>
                    <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="home-mascot"
                    aria-hidden="true"
                    preload="auto"
                >
                    <source src={isStudentOfOnlineTutoring ? '/online-tutoring-animation.mp4' : isStudent ? '/login-animation.mp4' : '/tutor-login-animation.mp4'} type="video/mp4" />
                    {/* Fallback image if video unsupported */}
                </video>
                </>)}

                    <form className="form" onSubmit={isFinalStep ? handleFormSubmit : handleNextStep}>
                        {renderStepContent()}

                        {/* This block will now only show for Tutors */}
                        {step > 1 && (
                            <div className="actions">
                                <button className="submit-btn" type="submit">
                                    {isFinalStep ? "Create Account" : "Continue"}
                                </button>
                                {window.innerWidth <= 768 && (<button className="back-btn" type="button" onClick={handlePreviousStep}>
                                    Back
                                </button>)}
                            </div>
                        )}
                    </form>
                </div>
            </div>
            {(step < 2 && !isLoggingInRef.current) && (<div className="registration-info">
                <h2>{'Who Can Join'}</h2>
                <p>{isStudent ? 'Students and professionals looking for personalised and flexible learning system.' : 'Anyone skilled in a subject — school, college, competitive exams, skills, languages, or academic writing/research.'}</p>
                <h2>{'How It Works'}</h2>
                <div className="info-points-root">{infoBulletPoints[isStudent].map(data => (<p key={data.text}>{data.icon} {data.text}</p>))}</div>
                <button className="primary-btn" onClick={() => navigate('/')}>Back To Home</button>
            </div>)}
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
                onConfirm={() => setShowDialog(false)}
                onCancel={() => setShowDialog(false)}
            />
        </div>
    );
}