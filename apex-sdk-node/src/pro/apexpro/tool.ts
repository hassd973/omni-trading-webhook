import { ENV } from '../Constant';

export class ApiTool {
  private baseUrl: string;

  constructor(env: ENV) {
    this.baseUrl = env.url;
  }

  async get(url: string, config?: any): Promise<any> {
    // Placeholder: Implement actual API call
    console.log(`GET ${this.baseUrl}${url}`, config);
    return { data: {} };
  }

  async post(url: string, data?: any): Promise<any> {
    // Placeholder: Implement actual API call
    console.log(`POST ${this.baseUrl}${url}`, data);
    return { data: {} };
  }
}
