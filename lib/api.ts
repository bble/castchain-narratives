import { APP_URL, API_BASE_URL } from "./constants";
import { 
  Narrative, 
  NarrativeContribution, 
  NarrativeBranch, 
  UserAchievement,
  NarrativeStatus, 
  CollaborationRules,
  AchievementType
} from "@/types/narrative";
import { generateId } from "./utils";

// 模拟数据 - 在实际应用中这些应该从API获取
export const MOCK_NARRATIVES: Narrative[] = [
  {
    narrativeId: "1",
    title: "虚空中的低语",
    description: "在一个遥远的星系，一艘孤独的飞船接收到了一个神秘的信号...",
    creatorFid: 1234,
    creatorUsername: "stellarCaptain",
    creatorDisplayName: "星际船长",
    creatorPfp: "https://picsum.photos/id/1005/200/200",
    status: NarrativeStatus.ACTIVE,
    collaborationRules: CollaborationRules.OPEN,
    tags: ["科幻", "恐怖", "太空"],
    branchCount: 5,
    contributionCount: 23,
    contributorCount: 12,
    featuredImageUrl: "https://picsum.photos/id/237/300/200",
    createdAt: "2025-05-01T12:00:00Z",
    updatedAt: "2025-05-18T15:30:00Z",
  },
  {
    narrativeId: "2",
    title: "失落的秘境",
    description: "一群探险者在亚马逊丛林深处发现了一个不为人知的古代文明...",
    creatorFid: 5678,
    creatorUsername: "explorer42",
    creatorDisplayName: "丛林探险家",
    creatorPfp: "https://picsum.photos/id/1012/200/200",
    status: NarrativeStatus.ACTIVE,
    collaborationRules: CollaborationRules.OPEN,
    tags: ["冒险", "悬疑", "古代文明"],
    branchCount: 3,
    contributionCount: 15,
    contributorCount: 8,
    featuredImageUrl: "https://picsum.photos/id/240/300/200",
    createdAt: "2025-05-05T10:00:00Z",
    updatedAt: "2025-05-17T14:20:00Z",
  },
  {
    narrativeId: "3",
    title: "魔法学院的日常",
    description: "在一个充满魔法的世界，一个普通少年意外获得了入学资格...",
    creatorFid: 9012,
    creatorUsername: "magicStudent",
    creatorDisplayName: "魔法学徒",
    creatorPfp: "https://picsum.photos/id/1025/200/200",
    status: NarrativeStatus.ACTIVE,
    collaborationRules: CollaborationRules.OPEN,
    tags: ["奇幻", "魔法", "校园"],
    branchCount: 8,
    contributionCount: 42,
    contributorCount: 25,
    featuredImageUrl: "https://picsum.photos/id/250/300/200",
    createdAt: "2025-04-20T09:00:00Z",
    updatedAt: "2025-05-18T16:45:00Z",
  },
];

// 模拟贡献数据
export const MOCK_CONTRIBUTIONS: Record<string, NarrativeContribution[]> = {
  "1": [
    {
      contributionId: "1-1",
      narrativeId: "1",
      contributorFid: 1234,
      contributorUsername: "stellarCaptain",
      contributorDisplayName: "星际船长",
      contributorPfp: "https://picsum.photos/id/1005/200/200",
      parentContributionId: null,
      branchId: null,
      textContent: "在一个遥远的星系，一艘孤独的飞船接收到了一个神秘的信号...",
      castHash: "0x1234",
      createdAt: "2025-05-01T12:00:00Z",
      upvotes: 7,
      isBranchStart: false,
    },
    {
      contributionId: "1-2",
      narrativeId: "1",
      contributorFid: 5678,
      contributorUsername: "explorer42",
      contributorDisplayName: "丛林探险家",
      contributorPfp: "https://picsum.photos/id/1012/200/200",
      parentContributionId: "1-1",
      branchId: null,
      textContent: "船长命令通信官尝试回应这个信号，但收到的却是一段古老的地球语言...",
      castHash: "0x1235",
      createdAt: "2025-05-02T14:30:00Z",
      upvotes: 5,
      isBranchStart: false,
    },
    {
      contributionId: "1-3",
      narrativeId: "1",
      contributorFid: 9012,
      contributorUsername: "magicStudent",
      contributorDisplayName: "魔法学徒",
      contributorPfp: "https://picsum.photos/id/1025/200/200",
      parentContributionId: "1-2",
      branchId: null,
      textContent: "解码后，信息里只有一句话：'不要回应，他们正在来'...",
      castHash: "0x1236",
      createdAt: "2025-05-03T16:45:00Z",
      upvotes: 12,
      isBranchStart: false,
    },
    {
      contributionId: "1-4",
      narrativeId: "1",
      contributorFid: 1234,
      contributorUsername: "stellarCaptain",
      contributorDisplayName: "星际船长",
      contributorPfp: "https://picsum.photos/id/1005/200/200",
      parentContributionId: "1-2",
      branchId: "1-1",
      textContent: "信号的源头是一个看似荒废的太空站，船长决定派遣一支探索队前往调查...",
      castHash: "0x1237",
      createdAt: "2025-05-04T10:15:00Z",
      upvotes: 9,
      isBranchStart: true,
    },
  ],
};

