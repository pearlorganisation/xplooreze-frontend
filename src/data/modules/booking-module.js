import api, { resolveAxiosError } from "../axios"; // Adjust path as needed

/**
 * Calls the endpoint to log the start of a class session.
 * This should be called once when the call becomes active.
 */
export async function startClassJoin(bookingId) {
  try {
    const response = await api.post('/start', { bookingId });
    if (response.data.success === true) {
      return response.data.data;
    }
    throw response.data.message;
  } catch (error) {
    // Don't throw a fatal error, just log it
    // so it doesn't interrupt the call
    console.error("Error starting class join:", resolveAxiosError(error).message);
  }
}

/**
 * Calls the endpoint to update the user's "end time" timestamp.
 * This should be called every 1 minute.
 */
export async function updateClassJoin(bookingId) {
  try {
    const response = await api.put('/update', { bookingId });
    if (response.data.success === true) {
      return response.data.data;
    }
    throw response.data.message;
  } catch (error) {
    // Don't throw a fatal error, just log it
    console.error("Error updating class join:", resolveAxiosError(error).message);
  }
}