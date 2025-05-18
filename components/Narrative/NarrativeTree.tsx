"use client";

import { useEffect, useRef } from "react";
import { NarrativeContribution, NarrativeBranch } from "@/types/narrative";
import { formatDistanceToNow, truncateText } from "@/lib/utils";

interface NarrativeTreeProps {
  contributions: NarrativeContribution[];
  branches: NarrativeBranch[];
  selectedContributionId: string | null;
  onSelectContribution: (contributionId: string) => void;
}

interface TreeNode {
  id: string;
  parentId: string | null;
  text: string;
  branchId?: string | null;
  isBranchStart: boolean;
  createdAt: string;
  contributorFid: number;
  contributorUsername?: string;
  contributorDisplayName?: string;
  contributorPfp?: string;
  children: TreeNode[];
}

export default function NarrativeTree({
  contributions,
  branches,
  selectedContributionId,
  onSelectContribution
}: NarrativeTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // 如果没有贡献，显示空状态
  if (contributions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <p>暂无故事内容</p>
      </div>
    );
  }

  // 构建树状视图
  const buildTree = (contributions: NarrativeContribution[]) => {
    const nodes: Record<string, TreeNode> = {};
    let rootNode: TreeNode | null = null;

    // 创建节点
    contributions.forEach(contribution => {
      nodes[contribution.contributionId] = {
        id: contribution.contributionId,
        parentId: contribution.parentContributionId,
        text: contribution.textContent,
        branchId: contribution.branchId,
        isBranchStart: contribution.isBranchStart,
        createdAt: contribution.createdAt,
        contributorFid: contribution.contributorFid,
        contributorUsername: contribution.contributorUsername,
        contributorDisplayName: contribution.contributorDisplayName,
        contributorPfp: contribution.contributorPfp,
        children: []
      };

      if (!contribution.parentContributionId) {
        rootNode = nodes[contribution.contributionId];
      }
    });

    // 构建树结构
    contributions.forEach(contribution => {
      if (contribution.parentContributionId && nodes[contribution.parentContributionId]) {
        nodes[contribution.parentContributionId].children.push(nodes[contribution.contributionId]);
      }
    });

    return rootNode;
  };

  const renderTreeNode = (node: TreeNode) => {
    const isCurrent = node.id === selectedContributionId;
    const formattedTime = formatDistanceToNow(new Date(node.createdAt));
    const truncatedText = truncateText(node.text, 60);
    const branchInfo = node.branchId ? branches.find(b => b.branchId === node.branchId) : null;
    
    const contributorName = node.contributorDisplayName || 
                            node.contributorUsername || 
                            `FID: ${node.contributorFid}`;

    return (
      <div key={node.id} className="mb-2">
        <div 
          className={`rounded-lg p-3 cursor-pointer ${
            isCurrent 
              ? "bg-purple-700 border-2 border-purple-500" 
              : node.isBranchStart 
                ? "bg-gray-700 border border-purple-800" 
                : "bg-gray-800 hover:bg-gray-700"
          }`}
          onClick={() => onSelectContribution(node.id)}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center">
              {node.contributorPfp ? (
                <img 
                  src={node.contributorPfp} 
                  alt="贡献者头像" 
                  className="h-5 w-5 rounded-full mr-1"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-gray-600 flex items-center justify-center mr-1">
                  <span className="text-[10px]">{contributorName.charAt(0)}</span>
                </div>
              )}
              <span className="text-xs text-gray-300">{truncateText(contributorName, 15)}</span>
            </div>
            <span className="text-xs text-gray-400">{formattedTime}</span>
          </div>
          <p className="text-sm">{truncatedText}</p>
          
          {node.isBranchStart && branchInfo && (
            <div className="mt-1 inline-block rounded-full bg-purple-900 px-2 py-0.5 text-xs">
              分支: {branchInfo.name}
            </div>
          )}
        </div>
        
        {node.children.length > 0 && (
          <div className="ml-6 mt-2 border-l-2 border-gray-700 pl-4">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const treeRoot = buildTree(contributions);

  if (!treeRoot) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <p>无法构建故事树</p>
      </div>
    );
  }

  return (
    <div className="narrative-tree overflow-auto pb-8">
      {renderTreeNode(treeRoot)}
    </div>
  );
} 