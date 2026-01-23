import { useParams, useNavigate, useLocation } from "react-router-dom";
import './TutorDetail.css';
import { useEffect, useState, useMemo } from "react";
// --- 1. IMPORT checkTrialAvailability ---
import { bookTutor, getTutor, getTutors, checkTrialAvailability } from "../../../data/modules/student-module";
import Loading from "../../../components/loading/Loading";
import { FaClock, FaHourglass, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaRedo } from "react-icons/fa";
import TutorCard from "../../../components/tutor-card/TutorCard";
import MultiSelect from "../../../components/multiselect/MultiSelect";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../../hooks/AuthProvider";
import StarRating from "../../../components/star-rating/StarRating";

const safeArray = (data) => Array.isArray(data) ? data : [];

// --- Helper functions for date formatting (Unchanged) ---
const formatDateRange = (start, end) => {
    const options = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    const year = start.getFullYear();

    if (start.getMonth() === end.getMonth()) {
        return `${startStr.split(' ')[0]} ${start.getDate()} - ${end.getDate()}, ${year}`;
    }
    return `${startStr} - ${endStr}, ${year}`;
};

const getSevenDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
    }
    return days;
};

const getAvailabilityMap = (avl_days, avl_time) => {
    const map = {
        'Sun': [], 'Mon': [], 'Tue': [], 'Wed': [], 'Thu': [], 'Fri': [], 'Sat': []
    };
    if (!avl_days || !avl_time || avl_days.length === 0 || avl_time.length === 0) {
        return map;
    }
    const sortedTimes = [...avl_time].sort();
    for (const day of avl_days) {
        if (map.hasOwnProperty(day)) {
            map[day] = sortedTimes;
        }
    }
    return map;
};
// --- End Helper Functions ---

