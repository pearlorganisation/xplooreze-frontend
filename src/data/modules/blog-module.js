import { data } from "react-router-dom";
import api, { resolveAxiosError } from "../axios"; // Adjust path as needed

export async function getBlogs({ page = 0, limit = 10 }) {
    try {
        const response = await api.get('/blogs', { params: { page, limit } });
        if (response.data.success === true) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed tp get blogs');
        }
    } catch (error) {
        return {};
    }
}

export async function getBlog(id) {
    try {
        const response = await api.get(`/blogs/${id}`);
        if (response.data.success === true) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed tp get blog');
        }
    } catch (error) {
        return {};
    }
}