interface SRTSubtitle {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  type: "line";
}

interface SRTTitle {
  type: "title";
  text: string;
}

type SRTBlock = SRTSubtitle | SRTTitle;

interface SRTDocument {
  blocks: SRTBlock[];
}

/**
 * Converts SRT time format (HH:MM:SS,mmm) to seconds
 */
function timeToSeconds(timeString: string): number {
  const [time, millisecondsString] = timeString.split(",");
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const milliseconds = Number(millisecondsString);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Parses SRT text into SRTDocument (lines + titles)
 */
function parseSRT(srtText: string): SRTDocument {
  const rawBlocks = srtText.trim().split(/\n\s*\n/);
  const blocks: SRTBlock[] = [];

  for (const rawBlock of rawBlocks) {
    const lines = rawBlock.trim().split("\n");

    if (!lines.length) continue;

    // --- Title Block ---
    if (lines[0].startsWith("#TITLE")) {
      const titleText = lines.slice(1).join(" ").trim();
      if (titleText) {
        blocks.push({ type: "title", text: titleText });
      }
      continue;
    }

    // --- Line / Subtitle Block ---
    if (lines.length < 3) continue;

    const id = parseInt(lines[0], 10);
    if (isNaN(id)) continue;

    const timeMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
    );
    if (!timeMatch) continue;

    const start = timeToSeconds(timeMatch[1]);
    const end = timeToSeconds(timeMatch[2]);
    const text = lines.slice(2).join("\n").trim();

    blocks.push({ type: "line", id, start, end, text });
  }

  return { blocks };
}

const isSubtitleBlock = (block: SRTBlock ): block is SRTSubtitle =>
  "start" in block && "end" in block;

export { parseSRT,isSubtitleBlock, type SRTDocument, type SRTBlock, type SRTSubtitle, type SRTTitle };
