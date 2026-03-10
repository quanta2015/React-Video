import React from "react";
import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { SubtitleGroup } from "./components/SubtitleGroup";
import { T1Template } from "./templates/T1";
import { AnimationName, StyledSubtitle } from "../types";

// List of animations to preview - All 39 animation types
export const ANIMATIONS_LIST: AnimationName[] = [
  "fadeIn", // 渐显
  "fadeOut", // 渐隐
  "scaleIn", // 缩放进入
  "scaleOut", // 缩放退出
  "slideUp", // 向上滑动
  "slideDown", // 向下滑动
  "slideLeft", // 向左滑动
  "slideRight", // 向右滑动
  "bounce", // 弹入
  "typeWriter", // 打字机
  "wipeRight", // 向右擦除
  "centerWipe", // 中线向两侧擦除
  "flipUp", // 向上翻转
  "blurIn", // 模糊进入
  "zoomIn", // 放大
  "zoomOut", // 缩小
  "waveIn", // 波浪弹入
  "wave", // 波浪
  "contract", // 收拢
  "linearMask", // 线性蒙版
  "springUp", // 向上露出
  "springDown", // 向下露出
  "swingIn", // 甩入
  "revealDown", // 向下弹入
  "revealUp", // 向上弹入
  "featherWipeRight", // 羽化向右擦除
  "pageTurn", // 翻页
  "popUp", // 向上弹出
  "popIn", // 弹入
  "shake", // 抖动
  "grow", // 生长
  "rotate", // 旋转
  "trail", // 拖尾
  "bouncePopIn", // 弹出效果
  "slideUpReturn", // 向上滑动 (大幅)
  "slideDownReturn", // 向下滑动 (大幅)
  "slideRightOut", // 向右滑出
  "slideLeftIn", // 向左滑入
  "slideDownSimple", // 下滑
  "carrySplit" // 上一句分裂保留
];

export const PREVIEW_DURATION_FRAMES = 90; // 3 seconds per animation - shorter preview duration

const AnimationPreviewItem: React.FC<{ animationName: AnimationName }> = ({ animationName }) => {
  const { fps } = useVideoConfig();

  const subtitles: StyledSubtitle[] =
    animationName === "carrySplit"
      ? [
          {
            start: 0,
            end: 1500,
            groupStart: 0,
            groupEnd: 1500,
            text: "上一句会被分裂保留",
            groupId: 0,
            position: 0,
            totalInGroup: 1,
            styleType: "default",
            animationIn: "none",
            animationOut: "fadeOut"
          },
          {
            start: 1500,
            end: 5000,
            groupStart: 1500,
            groupEnd: 5000,
            text: `【${animationName}】当前句进入`,
            groupId: 1,
            position: 0,
            totalInGroup: 1,
            styleType: "default",
            animationIn: "carrySplit",
            animationOut: "fadeOut"
          }
        ]
      : [
          {
            start: 0,
            end: 5000, // 5 seconds - longer display time to observe the animation
            groupStart: 0,
            groupEnd: 5000,
            text: `【${animationName}】动画效果预览`,
            groupId: 0,
            position: 0,
            totalInGroup: 1,
            styleType: "default",
            animationIn: animationName,
            animationOut: "fadeOut",
            // Populate words for typeWriter to work
            words:
              animationName === "typeWriter"
                ? `【${animationName}】动画效果预览`.split("").map((char, i) => ({
                    text: char,
                    start: i * 300, // Stagger words every 300ms - slower for better visibility
                    end: (i + 1) * 300
                  }))
                : undefined
          }
        ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 50,
          color: "white",
          fontSize: 40,
          fontFamily: "sans-serif",
          zIndex: 100
        }}
      >
        Current Animation: <span style={{ color: "#4facfe" }}>{animationName}</span>
      </div>

      <SubtitleGroup subtitles={subtitles} template={T1Template} />
    </AbsoluteFill>
  );
};

export const AllAnimationsPreview: React.FC = () => {
  return (
    <Series>
      {ANIMATIONS_LIST.map((anim) => (
        <Series.Sequence key={anim} durationInFrames={PREVIEW_DURATION_FRAMES}>
          <AnimationPreviewItem animationName={anim} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
