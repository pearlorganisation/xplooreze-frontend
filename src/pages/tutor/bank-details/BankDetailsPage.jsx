import './BankDetailsPage.css'; // <-- Import the page-specific CSS
import TutorSidebar from '../../../components/tutor-sidebar/TutorSidebar';
import { useState, useEffect } from 'react';
// Corrected import path
import { getBankDetails, saveBankDetails } from '../../../data/modules/tutor-module';
import Loading from "../../../components/loading/Loading"; 

const initialFormData = {
    bankName: '',
    branch: '',
    bankAccountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    phoneNumber: '',
    upiId: ''
};

export function BankDetailsPage() {
    const [showSidebar, setShowSidebar] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch existing bank details on component mount
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getBankDetails();
                
                if (data.details) {
                    // Pre-fill the form if details exist
                    setFormData({
                        bankName: data.details.bankName || '',
                        branch: data.details.branch || '',
                        bankAccountHolderName: data.details.bankAccountHolderName || '',
                        accountNumber: data.details.accountNumber || '',
                        ifscCode: data.details.ifscCode || '',
                        phoneNumber: data.details.phoneNumber || '',
                        upiId: data.details.upiId || ''
                    });
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch bank details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, []); 

    // --- NEW: Auto-clearing for success/error messages ---
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000); // Clear message after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [success, error]);


    // --- UPDATED: Handle input formatting ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        let processedValue = value;

        // Auto-uppercase and restrict IFSC code
        if (name === "ifscCode") {
            processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        }
        
        // Restrict account number to digits
        if (name === "accountNumber") {
            processedValue = value.replace(/[^0-9]/g, '').slice(0, 18);
        }

        // Restrict phone number to digits
        if (name === "phoneNumber") {
            processedValue = value.replace(/[^0-9]/g, '').slice(0, 15);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    // --- UPDATED: Handle form submission with validation ---
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        
        // --- VALIDATION BLOCK ---
        setError(null); // Clear old errors
        setSuccess(null); // Clear old success

        const { accountNumber, ifscCode, phoneNumber, upiId } = formData;

        // IFSC Code Validation (strict)
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifscCode)) {
            setError("Invalid IFSC Code. Must be 11 characters, e.g., KKBK0000123.");
            return;
        }

        // Account Number Validation (digits, 9-18 length)
        const accNumRegex = /^\d{9,18}$/;
        if (!accNumRegex.test(accountNumber)) {
            setError("Invalid Account Number. Must be 9-18 digits.");
            return;
        }

        // Phone Number Validation (if present)
        const phoneRegex = /^\d{10,15}$/;
        if (phoneNumber && !phoneRegex.test(phoneNumber)) {
            setError("Invalid Phone Number. Must be 10-15 digits.");
            return;
        }

        // UPI ID Validation (if present)
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        if (upiId && upiId.length > 0 && !upiRegex.test(upiId)) {
            setError("Invalid UPI ID format. Must be like name@bank.");
            return;
        }
        // --- END VALIDATION ---

        try {
            setIsSaving(true);
            await saveBankDetails(formData);
            setSuccess('Bank details updated successfully!');
        } catch (err) {
            setError(err.message || 'Failed to save details. Please check your inputs.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to render the main content
    const renderFormContent = () => {
        if (isLoading) {
            return <Loading />;
        }

        return (
            <>
                <p className='header-title'>Bank Account Details</p>

                <div className="grid-2">
                    <div className="form-group">
                        <label htmlFor="bankName" className="required">Bank Name</label>
                        <input type="text" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="branch" className="required">Branch</label>
                        <input type="text" id="branch" name="branch" value={formData.branch} onChange={handleChange} required />
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label htmlFor="bankAccountHolderName" className="required">Account Holder Name</label>
                        <input type="text" id="bankAccountHolderName" name="bankAccountHolderName" value={formData.bankAccountHolderName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="accountNumber" className="required">Account Number</label>
                        <input 
                            type="text" // Use text to allow formatting, but regex ensures digits
                            id="accountNumber" 
                            name="accountNumber" 
                            value={formData.accountNumber} 
                            onChange={handleChange} 
                            required 
                            inputMode="numeric" // Mobile keyboard
                            maxLength={18}
                            title="Account number must be 9-18 digits."
                        />
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label htmlFor="ifscCode" className="required">IFSC Code</label>
                        <input 
                            type="text" 
                            id="ifscCode" 
                            name="ifscCode" 
                            value={formData.ifscCode} 
                            onChange={handleChange} 
                            required 
                            maxLength={11}
                            title="IFSC code must be 11 characters (e.g., KKBK0000123)."
                            style={{ textTransform: 'uppercase' }} // Helps show user it's uppercase
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number (Optional)</label>
                        <input 
                            type="text" 
                            id="phoneNumber" 
                            name="phoneNumber" 
                            value={formData.phoneNumber} 
                            onChange={handleChange} 
                            inputMode="numeric" // Mobile keyboard
                            maxLength={15}
                            title="Phone number must be 10-15 digits."
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="upiId">UPI ID (Optional)</label>
                    <input 
                        type="text" 
                        id="upiId" 
                        name="upiId" 
                        value={formData.upiId} 
                        onChange={handleChange} 
                        inputMode="email" // Best match for name@bank
                        title="Please enter a valid UPI ID (e.g., name@bank)."
                    />
                </div>
                
                <div className="form-footer">
                    {/* UPDATED: Show success or error message */}
                    {error && <p className="form-error-message">{error}</p>}
                    {success && <p className="form-success-message">{success}</p>}
                </div>
            </>
        );
    };

    return (
        <div className="bank-details-page">
            <TutorSidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
            
            <main className="bank-details-content">
                
                <div className='tutor-account-header'>
                    <button className="menu-toggle" onClick={() => setShowSidebar(!showSidebar)}>&#9776;</button>
                    <div className="title">Bank Details</div>
                </div>

                <form className="form-details" onSubmit={handleSubmit}>
                    
                    <div className="other-details">
                        {renderFormContent()}
                    </div>
                </form>

                <button className='save-btn' onClick={handleSubmit} disabled={isSaving || isLoading}>
                    {isSaving ? 'Saving...' : 'Save Details'}
                </button>
            </main>
        </div>
    );
}