// --- TutorAvailabilityCalendar Component (Unchanged) ---
function TutorAvailabilityCalendar({ tutor }) {
    const [today] = useState(() => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        return todayDate;
    });

    const [currentStartDate, setCurrentStartDate] = useState(today);

    const sevenDays = useMemo(() => getSevenDays(currentStartDate), [currentStartDate]);

    const availabilityMap = useMemo(() => {
        return getAvailabilityMap(tutor.avl_days, tutor.avl_time);
    }, [tutor.avl_days, tutor.avl_time]);

    const dateRangeStr = useMemo(() => {
        return formatDateRange(sevenDays[0], sevenDays[6]);
    }, [sevenDays]);

    const goToPrevWeek = () => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() - 7);
            return newDate;
        });
    };

    const goToNextWeek = () => {
        setCurrentStartDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + 7);
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentStartDate(today);
    };

    const isViewingToday = useMemo(() => {
        const todayTime = today.getTime();
        const viewStartTime = sevenDays[0].getTime();
        const viewEndTime = sevenDays[6].getTime();
        return todayTime >= viewStartTime && todayTime <= viewEndTime;
    }, [sevenDays, today]);

    const isToday = (date) => date.toDateString() === today.toDateString();

    return (
        <div className="availability-calendar">
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button onClick={goToPrevWeek}><FaChevronLeft /></button>
                    <button onClick={goToNextWeek}><FaChevronRight /></button>
                    {!isViewingToday && (
                        <button className="calendar-reset-btn" onClick={goToToday} title="Go to today">
                            <FaRedo />
                        </button>
                    )}
                </div>
                <div className="calendar-date-range">{dateRangeStr}</div>
                <div className="calendar-timezone">
                    {tutor.timezone || 'Asia/Kolkata'}
                </div>
            </div>
            <div className="calendar-grid">
                {sevenDays.map(date => {
                    const dayNameShort = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNumber = date.getDate();
                    const times = availabilityMap[dayNameShort];
                    const isCurrentDay = isToday(date);

                    return (
                        <div key={date.toISOString()} className={`calendar-day-column ${isCurrentDay ? 'today' : ''}`}>
                            <div className="calendar-day-header">
                                <span className="day-name">{dayNameShort.toUpperCase()}</span>
                                <span className={`day-number ${isCurrentDay ? 'today' : ''}`}>{dayNumber}</span>
                            </div>
                            <div className="calendar-time-slot-list">
                                {times && times.length > 0 ? (
                                    times.map(time => (
                                        <div key={time} className="calendar-time-text">
                                            {time}
                                        </div>
                                    ))
                                ) : (
                                    <span className="no-availability">-</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
// --- END COMPONENT ---

export default function TutorDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();


    const [tutor, setTutor] = useState(null);
    const [tutors, setTutors] = useState([]);

    // States
    const [error, setError] = useState(null);
    const [isLoading, setLoading] = useState(true);
    // --- 2. ADD canTrial STATE ---
    const [canTrial, setCanTrial] = useState(false);

    const [isTrial, setIsTrial] = useState(false);

    const [bookingForm, setBookingForm] = useState({
        subject: '',
        price: '',
        currency: '',
        tutoringMode: [],
        sessionType: 'single',
        dateRange: null,
        availableDays: [],
        startTime: '',
        endTime: ''
    });
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [timeError, setTimeError] = useState('');
    const [showForm, setShowForm] = useState(true);

    // Check for student profile completion
    const isProfileComplete =
        user &&
        user.isFormSubmitted;

    const subcategories = safeArray(tutor?.subcategory);
    const tutoringModes = safeArray(tutor?.tutoring_mode);
    const tutorMinPrice = tutor?.min_hour_charge || '';
    const tutorMaxPrice = tutor?.max_hour_charge || (tutor?.min_hour_charge ? null : ''); // Handle null max price
    const tutorCurrency = tutor?.currency || 'INR';

    // --- Helper for displaying price range (handles null max) ---
    const priceRangeString = useMemo(() => {
        if (!tutorMinPrice) return 'Not set';
        if (tutorMaxPrice === null) return `${tutorMinPrice}+ ${tutorCurrency}`;
        return `${tutorMinPrice}-${tutorMaxPrice} ${tutorCurrency}`;
    }, [tutorMinPrice, tutorMaxPrice, tutorCurrency]);

    async function fetchTutor() {
        try {
            const tutorData = await getTutor({ tutorId: id });
            setTutor(tutorData);
            setBookingForm(prev => ({
                ...prev,
                currency: tutorData.currency || 'INR',
            }));
        } catch (error) {
            setError('Tutor not found');
            console.log('Error while receiving tutor details', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchTutors() {
        try {
            const { tutors, pagination } = await getTutors(new URLSearchParams({ similarTo: id, limit: 10 }));
            console.log(tutors);
            setTutors(tutors);
        } catch (error) {
            console.log('Error while receiving tutors', error);
        }
    }

    // This useEffect fetches tutor-specific data
    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchTutor();
        }
        fetchTutors()
    }, [id]);

    // --- 3. ADD useEffect to fetch trial status ---
    useEffect(() => {
        // This fetches student-specific data
        async function fetchTrialStatus() {
            try {
                const data = await checkTrialAvailability();
                setCanTrial(data.canTakeTrial);
            } catch (error) {
                console.error('Error fetching trial status:', error);
                setCanTrial(false);
            }
        }

        fetchTrialStatus();

        // This checks the URL for ?trial=true
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('trial') === 'true') {
            setIsTrial(true);
        } else {
            setIsTrial(false);
        }
    }, [location.search]); // Re-run if URL search param changes

    // Auto-select single mode if tutor has only one
    useEffect(() => {
        if (tutoringModes.length === 1) {
            setBookingForm(prev => ({
                ...prev,
                tutoringMode: [tutoringModes[0]]
            }));
        }
    }, [tutoringModes]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        let newForm = { ...bookingForm, [name]: value };

        if (name === 'startTime') {
            setTimeError('');
        }

        if (name === 'sessionType' && value !== bookingForm.sessionType) {
            newForm.dateRange = null;
            if (value === 'single') {
                newForm.availableDays = [];
            }
        }

        if (isTrial && name === 'startTime') {
            if (value) {
                const [hours, minutes] = value.split(':').map(Number);

                // Check if time is past 23:34
                if (hours === 23 && minutes > 34) {
                    // --- 1. UPDATE ERROR MESSAGE ---
                    setTimeError('Trial start time must be before 23:35. To book a later time, please select the next day.');
                    newForm.endTime = ''; // Clear end time
                } else {
                    setTimeError(''); // Clear error
                    const startDate = new Date();
                    startDate.setHours(hours);
                    startDate.setMinutes(minutes);
                    startDate.setSeconds(0);
                    startDate.setMilliseconds(0);

                    const endDate = new Date(startDate.getTime() + 25 * 60 * 1000);

                    const endHours = endDate.getHours().toString().padStart(2, '0');
                    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

                    newForm.endTime = `${endHours}:${endMinutes}`;
                }
            } else {
                newForm.endTime = '';
                setTimeError(''); // Clear error if empty
            }
        }

        setBookingForm(newForm);
    };

    const handleMultiSelectChange = (name, selectedItems) => {
        setBookingForm({
            ...bookingForm,
            [name]: selectedItems
        });
    };

    const handleDateRangeChange = (update) => {
        setBookingForm({
            ...bookingForm,
            dateRange: update
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess(false);

        if (!isProfileComplete) {
            setSubmitError('Please complete your profile before booking.');
            setShowForm(false);
            return;
        }

        try {
            const isSingleSession = isTrial || bookingForm.sessionType === 'single';

            if (!bookingForm.subject) {
                setSubmitError('Please select a subject.');
                setShowForm(false);
                return;
            }

            if (!isTrial) {
                const price = parseFloat(bookingForm.price);
                if (isNaN(price) || price < tutorMinPrice) {
                    setSubmitError(`Price must be at least ${tutorMinPrice} ${tutorCurrency}.`);
                    setShowForm(false);
                    return;
                }
                if (tutorMaxPrice !== null && price > tutorMaxPrice) {
                    setSubmitError(`Price must be between ${tutorMinPrice} and ${tutorMaxPrice} ${tutorCurrency}.`);
                    setShowForm(false);
                    return;
                }
            }

            if (!bookingForm.tutoringMode.length) {
                setSubmitError('Please select at least one tutoring mode.');
                setShowForm(false);
                return;
            }

            if (isSingleSession) {
                if (!bookingForm.dateRange || !(bookingForm.dateRange instanceof Date)) {
                    setSubmitError('Please select a single date.');
                    setShowForm(false);
                    return;
                }
            } else {
                if (!bookingForm.dateRange || !Array.isArray(bookingForm.dateRange) || bookingForm.dateRange.length !== 2) {
                    setSubmitError('Please select a date range.');
                    setShowForm(false);
                    return;
                }
                if (!bookingForm.availableDays.length) {
                    setSubmitError('Please select available days.');
                    setShowForm(false);
                    return;
                }
                const [startDate, endDate] = bookingForm.dateRange;
                if (endDate <= startDate) {
                    setSubmitError('End date must be after start date.');
                    setShowForm(false);
                    return;
                }
            }

            if (!bookingForm.startTime) {
                setSubmitError('Please select a start time.');
                setShowForm(false);
                return;
            }

            if (isTrial) {
                const [hours, minutes] = bookingForm.startTime.split(':').map(Number);
                if (hours === 23 && minutes > 34) {
                    // --- 2. UPDATE ERROR MESSAGE ---
                    setSubmitError('Trial start time must be before 23:35. To book a later time, please select the next day.');
                    setShowForm(false);
                    return;
                }
            }

            if (!isTrial) {
                if (!bookingForm.endTime) {
                    setSubmitError('Please select an end time.');
                    setShowForm(false);
                    return;
                }

                const startDateTime = new Date(`2000-01-01T${bookingForm.startTime}:00`);
                const endDateTime = new Date(`2000-01-01T${bookingForm.endTime}:00`);

                if (endDateTime <= startDateTime) {
                    setSubmitError('End time must be after start time.');
                    setShowForm(false);
                    return;
                }

                if (endDateTime - startDateTime < 45 * 60 * 1000) {
                    setSubmitError('The end time must be at least 45 minutes after the start time.');
                    setShowForm(false);
                    return;
                }
            }

            let startDate, endDate;
            if (isSingleSession) {
                startDate = bookingForm.dateRange;
                endDate = null;
            } else {
                [startDate, endDate] = bookingForm.dateRange;
            }

            const submitData = {
                tutorId: id,
                subject: bookingForm.subject,
                price: isTrial ? 0 : parseFloat(bookingForm.price),
                currency: bookingForm.currency,
                tutoringMode: bookingForm.tutoringMode,
                sessionType: isTrial ? 'single' : bookingForm.sessionType,
                startDate: startDate.toISOString(),
                endDate: endDate ? endDate.toISOString() : null,
                availableDays: isSingleSession ? [] : bookingForm.availableDays,
                startTime: bookingForm.startTime,
                endTime: bookingForm.endTime,
                isTrial: isTrial
            };

            await bookTutor(submitData);

            setSubmitSuccess(true);
            setShowForm(false);

        } catch (error) {
            setSubmitError(error?.message || error || 'Failed to submit booking. Please try again.');
            setShowForm(false);
        }
    };

    const handleTryAgain = () => {
        setSubmitError('');
        setSubmitSuccess(false);
        setShowForm(true);
    };

    const handleSeeRequests = () => {
        navigate('/student-classes');
    };

    const [pageToday] = useState(new Date());

    const isSingleSession = isTrial || bookingForm.sessionType === 'single';
    const dateLabel = isSingleSession ? 'Schedule (Date) *' : 'Schedule (Date Range) *';
    const selectsRangeProp = !isSingleSession;
    const placeholderText = isSingleSession ? 'Select a single date (future only)' : 'Select start and end dates (future only)';

    const hasOfflineModes = tutoringModes.length > 0 && !tutoringModes.every(mode => mode === 'Online Tutoring');

    const hasHomeTutoring = tutoringModes.includes("Home Tutoring");

    const successTitle = "Request Submitted!";
    const successMessage = isTrial
        ? `Your trial with ${tutor?.fullName} has been submitted successfully!`
        : `Your booking with ${tutor?.fullName} has been submitted successfully!`;

    // --- Reusable Availability Section Component (Unchanged) ---
    const AvailabilitySection = () => (
        <>
            {isLoading ? null : (
                <div className="availability-section">
                    <h2>Availability</h2>
                    {tutor && tutor.avl_days && tutor.avl_days.length > 0 && tutor.avl_time && tutor.avl_time.length > 0 ? (
                        <TutorAvailabilityCalendar tutor={tutor} />
                    ) : (
                        <p>Availability not set by tutor.</p>
                    )}
                </div>
            )}
        </>
    );
    // --- END ---

    // --- Success/Error Renders (Unchanged) ---
    if (submitSuccess) {
        return (
            <main className="tutor-details-page">
                <div className="horizontal">
                    {isLoading || !tutor ? <Loading /> : (<>
                        <div className="details-section">
                            <div className="header">
                                <img
                                    src={tutor.profilePhoto && !tutor.profilePhoto.startsWith('http')
                                        ? `${import.meta.env.VITE_APP_BASE_URL}/${tutor.profilePhoto}`
                                        : tutor.profilePhoto || '/app-logo-black.png'}
                                    onError={(e) => { e.target.onerror = null; e.target.src = import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER; }}
                                />
                                <div className="vertical">
                                    <h1>{tutor.fullName}</h1>
                                    <p>{tutor.headline}</p>
                                    {tutor.totalRatings > 0 && (
                                        <div className='tutor-rating-display'>
                                            <StarRating rating={tutor.averageRating || 0} editable={false} />
                                            <span className='tutor-rating-count'>({tutor.totalRatings} {tutor.totalRatings === 1 ? 'rating' : 'ratings'})</span>
                                        </div>
                                    )}
                                    <div className='info-tile'><FaHourglass /> {tutor.class_duration || 'None'}</div>
                                    <div className='info-tile'><FaClock /> {tutor.teaching_experience || 'None'} Years</div>
                                    {!isTrial && <h3>60-min session at {priceRangeString}</h3>}
                                </div>
                            </div>
                            <h2>About</h2>
                            <p>{tutor.bio}</p>

                            <h2>Specialty</h2>
                            <div className="vertical">
                                <div className='info-tile detailed'><b>Category: </b>{tutor.category || 'None'}</div>
                                <div className='info-tile detailed'><b>Teaching Level: </b>{tutor.teaching_level || 'None'}</div>
                            </div>
                            <h2>Spoken Languages</h2>
                            <div className="subjects-grid">
                                {safeArray(tutor.languages).map((subject, index) => (
                                    <div key={index} className="subject-card">
                                        <div className="subject-label">{subject}</div>
                                    </div>
                                ))}
                            </div>
                            <h2>Subjects</h2>
                            <div className="subjects-grid">
                                {subcategories.map((subject, index) => (
                                    <div key={index} className="subject-card">
                                        <div className="subject-label">{subject}</div>
                                    </div>
                                ))}
                            </div>
                            <h2>Teaching Modes</h2>
                            <div className="teaching-modes-grid">
                                {tutoringModes.map((mode, index) => (
                                    <div key={index} className="mode-card">
                                        <div className="mode-label">{mode}</div>
                                    </div>
                                ))}
                            </div>
                            {hasOfflineModes && (
                                <div className="address-section">
                                    <div className="address-header">Location</div>
                                    <div className="address-content">
                                        <FaMapMarkerAlt className="address-icon" />
                                        <div className="address-text">{tutor.city}, {tutor.state}, {tutor.country}</div>
                                    </div>
                                </div>
                            )}
                            {hasHomeTutoring && tutor?.pincodes && (
                                <div className="address-section">
                                    <div className="address-header">Preferred Pincodes</div>
                                    <div className="address-content">
                                        <FaMapMarkerAlt className="address-icon" />
                                        <div className="address-text">{tutor.pincodes}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="booking-section">
                            <h2>{successTitle}</h2>
                            <div className="success-message-large">
                                <p>{successMessage}</p>
                                <p>You will receive a confirmation email shortly.</p>
                                <button className="book-another-btn" onClick={handleSeeRequests}>See Requests</button>
                            </div>
                        </div>
                    </>)}
                </div>

                <AvailabilitySection />

                <h2>Similar Profiles</h2>
                <div className='tutors-list'>
                    {tutors.filter(t => t._id != tutor?._id).map(tutor => (<div key={tutor._id} >
                        {/* --- 4. PASS canTrial to similar tutors --- */}
                        <TutorCard tutor={tutor} canTrial={canTrial} />
                    </div>))}
                </div>
            </main>
        );
    }

    if (submitError && !showForm) {
        return (
            <main className="tutor-details-page">
                <div className="horizontal">
                    {isLoading || !tutor ? <Loading /> : (<>
                        <div className="details-section">
                            <div className="header">
                                <img
                                    src={tutor.profilePhoto && !tutor.profilePhoto.startsWith('http')
                                        ? `${import.meta.env.VITE_APP_BASE_URL}/${tutor.profilePhoto}`
                                        : tutor.profilePhoto || '/app-logo-black.png'}
                                    onError={(e) => { e.target.onerror = null; e.target.src = import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER; }}
                                />
                                <div className="vertical">
                                    <h1>{tutor.fullName}</h1>
                                    <p>{tutor.headline}</p>
                                    {tutor.totalRatings > 0 && (
                                        <div className='tutor-rating-display'>
                                            <StarRating rating={tutor.averageRating || 0} editable={false} />
                                            <span className='tutor-rating-count'>({tutor.totalRatings} {tutor.totalRatings === 1 ? 'rating' : 'ratings'})</span>
                                        </div>
                                    )}
                                    <div className='info-tile'><FaHourglass /> {tutor.class_duration || 'None'}</div>
                                    <div className='info-tile'><FaClock /> {tutor.teaching_experience || 'None'} Years</div>
                                    {!isTrial && <h3>60-min session at {priceRangeString}</h3>}
                                </div>
                            </div>
                            <h2>About</h2>
                            <p>{tutor.bio}</p>

                            <h2>Specialty</h2>
                            <div className="vertical">
                                <div className='info-tile detailed'><b>Category: </b>{tutor.category || 'None'}</div>
                                <div className='info-tile detailed'><b>Teaching Level: </b>{tutor.teaching_level || 'None'}</div>
                            </div>
                            <h2>Spoken Languages</h2>
                            <div className="subjects-grid">
                                {safeArray(tutor.languages).map((subject, index) => (
                                    <div key={index} className="subject-card">
                                        <div className="subject-label">{subject}</div>
                                    </div>
                                ))}
                            </div>
                            <h2>Subjects</h2>
                            <div className="subjects-grid">
                                {subcategories.map((subject, index) => (
                                    <div key={index} className="subject-card">
                                        <div className="subject-label">{subject}</div>
                                    </div>
                                ))}
                            </div>
                            <h2>Teaching Modes</h2>
                            <div className="teaching-modes-grid">
                                {tutoringModes.map((mode, index) => (
                                    <div key={index} className="mode-card">
                                        <div className="mode-label">{mode}</div>
                                    </div>
                                ))}
                            </div>
                            {hasOfflineModes && (
                                <div className="address-section">
                                    <div className="address-header">Location</div>
                                    <div className="address-content">
                                        <FaMapMarkerAlt className="address-icon" />
                                        <div className="address-text">{tutor.city}, {tutor.state}, {tutor.country}</div>
                                    </div>
                                </div>
                            )}
                            {hasHomeTutoring && tutor?.pincodes && (
                                <div className="address-section">
                                    <div className="address-header">Preferred Pincodes</div>
                                    <div className="address-content">
                                        <FaMapMarkerAlt className="address-icon" />
                                        <div className="address-text">{tutor.pincodes}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="booking-section">
                            <h2>Booking Failed</h2>
                            <div className="error-message-large">
                                <p>{submitError}</p>
                                <button className="try-again-btn" onClick={handleTryAgain}>Try Again</button>
                            </div>
                        </div>
                    </>)}
                </div>

                <AvailabilitySection />

                <h2>Similar Profiles</h2>
                <div className='tutors-list'>
                    {tutors.filter(t => t._id != tutor?._id).map(tutor => (<div key={tutor._id} >
                        {/* --- 4. PASS canTrial to similar tutors --- */}
                        <TutorCard tutor={tutor} canTrial={canTrial} />
                    </div>))}
                </div>
            </main>
        );
    }
    // --- End Success/Error Renders ---


    const bookingTitle = isTrial ? `Book a Trial with ${tutor?.fullName}` : `Book ${tutor?.fullName}`;
    const buttonText = isTrial ? "Book Trial Now" : "Book Now";

    return (
        <main className="tutor-details-page">
            <div className="horizontal">
                {isLoading ? <Loading /> : (
                    tutor ? (<>
                        <div className="details-section">
                            <div className="header">
                                <img
                                    src={tutor.profilePhoto && !tutor.profilePhoto.startsWith('http')
                                        ? `${import.meta.env.VITE_APP_BASE_URL}/${tutor.profilePhoto}`
                                        : tutor.profilePhoto || '/app-logo-black.png'}
                                    onError={(e) => { e.target.onerror = null; e.target.src = import.meta.env.VITE_PROFILE_PHOTO_PLACEHOLDER; }}
                                />
                                <div className="vertical">
                                    <h1>{tutor.fullName}</h1>
                                    <p>{tutor.headline}</p>
                                    {tutor.totalRatings > 0 && (
                                        <div className='tutor-rating-display'>
                                            <StarRating rating={tutor.averageRating || 0} editable={false} />
                                            <span className='tutor-rating-count'>({tutor.totalRatings} {tutor.totalRatings === 1 ? 'rating' : 'ratings'})</span>
                                        </div>
                                    )}
                                    <div className='info-tile'><FaHourglass /> {tutor.class_duration || 'None'}</div>
                                    <div className='info-tile'><FaClock /> {tutor.teaching_experience || 'None'} Years</div>
                                    {!isTrial && <h3>60-min session at {priceRangeString}</h3>}
                                </div>
                            </div>
                            <h2>About</h2>
                            <p>{tutor.bio}</p>

                            <h2>Specialty</h2>
                            <div className="vertical">
                                <div className='info-tile detailed'><b>Category: </b>{tutor.category || 'None'}</div>
                                <div className='info-tile detailed'><b>Teaching Level: </b>{tutor.teaching_level || 'None'}</div>
                            </div>
                            <h2>Spoken Languages</h2>
                            <div className="subjects-grid">
                                {safeArray(tutor.languages).map((subject, index) => (
                                    <div key={index} className="subject-card">
                                        <div className="subject-label">{subject}</div>
                                    </div>
                                ))}
                            </div>
                            <h2>Subjects</h2>
                            <div className="subjects-grid">
                                {subcategories.map((subject, index) => (
                                    <div key={index} className="subject-card">
                                        <div className="subject-label">{subject}</div>
                                    </div>
                                ))}
                            </div>
                            <h2>Teaching Modes</h2>
                            <div className="teaching-modes-grid">
                                {tutoringModes.map((mode, index) => (
                                    <div key={index} className="mode-card">
                                        <div className="mode-label">{mode}</div>
                                    </div>
                                ))}
                            </div>
                            {hasOfflineModes && (
                                <div className="address-section">
                                    <div className="address-header">Location</div>
                                    <div className="address-content">
                                        <FaMapMarkerAlt className="address-icon" />
                                        <div className="address-text">{tutor.city}, {tutor.state}, {tutor.country}</div>
                                    </div>
                                </div>
                            )}
                            {hasHomeTutoring && tutor?.pincodes && (
                                <div className="address-section">
                                    <div className="address-header">Preferred Pincodes</div>
                                    <div className="address-content">
                                        <FaMapMarkerAlt className="address-icon" />
                                        <div className="address-text">{tutor.pincodes}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="booking-section">
                            {!isProfileComplete ? (
                                <>
                                    <h2>Complete Your Profile</h2>
                                    <div className="error-message-large" style={{
                                        background: '#fff8e1',
                                        color: '#6d4c0c',
                                        border: '1px solid #ffecb3',
                                        textAlign: 'left'
                                    }}>
                                        <p>Please complete your account details before you can book a session.</p>
                                        <p style={{ marginTop: '10px' }}>This helps us and the tutor provide the best experience for you.</p>
                                        <button
                                            className="try-again-btn"
                                            style={{ background: 'var(--primary-color)', color: 'white', marginTop: '20px' }}
                                            onClick={() => navigate('/student-account')}
                                        >
                                            Go to My Account
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2>{bookingTitle}</h2>

                                    {/* --- 5. ADD TRIAL PROMPT HERE --- */}
                                    {!isTrial && canTrial && (
                                        <button
                                            className="book-btn"
                                            style={{
                                                background: 'transparent',
                                                color: 'var(--primary-color)',
                                                border: '1px solid var(--primary-color)',
                                                marginBottom: '1rem'
                                            }}
                                            onClick={() => {
                                                const newParams = new URLSearchParams(location.search);
                                                newParams.set('trial', 'true');
                                                navigate(`${location.pathname}?${newParams.toString()}`);
                                            }}
                                        >
                                            Book a Free Trial
                                        </button>
                                    )}

                                    {showForm && (
                                        <form onSubmit={handleSubmit} className="booking-form">
                                            <div className="form-group">
                                                <label htmlFor="subject">Subject *</label>
                                                <select
                                                    id="subject"
                                                    name="subject"
                                                    value={bookingForm.subject}
                                                    onChange={handleFormChange}
                                                    required
                                                >
                                                    <option value="">Select a subject</option>
                                                    {subcategories.map(subject => (
                                                        <option key={subject} value={subject}>{subject}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {!isTrial && (
                                                <div className="form-group">
                                                    <label htmlFor="price">Hourly Rate ({tutorCurrency}) *</label>
                                                    <input
                                                        type="number"
                                                        id="price"
                                                        name="price"
                                                        placeholder={`Enter rate (e.g., ${priceRangeString})`}
                                                        value={bookingForm.price}
                                                        onChange={handleFormChange}
                                                        min={tutorMinPrice}
                                                        max={tutorMaxPrice !== null ? tutorMaxPrice : undefined} // Only set max if it's not null
                                                        required
                                                    />
                                                </div>
                                            )}

                                            <div className="form-group">
                                                <label>Mode of Tutoring *</label>
                                                <select
                                                    id="tutoringMode"
                                                    name="tutoringMode"
                                                    value={bookingForm.tutoringMode[0] || ""}
                                                    onChange={(e) => setBookingForm({ ...bookingForm, tutoringMode: [e.target.value] })}
                                                    required
                                                >
                                                    <option value="">Select a mode</option>
                                                    {tutoringModes.map((mode) => (
                                                        <option key={mode} value={mode}>{mode}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {!isTrial && (
                                                <div className="form-group">
                                                    <label htmlFor="sessionType">Session Type *</label>
                                                    <select
                                                        id="sessionType"
                                                        name="sessionType"
                                                        value={bookingForm.sessionType}
                                                        onChange={handleFormChange}
                                                        required
                                                    >
                                                        <option value="single">Single Session</option>
                                                        <option value="multiple">Multiple Sessions</option>
                                                    </select>
                                                </div>
                                            )}

                                            <div className="form-group">
                                                <label>{dateLabel}</label>
                                                <DatePicker
                                                    selectsRange={selectsRangeProp}
                                                    selected={isSingleSession ? bookingForm.dateRange : undefined}
                                                    startDate={!isSingleSession ? bookingForm.dateRange?.[0] : undefined}
                                                    endDate={!isSingleSession ? bookingForm.dateRange?.[1] : undefined}
                                                    onChange={handleDateRangeChange}
                                                    minDate={pageToday}
                                                    isClearable={true}
                                                    dateFormat="dd/MM/yyyy"
                                                    placeholderText={placeholderText}
                                                    className="date-picker-input"
                                                    required
                                                />
                                            </div>

                                            {!isSingleSession && (
                                                <div className="form-group">
                                                    <label>Available Days *</label>
                                                    <MultiSelect
                                                        name="availableDays"
                                                        placeholder="Select days"
                                                        options={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                                                        value={bookingForm.availableDays}
                                                        onChange={(items) => handleMultiSelectChange('availableDays', items)}
                                                    />
                                                </div>
                                            )}

                                            <div className="form-group time-group">
                                                <label>{isTrial ? 'Time Slot (Start) *' : 'Time Slot (Start - End) *'}</label>
                                                <div className="time-inputs">
                                                    <input
                                                        type="time"
                                                        name="startTime"
                                                        value={bookingForm.startTime}
                                                        onChange={handleFormChange}
                                                        max={isTrial ? "23:34" : undefined}
                                                        required
                                                    />
                                                    {!isTrial && (
                                                        <>
                                                            <span>to</span>
                                                            <input
                                                                type="time"
                                                                name="endTime"
                                                                value={bookingForm.endTime}
                                                                onChange={handleFormChange}
                                                                required
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                                {isTrial && timeError && (
                                                    <div className="form-error-message" style={{ color: 'red', fontSize: '0.9rem', marginTop: '5px' }}>
                                                        {timeError}
                                                    </div>
                                                )}
                                            </div>

                                            <button type="submit" className="book-btn">{buttonText}</button>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </>) : (
                        <div>{error || 'Tutor not found.'}</div> // Handle case where tutor is null
                    )
                )}
            </div>

            <AvailabilitySection />

            <h2>Similar Profiles</h2>
            <div className='tutors-list'>
                {tutors.filter(t => t._id != tutor?._id).map(tutor => (<div key={tutor._id} >
                    {/* --- 4. PASS canTrial to similar tutors --- */}
                    <TutorCard tutor={tutor} canTrial={canTrial} />
                </div>))}
            </div>
        </main>
    );
}