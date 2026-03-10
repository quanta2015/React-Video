import React from 'react';
import { useVideoConfig, useCurrentFrame, Sequence, Img, OffthreadVideo, staticFile, interpolate, Easing } from 'remotion';
import { PipMedia, PipItem, VideoTemplate, StyledSubtitle } from '../../types';
import { calculatePipItems, DEFAULT_PIP_ANIMATIONS } from './pip/pipPlanner';

/** 平移动效预放大比例 */
const PAN_PRE_SCALE = 1.25;
/** 缩放动效放大终点 */
const ZOOM_IN_END_SCALE = 1.25;
/** 缩放动效缩小起点 */
const ZOOM_OUT_START_SCALE = 1.25;

interface Props {
  mediaList: PipMedia[];
  noGapMode?: boolean;
  fillTimelineMode?: boolean;
  template?: VideoTemplate;
  subtitles?: StyledSubtitle[];
}

function resolveMediaSrc(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) {
    return url
  }
  const normalized = url.replace(/^\/+/, '').replace(/^public\//, '')
  return staticFile(normalized)
}

/**
 * 计算素材在"宽度 100%"基准下的实际渲染尺寸和偏移
 *
 * 基准规则：素材宽度 = 窗口宽度，高度按原始比例缩放，垂直居中。
 * - 横屏素材（16:9）在竖屏窗口（9:16）中：宽度填满，高度 < 窗口高度
 * - 竖屏素材（9:16）在竖屏窗口（9:16）中：宽度填满，高度 ≈ 窗口高度
 * - 如果没有素材尺寸信息，回退到 cover 模式（宽高都 100%）
 */
function computeMediaLayout(
  media: PipMedia,
  windowWidth: number,
  windowHeight: number
): { width: number; height: number; top: number; left: number } {
  if (!media.width || !media.height) {
    // 没有尺寸信息，回退 cover 模式
    return { width: windowWidth, height: windowHeight, top: 0, left: 0 };
  }

  const mediaAspect = media.width / media.height;
  const windowAspect = windowWidth / windowHeight;

  // 宽度 100% 基准：素材宽度 = 窗口宽度
  const renderWidth = windowWidth;
  const renderHeight = windowWidth / mediaAspect;

  // 垂直居中
  const top = (windowHeight - renderHeight) / 2;

  return { width: renderWidth, height: renderHeight, top, left: 0 };
}

/**
 * 单个画中画项组件
 *
 * 动效规则：
 * 1. 所有画面以窗口宽度 100% 为初始基准（素材宽度 = 窗口宽度，高度按比例），无左右黑边
 * 2. 缩放动画：以画面中心为原点均匀放大/缩小
 * 3. 平移动画：预放大 25%，初始位置边缘对齐，确保移动中不露黑边
 * 4. 9:16 竖屏素材仅响应缩放，禁止平移（由 calculatePipItems 保证）
 * 5. 任何时刻画面最小宽度 ≥ 窗口宽度
 * 6. 无素材尺寸信息时回退 objectFit:cover 兼容旧行为
 */
