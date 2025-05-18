"use client";

import { useState, useEffect } from "react";
import { SafeAreaContainer } from "@/components/safe-area-container";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { api } from "@/lib/api";
import { Narrative, NarrativeContribution, NarrativeBranch } from "@/types/narrative";
import NarrativeTree from "@/components/Narrative/NarrativeTree";
import NarrativeHeader from "@/components/Narrative/NarrativeHeader";
import ContributionView from "@/components/Narrative/ContributionView";
import ContributionForm from "@/components/Narrative/ContributionForm";

interface NarrativeDetailProps {
  narrativeId: string;
}

export default function NarrativeDetail({ narrativeId }: NarrativeDetailProps) {
  const { context } = useMiniAppContext();
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [contributions, setContributions] = useState<NarrativeContribution[]>([]);
  const [branches, setBranches] = useState<NarrativeBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<string | null>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [contributionMode, setContributionMode] = useState<'extend' | 'branch'>('extend');

  // 加载叙事数据
  useEffect(() => {
    async function loadNarrativeData() {
      try {
        setLoading(true);
        
        // 获取叙事信息
        const narrativeData = await api.getNarrative(narrativeId);
        if (!narrativeData) {
          setError("找不到该故事");
          setLoading(false);
          return;
        }
        
        setNarrative(narrativeData);
        
        // 获取贡献信息
        const contributionsData = await api.getNarrativeContributions(narrativeId);
        setContributions(contributionsData);
        
        // 默认选中第一个贡献（创世片段）
        if (contributionsData.length > 0) {
          setSelectedContribution(contributionsData[0].contributionId);
        }
        
        // 获取分支信息
        const branchesData = await api.getNarrativeBranches(narrativeId);
        setBranches(branchesData);
        
        setLoading(false);
      } catch (err) {
        console.error("加载叙事数据失败", err);
        setError("加载故事数据失败，请重试");
        setLoading(false);
      }
    }
    
    loadNarrativeData();
  }, [narrativeId]);

  const handleContributionSelect = (contributionId: string) => {
    setSelectedContribution(contributionId);
    setShowContributeForm(false);
  };

  const handleContributeClick = (mode: 'extend' | 'branch') => {
    setContributionMode(mode);
    setShowContributeForm(true);
  };

  const handleContributeClose = () => {
    setShowContributeForm(false);
  };

  const handleContributeSubmit = async (text: string, isBranchStart: boolean, branchName?: string) => {
    if (!context?.user?.fid || !selectedContribution) return;
    
    try {
      // 在实际应用中，这应该通过 Farcaster 发布 Cast
      // 然后由后端处理 Cast 并更新数据库
      const mockCastHash = `0x${Math.random().toString(16).substring(2)}`;
      
      const result = await api.addContribution({
        narrativeId,
        castHash: mockCastHash,
        contributorFid: context.user.fid,
        contributorUsername: context.user.username,
        contributorDisplayName: context.user.displayName,
        contributorPfp: context.user.pfpUrl,
        parentContributionId: selectedContribution,
        textContent: text,
        isBranchStart,
        branchName,
        branchDescription: isBranchStart ? `从 "${text.substring(0, 20)}..." 开始的故事分支` : undefined
      });
      
      // 更新本地状态
      setContributions([...contributions, result.contribution]);
      
      if (result.branch) {
        setBranches([...branches, result.branch]);
      }
      
      // 关闭表单
      setShowContributeForm(false);
      
      // 选中新创建的贡献
      setSelectedContribution(result.contribution.contributionId);
      
    } catch (error) {
      console.error("提交贡献失败", error);
      alert("提交贡献失败，请重试");
    }
  };

  if (loading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold">加载中...</h2>
            <p className="text-sm mt-2">正在加载故事内容</p>
          </div>
        </div>
      </SafeAreaContainer>
    );
  }

  if (error || !narrative) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500">出错了</h2>
            <p className="mt-2">{error || "找不到该故事"}</p>
            <button 
              className="mt-4 px-4 py-2 bg-purple-600 rounded-lg"
              onClick={() => window.history.back()}
            >
              返回
            </button>
          </div>
        </div>
      </SafeAreaContainer>
    );
  }

  // 获取当前选中的贡献
  const currentContribution = selectedContribution 
    ? contributions.find(c => c.contributionId === selectedContribution) || null
    : null;

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <div className="flex flex-col min-h-screen bg-[#1A1B23] text-white">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-[#1A1B23] p-4">
          <button 
            className="flex items-center text-gray-400"
            onClick={() => window.history.back()}
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h1 className="text-lg font-bold truncate max-w-[60%]">{narrative.title}</h1>
          <div className="w-[60px]"></div> {/* 空白占位，保持标题居中 */}
        </header>

        {/* 叙事头部信息 */}
        <NarrativeHeader narrative={narrative} />

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* 左侧叙事树 */}
          <div className="md:w-1/3 overflow-y-auto border-r border-gray-800 p-4">
            <h2 className="text-lg font-bold mb-3">故事脉络</h2>
            <NarrativeTree 
              contributions={contributions}
              branches={branches}
              selectedContributionId={selectedContribution}
              onSelectContribution={handleContributionSelect}
            />
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4">
            {showContributeForm ? (
              <ContributionForm 
                parentContribution={currentContribution}
                mode={contributionMode}
                onSubmit={handleContributeSubmit}
                onCancel={handleContributeClose}
              />
            ) : currentContribution ? (
              <>
                <ContributionView contribution={currentContribution} />
                
                {/* 贡献操作按钮 */}
                <div className="mt-6 flex space-x-3">
                  <button
                    className="flex-1 rounded-lg bg-purple-600 px-4 py-3 font-medium text-white shadow-lg hover:bg-purple-700"
                    onClick={() => handleContributeClick('extend')}
                  >
                    延续此分支
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-gray-700 px-4 py-3 font-medium text-white shadow-lg hover:bg-gray-600"
                    onClick={() => handleContributeClick('branch')}
                  >
                    创建新分支
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400">请从左侧选择一个片段</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SafeAreaContainer>
  );
} 