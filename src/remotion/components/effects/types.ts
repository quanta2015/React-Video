/**
 * 视频特效通用配置接口
 */
export interface BaseEffectProps {
    /** 特效开始帧 */
    startFrame: number;
    /** 特效持续帧数 */
    durationFrames: number;
}

/**
 * 变换类特效配置 (Zoom, Shake)
 */
export interface TransformEffectProps extends BaseEffectProps {
    children: React.ReactNode;
}

/**
 * 叠加类特效配置 (Overlay/Mask)
 */
export interface OverlayEffectProps extends BaseEffectProps {
    width: number;
    height: number;
}

/**
 * 平移类特效配置
 */
export interface PanEffectProps extends TransformEffectProps {
    direction: 'left' | 'right';
    distance?: number; // 移动距离，百分比，这里默认用百分比
    motionEndProgress?: number; // 在总时长中，位移动作完成并停稳的进度点（0-1）
}

/**
 * 滤镜类特效配置
 */
export interface FilterEffectProps extends BaseEffectProps {
    children: React.ReactNode;
    intensity?: number; // 强度 0-1
}
