import React from "react";
import { Composition, staticFile } from "remotion";
import { VideoComposition } from "./VideoComposition";
import { AllAnimationsPreview, ANIMATIONS_LIST, PREVIEW_DURATION_FRAMES } from "./AllAnimationsPreview";
import { AllFontsPreview } from "./AllFontsPreview";
import {
  AllVideoEffectsPreview,
  VIDEO_EFFECTS_PREVIEW_LIST,
  VIDEO_EFFECT_PREVIEW_DURATION
} from "./AllVideoEffectsPreview";
import { AllSfxPreview, SFX_PREVIEW_COUNT, SFX_PREVIEW_DURATION_FRAMES } from "./AllSfxPreview";
import {
  AllSubtitleLayoutsPreview,
  SUBTITLE_LAYOUT_PREVIEW_COUNT,
  SUBTITLE_LAYOUT_PREVIEW_DURATION_FRAMES
} from "./AllSubtitleLayoutsPreview";
import {
  T1TemplatePreview,
  T1AnimationSequencePreview,
  VIDEO_DURATION_FRAMES,
  SUBTITLE_COUNT
} from "./T1TemplatePreview";
import { videoCompositionSchema } from "../types/schema";

import { config } from "../config";
import { SimpleTemplate } from "./templates";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        schema={videoCompositionSchema}
        component={VideoComposition}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          subtitles: [],
          videoSrc: "",
          pipOnlyMode: false,
          template: SimpleTemplate
        }}
      />
      <Composition
        id="AllAnimationsPreview"
        component={AllAnimationsPreview}
        durationInFrames={ANIMATIONS_LIST.length * PREVIEW_DURATION_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AllFontsPreview"
        component={AllFontsPreview}
        durationInFrames={Math.ceil(config.fonts.length / 6) * 150}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AllSfxPreview"
        component={AllSfxPreview}
        durationInFrames={SFX_PREVIEW_COUNT * SFX_PREVIEW_DURATION_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AllVideoEffectsPreview"
        component={AllVideoEffectsPreview}
        durationInFrames={VIDEO_EFFECTS_PREVIEW_LIST.length * VIDEO_EFFECT_PREVIEW_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="AllSubtitleLayoutsPreview"
        component={AllSubtitleLayoutsPreview}
        durationInFrames={SUBTITLE_LAYOUT_PREVIEW_COUNT * SUBTITLE_LAYOUT_PREVIEW_DURATION_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="T1TemplatePreview"
        component={T1TemplatePreview}
        durationInFrames={VIDEO_DURATION_FRAMES} // Auto-calculated from subtitle data (demo.mp4 timing)
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="T1AnimationSequencePreview"
        component={T1AnimationSequencePreview}
        durationInFrames={SUBTITLE_COUNT * PREVIEW_DURATION_FRAMES} // Dynamic based on subtitle count
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
