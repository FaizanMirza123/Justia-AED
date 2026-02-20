// ===========================
// AED LAWS API - Backend Integration
// ===========================

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetches all states from the backend API
 * @returns {Promise<Array>} Array of state objects with id, name, abbreviation, slug, summary
 */
export const getStatesList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/states`);
    
    if (!response.ok) {
      if (response.status === 500) {
        throw new Error('Server error');
      }
      throw new Error(`Failed to fetch states: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching states list:', error);
    throw error;
  }
};

/**
 * Fetches detailed state information with all associated laws
 * @param {string} slug - State slug (e.g., "alabama", "new-york")
 * @returns {Promise<Object>} State object with slug, name, summary, and laws array
 */
export const getStateDetails = async (slug) => {
  if (!slug) {
    throw new Error('No state slug provided');
  }

  try {
    const normalized = slug.toLowerCase().replace(/\s+/g, '-');
    const response = await fetch(`${API_BASE_URL}/states/${normalized}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({ message: 'State not found' }));
        throw new Error(errorData.message || 'State not found');
      }
      if (response.status === 500) {
        throw new Error('Server error');
      }
      throw new Error(`Failed to fetch state details: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching state details:', error);
    throw error;
  }
};

/**
 * Fetches all laws from all states
 * @returns {Promise<Array>} Array of law objects with id, state_id, title, description, state_slug, state_name
 */
export const getAllLaws = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/laws`);
    
    if (!response.ok) {
      if (response.status === 500) {
        throw new Error('Server error');
      }
      throw new Error(`Failed to fetch laws: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all laws:', error);
    throw error;
  }
};

/**
 * Fetches all laws for a specific state by slug
 * @param {string} slug - State slug (e.g., "alabama", "new-york")
 * @returns {Promise<Array>} Array of law objects for the specified state
 */
export const getLawsByState = async (slug) => {
  if (!slug) {
    throw new Error('No state slug provided');
  }

  try {
    const normalized = slug.toLowerCase().replace(/\s+/g, '-');
    const response = await fetch(`${API_BASE_URL}/laws/${normalized}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({ message: 'State not found' }));
        throw new Error(errorData.message || 'State not found');
      }
      if (response.status === 500) {
        throw new Error('Server error');
      }
      throw new Error(`Failed to fetch laws: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching laws by state:', error);
    throw error;
  }
};
