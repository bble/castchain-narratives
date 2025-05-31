"use client";

import { useState } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useRouter } from "next/navigation";
import { CollaborationRules } from "@/types/narrative";
import { api } from "@/lib/api";
import { NARRATIVE_TAGS } from "@/lib/constants";

// 预设标签
const PRESET_TAGS = [
  "科幻",
  "奇幻",
  "恐怖",
  "悬疑",
  "冒险",
  "爱情",
  "历史",
  "校园",
  "魔法",
  "未来",
  "赛博朋克",
  "古代文明",
  "太空",
  "超能力",
];

interface CreateNarrativeProps {
  onClose: () => void;
}

export function CreateNarrative({ onClose }: CreateNarrativeProps) {
  const { context, actions } = useMiniAppContext();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [collaborationRules, setCollaborationRules] = useState<CollaborationRules>(
    CollaborationRules.OPEN
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleSubmit = async () => {
    if (!context?.user?.fid) {
      alert("请先连接Farcaster账号");
      return;
    }

    if (!title.trim() || !description.trim()) {
      alert("请填写标题和开篇内容");
      return;
    }

    if (selectedTags.length === 0) {
      alert("请至少选择一个标签");
      return;
    }

    setIsSubmitting(true);

    try {
      // 使用Farcaster的composeCast发布创世Cast
      if (actions) {
        const castText = `#CastChainNarratives\n\n【新故事】${title}\n\n${description}\n\n标签: ${selectedTags.map(tag => `#${tag}`).join(' ')}`;

        // 通过Frames API发起Cast
        const castResult = await actions.composeCast({
          text: castText,
        });

        if (castResult?.cast?.hash) {
          // 调用API创建叙事
          const narrative = await api.createNarrative({
            title,
            description,
            castHash: castResult.cast.hash,
            creatorFid: context.user.fid,
            creatorUsername: context.user.username,
            creatorDisplayName: context.user.displayName,
            creatorPfp: context.user.pfpUrl,
            tags: selectedTags,
            collaborationRules,
          });

          console.log("创建的叙事:", narrative);

          // 关闭模态框
          onClose();

          // 导航到新创建的叙事页面
          router.push(`/narratives/${narrative.narrativeId}`);
        } else {
          alert("创建Cast失败，请重试");
        }
      } else {
        alert("无法访问Farcaster API，请确保在Farcaster客户端中打开");
      }
    } catch (error) {
      console.error("创建叙事失败:", error);
      alert("创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="w-full max-w-2xl rounded-xl bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">开启你的传奇故事</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              故事标题 *
            </label>
            <input
              id="title"
              type="text"
              placeholder="为你的故事取个引人入胜的标题"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {title.length}/50
            </p>
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              开篇内容 *
            </label>
            <textarea
              id="description"
              placeholder="写下你的故事开头..."
              className="h-32 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {description.length}/300
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">标签 *（最多选择5个）</label>
            <div className="flex flex-wrap gap-2">
              {NARRATIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`rounded-full px-3 py-1 text-sm ${
                    selectedTags.includes(tag)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">协作规则 *</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="collaboration"
                  checked={collaborationRules === CollaborationRules.OPEN}
                  onChange={() => setCollaborationRules(CollaborationRules.OPEN)}
                  className="h-4 w-4 accent-purple-600"
                />
                <span>开放贡献</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="collaboration"
                  checked={collaborationRules === CollaborationRules.MODERATED}
                  onChange={() => setCollaborationRules(CollaborationRules.MODERATED)}
                  className="h-4 w-4 accent-purple-600"
                />
                <span>需要审核</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="collaboration"
                  checked={collaborationRules === CollaborationRules.INVITED}
                  onChange={() => setCollaborationRules(CollaborationRules.INVITED)}
                  className="h-4 w-4 accent-purple-600"
                />
                <span>仅限邀请</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              选择协作方式：开放贡献允许任何人参与，需要审核模式会先审核贡献，仅限邀请则只有你邀请的用户可以参与。
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-700 bg-transparent px-4 py-3 font-medium text-white hover:bg-gray-800"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 rounded-lg px-4 py-3 font-medium text-white ${
              isSubmitting
                ? "bg-gray-600"
                : "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
            }`}
          >
            {isSubmitting ? "发布中..." : "发布创世片段"}
          </button>
        </div>
      </div>
    </div>
  );
}