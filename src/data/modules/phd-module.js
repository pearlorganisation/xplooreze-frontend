import api, { resolveAxiosError } from "../axios";

export async function submitResearchSupportForm(formData) {
    const defaultError = 'Something went wrong while submitting research support form.';
    try {
        const response = await api.post('/submit-research-support-form', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data.success === true) {
            return response.data;
        }

        throw response.data.message || defaultError;
    } catch (error) {
        throw resolveAxiosError(error).message || defaultError;
    }
}

export async function submitConsultationForm(formData) {
    const defaultError = 'Something went wrong while submitting consultation form.';
    try {
        const response = await api.post('/submit-consultation-form', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message || defaultError;
    } catch (error) {
        throw resolveAxiosError(error).message || defaultError;
    }
}

export async function verifyConsultationFormPayment(formData) {
    const defaultError = 'Something went wrong while verifying consultation form.';
    try {
        const response = await api.post('/verify-consultation-form-payment', formData);

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message || defaultError;
    } catch (error) {
        throw resolveAxiosError(error).message || defaultError;
    }
}