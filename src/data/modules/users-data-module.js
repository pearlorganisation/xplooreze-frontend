import api, { resolveAxiosError } from "../axios";

export async function getProfile() {
    try {
        const response = await api.get('/me');

        if (response.data.success === true) {
            const user = response.data.data;
            localStorage.setItem("user", JSON.stringify(user));
            return user;
        }

        throw response.data.message;
    } catch (error) {
        throw resolveAxiosError(error).message;
    }
}