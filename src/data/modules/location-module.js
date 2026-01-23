import api from "../axios";

export async function getCountries() {
    try {
        const response = await api.get("/get-countries");
        const countries = response.data.data;
        return [...new Set(countries)];
    } catch (_) {
        return [];
    }
} 

export async function getStatesByCountry({ country }) {
    try {
        const response = await api.get(
            `/get-states/${country}`,
        );
        const states = response.data.data;
        return [...new Set(states)];
    } catch (_) {
        return [];
    }
}

export async function getCitiesByState({ country, state }) {
    try {
        const response = await api.get(
            `/get-cities/${country}/${state}`
        );
        const cities = response.data.data;
        return [...new Set(cities)];
    } catch (_) {
        return [];
    }
}