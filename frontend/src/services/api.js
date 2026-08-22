const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred while talking to the API.';
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMessage = errorData.detail;
    } catch (e) {
      // Not JSON
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const api = {
  // Rules
  getRules: async () => {
    const res = await fetch(`${API_BASE_URL}/rules`);
    return handleResponse(res);
  },
  
  createRule: async (ruleData) => {
    const res = await fetch(`${API_BASE_URL}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    return handleResponse(res);
  },

  updateRule: async (ruleId, ruleData) => {
    const res = await fetch(`${API_BASE_URL}/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    return handleResponse(res);
  },

  deleteRule: async (ruleId) => {
    const res = await fetch(`${API_BASE_URL}/rules/${ruleId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  interpretRule: async (ruleText) => {
    const res = await fetch(`${API_BASE_URL}/rules/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule_text: ruleText }),
    });
    return handleResponse(res);
  },

  // Claims
  processClaimsBatch: async () => {
    const res = await fetch(`${API_BASE_URL}/claims/process-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(null), // Send null to trigger backend synthetic data load
    });
    return handleResponse(res);
  }
};
