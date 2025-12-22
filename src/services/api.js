import { mockInventory, mockHistory } from './mockData';

// Toggle this to switch between Mock and Real GAS backend
const USE_MOCK = false;

// ✅ Google Apps Script Web App URL (Deployed)
const API_URL = 'https://script.google.com/macros/s/AKfycbwAdd8MyZZ_7K7pWI1vCvpnMp8Rq7B_nhQ4xV-Z7XxbyA2hfFI_Bn8UL9FFWWryC4nm/exec';

// Spreadsheet ID (for reference)
const SPREADSHEET_ID = "1c3U81eazLDTMQTdDScObASikKgYJf_qmKabn4Lyf1Og";

export const api = {
    /**
     * Get all inventory items
     */
    getInventory: async () => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true, data: mockInventory }), 500);
            });
        }

        try {
            const response = await fetch(`${API_URL}?action=getInventory`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }
    },

    /**
     * Get transaction history
     */
    /**
     * Get transaction history
     * @param {string|null} startDate - Optional start date filter (YYYY-MM-DD)
     */
    getHistory: async (startDate = null) => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true, data: mockHistory }), 500);
            });
        }

        try {
            let url = `${API_URL}?action=getHistory`;
            if (startDate) {
                url += `&startDate=${encodeURIComponent(startDate)}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching history:', error);
            throw error;
        }
    },

    /**
     * Search for products by name or barcode
     */
    searchProduct: async (query) => {
        if (USE_MOCK) {
            const filtered = mockInventory.filter(item =>
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.barcode.includes(query)
            );
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true, data: filtered }), 300);
            });
        }

        try {
            const response = await fetch(`${API_URL}?action=searchProduct&query=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    },

    /**
     * Get single product by barcode
     */
    getProduct: async (barcode) => {
        if (USE_MOCK) {
            const product = mockInventory.find(item => item.barcode === barcode);
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (product) {
                        resolve({ success: true, data: product });
                    } else {
                        reject({ success: false, error: 'Product not found' });
                    }
                }, 300);
            });
        }

        try {
            const response = await fetch(`${API_URL}?action=getProduct&barcode=${encodeURIComponent(barcode)}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    /**
     * Update stock (IN/OUT)
     */
    updateStock: async (barcode, amount, type, userId = 'WebApp', imageUrl = null) => {
        if (USE_MOCK) {
            console.log(`[MOCK] Update ${barcode}: ${type} ${amount}`, imageUrl);
            return new Promise((resolve) => {
                setTimeout(() => resolve({
                    success: true,
                    message: "อัปเดตสำเร็จ (Mock)",
                    newStock: Math.floor(Math.random() * 100)
                }), 800);
            });
        }

        try {
            // Google Apps Script doesn't support FormData well, use URL parameters instead
            const params = new URLSearchParams({
                action: 'updateStock',
                barcode: barcode,
                amount: amount,
                type: type,
                userId: userId
            });

            if (imageUrl) {
                params.append('imageUrl', imageUrl);
            }

            const response = await fetch(`${API_URL}?${params.toString()}`, {
                method: 'POST',
                redirect: 'follow'
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    },

    /**
     * Bulk Update Min Stock from AI recommendations
     */
    bulkUpdateMinStock: async (updates) => {
        if (USE_MOCK) {
            return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: `Mock updated ${updates.length} items` }), 1000));
        }
        try {
            const params = new URLSearchParams({
                action: 'bulkUpdateMinStock',
                updates: JSON.stringify(updates)
            });
            const response = await fetch(`${API_URL}?${params.toString()}`, {
                method: 'POST',
                redirect: 'follow'
            });
            return await response.json();
        } catch (error) {
            console.error('Error bulk updating:', error);
            throw error;
        }
    },

    /**
     * Save daily report to Reports sheet
     */
    saveReport: async (note = '') => {
        if (USE_MOCK) return { success: true };
        try {
            const response = await fetch(`${API_URL}?action=saveReport&note=${encodeURIComponent(note)}`, { method: 'POST' });
            return await response.json();
        } catch (e) {
            console.error('Error saving report:', e);
            throw e;
        }
    },

    /**
     * Clear Transaction history
     */
    clearHistory: async () => {
        if (USE_MOCK) return { success: true, message: 'Mock history cleared' };
        try {
            const response = await fetch(`${API_URL}?action=clearHistory`, { method: 'POST' });
            return await response.json();
        } catch (e) {
            console.error('Error clearing history:', e);
            throw e;
        }
    },

    /**
     * Upload image to Google Drive
     */
    uploadImage: async (imageFile, barcode) => {
        if (USE_MOCK) {
            console.log('[MOCK] Upload image:', imageFile.name);
            return new Promise((resolve) => {
                setTimeout(() => resolve({
                    success: true,
                    imageUrl: 'https://via.placeholder.com/300',
                }), 1000);
            });
        }

        try {
            // Convert to Base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result); // Contains data:image/jpeg;base64,...
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            // Use URLSearchParams for the Body to act as Form Data
            const formData = new URLSearchParams();
            formData.append('action', 'uploadImage');
            formData.append('imageData', base64);
            formData.append('barcode', barcode || '');

            // Send as POST Body
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    /**
     * Configuration
     */
    config: {
        USE_MOCK,
        API_URL,
        SPREADSHEET_ID,
        SPREADSHEET_URL: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`
    }
};
