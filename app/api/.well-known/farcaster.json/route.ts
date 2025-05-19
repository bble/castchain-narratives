import { NextResponse } from "next/server";
import { APP_URL } from "../../../../lib/constants";

export async function GET() {
  return NextResponse.json({
    name: "CastChain Narratives",
    description: "去中心化、可分支的协作式故事创作平台",
    image: `${APP_URL}/images/logo.png`,
    external_url: APP_URL,
    success_url: `${APP_URL}/onboarding`,
    frames: {
      version: "1",
      external_url: APP_URL,
      content: {
        frames_url: APP_URL,
        post_url: `${APP_URL}/api/frame`,
        frames: [
          {
            id: "landing",
            frame: {
              version: "vNext",
              image: `${APP_URL}/images/feed.png`,
              title: "开始你的链上叙事之旅",
              buttons: [
                {
                  label: "探索故事",
                  action: "post_redirect"
                },
                {
                  label: "创建叙事",
                  action: "post"
                }
              ]
            },
            state: {}
          },
          {
            id: "narrative_detail",
            frame: {
              version: "vNext",
              image: `${APP_URL}/images/narrative_preview.png`,
              title: "查看叙事详情",
              buttons: [
                {
                  label: "阅读故事",
                  action: "post_redirect"
                },
                {
                  label: "贡献新章节",
                  action: "post"
                },
                {
                  label: "分享",
                  action: "link",
                  target: `${APP_URL}/share`
                }
              ]
            },
            state: {}
          },
          {
            id: "mint_achievement",
            frame: {
              version: "vNext",
              image: `${APP_URL}/images/achievement.png`,
              title: "铸造成就",
              buttons: [
                {
                  label: "铸造",
                  action: "post"
                },
                {
                  label: "取消",
                  action: "post"
                }
              ]
            },
            state: {}
          }
        ]
      }
    }
  });
} 