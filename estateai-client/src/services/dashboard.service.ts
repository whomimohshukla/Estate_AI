import { api } from '../lib/api'
import { unwrap } from '../lib/envelope'
import type { ApiSuccess } from '../types/api'
import type { AdminDashboard, AgentDashboard } from '../types/app'

export const dashboardService = {
  agent(): Promise<AgentDashboard> {
    return unwrap(api.get<ApiSuccess<AgentDashboard>>('/dashboard/agent'))
  },

  admin(): Promise<AdminDashboard> {
    return unwrap(api.get<ApiSuccess<AdminDashboard>>('/dashboard/admin'))
  },

  analytics(): Promise<AdminDashboard> {
    return unwrap(api.get<ApiSuccess<AdminDashboard>>('/dashboard/analytics'))
  },
}
