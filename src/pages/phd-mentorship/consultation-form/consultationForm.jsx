import React, { useEffect, useState } from "react";
import "./consultationForm.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ConfirmDialog from "../../../components/dialog/ConfirmDialog";
import { getCountries } from "../../../data/modules/location-module";
import { submitConsultationForm, verifyConsultationFormPayment } from "../../../data/modules/phd-module";
import MultiSelect from "../../../components/multiselect/MultiSelect";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { handlePayment } from "../../../data/razorpay";

export default function ConsultationForm() {
    const navigate = useNavigate();
    const [countries, setCountries] = useState([]);
    const [step, setStep] = useState(1);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogData, setDialogData] = useState({});
    const [formTitle, setFormTitle] = useState("Book Your 1-to-1 PhD Mentoring Session");
    const [paymentStatus, setPaymentStatus] = useState(null);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        university: "",
        country: "",
        phdStage: "",
        researchTitle: "",
        researchDescription: "",
        document: null,
        guidanceAreas: [],
        otherGuidance: "",
        sessionType: "",
        sessionDate: null,
        sessionTime: "",
        agreeTerms: false,
    });

    const timeSlots = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
        "05:00 PM", "06:00 PM"
    ];

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        const titles = [
            "Book Your 1-to-1 PhD Mentoring Session",
            "Where are you in your PhD journey?",
            "Tell us about your research",
            "Which areas do you want guidance on?",
            "Choose your mentoring session",
            "Pick a date & time that works for you",
            "Confirm and Proceed"
        ];
        setFormTitle(titles[step - 1] || titles[6]);
    }, [step]);

    const fetchCountries = async () => {
        const data = await getCountries();
        setCountries(data);
        setFormData((prev) => ({
            ...prev,
            country: "India",
        }));
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

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === "file") {
            setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
        } else if (name === "agreeTerms") {
            setFormData((prev) => ({ ...prev, [name]: e.target.checked }));
        } else {
            let processedValue = value;
            if (name === "phone") {
                processedValue = value.replace(/[^0-9]/g, "");
            }
            setFormData((prev) => ({ ...prev, [name]: processedValue }));
        }
    };

    const handleDateChange = (date) => {
        setFormData((prev) => ({ ...prev, sessionDate: date }));
    };

    const handleGuidanceChange = (items) => {
        setFormData((prev) => ({ ...prev, guidanceAreas: items }));
    };

    const getPrice = () => {
        const isIndia = formData.country === "India";
        const currency = isIndia ? "₹" : "$";
        if (formData.sessionType.includes("30 min")) {
            return `${currency}${isIndia ? "1,200" : "25"}`;
        } else if (formData.sessionType.includes("60 min")) {
            return `${currency}${isIndia ? "2,500" : "50"}`;
        }
        return "";
    };

    const validateStep = (currentStep) => {
        if (currentStep === 1) {
            if (!formData.fullName.trim()) return "Please enter your full name.";
            if (!formData.email.trim()) return "Please enter your email.";
            if (!formData.phone.trim()) return "Please enter your phone/WhatsApp.";
            if (!formData.country.trim()) return "Please select your country.";
        } else if (currentStep === 2) {
            if (!formData.phdStage.trim()) return "Please select your PhD stage.";
        } else if (currentStep === 3) {
            if (!formData.researchTitle.trim()) return "Please enter your tentative title/research area.";
        } else if (currentStep === 4) {
            if (formData.guidanceAreas.length === 0) return "Please select at least one guidance area.";
            if (formData.guidanceAreas.includes("Other") && !formData.otherGuidance.trim()) {
                return "Please describe the other guidance needed.";
            }
        } else if (currentStep === 5) {
            if (!formData.sessionType.trim()) return "Please select your preferred session type.";
        } else if (currentStep === 6) {
            if (!formData.sessionDate) return "Please select a session date.";
            if (!formData.sessionTime.trim()) return "Please select a session time.";
        } else if (currentStep === 7) {
            if (!formData.agreeTerms) return "Please agree to the terms.";
        }
        return null;
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        const error = validateStep(step);
        if (error) {
            showErrorDialog("Validation Error", error);
            return;
        }
        if (step < 7) {
            setStep(step + 1);
        } else {
            handleFormSubmit();
        }
    };

    const handleBackClick = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigate('/');
        }
    };

    const handleFormSubmit = async () => {
        setPaymentStatus({ type: 'loading', message: 'Processing...' });
        try {
            const formResponse = await submitConsultationForm({
                ...formData,
                agreeTerms: undefined,
                price: parseFloat(getPrice().replace(/[^0-9.]/g, '')),
            });
            handlePayment({
                order: formResponse,
                onError: (error) => {
                    setPaymentStatus({ 
                        type: 'error', 
                        message: error?.description || error?.message || error?.toString() || "Payment failed" 
                    });
                },
                onSuccess: async (paymentResponse) => {
                    try {
                        await verifyConsultationFormPayment({
                            formId: formResponse.id,
                            orderId: paymentResponse.razorpay_order_id
                        });
                        setPaymentStatus({ 
                            type: 'success', 
                            message: "Thank you! Your session has been booked successfully!" 
                        });
                    } catch (apiError) {
                        setPaymentStatus({ 
                            type: 'error', 
                            message: apiError?.message || apiError?.toString() || "Payment confirmation failed" 
                        });
                    }
                }
            });
        } catch (error) {
            setPaymentStatus({ 
                type: 'error', 
                message: error?.message || error?.toString() || "Form submission failed" 
            });
        }
    };

    const renderStepContent = () => {
        if (step === 1) {
            return (
                <>
                    <div className="form-group">
                        <label htmlFor="fullName" className="required">Full Name</label>
                        <input id="fullName" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email" className="required">Email</label>
                        <input id="email" name="email" type="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone" className="required">Phone/WhatsApp</label>
                        <input id="phone" name="phone" type="tel" placeholder="Phone/WhatsApp" value={formData.phone} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="university">University / Institution</label>
                        <input id="university" name="university" placeholder="University / Institution" value={formData.university} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="country" className="required">Country</label>
                        <select id="country" name="country" value={formData.country} onChange={handleInputChange} required>
                            <option value="">Select Country</option>
                            {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                        </select>
                    </div>
                </>
            );
        }

        if (step === 2) {
            return (
                <div className="form-group">
                    <label htmlFor="phdStage" className="required">Where are you in your PhD journey?</label>
                    <select id="phdStage" name="phdStage" value={formData.phdStage} onChange={handleInputChange} required>
                        <option value="">Select Stage</option>
                        <option value="Just starting / Pre-proposal">Just starting / Pre-proposal</option>
                        <option value="Proposal writing">Proposal writing</option>
                        <option value="Literature review">Literature review</option>
                        <option value="Methodology design">Methodology design</option>
                        <option value="Data collection / Analysis">Data collection / Analysis</option>
                        <option value="Drafting chapters">Drafting chapters</option>
                        <option value="Near submission / Defense prep">Near submission / Defense prep</option>
                    </select>
                </div>
            );
        }

        if (step === 3) {
            return (
                <>
                    <div className="form-group">
                        <label htmlFor="researchTitle" className="required">Tentative Title / Research Area</label>
                        <input id="researchTitle" name="researchTitle" placeholder="e.g., AI in Healthcare" value={formData.researchTitle} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="researchDescription">Short Description (optional)</label>
                        <textarea id="researchDescription" name="researchDescription" placeholder="Briefly describe your research..." value={formData.researchDescription} onChange={handleInputChange} rows={3} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="document">Upload Document (optional, if you have draft/outline)</label>
                        <input type="file" id="document" name="document" accept=".pdf,.doc,.docx" onChange={handleInputChange} />
                    </div>
                </>
            );
        }

        if (step === 4) {
            return (
                <>
                    <div className="form-group">
                        <label htmlFor="guidanceAreas" className="required">Which areas do you want guidance on?</label>
                        <MultiSelect
                            name="guidanceAreas"
                            placeholder="Select areas (at least one)"
                            options={[
                                "Refining research questions",
                                "Literature review guidance",
                                "Methodology design / clarity",
                                "Data analysis (quantitative/qualitative)",
                                "Structuring chapters / thesis flow",
                                "Academic writing style (clarity, citations, coherence)",
                                "Publication guidance",
                                "Viva/Defense preparation",
                                "Other"
                            ]}
                            value={formData.guidanceAreas || []}
                            onChange={handleGuidanceChange}
                        />
                    </div>
                    {formData.guidanceAreas.includes("Other") && (
                        <div className="form-group">
                            <label htmlFor="otherGuidance" className="required">Other</label>
                            <textarea id="otherGuidance" name="otherGuidance" placeholder="Describe..." value={formData.otherGuidance} onChange={handleInputChange} rows={3} />
                        </div>
                    )}
                </>
            );
        }

        if (step === 5) {
            return (
                <>
                    <div className="form-group">
                        <label htmlFor="sessionType" className="required">Preferred Session Type</label>
                        <select id="sessionType" name="sessionType" value={formData.sessionType} onChange={handleInputChange} required>
                            <option value="">Select Type</option>
                            <option value="Quick Consultation (30 min)">Quick Consultation (30 min)</option>
                            <option value="Deep Dive Mentoring (60 min)">Deep Dive Mentoring (60 min)</option>
                        </select>
                        {formData.sessionType && <div className="price-display">{getPrice()}</div>}
                    </div>
                </>
            );
        }

        if (step === 6) {
            return (
                <>
                    <div className="form-group">
                        <label htmlFor="sessionDate" className="required">Select Date</label>
                        <DatePicker
                            id="sessionDate"
                            selected={formData.sessionDate}
                            onChange={handleDateChange}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Select date"
                            className="date-picker-input"
                            minDate={new Date()}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="sessionTime" className="required">Select Time</label>
                        <select id="sessionTime" name="sessionTime" value={formData.sessionTime} onChange={handleInputChange} required>
                            <option value="">Select Time</option>
                            {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                        </select>
                    </div>
                </>
            );
        }

        if (step === 7) {
            if (paymentStatus) {
                return (
                    <div className="payment-status">
                        {paymentStatus.type === 'loading' && (
                            <div className="loading-message">
                                <p>{paymentStatus.message}</p>
                            </div>
                        )}
                        {paymentStatus.type === 'success' && (
                            <div className="success-message">
                                <h2>Thank you!</h2>
                                <p style={{ color: 'black' }}>{paymentStatus.message}</p>
                                <div className="actions">
                                    <button className="submit-btn" type="button" onClick={() => navigate('/')}>Okay</button>
                                </div>
                            </div>
                        )}
                        {paymentStatus.type === 'error' && (
                            <div className="error-message">
                                <p>{paymentStatus.message}</p>
                                <div className="actions">
                                    <button className="submit-btn" type="button" onClick={() => setPaymentStatus(null)}>Try Again</button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            return (
                <>
                    <div className="price-display">{getPrice()}</div>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input type="checkbox" id="agreeTerms" name="agreeTerms" checked={formData.agreeTerms} onChange={handleInputChange} required />
                            <span>I understand this is mentoring & guidance, not a writing service.</span>
                        </label>
                    </div>
                </>
            );
        }

        return null;
    };

    const isFinalStep = step === 7;

    const renderActions = () => {
        if (step === 7 && paymentStatus) return null;
        return (
            <div className="actions">
                <button className="submit-btn" type="submit">
                    {isFinalStep ? "Confirm & Proceed to Payment" : "Next"}
                </button>
            </div>
        );
    };

    const handleBackOrHome = () => {
        handleBackClick();
    };

    return (
        <div className="consultation-root">
            <div className="side-bar">
                {step > 1 && <FaArrowLeft className="back-icon" onClick={handleBackOrHome} />}
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-hidden="true"
                    preload="auto"
                >
                    <source src="/consultation-animation.mp4" type="video/mp4" />
                </video>
            </div>
            <div className="authentication-container">
                <div className="authentication-box">
                    <img className="login-app-logo" src="/app-logo-black.png" alt="App Logo" />
                    <>
                        <h2>{formTitle}</h2>
                        <form className="form" onSubmit={handleNextStep}>
                            {renderStepContent()}
                            {renderActions()}
                        </form>
                    </>
                </div>
            </div>
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