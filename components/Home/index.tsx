"use client";

import { useState, useEffect } from "react";
import { User } from "@/components/Home/User";
import { FarcasterActions } from "@/components/Home/FarcasterActions";
import { WalletActions } from "@/components/Home/WalletActions";
import { NarrativeExplorer } from "@/components/Narrative/NarrativeExplorer";
import { UserAchievements } from "@/components/User/UserAchievements";
import { CreateNarrative } from "@/components/Narrative/CreateNarrative";
import NotificationCenter from "@/components/User/NotificationCenter";
import OnboardingGuide from "@/components/OnboardingGuide";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { api } from "@/lib/api";
import { Notification } from "@/types/narrative";

enum Tab {
  DISCOVER = "发现",
  MY_NARRATIVES = "我的创作",
  FOLLOWING = "关注",
  ACHIEVEMENTS = "成就"
}

export default function Home() {
  const { context } = useMiniAppContext();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DISCOVER);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // 检查未读通知和处理新用户引导
  useEffect(() => {
    if (context?.user?.fid) {
      // 从API获取未读通知状态
      api.getUserNotifications(context.user.fid, { onlyUnread: true })
        .then(notifications => setHasUnreadNotifications(notifications.length > 0))
        .catch(err => console.error("获取通知状态失败", err));
      
      // 检查是否需要显示引导
      if (typeof window !== 'undefined') {
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
        setShowOnboarding(hasSeenOnboarding !== "true");
      }
    }
  }, [context?.user?.fid]);
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#1A1B23] text-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-[#1A1B23] p-4">
        <div className="flex items-center">
          <div className="mr-4 text-xl font-bold text-purple-400">CastChain</div>
          <div className="hidden space-x-2 sm:flex">
            {Object.values(Tab).map((tab) => (
              <button
                key={tab}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  activeTab === tab
                    ? "bg-gray-800 font-medium text-purple-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
                onClick={() => setActiveTab(tab as Tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {context?.user?.fid && (
            <button 
              className="relative text-gray-400 hover:text-white"
              onClick={() => setShowNotifications(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {hasUnreadNotifications && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></div>
              )}
            </button>
          )}
          <User compact />
        </div>
      </header>

      {/* 内容区域 */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-6xl">
          {/* 移动端标签页 */}
          <div className="mb-6 flex sm:hidden">
            <div className="grid w-full grid-cols-4 rounded-lg bg-gray-900 p-1">
              {Object.values(Tab).map((tab) => (
                <button
                  key={tab}
                  className={`rounded-lg py-2 text-center text-xs ${
                    activeTab === tab
                      ? "bg-gray-800 font-medium text-purple-400"
                      : "text-gray-400"
                  }`}
                  onClick={() => setActiveTab(tab as Tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 页面标题和创建按钮 */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {activeTab === Tab.DISCOVER
                ? "发现叙事"
                : activeTab === Tab.MY_NARRATIVES
                ? "我的创作"
                : activeTab === Tab.FOLLOWING
                ? "关注的叙事"
                : "我的成就"}
            </h1>
            
            {activeTab !== Tab.ACHIEVEMENTS && (
              <button
                className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white shadow-lg hover:bg-purple-700"
                onClick={() => setShowCreateModal(true)}
              >
                创建叙事
              </button>
            )}
          </div>

          {/* 主要内容 */}
          {activeTab === Tab.ACHIEVEMENTS ? (
            <UserAchievements />
          ) : (
            <NarrativeExplorer
              type={
                activeTab === Tab.DISCOVER
                  ? "discover"
                  : activeTab === Tab.MY_NARRATIVES
                  ? "my"
                  : "following"
              }
            />
          )}
        </div>
      </main>

      {/* 创建叙事模态框 */}
      {showCreateModal && <CreateNarrative onClose={() => setShowCreateModal(false)} />}

      {/* 通知中心 */}
      {showNotifications && (
        <NotificationCenter 
          onClose={() => {
            setShowNotifications(false);
            setHasUnreadNotifications(false); // 查看后清除未读状态
          }} 
        />
      )}
      
      {/* 新用户引导 */}
      {showOnboarding && <OnboardingGuide onComplete={handleOnboardingComplete} />}

      {/* 底部操作栏 */}
      <footer className="border-t border-gray-800 bg-[#1A1B23] p-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <WalletActions />
          </div>
          <div>
            <FarcasterActions />
          </div>
        </div>
      </footer>
    </div>
  );
}
