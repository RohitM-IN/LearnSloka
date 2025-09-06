interface SRTSubtitle {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  meta?: Record<string, string>;
  type: "line";
}

interface SRTTitle {
  type: "title" | "title-end";
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

    // Try to parse as standalone title block
    const titleBlock = parseStandaloneTitleBlock(lines);
    if (titleBlock) {
      blocks.push(titleBlock);
      continue;
    }
    
    // Try to parse as subtitle block
    const timing = validateSubtitleBlock(lines);
    if (!timing) continue;
    
    // Parse content lines (text, meta, embedded titles)
    const content = parseContentLines(lines.slice(2));
    
    // Create appropriate blocks
    const subtitleBlocks = createBlocksFromSubtitle(timing, content);
    blocks.push(...subtitleBlocks);
  }

  return { blocks };
}

/**
 * Parses standalone title blocks (#TITLE or #TITLEEND at the beginning)
 */
function parseStandaloneTitleBlock(lines: string[]): SRTTitle | null {
  const firstLine = lines[0];
  
  if (firstLine.startsWith("#TITLEEND")) {
    const titleText = firstLine.substring(10).trim();
    return titleText ? { type: "title-end", text: titleText } : null;
  }
  
  if (firstLine.startsWith("#TITLE")) {
    const titleText = firstLine.substring(6).trim();
    return titleText ? { type: "title", text: titleText } : null;
  }
  
  return null;
}

/**
 * Validates if a block can be a subtitle block (has ID and timing)
 */
function validateSubtitleBlock(lines: string[]): { id: number; start: number; end: number } | null {
  if (lines.length < 3) return null;
  
  const id = parseInt(lines[0], 10);
  if (isNaN(id)) return null;
  
  const timeMatch = lines[1].match(
    /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
  );
  if (!timeMatch) return null;
  
  const start = timeToSeconds(timeMatch[1]);
  const end = timeToSeconds(timeMatch[2]);
  
  return { id, start, end };
}

/**
 * Parses content lines to extract text, metadata, and embedded titles
 */
function parseContentLines(contentLines: string[]): {
  text: string;
  meta: Record<string, string>;
  embeddedTitle: string | null;
} {
  const textLines: string[] = [];
  const meta: Record<string, string> = {};
  let embeddedTitle: string | null = null;
  
  for (const line of contentLines) {
    // Check for embedded #TITLE directive
    if (line.startsWith('#TITLE ')) {
      embeddedTitle = line.substring(7).trim();
      continue;
    }
    
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
  
  return {
    text: textLines.join("\n").trim(),
    meta,
    embeddedTitle
  };
}

/**
 * Creates blocks from parsed subtitle data
 */
function createBlocksFromSubtitle(
  timing: { id: number; start: number; end: number },
  content: { text: string; meta: Record<string, string>; embeddedTitle: string | null }
): SRTBlock[] {
  const blocks: SRTBlock[] = [];
  
  // Add embedded title block if found
  if (content.embeddedTitle) {
    blocks.push({ type: "title", text: content.embeddedTitle });
  }
  
  // Always create the subtitle block if there's text content OR if there was no embedded title
  // This ensures we don't lose the timing information
  if (content.text || !content.embeddedTitle) {
    const subtitle: SRTSubtitle = { 
      type: "line", 
      id: timing.id, 
      start: timing.start, 
      end: timing.end, 
      text: content.text 
    };
    
    if (Object.keys(content.meta).length > 0) {
      subtitle.meta = content.meta;
    }
    
    blocks.push(subtitle);
  }
  
  return blocks;
}


const isSubtitleBlock = (block: SRTBlock): block is SRTSubtitle =>
  "start" in block && "end" in block;

export { parseSRT, isSubtitleBlock, type SRTDocument, type SRTBlock, type SRTSubtitle, type SRTTitle };
