declare module 'segmentit' {
  interface SegmentResult {
    w: string;
    p: number;
  }

  interface SegmentInstance {
    doSegment(text: string): SegmentResult[];
  }

  export class Segment {
    constructor();
  }

  export function useDefault(segment: Segment): SegmentInstance;
}
