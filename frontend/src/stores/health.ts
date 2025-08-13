import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const useHealthStore = defineStore('health', {
  state: () => ({
    backendConnected: false,
    error: null as string | null,
    loading: false,
  }),
  actions: {
    async checkBackendStatus() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        if (response.data && response.data.status === 'OK') {
          this.backendConnected = true;
          console.log('Backend is connected successfully.');
        } else {
          throw new Error('Backend status check failed');
        }
      } catch (error: any) {
        this.backendConnected = false;
        this.error = error.message || 'Failed to connect to the backend.';
        console.error('Backend health check failed:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});
