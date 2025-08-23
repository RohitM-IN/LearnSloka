interface SRTSubtitle {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  meta?: Record<string, string>;
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
  debugger
  const rawBlocks = srtText.trim().split(/\n\s*\n/);
  const blocks: SRTBlock[] = [];

  for (const rawBlock of rawBlocks) {
    const lines = rawBlock.trim().split("\n");
    if (!lines.length) continue;

    // --- Title Block ---
    if (lines[0].startsWith("#TITLE")) {
      const titleText = lines[0].substring(6).trim(); // 6 = length of "#TITLE"
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

    // Parse text and meta
    const textLines: string[] = [];
    const meta: Record<string, string> = {};
    for (const line of lines.slice(2)) {
      // Meta line: # [key=value] [key2=value2] ...
      if (line.startsWith('# ')) {
        const metaPairs = [...line.matchAll(/\[(\w+)=(.+?)\]/g)];
        if (metaPairs.length > 0) {
          for (const pair of metaPairs) {
            meta[pair[1].trim()] = pair[2].trim();
          }
          continue;
        }
      }
      textLines.push(line);
    }
    const text = textLines.join("\n").trim();

    const subtitle: SRTSubtitle = { type: "line", id, start, end, text };
    if (Object.keys(meta).length > 0) {
      subtitle.meta = meta;
    }
    blocks.push(subtitle);
  }

  return { blocks };
}

const isSubtitleBlock = (block: SRTBlock): block is SRTSubtitle =>
  "start" in block && "end" in block;

export { parseSRT, isSubtitleBlock, type SRTDocument, type SRTBlock, type SRTSubtitle, type SRTTitle };