// 模拟分支数据
export const MOCK_BRANCHES: Record<string, NarrativeBranch[]> = {
  "1": [
    {
      branchId: "1-1",
      narrativeId: "1",
      name: "探索太空站",
      description: "关于探索队进入荒废太空站的故事分支",
      creatorFid: 1234,
      createdAt: "2025-05-04T10:15:00Z",
      rootContributionId: "1-4",
      parentBranchId: null,
      contributionCount: 5
    },
  ],
};

// 模拟成就数据
export const MOCK_ACHIEVEMENTS: UserAchievement[] = [
  {
    achievementId: "1",
    type: AchievementType.POPULAR_BRANCH,
    title: "分支先锋",
    description: "创建了一个受欢迎的故事分支",
    imageUrl: "https://picsum.photos/id/1041/300/300",
    awardedAt: "2025-05-10T12:00:00Z",
    ownerFid: 1234,
    narrativeId: "1",
    contributionId: "1-4",
    tokenId: "1",
    transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890",
  },
  {
    achievementId: "2",
    type: AchievementType.CONTRIBUTOR,
    title: "优秀贡献者",
    description: "为多个叙事做出了宝贵贡献",
    imageUrl: "https://picsum.photos/id/1059/300/300",
    awardedAt: "2025-05-15T12:00:00Z",
    ownerFid: 1234,
    tokenId: "2",
    transactionHash: "0xfedcba0987654321fedcba0987654321fedcba0987654321",
  },
];

// API类
class API {
  private apiBaseUrl = API_BASE_URL;
  private headers = {
    "Content-Type": "application/json",
  };

