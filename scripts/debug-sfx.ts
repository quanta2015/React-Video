import fs from "fs";
import path from "path";
import { generateSfxTriggers } from "../src/services/SfxTriggerGenerator";
import { T1Template } from "../src/remotion/templates/T1";
import { config } from "../src/config";

const subs = JSON.parse(fs.readFileSync("./examples/subtitle_split.json", "utf8")).subtitles;

const sfxDir = config.paths.sfx;
const hasLocalSfxDir = fs.existsSync(sfxDir);
const sfxFiles = hasLocalSfxDir
  ? fs.readdirSync(sfxDir).filter((f: string) => f.endsWith(".mp3") || f.endsWith(".wav"))
  : [];

function resolveConfiguredSfx(sfxDir: string) {
  const sfxConfigFile = path.join(sfxDir, "sfx-config.json");
  if (!fs.existsSync(sfxConfigFile)) return [];
  return JSON.parse(fs.readFileSync(sfxConfigFile, "utf8"));
}

const configuredSfx = resolveConfiguredSfx(sfxDir);

const triggers = generateSfxTriggers(subs, {
  plannedVideoEffects: [],
  sfxSequence: T1Template.sfxSequence,
  subtitleAnimationSequence: T1Template.subtitleAnimationSequence,
  subtitleAnimationSfxMap: T1Template.subtitleAnimationSfxMap,
  fps: 30
});

// Build map of groupStart time -> sfx filename
// Each group has exactly one sound effect
const sfxByGroupStartTime = new Map<number, string>();
for (const t of triggers) {
  sfxByGroupStartTime.set(t.time, t.sfxPath.split("/").pop()!);
}

function getAnchorTime(sub: any): number {
  const rawAnchor = Number.isFinite(sub.groupStart) ? sub.groupStart : sub.start;
  return Math.max(0, Math.floor(rawAnchor));
}

// Track which groups we've already shown the sound for
const shownGroupSounds = new Set<number>();

const sortedSubtitles = subs
  .slice(0, 50)
  .sort((a: any, b: any) => a.groupId - b.groupId || a.position - b.position || a.start - b.start);

const lines = sortedSubtitles.map((sub: any, i: number) => {
  const anchorTime = getAnchorTime(sub);
  const groupId = sub.groupId;
  let sfx: string;

  if (shownGroupSounds.has(groupId)) {
    // Not the first line of this group - show none
    sfx = "none";
  } else {
    // First line of this group - show the sound if exists
    const sfxFilename = sfxByGroupStartTime.get(anchorTime);
    sfx = sfxFilename ?? "none";
    shownGroupSounds.add(groupId);
  }

  return {
    idx: i + 1,
    groupId,
    text: sub.text,
    animation: `${sub.animationIn} -> ${sub.animationOut}`,
    sfx
  };
});

console.log("\n=== Subtitle Animation Sound Effects (per group) ===");
console.log(JSON.stringify(lines, null, 2));
console.log("\n=== Total triggers ===", triggers.length);
console.log("\n=== Trigger details ===");
triggers.forEach((t, i) => {
  console.log(`[${i}] time=${t.time}ms sfx=${t.sfxPath.split("/").pop()}`);
});
