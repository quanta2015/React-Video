import fs from "fs";
import { assignStyles } from "../src/services/SubtitleStyleAssigner";
import { T1Template } from "../src/remotion/templates/T1";

const subs = JSON.parse(fs.readFileSync("./examples/subtitle_split.json", "utf8")).subtitles;

// Assign styles using T1 template
const styledSubs = assignStyles(subs, T1Template);

// Group by groupId and show first line of each group
const groupFirstLines = new Map<number, (typeof styledSubs)[0]>();
for (const sub of styledSubs) {
  if (!groupFirstLines.has(sub.groupId)) {
    groupFirstLines.set(sub.groupId, sub);
  }
}

// Sort by groupId and display
const sortedGroups = Array.from(groupFirstLines.entries()).sort((a, b) => a[0] - b[0]);

console.log("=== Animation Sequence Test (first line of each group) ===\n");
sortedGroups.forEach(([groupId, sub], index) => {
  const screenNumber = index + 1;
  const sequenceIndex = ((screenNumber - 1) % 15) + 1;
  const expectedAnim = T1Template.subtitleAnimationSequence?.[sequenceIndex - 1]?.animationIn;
  const expectedSfx = T1Template.subtitleAnimationSequence?.[sequenceIndex - 1]?.startSfx;

  const match = sub.animationIn === expectedAnim ? "✓" : "✗";
  console.log(
    `[${screenNumber}] groupId=${groupId} | text="${sub.text}" | animationIn=${sub.animationIn} (expected: ${expectedAnim}) ${match} | sfx=${expectedSfx}`
  );
});
