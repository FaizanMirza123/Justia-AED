const API_BASE_URL = 'https://justia.dipietroassociates.com/api';

/**
 * Send a chat message to the AED law assistant
 * @param {string} message - User's question
 * @param {object} filters - { state, topic, industry }
 * @param {number|null} threadId - Existing thread ID to continue, or null for new thread
 * @param {string} sessionId - Anonymous session ID for thread ownership
 * @returns {Promise<{ reply: string, sources: Array, usedWebFallback: boolean, threadId: number }>}
 */
export const sendChatMessage = async (message, filters = {}, threadId = null, sessionId = null) => {
  try {
    const token = localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, filters, threadId, sessionId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Chat request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
};
