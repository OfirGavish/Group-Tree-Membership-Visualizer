// Client-side caching service using localStorage
// Provides intelligent caching with expiration for Microsoft Graph API responses

export interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

export class CacheService {
  // Cache duration in milliseconds
  private static readonly CACHE_DURATION = {
    users: 5 * 60 * 1000,      // 5 minutes - User search results
    groups: 10 * 60 * 1000,    // 10 minutes - Group listings and details
    memberships: 5 * 60 * 1000  // 5 minutes - User group memberships and group members
  } as const

  // Cache key prefixes for organization
  private static readonly CACHE_KEYS = {
    ALL_USERS: 'cache:users:all',
    ALL_GROUPS: 'cache:groups:all',
    USER_GROUPS: 'cache:user:groups:',
    GROUP_MEMBERS: 'cache:group:members:',
    GROUP_MEMBER_OF: 'cache:group:memberof:'
  } as const

  /**
   * Store data in cache with expiration
   */
  static set<T>(key: string, data: T, type: keyof typeof CacheService.CACHE_DURATION): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_DURATION[type]
      }
      
      localStorage.setItem(key, JSON.stringify(cacheItem))
      
      // Log cache write (useful for debugging)
      console.log(`[Cache] Set: ${key} (expires in ${this.CACHE_DURATION[type] / 1000}s)`)
    } catch (error) {
      console.warn('[Cache] Failed to set cache item:', error)
      // Fail silently - app should work without cache
    }
  }

  /**
   * Retrieve data from cache if not expired
   */
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key)
      if (!cached) {
        return null
      }

      const item: CacheItem<T> = JSON.parse(cached)
      
      // Check if expired
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key)
        console.log(`[Cache] Expired and removed: ${key}`)
        return null
      }

      console.log(`[Cache] Hit: ${key}`)
      return item.data
    } catch (error) {
      console.warn('[Cache] Failed to get cache item:', error)
      // Clean up corrupted cache item
      localStorage.removeItem(key)
      return null
    }
  }

  /**
   * Remove specific cache item
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key)
      console.log(`[Cache] Removed: ${key}`)
    } catch (error) {
      console.warn('[Cache] Failed to remove cache item:', error)
    }
  }

  /**
   * Clear all cache items
   */
  static clear(): void {
    try {
      const keysToRemove: string[] = []
      
      // Find all cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('cache:')) {
          keysToRemove.push(key)
        }
      }

      // Remove cache items
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      console.log(`[Cache] Cleared ${keysToRemove.length} cache items`)
    } catch (error) {
      console.warn('[Cache] Failed to clear cache:', error)
    }
  }

  /**
   * Get cache statistics for debugging
   */
  static getStats(): { totalItems: number, totalSize: number, items: Array<{ key: string, size: number, expiresIn: number }> } {
    const stats = {
      totalItems: 0,
      totalSize: 0,
      items: [] as Array<{ key: string, size: number, expiresIn: number }>
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('cache:')) {
          const value = localStorage.getItem(key)
          if (value) {
            const size = value.length
            stats.totalItems++
            stats.totalSize += size

            try {
              const item: CacheItem<any> = JSON.parse(value)
              const expiresIn = Math.max(0, item.expiry - Date.now())
              stats.items.push({ key, size, expiresIn })
            } catch {
              // Invalid cache item
              stats.items.push({ key, size, expiresIn: 0 })
            }
          }
        }
      }
    } catch (error) {
      console.warn('[Cache] Failed to get cache stats:', error)
    }

    return stats
  }

  /**
   * Cache key generators for consistent naming
   */
  static keys = {
    allUsers: () => CacheService.CACHE_KEYS.ALL_USERS,
    allGroups: () => CacheService.CACHE_KEYS.ALL_GROUPS,
    userGroups: (userId: string) => `${CacheService.CACHE_KEYS.USER_GROUPS}${userId}`,
    groupMembers: (groupId: string) => `${CacheService.CACHE_KEYS.GROUP_MEMBERS}${groupId}`,
    groupMemberOf: (groupId: string) => `${CacheService.CACHE_KEYS.GROUP_MEMBER_OF}${groupId}`
  }
}

// Global cache management functions for debugging
if (typeof window !== 'undefined') {
  // Make cache functions available in browser console for debugging
  (window as any).cacheDebug = {
    stats: () => CacheService.getStats(),
    clear: () => CacheService.clear(),
    get: (key: string) => CacheService.get(key),
    remove: (key: string) => CacheService.remove(key)
  }
}
