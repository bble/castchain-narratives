"use client";

import { useState } from "react";
import { NarrativeContribution } from "@/types/narrative";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

interface ContributionFormProps {
  parentContribution: NarrativeContribution | null;
  mode: 'extend' | 'branch';
  onSubmit: (text: string, isBranchStart: boolean, branchName?: string) => void;
  onCancel: () => void;
}

export default function ContributionForm({
  parentContribution,
  mode,
  onSubmit,
  onCancel,
}: ContributionFormProps) {
  const { context } = useMiniAppContext();
  const [text, setText] = useState("");
  const [branchName, setBranchName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBranchMode = mode === 'branch';
  const maxLength = 500;

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("请输入内容");
      return;
    }

    if (isBranchMode && !branchName.trim()) {
      alert("请为新分支命名");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 调用父组件提供的提交函数
      await onSubmit(text, isBranchMode, isBranchMode ? branchName : undefined);
      
      // 重置表单
      setText("");
      setBranchName("");
      
    } catch (error) {
      console.error("提交失败", error);
      alert("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!parentContribution) {
    return (
      <div className="rounded-lg border border-gray-800 bg-[#262836] p-4 text-center">
        <p className="text-gray-400">请先选择一个故事片段</p>
        <button
          className="mt-4 rounded-lg bg-gray-700 px-4 py-2 text-sm"
          onClick={onCancel}
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-[#262836] p-4">
      <h2 className="mb-4 text-xl font-bold">
        {isBranchMode ? "创建新分支" : "延续故事"}
      </h2>
      
      {/* 父片段摘要 */}
      <div className="mb-4 rounded-lg bg-gray-800 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">上一个片段</span>
          <span className="text-xs text-gray-400">FID: {parentContribution.contributorFid}</span>
        </div>
        <p className="text-sm text-gray-300">
          {parentContribution.textContent.length > 100
            ? `${parentContribution.textContent.substring(0, 100)}...`
            : parentContribution.textContent}
        </p>
      </div>
      
      {/* 分支名称 (仅在创建新分支时显示) */}
      {isBranchMode && (
        <div className="mb-4">
          <label htmlFor="branchName" className="mb-1 block text-sm font-medium">
            分支名称 *
          </label>
          <input
            id="branchName"
            type="text"
            placeholder="为你的分支起个名字"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            maxLength={30}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {branchName.length}/30
          </p>
        </div>
      )}
      
      {/* 内容输入 */}
      <div className="mb-4">
        <label htmlFor="contributionText" className="mb-1 block text-sm font-medium">
          你的故事 *
        </label>
        <textarea
          id="contributionText"
          placeholder="接续上文，继续讲述故事..."
          className="h-40 w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={maxLength}
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {text.length}/{maxLength}
        </p>
      </div>
      
      {/* 提交说明 */}
      <div className="mb-6 rounded-md bg-gray-800 p-3 text-xs text-gray-300">
        <p>你的贡献将作为 Cast 发布到 Farcaster，并与当前故事关联。</p>
        <p className="mt-1">请确保内容符合社区规范。</p>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <button
          className="flex-1 rounded-lg border border-gray-700 bg-transparent px-4 py-3 font-medium text-white hover:bg-gray-800"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          className={`flex-1 rounded-lg px-4 py-3 font-medium text-white ${
            isSubmitting
              ? "bg-gray-600"
              : "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "提交中..." : isBranchMode ? "创建新分支" : "发布延续"}
        </button>
      </div>
    </div>
  );
} 