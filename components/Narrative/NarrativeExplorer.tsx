"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { NarrativeCard } from "./NarrativeCard";
import { Narrative } from "@/types/narrative";
import { api } from "@/lib/api";

interface NarrativeExplorerProps {
  type: "discover" | "my" | "following";
}

export function NarrativeExplorer({ type }: NarrativeExplorerProps) {
  const { context } = useMiniAppContext();
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);

  // 加载叙事数据
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后设置状态

    async function loadNarratives() {
      try {
        if (!isMounted) return;
        setLoading(true);

        const options: any = {
          type,
          userFid: context?.user?.fid,
        };

        if (searchTerm) {
          options.searchTerm = searchTerm;
        }

        if (selectedTag) {
          options.tags = [selectedTag];
        }

        console.log('加载叙事数据，选项:', options);
        const narrativesData = await api.getNarratives(options);
        console.log('获取到叙事数据:', narrativesData);

        if (!isMounted) return; // 检查组件是否仍然挂载

        // 确保narrativesData是数组
        const validNarratives = Array.isArray(narrativesData) ? narrativesData : [];
        setNarratives(validNarratives);

        // 提取所有标签，确保安全处理
        try {
          const tags = Array.from(
            new Set(validNarratives.flatMap((narrative) => {
              if (narrative && Array.isArray(narrative.tags)) {
                return narrative.tags;
              }
              return [];
            }))
          );
          setAllTags(tags);
        } catch (tagError) {
          console.warn('提取标签失败:', tagError);
          setAllTags([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("加载叙事失败", error);
        if (isMounted) {
          setNarratives([]); // 设置为空数组而不是保持旧状态
          setAllTags([]);
          setLoading(false);
        }
        // 不重新抛出错误，让组件正常显示空状态
      }
    }

    loadNarratives();

    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [type, context?.user?.fid, searchTerm, selectedTag]);

  const handleTagToggle = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="搜索叙事..."
          className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* 标签选择器 */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full px-3 py-1 text-sm ${
              selectedTag === null
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
            onClick={() => setSelectedTag(null)}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`rounded-full px-3 py-1 text-sm ${
                selectedTag === tag
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 加载中状态 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 min-h-[400px]">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent mb-6"></div>
          <p className="text-gray-300 text-lg font-medium mb-2">正在加载叙事...</p>
          <p className="text-gray-500 text-sm">请稍候，正在获取最新的故事内容</p>
        </div>
      )}

      {/* 结果数量 */}
      {!loading && (
        <p className="text-sm text-gray-400">
          找到 {narratives.length} 个符合条件的叙事
        </p>
      )}

      {/* 叙事列表 */}
      {!loading && narratives.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {narratives.map((narrative) => (
            <NarrativeCard key={narrative.narrativeId} narrative={narrative} />
          ))}
        </div>
      )}

      {/* 如果没有结果 */}
      {!loading && narratives.length === 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-lg font-medium text-white mb-2">
            {type === "discover" ? "暂无叙事" : type === "my" ? "你还没有创建叙事" : "暂无关注的叙事"}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {type === "discover"
              ? "成为第一个创建叙事的人，开启协作故事的旅程"
              : type === "my"
              ? "创建你的第一个叙事，与社区一起编织精彩故事"
              : "探索并关注感兴趣的叙事，参与协作创作"}
          </p>
          {type !== "following" && (
            <button
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => {
                // 触发创建叙事模态框
                const createButton = document.querySelector('[data-create-narrative]') as HTMLButtonElement;
                if (createButton) {
                  createButton.click();
                }
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建叙事
            </button>
          )}
        </div>
      )}
    </div>
  );
}