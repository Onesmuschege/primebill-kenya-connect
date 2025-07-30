
import { create } from 'zustand'
import { toast } from '@/hooks/use-toast'

export interface NotificationState {
  id: string
  title?: string
  description?: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  timestamp: Date
}

interface NotificationStore {
  notifications: NotificationState[]
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  showSuccess: (title: string, description?: string) => void
  showError: (title: string, description?: string) => void
  showWarning: (title: string, description?: string) => void
  showInfo: (title: string, description?: string) => void
}

const useNotifications = create<NotificationStore>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7)
    const newNotification = {
      ...notification,
      id,
      timestamp: new Date(),
    }
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications.slice(0, 4)] // Keep only 5 most recent
    }))
    
    // Also show as toast
    toast({
      title: notification.title,
      description: notification.description,
      variant: notification.variant === 'error' ? 'destructive' : 'default',
    })
    
    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration || 5000)
    }
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  
  clearNotifications: () => {
    set({ notifications: [] })
  },
  
  showSuccess: (title, description) => {
    get().addNotification({ title, description, variant: 'success' })
  },
  
  showError: (title, description) => {
    get().addNotification({ title, description, variant: 'error' })
  },
  
  showWarning: (title, description) => {
    get().addNotification({ title, description, variant: 'warning' })
  },
  
  showInfo: (title, description) => {
    get().addNotification({ title, description, variant: 'info' })
  },
}))

export { useNotifications }
