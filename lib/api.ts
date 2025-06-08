// Updated API functions to use the real backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Group {
  id: string
  name: string
  code: string
  created_at: number
  created_by: string
  description?: string
}

interface Game {
  id: string
  name: string
  group_id: string
  created_at: number
  created_by: string
}

interface Player {
  id: string
  name: string
  group_id: string
  created_at: number
}

export const groupApi = {
  async createGroup(name: string, description?: string): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },

  async joinGroup(code: string): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(`${API_BASE}/groups/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },

  async getGroups(): Promise<ApiResponse<Group[]>> {
    try {
      const response = await fetch(`${API_BASE}/groups`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },
}

export const gameApi = {
  async createGame(groupId: string, name: string): Promise<ApiResponse<Game>> {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },

  async getGamesForGroup(groupId: string): Promise<ApiResponse<Game[]>> {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}/games`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },
}

export const playerApi = {
  async getPlayersForGroup(groupId: string): Promise<ApiResponse<Player[]>> {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}/players`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },
}

export const playthroughApi = {
  async getPlaythroughsForGame(gameId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/playthroughs`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },

  async createPlaythrough(gameId: string, results: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/playthroughs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },

  async deletePlaythrough(gameId: string, playthroughId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE}/games/${gameId}/playthroughs/${playthroughId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("API Error:", error)
      return { success: false, error: "Network error" }
    }
  },
}
