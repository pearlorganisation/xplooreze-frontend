import { useEffect, useState } from "react";
import "./researchForm.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import ConfirmDialog from "../../../components/dialog/ConfirmDialog";
import { getCountries } from "../../../data/modules/location-module";
import MultiSelect from "../../../components/multiselect/MultiSelect";
import { submitResearchSupportForm } from "../../../data/modules/phd-module";

export default function ResearchForm() {
    const navigate = useNavigate();
    const [countries, setCountries] = useState([]);
    const [step, setStep] = useState(1);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogData, setDialogData] = useState({});
    const [formTitle, setFormTitle] = useState("Basic Info");

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        country: "",
        researchArea: "",
        currentStage: "",
        document: null,
        supportNeeded: [],
        otherSupport: "",
        deadline: "",
    });

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        if (step === 1) {
            setFormTitle("Basic Info");
        } else if (step === 2) {
            setFormTitle("Project Details & Support Needed");
        }
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
        } else {
            let processedValue = value;
            if (name === "phone") {
                processedValue = value.replace(/[^0-9]/g, "");
            }
            setFormData((prev) => ({ ...prev, [name]: processedValue }));
        }
    };

    const validateStep = (currentStep) => {
        if (currentStep === 1) {
            if (!formData.fullName.trim()) return "Please enter your full name.";
            if (!formData.email.trim()) return "Please enter your email.";
            if (!formData.phone.trim()) return "Please enter your phone/WhatsApp.";
            if (!formData.country.trim()) return "Please select your country.";
        } else if (currentStep === 2) {
            if (!formData.researchArea.trim()) return "Please enter your research area/discipline.";
            if (!formData.currentStage.trim()) return "Please select your current stage.";
            if (formData.supportNeeded.length === 0) return "Please select at least one support needed.";
            if (formData.supportNeeded.includes("Other") && !formData.otherSupport.trim()) {
                return "Please describe the other support needed.";
            }
            if (!formData.deadline.trim()) return "Please select your target deadline.";
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
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleFormSubmit(e);
        }
    };

    const handleBackClick = () => {
        if (step === 3) {
            navigate('/');
        } else if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSupportChange = (items) => {
        setFormData((prev) => ({ ...prev, supportNeeded: items }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitResearchSupportForm(formData);
            console.log("Form submitted:", formData);
            setStep(3);
        } catch (error) {
            showErrorDialog("Submission Failed", error.toString());
        }
    };

    const renderStepContent = () => {
        if (step === 1) {
            return (
                <>
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

                    <div className="form-group">
                        <label htmlFor="email" className="required">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone" className="required">
                            Phone/WhatsApp
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="Phone/WhatsApp"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
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
                </>
            );
        }

        if (step === 2) {
            return (
                <>
                    <div className="form-group">
                        <label htmlFor="researchArea" className="required">
                            Research Area / Discipline
                        </label>
                        <input
                            id="researchArea"
                            name="researchArea"
                            placeholder="e.g., Computer Science, Biology, etc."
                            value={formData.researchArea}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="currentStage" className="required">
                            Current Stage
                        </label>
                        <select
                            id="currentStage"
                            name="currentStage"
                            value={formData.currentStage}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select Current Stage</option>
                            <option value="Proposal prep">Proposal prep</option>
                            <option value="Literature review">Literature review</option>
                            <option value="Methodology">Methodology</option>
                            <option value="Data analysis">Data analysis</option>
                            <option value="Draft / Chapter refinement">Draft / Chapter refinement</option>
                            <option value="Editing & formatting">Editing & formatting</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="document">
                            Upload Document (optional)
                        </label>
                        <input
                            type="file"
                            id="document"
                            name="document"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="supportNeeded" className="required">
                            Support Needed
                        </label>
                        <MultiSelect
                            name="supportNeeded"
                            placeholder="Select support needed (at least one)"
                            options={[
                                "Topic refinement",
                                "Structuring & organization",
                                "Literature review guidance",
                                "Methodology clarity",
                                "Data analysis & interpretation",
                                "Editing for clarity / academic style",
                                "Citation & referencing help",
                                "Formatting (APA, MLA, etc.)",
                                "Other"
                            ]}
                            value={formData.supportNeeded || []}
                            onChange={handleSupportChange}
                        />
                    </div>

                    {formData.supportNeeded.includes("Other") && (
                        <div className="form-group">
                            <label htmlFor="otherSupport" className="required">
                                Other Support Needed
                            </label>
                            <textarea
                                id="otherSupport"
                                name="otherSupport"
                                placeholder="Describe the other support needed"
                                value={formData.otherSupport}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="deadline" className="required">
                            Target Deadline
                        </label>
                        <select
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select Target Deadline</option>
                            <option value="Within 1 week">Within 1 week</option>
                            <option value="2–3 weeks">2–3 weeks</option>
                            <option value="1 month+">1 month+</option>
                        </select>
                    </div>
                </>
            );
        }

        if (step === 3) {
            return (
                <div className="success-page">
                    <h2>Thank you!</h2>
                    <p style={{ color: 'black' }}>Thank you for submitting your request. Our team will review your details and contact you within 24 hours to discuss how we can support your research.</p>
                    <div className="calendar-links">
                        <button onClick={() => navigate('/')} className="calendar-btn">Okay</button>
                    </div>
                </div>
            );
        }

        return null;
    };

    const isFinalStep = step === 2;

    const renderActions = () => {
        if (step === 3) return null;
        return (
            <div className="actions">
                <button className="submit-btn" type="submit">
                    {isFinalStep ? "Submit" : "Continue"}
                </button>
                {window.innerWidth <= 768 && step > 1 && (
                    <button className="back-btn" type="button" onClick={handleBackClick}>
                        Back
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="research-root">
            <div className="side-bar">
                {step > 1 && <FaArrowLeft className="back-icon" onClick={handleBackClick} />}
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-hidden="true"
                    preload="auto"
                >
                    <source src="/phd-mascot.mp4" type="video/mp4" />
                </video>
            </div>
            <div className="authentication-container">
                <div className="authentication-box">
                    <img className="login-app-logo" src="/app-logo-black.png" alt="App Logo" />
                    {step === 3 ? (
                        renderStepContent()
                    ) : (
                        <>
                            <h2>Research Support Form – {formTitle}</h2>
                            <form className="form" onSubmit={handleNextStep}>
                                {renderStepContent()}
                                {renderActions()}
                            </form>
                        </>
                    )}
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