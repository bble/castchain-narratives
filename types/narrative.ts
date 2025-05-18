// 叙事状态枚举
export enum NarrativeStatus {
  ACTIVE = "active",         // 活跃状态，可继续贡献
  COMPLETED = "completed",   // 已完成，不再接受贡献
  ARCHIVED = "archived"      // 已归档
}

// 协作规则枚举
export enum CollaborationRules {
  OPEN = "open",             // 任何人可贡献
  MODERATED = "moderated",   // 需要审核
  INVITED = "invited"        // 仅邀请用户可贡献
}

// 成就类型枚举
export enum AchievementType {
  CREATOR = "creator",       // 创作者
  CONTRIBUTOR = "contributor", // 贡献者
  POPULAR_BRANCH = "popular_branch", // 热门分支
  COMPLETED_NARRATIVE = "completed_narrative" // 完成的叙事
}

// 叙事接口
export interface Narrative {
  narrativeId: string;
  title: string;
  description: string;
  creatorFid: number;
  creatorUsername?: string;
  creatorDisplayName?: string;
  creatorPfp?: string;
  createdAt: string;
  updatedAt: string;
  status: NarrativeStatus;
  collaborationRules: CollaborationRules;
  tags: string[];
  branchCount: number;
  contributionCount: number;
  contributorCount: number;
  featuredImageUrl?: string;
}

// 叙事贡献接口
export interface NarrativeContribution {
  contributionId: string;
  narrativeId: string;
  contributorFid: number;
  contributorUsername?: string;
  contributorDisplayName?: string;
  contributorPfp?: string;
  parentContributionId: string | null;
  branchId: string | null;
  textContent: string;
  castHash: string;
  createdAt: string;
  upvotes: number;
  isBranchStart: boolean;
}

// 叙事分支接口
export interface NarrativeBranch {
  branchId: string;
  narrativeId: string;
  name: string;
  description?: string;
  creatorFid: number;
  createdAt: string;
  rootContributionId: string;
  parentBranchId: string | null;
  contributionCount: number;
}

// 用户成就接口
export interface UserAchievement {
  achievementId: string;
  type: AchievementType;
  title: string;
  description: string;
  imageUrl: string;
  awardedAt: string;
  ownerFid: number;
  narrativeId?: string;
  contributionId?: string;
  tokenId?: string;
  transactionHash?: string;
}

// 添加贡献请求参数
export interface AddContributionParams {
  narrativeId: string;
  contributorFid: number;
  parentContributionId: string;
  textContent: string;
  castHash: string;
  isBranchStart: boolean;
  branchName?: string;
}

// 添加贡献响应接口
export interface AddContributionResponse {
  contribution: NarrativeContribution;
  branch?: NarrativeBranch;
}

// 成就属性
export interface AchievementAttribute {
  trait_type: string;
  value: string;
}

// 成就元数据
export interface AchievementMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: AchievementAttribute[];
}

// 铸造成就请求参数
export interface MintAchievementParams {
  achievementType: AchievementType;
  narrativeId: string;
  contributionId?: string;
  recipientFid: number;
  title?: string;
  description?: string;
  metadata?: AchievementMetadata;
}

// 通知类型
export enum NotificationType {
  NEW_CONTRIBUTION = 'new_contribution_on_your_narrative',
  ELIGIBLE_FOR_SBT = 'eligible_for_sbt_mint',
  NEW_BADGE = 'new_badge_unlocked',
}

// 用户通知
export interface Notification {
  notificationId: string;
  userFid: number;
  notificationType: NotificationType;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
} 