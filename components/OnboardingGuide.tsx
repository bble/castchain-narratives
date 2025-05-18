"use client";

import { useState, useEffect } from "react";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

interface OnboardingGuideProps {
  onComplete: () => void;
}

export default function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [activeStep, setActiveStep] = useState(0);
  const { context } = useMiniAppContext();

  // 检查是否是首次访问
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (hasSeenOnboarding === "true") {
      onComplete();
    }
  }, [onComplete]);

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    onComplete();
  };

  const handleNext = () => {
    if (activeStep < 2) {
      setActiveStep(activeStep + 1);
    } else {
      handleComplete();
    }
  };

  const slides = [
    {
      title: "欢迎来到链上叙事",
      description: "这是一个去中心化的、可分支的、协作式故事创作平台。每一段故事的延续或转折都是一个 Farcaster Cast，共同构建出一个动态的、不断演进的叙事树。",
      image: "/images/onboarding-1.png"
    },
    {
      title: "共同创作，无限可能",
      description: "您可以创建原创叙事，或者参与现有故事的创作。每个贡献都将永久记录在区块链上，形成一条完整的故事线。",
      image: "/images/onboarding-2.png"
    },
    {
      title: "链上成就，永久保存",
      description: "优秀的贡献将被铸造为独特的数字收藏品，永久记录在 Monad 区块链上，证明您的创作价值。",
      image: "/images/onboarding-3.png"
    }
  ];

  const currentSlide = slides[activeStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 p-6 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-12 rounded-full ${
                  index === activeStep ? "bg-purple-500" : "bg-gray-700"
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="mb-6 text-2xl font-bold text-white">{currentSlide.title}</h2>
          
          <div className="mb-6 h-48 w-full overflow-hidden rounded-lg bg-gray-800 flex items-center justify-center">
            {currentSlide.image ? (
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-gray-600">引导图片</div>
            )}
          </div>
          
          <p className="mb-8 text-gray-300">{currentSlide.description}</p>

          <div className="flex items-center justify-between">
            {activeStep > 0 ? (
              <button
                className="px-4 py-2 text-gray-400 hover:text-white"
                onClick={() => setActiveStep(activeStep - 1)}
              >
                上一步
              </button>
            ) : (
              <div></div> // 占位
            )}
            
            <button
              className="rounded-lg bg-purple-600 px-8 py-3 font-medium text-white shadow-lg hover:bg-purple-700"
              onClick={handleNext}
            >
              {activeStep < 2 ? "下一步" : "开始探索"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 