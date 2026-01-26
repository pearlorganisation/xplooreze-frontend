import api, { resolveAxiosError } from "../axios";

export async function getTutors(params) {
  try {
    // Pass all params (page, limit, search, sortBy, filters)
    // to the backend
    const response = await api.get("/get-tutors", { params });

    if (response.data.success === true) {
      return response.data.data;
    }

    throw response.data.message;
  } catch (error) {
    throw resolveAxiosError(error).message;
  }
}

export async function getTutor({ tutorId }) {
  try {
    const response = await api.get(`/get-tutor`, { params: { id: tutorId } });

    if (response.data.success === true) {
      return response.data.data;
    }

    throw response.data.message;
  } catch (error) {
    throw resolveAxiosError(error).message;
  }
}

export async function bookTutor(formData) {
  const defaultError = "Something went wrong while submitting booking form.";
  try {
    const response = await api.post("/submit-booking", formData);

    if (response.data.success === true) {
      return response.data;
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}

export async function addFavorite({ tutorId }) {
  const defaultError = "Something went wrong while adding to favorites.";
  try {
    const response = await api.post("/add-favorite", { tutorId });

    if (response.data.success === true) {
      return response.data.data;
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}

export async function removeFavorite({ tutorId }) {
  const defaultError = "Something went wrong while removing from favorites.";
  try {
    const response = await api.post("/remove-favorite", { tutorId });

    if (response.data.success === true) {
      return response.data.data;
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}

export async function getFavorites() {
  try {
    const response = await api.get("/get-favorites", {
      params: { limit: 1000 },
    });

    if (response.data.success === true) {
      return {
        ...response.data.data,
        tutors: response.data.data.tutors.map((t) => ({
          ...t,
          isFavourite: true,
        })),
      };
    }

    throw response.data.message;
  } catch (error) {
    throw resolveAxiosError(error).message;
  }
}

export async function getBookings({ status }) {
  try {
    const response = await api.get("/get-bookings", {
      params: { statuses: [status], limit: 1000 },
    });

    if (response.data.success === true) {
      return response.data.data;
    }

    throw response.data.message;
  } catch (error) {
    throw resolveAxiosError(error).message;
  }
}

export async function createBookingOrder(formData) {
  const defaultError = "Something went wrong while creating booking order.";
  try {
    const response = await api.post("/create-booking-order", formData);

    if (response.data.success === true) {
      return response.data;
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}

export async function verifyBookingPayment(formData) {
  const defaultError = "Something went wrong while verifying booking payment.";
  try {
    const response = await api.post("/verify-booking-payment", formData);

    if (response.data.success === true) {
      return response.data;
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}

// --- NEW FUNCTION ---
export async function checkTrialAvailability() {
  const defaultError = "Something went wrong while checking trial status.";
  try {
    const response = await api.get("/check-trial-availability");

    if (response.data.success === true) {
      return response.data.data; // Returns { canTakeTrial, trialsUsed, ... }
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}

// --- NEW FUNCTION: Get Upcoming Classes ---
export async function getUpcomingClasses() {
  const defaultError = "Something went wrong while fetching upcoming classes.";
  try {
    const response = await api.get("/get-upcoming-classes");

    if (response.data.success === true) {
      return response.data.data; // Returns { classes, currentTime }
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}

// --- NEW FUNCTION: Submit Rating ---
export async function submitRating({ bookingId, rating }) {
  const defaultError = "Something went wrong while submitting rating.";
  try {
    const response = await api.post("/submit-rating", { bookingId, rating });

    if (response.data.success === true) {
      return response.data.data;
    }

    throw response.data.message || defaultError;
  } catch (error) {
    throw resolveAxiosError(error).message || defaultError;
  }
}
