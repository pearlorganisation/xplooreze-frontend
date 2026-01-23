import api, { resolveAxiosError } from "../axios";

export async function signWithGoogle(credential, role) {
    const loginError = 'Something went wrong while signing with Google.';
    try {
        const response = await api.post('/google-sign-in', { credential, role });

        if (response.data.success === true) {
            const { accessToken, user } = response.data.data;

            localStorage.setItem("token", accessToken);
            localStorage.setItem("user", JSON.stringify(user));

            return user;
        }

        throw response.data.message || loginError;
    } catch (error) {
        throw resolveAxiosError(error).message || loginError;
    }
}

export async function submitStudentForm(formData) {
    const loginError = 'Something went wrong while signing with Google.';
    try {
        const response = await api.post('/submit-student-form', formData);

        if (response.data.success === true) {
            localStorage.setItem("user", JSON.stringify(response.data.data.user));
            return response.data.data.user;
        }

        throw response.data.message || loginError;
    } catch (error) {
        throw resolveAxiosError(error).message || loginError;
    }
}

export async function submitTutorForm(formData) {
    const loginError = 'Something went wrong while submitting tutor form.';
    try {
        const response = await api.post('/submit-tutor-form', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data.success === true) {
            localStorage.setItem("user", JSON.stringify(response.data.data.user));
            return response.data.data.user;
        }

        throw response.data.message || loginError;
    } catch (error) {
        throw resolveAxiosError(error).message || loginError;
    }
}

export async function logout() {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    } catch (error) {
        throw 'Something went wrong while logging out.';
    }
}