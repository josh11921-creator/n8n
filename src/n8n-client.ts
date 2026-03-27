import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  N8nConfig,
  WorkflowData,
  ExecutionFilters,
  CredentialData,
  TagData,
  VariableData,
  UserData,
  ProjectData,
  ApiResponse
} from './types.js';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;

function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors, timeouts, DNS failures
    return true;
  }
  const status = error.response.status;
  // Retry on rate-limit (429) and server errors (5xx)
  return status === 429 || (status >= 500 && status <= 599);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class N8nClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: N8nConfig) {
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY_MS;

    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      headers: {
        'X-N8N-API-KEY': config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: AxiosError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const axiosErr = err as AxiosError;
        if (attempt < this.maxRetries && isRetryableError(axiosErr)) {
          lastError = axiosErr;
          const delay = this.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
        } else {
          throw err;
        }
      }
    }

    throw lastError;
  }

  // ========== WORKFLOWS ==========

  async createWorkflow(workflow: WorkflowData): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/workflows', workflow));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getWorkflows(filters?: {
    active?: boolean;
    tags?: string;
    name?: string;
    projectId?: string;
    limit?: number;
    cursor?: string;
    fields?: string[];
  }): Promise<ApiResponse> {
    try {
      const { fields, ...apiFilters } = filters || {};
      const response = await this.withRetry(() =>
        this.client.get('/workflows', { params: apiFilters })
      );

      if (fields && fields.length > 0 && response.data?.data) {
        const filteredData = response.data.data.map((workflow: any) => {
          const filtered: any = {};
          fields.forEach(field => {
            if (workflow.hasOwnProperty(field)) {
              filtered[field] = workflow[field];
            }
          });
          return filtered;
        });
        return { data: { ...response.data, data: filteredData } };
      }

      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getWorkflow(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.get(`/workflows/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async updateWorkflow(id: string, workflow: Partial<WorkflowData>): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.put(`/workflows/${id}`, workflow));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deleteWorkflow(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.delete(`/workflows/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async activateWorkflow(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.post(`/workflows/${id}/activate`)
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deactivateWorkflow(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.post(`/workflows/${id}/deactivate`)
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async transferWorkflow(id: string, destinationProjectId: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.put(`/workflows/${id}/transfer`, { destinationProjectId })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getWorkflowTags(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.get(`/workflows/${id}/tags`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async updateWorkflowTags(id: string, tagIds: string[]): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.put(`/workflows/${id}/tags`, { tagIds })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  // ========== EXECUTIONS ==========

  async getExecutions(filters?: ExecutionFilters & { fields?: string[] }): Promise<ApiResponse> {
    try {
      const { fields, ...apiFilters } = filters || {};
      const response = await this.withRetry(() =>
        this.client.get('/executions', { params: apiFilters })
      );

      if (fields && fields.length > 0 && response.data?.data) {
        const filteredData = response.data.data.map((execution: any) => {
          const filtered: any = {};
          fields.forEach(field => {
            if (execution.hasOwnProperty(field)) {
              filtered[field] = execution[field];
            }
          });
          return filtered;
        });
        return { data: { ...response.data, data: filteredData } };
      }

      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getExecution(id: string, includeData = false): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.get(`/executions/${id}`, { params: { includeData } })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deleteExecution(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.delete(`/executions/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async retryExecution(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.post(`/executions/${id}/retry`)
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  // ========== CREDENTIALS ==========

  async createCredential(credential: CredentialData): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/credentials', credential));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deleteCredential(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.delete(`/credentials/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getCredentialSchema(credentialTypeName: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.get(`/credentials/schema/${credentialTypeName}`)
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async transferCredential(id: string, destinationProjectId: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.put(`/credentials/${id}/transfer`, { destinationProjectId })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  // ========== TAGS ==========

  async createTag(tag: TagData): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/tags', tag));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getTags(): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.get('/tags'));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getTag(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.get(`/tags/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async updateTag(id: string, tag: TagData): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.put(`/tags/${id}`, tag));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deleteTag(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.delete(`/tags/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  // ========== VARIABLES ==========

  async createVariable(variable: VariableData): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/variables', variable));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getVariables(filters?: { projectId?: string; state?: string }): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.get('/variables', { params: filters })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async updateVariable(id: string, variable: Partial<VariableData>): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.put(`/variables/${id}`, variable)
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deleteVariable(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.delete(`/variables/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  // ========== USERS ==========

  async getUsers(includeRole = false): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.get('/users', { params: { includeRole } })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async createUsers(users: UserData[]): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/users', users));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getUser(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.get(`/users/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.delete(`/users/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async changeUserRole(id: string, role: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.patch(`/users/${id}/role`, { role })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  // ========== PROJECTS ==========

  async createProject(project: ProjectData): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/projects', project));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async getProjects(): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.get('/projects'));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async updateProject(id: string, project: Partial<ProjectData>): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.put(`/projects/${id}`, project)
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.delete(`/projects/${id}`));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async addUserToProject(projectId: string, userId: string, role: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.post(`/projects/${projectId}/users`, { userId, role })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async removeUserFromProject(projectId: string, userId: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.delete(`/projects/${projectId}/users/${userId}`)
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async changeUserProjectRole(projectId: string, userId: string, role: string): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() =>
        this.client.patch(`/projects/${projectId}/users/${userId}`, { role })
      );
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  // ========== OTHER ==========

  async generateAudit(): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/audit'));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }

  async pullSourceControl(): Promise<ApiResponse> {
    try {
      const response = await this.withRetry(() => this.client.post('/source-control/pull'));
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.message || error.message };
    }
  }
}
