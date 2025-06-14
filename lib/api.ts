import { APP_URL, API_BASE_URL } from "./constants";
import {
  Narrative,
  NarrativeContribution,
  NarrativeBranch,
  UserAchievement,
  NarrativeStatus,
  CollaborationRules,
  AchievementType,
  Notification,
  AchievementMetadata
} from "@/types/narrative";
import { generateId } from "./utils";

// API类
class API {
  private apiBaseUrl = API_BASE_URL;
  private headers: Record<string, string> = {
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

      console.log(`API请求: ${method} ${url}`, data ? { data } : '');

      const response = await fetch(url, options);

      // 处理非200响应
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.warn('无法解析错误响应为JSON');
        }

        const errorMessage = errorData.message || `API错误: ${response.status} ${response.statusText}`;
        console.error(`API错误响应:`, { status: response.status, statusText: response.statusText, errorData });
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`API响应成功: ${method} ${url}`, result);
      return result;
    } catch (error) {
      console.error(`API请求失败 (${endpoint}):`, error);
      throw error;
    }
  }

  // 设置认证头
  public setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      "Authorization": `Bearer ${token}`,
    };
  }

  // 公共请求方法，供组件直接调用
  public async makeRequest<T>(
    endpoint: string,
    method: string = "GET",
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    return this.request(endpoint, method, data, customHeaders);
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
  ): Promise<{
    narratives: Narrative[];
    totalCount: number;
    currentPage: number;
    hasMore: boolean;
  } | Narrative[]> {
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
    const result = await this.request<{
      narratives: Narrative[];
      totalCount: number;
      currentPage: number;
      hasMore: boolean;
    } | Narrative[]>(endpoint);

    // 兼容旧格式（直接返回数组）和新格式（返回对象）
    if (Array.isArray(result)) {
      return result;
    }

    return result;
  }

  // 获取单个叙事
  async getNarrative(narrativeId: string): Promise<Narrative | null> {
    try {
      const endpoint = `/narrative-by-id?id=${narrativeId}`;
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
    const endpoint = `/narrative-contributions?narrativeId=${narrativeId}`;
    return this.request<NarrativeContribution[]>(endpoint);
  }

  // 获取叙事分支
  async getNarrativeBranches(narrativeId: string): Promise<NarrativeBranch[]> {
    const endpoint = `/narrative-branches?narrativeId=${narrativeId}`;
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
    const endpoint = `/narrative-contributions?narrativeId=${data.narrativeId}`;

    // 转换字段名以匹配后端API期望的格式
    const requestData = {
      contributorFid: data.contributorFid,
      contributorUsername: data.contributorUsername,
      contributorDisplayName: data.contributorDisplayName,
      contributorPfp: data.contributorPfp,
      content: data.textContent, // 后端期望的是 content 而不是 textContent
      castHash: data.castHash,
      parentContributionId: data.parentContributionId,
      isBranchStart: data.isBranchStart,
      branchName: data.branchName,
      branchDescription: data.branchDescription
    };

    return this.request<{
      contribution: NarrativeContribution;
      branch?: NarrativeBranch;
    }>(endpoint, "POST", requestData);
  }

  // 点赞贡献
  async likeContribution(narrativeId: string, contributionId: string, userFid?: number): Promise<{ success: boolean; like_count: number; upvotes?: number }> {
    const endpoint = `/contribution-like?narrativeId=${narrativeId}&contributionId=${contributionId}`;

    // 添加认证头
    const authHeaders: Record<string, string> | undefined = userFid ? {
      'X-User-FID': userFid.toString(),
      'X-Auth-Token': 'demo-token'
    } : undefined;

    return this.request<{ success: boolean; like_count: number; upvotes?: number }>(endpoint, "POST", {}, authHeaders);
  }

  // 获取用户成就
  async getUserAchievements(userFid: number, achievementType?: AchievementType): Promise<UserAchievement[]> {
    let endpoint = `/user-achievements?userFid=${userFid}`;

    if (achievementType) {
      endpoint += `&type=${achievementType}`;
    }

    return this.request<UserAchievement[]>(endpoint);
  }

  // 请求铸造成就
  async requestMint(data: {
    recipientFid: number;
    recipientAddress: string;
    achievementType: AchievementType;
    narrativeId?: string;
    contributionId?: string;
    title?: string;
    description?: string;
    metadata?: AchievementMetadata;
  }): Promise<{
    success: boolean;
    transactionParams?: any;
    achievementId?: string;
    message?: string;
  }> {
    const endpoint = `/achievement-mint`;
    // 添加模拟认证头用于测试
    const authHeaders = {
      'X-User-FID': data.recipientFid.toString(),
      'X-Auth-Token': 'demo-token'
    };
    return this.request<{
      success: boolean;
      transactionParams?: any;
      achievementId?: string;
      message?: string;
    }>(endpoint, "POST", data, authHeaders);
  }

  // 关注叙事
  async followNarrative(narrativeId: string, userFid: number): Promise<{ success: boolean }> {
    const endpoint = `/narrative-follow?narrativeId=${narrativeId}`;
    // 添加模拟认证头用于测试
    const authHeaders = {
      'X-User-FID': userFid.toString(),
      'X-Auth-Token': 'demo-token'
    };
    return this.request<{ success: boolean }>(endpoint, "POST", { userFid }, authHeaders);
  }

  // 取消关注叙事
  async unfollowNarrative(narrativeId: string, userFid: number): Promise<{ success: boolean }> {
    const endpoint = `/narrative-follow?narrativeId=${narrativeId}`;
    // 添加模拟认证头用于测试
    const authHeaders = {
      'X-User-FID': userFid.toString(),
      'X-Auth-Token': 'demo-token'
    };
    return this.request<{ success: boolean }>(endpoint, "DELETE", { userFid }, authHeaders);
  }

  // 检查关注状态
  async checkFollowStatus(narrativeId: string, userFid: number): Promise<{
    is_following: boolean;
    follower_count: number;
    followed_at?: string
  }> {
    const endpoint = `/narrative-follow?narrativeId=${narrativeId}`;
    const authHeaders = {
      'X-User-FID': userFid.toString(),
      'X-Auth-Token': 'demo-token'
    };
    return this.request<{
      is_following: boolean;
      follower_count: number;
      followed_at?: string
    }>(endpoint, "GET", null, authHeaders);
  }

  // 确认成就铸造完成
  async confirmAchievementMint(
    achievementId: string,
    transactionHash: string,
    tokenId: string,
    userFid?: number
  ): Promise<{ success: boolean }> {
    const endpoint = `/achievement-mint`;
    // 添加模拟认证头用于测试
    const authHeaders = {
      'X-User-FID': userFid?.toString() || '12345', // 使用传入的用户FID
      'X-Auth-Token': 'demo-token'
    };
    return this.request<{ success: boolean }>(
      endpoint,
      "PUT",
      { achievementId, transactionHash, tokenId },
      authHeaders
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
    queryParams.append("userFid", userFid.toString());

    if (options.onlyUnread) {
      queryParams.append("onlyUnread", "true");
    }

    if (options.page) {
      queryParams.append("page", options.page.toString());
    }

    if (options.limit) {
      queryParams.append("limit", options.limit.toString());
    }

    const endpoint = `/user-notifications?${queryParams.toString()}`;
    return this.request<Notification[]>(endpoint);
  }

  // 标记通知为已读
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    const endpoint = `/notification-read?notificationId=${notificationId}`;
    return this.request<{ success: boolean }>(endpoint, "POST");
  }

  // 标记所有通知为已读
  async markAllNotificationsAsRead(userFid: number): Promise<{ success: boolean }> {
    const endpoint = `/user-notifications?userFid=${userFid}`;
    return this.request<{ success: boolean }>(endpoint, "POST");
  }
}

export const api = new API();