import { mockStore } from './mockHospitalStore';
import { NotificationItem, NotificationType, NotificationSeverity } from '@/types';

export const NotificationService = {
  async getNotifications(targetRole?: string, unreadOnly?: boolean): Promise<NotificationItem[]> {
    return Promise.resolve(mockStore.getNotifications(targetRole, unreadOnly));
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    return Promise.resolve(mockStore.markNotificationAsRead(id));
  },

  async markAllAsRead(targetRole?: string): Promise<void> {
    mockStore.markAllNotificationsAsRead(targetRole);
    return Promise.resolve();
  },

  async dispatchNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    severity: NotificationSeverity;
    targetRole?: string;
    targetUserId?: string;
    linkUrl?: string;
  }): Promise<NotificationItem> {
    return Promise.resolve(mockStore.createNotification(data));
  },

  async getUnreadCount(targetRole?: string): Promise<number> {
    const list = mockStore.getNotifications(targetRole, true);
    return Promise.resolve(list.length);
  },

  subscribe(listener: () => void): () => void {
    return mockStore.subscribe(listener);
  },
};
