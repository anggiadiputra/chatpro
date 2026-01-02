const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

export interface AIConfig {
  enabled: boolean;
  model: string;
  systemPrompt: string;
  temperature: number;
  filterWords?: string[];
  activeAgentId?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  systemPrompt: string;
  knowledgeDocumentCount?: number;
  knowledgeDocuments?: KnowledgeDocument[];
}

export interface KnowledgeDocument {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  createdAt: string;
  _count?: {
    chunks: number;
  };
}

export const aiApi = {
  async getConfig() {
    const response = await fetch(`${API_URL}/api/v1/ai/config`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch AI config');
    }

    const json = await response.json();
    return json.data || json;
  },

  async updateConfig(data: Partial<AIConfig>) {
    const response = await fetch(`${API_URL}/api/v1/ai/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to update AI config');
    }

    const json = await response.json();
    return json.data || json;
  },

  async getDocuments() {
    const response = await fetch(`${API_URL}/api/v1/ai/knowledge`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch documents');
    }

    const json = await response.json();
    return json.data || json;
  },

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/ai/knowledge/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to upload document');
    }

    return response.json();
  },

  async deleteDocument(id: string) {
    const response = await fetch(`${API_URL}/api/v1/ai/knowledge/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to delete document');
    }

    return response.json();
  },

  async getAgents() {
    const response = await fetch(`${API_URL}/api/v1/ai/agents`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch agents');
    }

    const json = await response.json();
    return json.data || json;
  },

  async getAgent(id: string) {
    const response = await fetch(`${API_URL}/api/v1/ai/agents/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch agent');
    }

    const json = await response.json();
    return json.data || json;
  },

  async createAgent(data: { name: string; systemPrompt: string; documentIds: string[] }) {
    const response = await fetch(`${API_URL}/api/v1/ai/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to create agent');
    }

    const json = await response.json();
    return json.data || json;
  },

  async updateAgent(id: string, data: { name: string; systemPrompt: string; documentIds: string[] }) {
    const response = await fetch(`${API_URL}/api/v1/ai/agents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to update agent');
    }

    const json = await response.json();
    return json.data || json;
  },

  async deleteAgent(id: string) {
    const response = await fetch(`${API_URL}/api/v1/ai/agents/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to delete agent');
    }

    return true;
  },
};