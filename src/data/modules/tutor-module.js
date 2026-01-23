import api, { resolveAxiosError } from "../axios";

export async function getBookings({ statuses }) {
    try {
        const response = await api.get('/get-tutor-bookings', { params: { statuses, limit: 1000 } });

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}

export async function acceptBooking(id) {
    try {
        const response = await api.post(`/accept-booking/${id}`);

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}

export async function rejectBooking(id, rejectionReason) {
    try {
        const response = await api.post(`/reject-booking/${id}`, { rejectionReason });

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}

// --- Added new function ---
export async function getDashboardInsights() {
    try {
        const response = await api.get('/dashboard');

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}

// --- New function for transactions ---
export async function getTransactions({ page = 1, limit = 10 }) {
    try {
        const response = await api.get('/transactions', { params: { page, limit } });

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}

// --- New function for students ---
export async function getStudents({ page = 1, limit = 10 }) {
    try {
        const response = await api.get('/students', { params: { page, limit } });

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}


// --- NEW FUNCTIONS FOR BANK DETAILS ---

export async function getBankDetails() {
    try {
        const response = await api.get('/bank-details');

        if (response.data.success === true) {
            // Will return { details: ... } or { details: null }
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}

export async function saveBankDetails(details) {
    try {
        // The body will contain all the form fields
        const response = await api.post('/bank-details', details);

        if (response.data.success === true) {
            return response.data.data;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}