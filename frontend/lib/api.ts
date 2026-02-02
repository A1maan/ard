/**
 * API client for the Soil Property Prediction backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const FARMS_API_URL = process.env.NEXT_PUBLIC_FARMS_API_URL || 'http://localhost:8001';

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

  /**
   * Get list of farms from BigQuery
   */
  async getFarms(limit: number = 50): Promise<FarmsListResponse> {
    const url = `${FARMS_API_URL}/api/farms?limit=${limit}`;
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to Farms API server. Is the backend running?');
      }
      throw error;
    }
  }

  /**
   * Get detailed farm data including soil metrics and recommendations
   */
  async getFarm(farmId: string): Promise<FarmDetail> {
    const url = `${FARMS_API_URL}/api/farms/${farmId}`;
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to Farms API server. Is the backend running?');
      }
      throw error;
    }
  }
}

// Farm types
export interface FarmListItem {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  size: string;
  soilType: string;
  health: 'good' | 'warning' | 'critical';
  healthScore: number;
}

export interface FarmsListResponse {
  farms: FarmListItem[];
  total: number;
}

export interface SoilAnalysisNutrient {
  value: number;
  unit: string;
  status: string;
}

export interface FertilizerRecommendation {
  nutrient: string;
  priority: number;
  status: string;
  current_value: string;
  target: string;
  products?: Array<{
    name: string;
    analysis: string;
    rate: string;
    note: string;
  }>;
  note?: string;
}

export interface FarmFertilizerAnalysis {
  farm_soil_health: {
    overall_status: string;
    critical_issues_count: number;
    moderate_issues_count: number;
    warnings_count: number;
  };
  soil_analysis: Record<string, SoilAnalysisNutrient | { clay_pct: number; sand_pct: number; silt_pct: number }>;
  recommendations: FertilizerRecommendation[];
  warnings: string[];
  general_advice: string[];
  target_crop: string;
}

export interface CropRecommendation {
  crop: string;
  category: string;
  score: number;
  rating: string;
  positives: string[];
  issues: string[];
  notes: string;
}

export interface FarmCropAnalysis {
  row_id: number;
  location: string | null;
  soil_summary: Record<string, unknown>;
  constraints: string[];
  top_5_crops: CropRecommendation[];
  all_suitable: CropRecommendation[];
  not_recommended: CropRecommendation[];
}

export interface FarmDetail extends FarmListItem {
  farm_fertilizer_analysis?: FarmFertilizerAnalysis;
  farm_crop_analysis?: FarmCropAnalysis;
  raw_predictions?: Record<string, number>;
}

// Export singleton instance
export const api = new ApiClient();

// Export class for custom instances
export { ApiClient };