  // 通用API请求方法
  private async request<T>(
    endpoint: string, 
    method: string = "GET", 
    data?: any, 
    customHeaders?: Record<string, string>
  ): Promise<T> {
    try {
      const url = `${this.apiBaseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          ...this.headers,
          ...customHeaders,
        },
        credentials: "include", // 包含跨域Cookie
      };

      if (data && method !== "GET") {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);

      // 处理非200响应
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API错误: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API请求失败 (${endpoint}):`, error);
      throw error;
    }
  }

  // 设置认证头
  public setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  
  // 获取叙事列表
  async getNarratives(
    options: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      tags?: string[];
      creatorFid?: number;
      sortBy?: 'latest' | 'popular';
      type?: 'discover' | 'my' | 'following';
      userFid?: number;
    } = {}
  ): Promise<Narrative[]> {
    const { page = 1, limit = 20, searchTerm, tags, creatorFid, sortBy = 'latest', type, userFid } = options;
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    queryParams.append("sortBy", sortBy);
    
    if (searchTerm) {
      queryParams.append("search", searchTerm);
    }
    
    if (tags && tags.length > 0) {
      tags.forEach(tag => queryParams.append("tags", tag));
    }
    
    if (creatorFid) {
      queryParams.append("creatorFid", creatorFid.toString());
    }
    
    if (type && userFid) {
      queryParams.append("type", type);
      queryParams.append("userFid", userFid.toString());
    }
    
    const endpoint = `/narratives?${queryParams.toString()}`;
    return this.request<Narrative[]>(endpoint);
  }
  
  // 获取单个叙事
  async getNarrative(narrativeId: string): Promise<Narrative | null> {
    try {
      const endpoint = `/narratives/${narrativeId}`;
      return await this.request<Narrative>(endpoint);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }
  
  // 创建新叙事
  async createNarrative(data: {
    title: string;
    description: string;
    castHash: string;
    creatorFid: number;
    creatorUsername?: string;
    creatorDisplayName?: string;
    creatorPfp?: string;
    tags: string[];
    collaborationRules: CollaborationRules;
    featuredImageUrl?: string;
  }): Promise<Narrative> {
    const endpoint = `/narratives`;
    return this.request<Narrative>(endpoint, "POST", data);
  }
  
  // 获取叙事贡献 (故事片段)
  async getNarrativeContributions(narrativeId: string): Promise<NarrativeContribution[]> {
    const endpoint = `/narratives/${narrativeId}/contributions`;
    return this.request<NarrativeContribution[]>(endpoint);
  }
  
  // 获取叙事分支
  async getNarrativeBranches(narrativeId: string): Promise<NarrativeBranch[]> {
    const endpoint = `/narratives/${narrativeId}/branches`;
    return this.request<NarrativeBranch[]>(endpoint);
  }
  
  // 添加新贡献
  async addContribution(data: {
    narrativeId: string;
    castHash: string;
    contributorFid: number;
    contributorUsername?: string;
    contributorDisplayName?: string;
    contributorPfp?: string;
    parentContributionId: string;
    textContent: string;
    isBranchStart: boolean;
    branchName?: string;
    branchDescription?: string;
  }): Promise<{
    contribution: NarrativeContribution;
    branch?: NarrativeBranch;
  }> {
    const endpoint = `/narratives/${data.narrativeId}/contributions`;
    return this.request<{
      contribution: NarrativeContribution;
      branch?: NarrativeBranch;
    }>(endpoint, "POST", data);
  }
  
  // 点赞贡献
  async likeContribution(narrativeId: string, contributionId: string): Promise<{ success: boolean; upvotes: number }> {
    const endpoint = `/narratives/${narrativeId}/contributions/${contributionId}/like`;
    return this.request<{ success: boolean; upvotes: number }>(endpoint, "POST");
  }
  
  // 获取用户成就
  async getUserAchievements(userFid: number, achievementType?: AchievementType): Promise<UserAchievement[]> {
    let endpoint = `/users/${userFid}/achievements`;
    
    if (achievementType) {
      endpoint += `?type=${achievementType}`;
    }
    
    return this.request<UserAchievement[]>(endpoint);
  }
  
  // 请求铸造成就
  async requestMint(data: {
    recipientFid: number;
    achievementType: AchievementType;
    narrativeId?: string;
    contributionId?: string;
    title?: string;
    description?: string;
  }): Promise<{
    success: boolean;
    transactionParams?: any;
    message?: string;
  }> {
    const endpoint = `/achievements/mint`;
    return this.request<{
      success: boolean;
      transactionParams?: any;
      message?: string;
    }>(endpoint, "POST", data);
  }
  
  // 关注叙事
  async followNarrative(narrativeId: string, userFid: number): Promise<{ success: boolean }> {
    const endpoint = `/narratives/${narrativeId}/follow`;
    return this.request<{ success: boolean }>(endpoint, "POST", { userFid });
  }
  
  // 取消关注叙事
  async unfollowNarrative(narrativeId: string, userFid: number): Promise<{ success: boolean }> {
    const endpoint = `/narratives/${narrativeId}/unfollow`;
    return this.request<{ success: boolean }>(endpoint, "POST", { userFid });
  }
  
  // 确认成就铸造完成
  async confirmAchievementMint(
    achievementId: string, 
    transactionHash: string, 
    tokenId: string
  ): Promise<{ success: boolean }> {
    const endpoint = `/achievements/${achievementId}/confirm`;
    return this.request<{ success: boolean }>(
      endpoint, 
      "POST", 
      { transactionHash, tokenId }
    );
  }
  
  // 检查用户是否有资格获得成就
  async checkAchievementEligibility(userFid: number): Promise<{
    eligible: boolean;
    achievementType?: AchievementType;
    narrativeId?: string;
    contributionId?: string;
    message?: string;
  }> {
    const endpoint = `/users/${userFid}/achievement-eligibility`;
    return this.request<{
      eligible: boolean;
      achievementType?: AchievementType;
      narrativeId?: string;
      contributionId?: string;
      message?: string;
    }>(endpoint);
  }
  
  // 获取用户通知
  async getUserNotifications(userFid: number, options: { 
    onlyUnread?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<Notification[]> {
    const queryParams = new URLSearchParams();
    
    if (options.onlyUnread) {
      queryParams.append("onlyUnread", "true");
    }
    
    if (options.page) {
      queryParams.append("page", options.page.toString());
    }
    
    if (options.limit) {
      queryParams.append("limit", options.limit.toString());
    }
    
    const endpoint = `/users/${userFid}/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<Notification[]>(endpoint);
  }
  
  // 标记通知为已读
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    const endpoint = `/notifications/${notificationId}/read`;
    return this.request<{ success: boolean }>(endpoint, "POST");
  }
  
  // 标记所有通知为已读
  async markAllNotificationsAsRead(userFid: number): Promise<{ success: boolean }> {
    const endpoint = `/users/${userFid}/notifications/read-all`;
    return this.request<{ success: boolean }>(endpoint, "POST");
  }
}

export const api = new API(); 