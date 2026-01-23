/**
 * API client for the Soil Property Prediction backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SoilProperty {
  name: string;
  short_name: string;
  description: string;
  value?: number;
  values?: number[];
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
}

export interface Sample {
  sample_idx: number;
  latitude: number | null;
  longitude: number | null;
  predictions: SoilProperty[];
}

export interface StateData {
  name: string;
  organic_carbon: number;
  ph: number;
  clay: number;
  sand: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface StatesResponse {
  states: Record<string, StateData>;
  metadata: {
    properties: string[];
    risk_levels: string[];
    units: Record<string, string>;
  };
}

export interface StateDetail extends StateData {
  state_code: string;
  sample_count: number;
  properties: Record<string, {
    value: number;
    unit: string;
    description: string;
    trend?: string;
    classification?: string;
  }>;
}

export interface HealthResponse {
  status: string;
  pipeline_loaded: boolean;
  test_data_loaded: boolean;
  test_data_summary?: {
    total_samples: number;
    columns: number;
    has_coordinates: boolean;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to API server. Is the backend running?');
      }
      throw error;
    }
  }

  /**
   * Check API health status
   */
  async getHealth(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>('/api/health');
  }

  /**
   * Get list of all predictable soil properties
   */
  async getProperties(): Promise<{ properties: SoilProperty[] }> {
    return this.fetch('/api/properties');
  }

  /**
   * Get aggregated soil data for all US states
   */
  async getStates(): Promise<StatesResponse> {
    return this.fetch<StatesResponse>('/api/states');
  }

  /**
   * Get detailed soil data for a specific state
   */
  async getStateDetail(stateCode: string): Promise<StateDetail> {
    return this.fetch<StateDetail>(`/api/states/${stateCode}`);
  }

  /**
   * Get sample predictions from test data
   */
  async getSamples(params?: { limit?: number; offset?: number; random?: boolean }): Promise<{
    total: number;
    returned: number;
    offset: number | null;
    samples: Sample[];
  }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.random) searchParams.set('random', 'true');
    
    const query = searchParams.toString();
    return this.fetch(`/api/samples${query ? `?${query}` : ''}`);
  }

  /**
   * Get prediction for a specific sample
   */
  async getSample(sampleIdx: number): Promise<Sample> {
    return this.fetch<Sample>(`/api/samples/${sampleIdx}`);
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for custom instances
export { ApiClient };
