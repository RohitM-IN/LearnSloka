interface SRTSubtitle {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

/**
 * Converts SRT time format (HH:MM:SS,mmm) to seconds
 * @param timeString Time in SRT format
 * @returns Time in seconds
 */
function timeToSeconds(timeString: string): number {
  const [time, millisecondsString] = timeString.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const milliseconds = Number(millisecondsString);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function parseSRT(srtText: string): SRTSubtitle[] {
  // Split the SRT text into blocks
  const blocks = srtText.trim().split(/\n\s*\n/);
  const subtitles: SRTSubtitle[] = [];
  
  for (const block of blocks) {
    // Skip empty blocks
    if (!block.trim()) continue;
    
    // Split the block into lines
    const lines = block.trim().split('\n');
    
    // Need at least 3 lines (index, time, text)
    if (lines.length < 3) continue;
    
    // Parse the index (first line)
    const id = parseInt(lines[0], 10);
    if (isNaN(id)) continue;
    
    // Parse the time range (second line)
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) continue;
    
    const start = timeToSeconds(timeMatch[1]);
    const end = timeToSeconds(timeMatch[2]);
    
    // Parse the text (remaining lines)
    const text = lines.slice(2).join('\n').trim();
    
    subtitles.push({
      id,
      start,
      end,
      text
    });
  }
  
  return subtitles;
}

export { parseSRT, type SRTSubtitle };