import api from "./axios";

export const notificationService = {
  getNotifications: async (userId: string) => {
    const res = await api.get(`/notifications/${userId}`);
    return res.data.data;
  },

  markAsRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  createNotification: async (data: {
    userId: string;
    title: string;
    message: string;
  }) => {
    const res = await api.post("/notifications", data);
    return res.data.data;
  },
};