const PipItemDisplay: React.FC<{ item: PipItem; disableFade?: boolean }> = ({ item, disableFade = false }) => {
  const frame = useCurrentFrame();
  const { width: windowWidth, height: windowHeight } = useVideoConfig();

  const opacity = disableFade
    ? 1
    : interpolate(
      frame,
      [0, 9, item.durationFrames - 9, item.durationFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

  // 动画进度 [0, 1]，使用 easeInOut 缓动
  const rawProgress = interpolate(frame, [0, item.durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const progress = Easing.inOut(Easing.cubic)(rawProgress);

  const hasDimensions = !!(item.media.width && item.media.height);
  const layout = computeMediaLayout(item.media, windowWidth, windowHeight);

  /**
   * 计算动画 transform
   * 基于"宽度 100%"基准状态，scale(1) = 素材宽度刚好等于窗口宽度
   */
  const getTransform = (): string => {
    if (item.media.type === 'video') {
      return 'scale(1)';
    }

    switch (item.animation) {
      case 'zoomIn': {
        // 放大动画：从宽度 100%（scale=1）以中心为原点均匀放大
        const scale = interpolate(progress, [0, 1], [1, ZOOM_IN_END_SCALE]);
        return `scale(${scale})`;
      }

      case 'zoomOut': {
        // 缩小动画：从预放大状态缩小至宽度 100%
        const scale = interpolate(progress, [0, 1], [ZOOM_OUT_START_SCALE, 1]);
        return `scale(${scale})`;
      }

      case 'panLeft': {
        // 向左平移：预放大后，初始右边缘对齐窗口右边缘，向左滑动
        const scaledWidth = layout.width * PAN_PRE_SCALE;
        const overflow = scaledWidth - windowWidth;
        const startX = overflow / 2;
        const endX = -overflow / 2;
        const tx = interpolate(progress, [0, 1], [startX, endX]);
        return `translate(${tx}px, 0px) scale(${PAN_PRE_SCALE})`;
      }

      case 'panRight': {
        // 向右平移：预放大后，初始左边缘对齐窗口左边缘，向右滑动
        const scaledWidth = layout.width * PAN_PRE_SCALE;
        const overflow = scaledWidth - windowWidth;
        const startX = -overflow / 2;
        const endX = overflow / 2;
        const tx = interpolate(progress, [0, 1], [startX, endX]);
        return `translate(${tx}px, 0px) scale(${PAN_PRE_SCALE})`;
      }

      case 'panUp': {
        // 向上平移：预放大后，初始下边缘对齐窗口下边缘，向上滑动
        const scaledHeight = layout.height * PAN_PRE_SCALE;
        const overflow = scaledHeight - windowHeight;
        // 如果放大后高度仍不够窗口高度，不做垂直位移
        if (overflow <= 0) return `scale(${PAN_PRE_SCALE})`;
        const startY = overflow / 2;
        const endY = -overflow / 2;
        const ty = interpolate(progress, [0, 1], [startY, endY]);
        return `translate(0px, ${ty}px) scale(${PAN_PRE_SCALE})`;
      }

      case 'panDown': {
        // 向下平移：预放大后，初始上边缘对齐窗口上边缘，向下滑动
        const scaledHeight = layout.height * PAN_PRE_SCALE;
        const overflow = scaledHeight - windowHeight;
        if (overflow <= 0) return `scale(${PAN_PRE_SCALE})`;
        const startY = -overflow / 2;
        const endY = overflow / 2;
        const ty = interpolate(progress, [0, 1], [startY, endY]);
        return `translate(0px, ${ty}px) scale(${PAN_PRE_SCALE})`;
      }

      default:
        return 'scale(1)';
    }
  };

  const transform = getTransform();

  // 容器样式：overflow hidden 确保放大/平移时不溢出
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity,
    overflow: 'hidden',
  };

  // 媒体样式：根据是否有尺寸信息选择布局方式
  const mediaStyle: React.CSSProperties = hasDimensions
    ? {
      // 精确布局：宽度 100% 基准，高度按比例，垂直居中
      position: 'absolute' as const,
      left: layout.left,
      top: layout.top,
      width: layout.width,
      height: layout.height,
      transform,
      transformOrigin: 'center center',
    }
    : {
      // 回退：无尺寸信息时用 cover 模式兼容
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      transform,
      transformOrigin: 'center center',
    };

  return (
    <div style={containerStyle}>
      {item.media.type === 'image' ? (
        <Img src={resolveMediaSrc(item.media.url)} style={mediaStyle} />
      ) : (
        <OffthreadVideo src={resolveMediaSrc(item.media.url)} style={mediaStyle} muted volume={0} />
      )}
    </div>
  );
};

/** 画中画层组件 */
export const PictureInPicture: React.FC<Props> = ({
  mediaList,
  noGapMode = false,
  fillTimelineMode = false,
  template,
  subtitles,
}) => {
  const { durationInFrames, fps } = useVideoConfig();

  const pipAnimations = template?.pipAnimations ?? DEFAULT_PIP_ANIMATIONS;

  const pipItems = React.useMemo(() => {
    return calculatePipItems(mediaList, durationInFrames, fps, noGapMode, pipAnimations, subtitles, fillTimelineMode);
  }, [mediaList, durationInFrames, fps, noGapMode, pipAnimations, subtitles, fillTimelineMode]);

  return (
    <>
      {pipItems.map((item, index) => (
        <Sequence
          key={index}
          from={item.startFrame}
          durationInFrames={item.durationFrames}
        >
          <PipItemDisplay item={item} disableFade={fillTimelineMode} />
        </Sequence>
      ))}
    </>
  );
};
