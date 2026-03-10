const fs = require("fs");
const { generateSfxTriggers } = require("../src/services/SfxTriggerGenerator");
const template = require("../src/remotion/templates/T1").T1Template;

const subs = JSON.parse(fs.readFileSync("./examples/subtitle_split.json", "utf8")).subtitles;
const triggers = generateSfxTriggers(subs, {
  plannedVideoEffects: [],
  sfxSequence: template.sfxSequence,
  subtitleAnimationSequence: template.subtitleAnimationSequence,
  subtitleAnimationSfxMap: template.subtitleAnimationSfxMap,
  fps: 30
});

const sfxByTime = new Map();
for (const t of triggers) {
  const cur = sfxByTime.get(t.time) || [];
  cur.push(t.sfxPath);
  sfxByTime.set(t.time, cur);
}

function getAnchorTime(sub) {
  const rawAnchor = Number.isFinite(sub.groupStart) ? sub.groupStart : sub.start;
  return Math.max(0, Math.floor(rawAnchor));
}

const lines = subs.slice(0, 50).map((sub, i) => ({
  idx: i + 1,
  text: sub.text,
  animation: `${sub.animationIn} -> ${sub.animationOut}`,
  sfx: (sfxByTime.get(getAnchorTime(sub)) || []).map((p) => p.split("/").pop()).join(" | ") || "none"
}));

console.log(lines.slice(0, 20));
console.log("total triggers", triggers.length);
