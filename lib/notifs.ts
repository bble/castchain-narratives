import { APP_URL } from "@/lib/constants";
import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendFrameNotification({
  fid,
  title,
  body,
}: {
  fid: number;
  title: string;
  body: string;
}): Promise<SendFrameNotificationResult> {
  // 从API获取用户通知令牌
  let notificationDetails;
  try {
    const response = await fetch(`${APP_URL}/api/users/${fid}/notification-tokens`);
    if (response.ok) {
      const data = await response.json();
      notificationDetails = { 
        url: "https://api.coinbase.com/notifications/v1/send",
        token: data.notificationToken 
      };
    } else {
      console.error("无法获取用户通知令牌:", await response.text());
      return { state: "error", error: "无法获取用户通知令牌" };
    }
  } catch (error) {
    console.error("获取通知详情失败:", error);
    return { state: "error", error };
  }

  if (!notificationDetails) {
    return { state: "no_token" };
  }

  const response = await fetch(notificationDetails.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title,
      body,
      targetUrl: APP_URL,
      tokens: [notificationDetails.token],
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      // Malformed response
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.rateLimitedTokens.length) {
      // Rate limited
      return { state: "rate_limit" };
    }

    return { state: "success" };
  } else {
    // Error response
    return { state: "error", error: responseJson };
  }
}
