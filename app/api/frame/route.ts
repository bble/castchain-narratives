import { NextRequest, NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  try {
    // 解析请求体获取Frame数据
    const requestData = await req.json();
    console.log("Frame请求数据:", requestData);

    // 获取按钮索引
    const buttonIndex = requestData?.untrustedData?.buttonIndex || 0;

    // 根据按钮索引执行不同的操作
    if (buttonIndex === 1) {
      // 按钮1：浏览故事 - 重定向到故事列表
      return NextResponse.json({
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        redirect: `${APP_URL}/narratives`
      });
    } else if (buttonIndex === 2) {
      // 按钮2：创建新叙事 - 重定向到创建页面
      return NextResponse.json({
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        redirect: `${APP_URL}/narratives/create`
      });
    } else {
      // 默认响应
      return NextResponse.json({
        version: "vNext",
        image: `${APP_URL}/images/feed.png`,
        buttons: [
          {
            label: "浏览故事",
            action: "post"
          },
          {
            label: "创建新叙事",
            action: "post"
          }
        ]
      });
    }
  } catch (error) {
    console.error("Frame处理错误:", error);
    return NextResponse.json({
      version: "vNext",
      image: `${APP_URL}/images/error.png`,
      buttons: [
        {
          label: "重试",
          action: "post"
        }
      ]
    }, { status: 200 }); // 即使出错也返回200状态码和有效的Frame
  }
} 