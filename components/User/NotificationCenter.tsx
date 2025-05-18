"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { api } from "@/lib/api";
import { Notification, NotificationType } from "@/types/narrative";

interface NotificationCenterProps {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { context } = useMiniAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotifications() {
      if (!context?.user?.fid) return;

      try {
        setLoading(true);
        const userNotifications = await api.getUserNotifications(context.user.fid);
        setNotifications(userNotifications as unknown as Notification[]);
        setLoading(false);
      } catch (err) {
        console.error("加载通知失败", err);
        setError("加载通知失败，请重试");
        setLoading(false);
      }
    }

    loadNotifications();
  }, [context?.user?.fid]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // 调用API标记通知为已读
      await api.markNotificationAsRead(notificationId);
      
      // 更新本地状态
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error("标记通知已读失败", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!context?.user?.fid) return;
    
    try {
      // 调用API标记所有通知为已读
      await api.markAllNotificationsAsRead(context.user.fid);
      
      // 更新本地状态
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
    } catch (err) {
      console.error("标记所有通知已读失败", err);
    }
  };

  // 通知图标
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ELIGIBLE_FOR_SBT:
        return (
          <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      case NotificationType.NEW_CONTRIBUTION:
        return (
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        );
      case NotificationType.NEW_BADGE:
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-600 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="w-full max-w-md rounded-xl bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">通知</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-purple-600 rounded-lg text-white"
              onClick={() => window.location.reload()}
            >
              重试
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">暂无通知</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                全部标记为已读
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className={`flex items-start space-x-4 rounded-lg p-3 transition ${
                    notification.isRead ? "bg-gray-800" : "bg-gray-700"
                  }`}
                  onClick={() => handleMarkAsRead(notification.notificationId)}
                >
                  {getNotificationIcon(notification.notificationType)}
                  <div className="flex-1">
                    <p className={`${notification.isRead ? "text-gray-300" : "text-white font-medium"}`}>
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 