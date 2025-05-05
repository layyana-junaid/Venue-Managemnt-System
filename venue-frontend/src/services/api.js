import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateUserBalance: async (userId, newBalance) => {
    try {
      const response = await api.put(`/auth/update/${userId}`, { balance: newBalance });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const venueService = {
  getVenues: async () => {
    try {
      const response = await api.get('/venues');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createVenue: async (venueData) => {
    try {
      const response = await api.post('/venues', venueData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateVenue: async (id, venueData) => {
    try {
      const response = await api.put(`/venues/${id}`, venueData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteVenue: async (id) => {
    try {
      const response = await api.delete(`/venues/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const bookingService = {
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateBooking: async (id, bookingData) => {
    try {
      const response = await api.put(`/bookings/${id}`, bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default api; 