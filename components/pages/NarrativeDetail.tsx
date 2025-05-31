"use client";

import { useState, useEffect } from "react";
import { SafeAreaContainer } from "@/components/safe-area-container";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useRouter } from "next/navigation";
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
  const { context, actions } = useMiniAppContext();
  const router = useRouter();
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
    let isMounted = true;

    async function loadNarrativeData() {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        console.log('开始加载叙事数据，ID:', narrativeId);

        // 获取叙事信息
        const narrativeData = await api.getNarrative(narrativeId);
        console.log('获取到叙事数据:', narrativeData);

        if (!isMounted) return;

        if (!narrativeData) {
          setError("找不到该故事");
          setLoading(false);
          return;
        }

        setNarrative(narrativeData);

        // 获取贡献信息
        try {
          const contributionsData = await api.getNarrativeContributions(narrativeId);
          console.log('获取到贡献数据:', contributionsData);

          if (!isMounted) return;

          const validContributions = Array.isArray(contributionsData) ? contributionsData : [];
          setContributions(validContributions);

          // 默认选中第一个贡献（创世片段）
          if (validContributions.length > 0) {
            setSelectedContribution(validContributions[0].contributionId);
          }
        } catch (contribError) {
          console.warn('获取贡献数据失败:', contribError);
          setContributions([]);
        }

        // 获取分支信息
        try {
          const branchesData = await api.getNarrativeBranches(narrativeId);
          console.log('获取到分支数据:', branchesData);

          if (!isMounted) return;

          const validBranches = Array.isArray(branchesData) ? branchesData : [];
          setBranches(validBranches);
        } catch (branchError) {
          console.warn('获取分支数据失败:', branchError);
          setBranches([]);
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("加载叙事数据失败", err);
        if (isMounted) {
          setError(`加载故事数据失败: ${err instanceof Error ? err.message : '未知错误'}`);
          setLoading(false);
        }
      }
    }

    loadNarrativeData();

    return () => {
      isMounted = false;
    };
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
      // 通过Farcaster发布Cast
      let castHash: string;

      if (actions?.composeCast) {
        // 准备Cast文本
        const castText = `${text}\n\n${window.location.origin}/narratives/${narrativeId}`;

        // 发布Cast
        const castResult = await actions.composeCast({
          text: castText
        });

        if (!castResult || !castResult.cast?.hash) {
          throw new Error("发布Cast失败");
        }

        castHash = castResult.cast.hash;
      } else {
        throw new Error("Farcaster API不可用");
      }

      const result = await api.addContribution({
        narrativeId,
        castHash: castHash,
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
      <SafeAreaContainer insets={context?.client?.safeAreaInsets}>
        <div className="flex min-h-screen items-center justify-center bg-[#1A1B23] text-white">
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
      <SafeAreaContainer insets={context?.client?.safeAreaInsets}>
        <div className="flex min-h-screen items-center justify-center bg-[#1A1B23] text-white">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500">出错了</h2>
            <p className="mt-2">{error || "找不到该故事"}</p>
            <button
              className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
              onClick={() => router.back()}
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
    <SafeAreaContainer insets={context?.client?.safeAreaInsets}>
      <div className="flex flex-col min-h-screen bg-[#1A1B23] text-white">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-[#1A1B23] p-4">
          <button
            className="flex items-center text-gray-400"
            onClick={() => router.back()}
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