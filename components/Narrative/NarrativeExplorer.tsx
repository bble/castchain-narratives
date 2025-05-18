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
    async function loadNarratives() {
      try {
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
        
        const narrativesData = await api.getNarratives(options);
        setNarratives(narrativesData);
        
        // 提取所有标签
        const tags = Array.from(
          new Set(narrativesData.flatMap((narrative) => narrative.tags))
        );
        setAllTags(tags);
        
        setLoading(false);
      } catch (error) {
        console.error("加载叙事失败", error);
        setLoading(false);
      }
    }
    
    loadNarratives();
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
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent"></div>
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
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-center">
          <p className="text-lg font-medium">未找到叙事</p>
          <p className="mt-2 text-sm text-gray-400">
            {type === "discover"
              ? "尝试调整搜索条件或选择其他标签"
              : type === "my"
              ? "你还没有创建过叙事，点击下方按钮开始创建"
              : "你还没有关注任何叙事"}
          </p>
        </div>
      )}
    </div>
  );
} 