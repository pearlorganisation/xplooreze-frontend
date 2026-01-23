import './VerificationPage.css';
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/AuthProvider'; 
import { submitTutorForm } from '../../../data/modules/auth-module'; 
import Loading from "../../../components/loading/Loading"; 
import { useNavigate } from 'react-router-dom';

const initialFormData = {
    certificates: [],
    govt_ids: [],
    addressProof: null
};

export function VerificationPage() {
    const { user } = useAuth(); // Get current user from context
    const [showSidebar, setShowSidebar] = useState(false);

    const navigate = useNavigate();
    
    // This state will ONLY hold the new files
    const [formData, setFormData] = useState(initialFormData);
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [rejectionReason, setRejectionReason] = useState('');
    const [showAddressProof, setShowAddressProof] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.rejectionReason) {
                setRejectionReason(user.rejectionReason);
            }
            const needsAddressProof = user.tutoring_mode?.some(
                (mode) => mode.toLowerCase() === "at tutor place"
            );
            setShowAddressProof(needsAddressProof);
        }
    }, [user]);

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000); 
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const handleChange = (e) => {
        const { name, files, multiple } = e.target;
        
        if (multiple) {
            const fileArray = Array.from(files);
            if (fileArray.length > 5) {
                setError("You can only upload up to 5 files at once.");
                e.target.value = ""; 
                return;
            }
            setFormData((prev) => ({ ...prev, [name]: fileArray }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
        }
    };

    // --- THIS IS THE UPDATED FUNCTION ---
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        
        setError(null); 
        setSuccess(null);

        // --- Validation ---
        if (formData.certificates.length === 0) {
            setError("Please upload at least one certificate.");
            return;
        }
        if (formData.govt_ids.length === 0) {
            setError("Please upload at least one Government ID.");
            return;
        }
        if (showAddressProof && !formData.addressProof) {
            setError("Address Proof is required because you selected 'At Tutor Place'.");
            return;
        }
        // --- End Validation ---

        try {
            setIsSaving(true);
            
            // 1. Create a combined data object
            // Start with ALL existing user data
            // Then, overwrite the document fields with the new files from our form's state
            const dataToSubmit = {
                ...user,       // "existing data"
                ...formData,   // "new" data (files)
                emailId: user.email,
            };

            // 2. Call submitTutorForm with the combined object
            // This now mimics the behavior of AuthenticationPage and TutorAccount
            await submitTutorForm(dataToSubmit);
            
            setSuccess('Documents submitted successfully! Your profile will be re-verified.');
            setFormData(initialFormData); // Clear the form
            
            // Clear file inputs
            document.getElementById('certificates').value = "";
            document.getElementById('govt_ids').value = "";
            if (showAddressProof) {
                 document.getElementById('addressProof').value = "";
            }

            navigate('/tutor-dashboard');

        } catch (err) {
            setError(err.message || 'Failed to submit documents. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to render the main content
    const renderFormContent = () => {
        return (
            <>
                <p className='header-title'>Resubmit Verification Documents</p>
                
                {rejectionReason && (
                    <div className="rejection-message">
                        <p><strong>Your profile was rejected.</strong></p>
                        <p>Reason: {rejectionReason}</p>
                        <p>Please re-upload the correct documents below. Your previous files will be replaced.</p>
                    </div>
                )}

                <div className="form-group">
                    <label className="required" htmlFor="certificates">
                        Upload Certificates (Degree / Award / Other)
                    </label>
                    <input
                        type="file"
                        id="certificates"
                        name="certificates" // This name MUST match the state key
                        accept=".pdf,.jpg,.png"
                        multiple
                        onChange={handleChange}
                        required
                    />
                    <small>Upload up to 5 files. Your previous uploads will be replaced.</small>
                </div>

                <div className="form-group">
                    <label htmlFor="govt_ids" className="required">
                        Government ID Proof (Aadhar / Passport / Pan / Other)
                    </label>
                    <input
                        type="file"
                        id="govt_ids"
                        name="govt_ids" // This name MUST match the state key
                        accept=".pdf,.jpg,.png"
                        multiple
                        onChange={handleChange}
                        required
                    />
                    <small>Upload up to 5 files. Your previous uploads will be replaced.</small>
                </div>

                {showAddressProof && (
                    <div className="form-group">
                        <label htmlFor="addressProof" className="required">
                            Address Proof (for "At Tutor Place")
                        </label>
                        <input
                            type="file"
                            id="addressProof"
                            name="addressProof" // This name MUST match the state key
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={handleChange}
                            required={showAddressProof}
                        />
                        <small>Required because you offer tutoring "At Tutor Place". Your previous upload will be replaced.</small>
                    </div>
                )}
                
                <div className="form-footer">
                    {error && <p className="form-error-message">{error}</p>}
                    {success && <p className="form-success-message">{success}</p>}
                </div>
            </>
        );
    };

    return (
        <div className="verification-page"> 
            <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            
            <main className="verification-content"> 
                
                <div className='tutor-account-header'>
                    <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>&#9776;</button>
                    <div className="title">Verification</div>
                </div>

                <form className="form-details" onSubmit={handleSubmit}>
                    <div className="other-details">
                        {renderFormContent()}
                    </div>
                </form>

                <button className='save-btn' onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? 'Submitting...' : 'Submit for Re-Verification'}
                </button>
            </main>
        </div>
    );
}