
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- Placeholder for Kome.ai Transcript Fetching (Not used in pasted text flow) ---
async function fetchKomeTranscriptByUrl(url) {
  console.log(`[Placeholder] Simulating Kome.ai fetch for URL: ${url}`);
  // This function is not called if a transcript is directly provided.
  // For testing sermon isolation, this function's output is less relevant now.
  // However, keeping a basic placeholder in case it's used elsewhere or for future ref.
  if (url && url.includes("example_sermon_video")) {
    return `
[00:00:00] Welcome everyone! Today's announcements are...
[00:00:05] [Music: Opening Hymn - Amazing Grace]
[00:00:10] La la la, singing the hymn.
[00:00:15] [Congregation sings]
[00:00:20] And now for a time of prayer. Heavenly Father, we thank you...
[00:00:30] Our scripture reading today is from John chapter 3.
[00:00:35] Pastor: Today’s sermon is about the incredible love of God, based on Romans 5.
[00:00:40] Let us turn to the scripture, specifically Romans chapter 5.
00:45 Paul tells us, "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:"
00:50 This peace is a foundational element of our walk.
[00:00:55] Consider the implications for daily life.
[00:01:00] It means that even in trials, we have an anchor.
[00:01:05] [Pastor sips water]
[00:01:10] The Bible clearly states this principle in many places.
01:15 For God so loved the world... (John 3:16 KJV)
[00:01:20] We will now have a closing prayer.
[00:01:25] [Music: Closing Song]
[00:01:30] Thank you for joining us. Coffee fellowship in the hall. Heat Heat.
`;
  } else if (url && !url.match(/https?:\/\/(www\.)?youtube\.com\/(watch\?v=[\w-]+|embed\/[\w-]+|v\/[\w-]+|shorts\/[\w-]+)|https?:\/\/youtu\.be\/[\w-]+/)) {
    console.error('Invalid YouTube URL format for placeholder fetch:', url);
    throw new Error("Invalid input. Please provide a valid YouTube video URL for fetching.");
  }
  console.warn(`[Placeholder] Kome.ai failed to generate transcript for: ${url}`);
  throw new Error("Unable to generate transcript for the provided YouTube video (simulated Kome.ai failure).");
}


// --- Timestamp Removal Function ---
function removeTimestamps(text) {
  if (!text) return "";
  // Regex to match various timestamp formats, including those at the start of a line without brackets
  // and those with milliseconds.
  const timestampRegex = /(\[\s*\d{1,2}:\d{2}(:\d{2})?(\.\d{3})?\s*\]|^\s*\d{1,2}:\d{2}(:\d{2})?(\.\d{3})?\s*(?=\s|\w|$))/gm;
  let cleanedText = text.replace(timestampRegex, '');
  // Remove lines that became empty after timestamp removal or were only whitespace
  cleanedText = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
  return cleanedText;
}

// --- Sermon Isolation Function ---
function isolateSermonContent(transcript) {
  if (!transcript || transcript.trim() === "") {
    return "No transcript provided or transcript is empty.";
  }

  const lines = transcript.split('\n');
  const sermonParts = [];
  let inSermon = false;
  let inPrayerBlock = false; // To handle multi-line prayers

  // Cues to identify start of sermon
  const sermonStartCues = [
    "sermon is about", "message today", "let us turn to the scripture", "our theme is",
    "we're going to be looking at", "pastor:", "preacher:", "speaker:",
    "the word of god", "our text today", "teaching on", "exposition of",
    "turn back to romans", "romans chapter 5", "looking at verses"
  ];

  // Cues to identify non-sermon content (expanded)
  const nonSermonCues = [
    "[music]", "[song]", "[sings]", "[congregation sings]", "[applause]", "hymn:",
    "announcement", "news sheet", "notices", "welcome", "good morning", "happy sunday",
    "coffee fellowship", "closing song", "benediction", "offering", "tithes",
    "members meeting", "ladies meeting", "youth group", "sunday school children", "awards for",
    "christian institute", "assisted suicide bill", "conversion therapy",
    "let's come in prayer", "father we come to worship", "heavenly father", "lord grant to us",
    "we ask these things in jesus name amen", "let us pray", "let's pray", "we pray for",
    "our father who art in heaven", "closing prayer", "opening prayer",
    "scripture reading", "psalm", "reading from", "the reading today is"
    // Note: "Amen" at the end of a prayer needs careful handling if sermon follows immediately.
  ];

  // Regex for action tags like [Pastor sips water]
  const actionTagRegex = /\[[^\]]*?(pastor|speaker|audience|congregation|applause|laughs|coughs|clears throat|sips water|walks|stands|sits|video plays|sound effect)[^\]]*?\]/gi;

  // Simple check for song-like repetitive short lines
  const isLikelySongLyric = (line) => {
    const words = line.toLowerCase().split(/\s+/);
    if (words.length <= 3 && words.length > 0) {
        // e.g. "Heat Heat", "Hallelujah Hallelujah"
        if (words.every(w => w === words[0])) return true;
        if (words.length === 2 && words[0] === words[1]) return true;
    }
    return false;
  };


  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Remove purely descriptive action tags or strip them if line has other content
    const lineWithoutActionTags = line.replace(actionTagRegex, "").trim();
    if (lineWithoutActionTags.length === 0 && actionTagRegex.test(line)) {
        console.log(`Skipping action tag line: ${line}`);
        continue; // Skip lines that are only action tags
    }
    line = lineWithoutActionTags; // Use line without action tags for further processing
    if (!line) continue;


    const lowerLine = line.toLowerCase();

    // Handle prayer blocks
    if (lowerLine.includes("let's come in prayer") || lowerLine.includes("father we come to worship") || lowerLine.startsWith("heavenly father")) {
        console.log(`Entering prayer block at: ${line}`);
        inPrayerBlock = true;
        inSermon = false; // Ensure prayer is not sermon
        continue;
    }
    if (inPrayerBlock) {
        if (lowerLine.endsWith("amen") && (lowerLine.includes("in jesus name amen") || lines.length === i + 1 || lines[i+1].trim() === "")) {
            console.log(`Exiting prayer block at: ${line}`);
            inPrayerBlock = false;
        }
        console.log(`Skipping prayer line: ${line}`);
        continue; // Skip all lines within a prayer block
    }


    let isNonSermonLine = nonSermonCues.some(cue => lowerLine.includes(cue.toLowerCase()));
    let isSermonStartIndicator = sermonStartCues.some(cue => lowerLine.includes(cue.toLowerCase()));
    
    // Special handling for scripture readings if they are not part of sermon exposition
    if (lowerLine.includes("psalm") && lowerLine.length < 150 && !inSermon) { // Heuristic: short lines with "psalm" are likely readings
        console.log(`Identified potential scripture reading (Psalm): ${line}`);
        isNonSermonLine = true;
    }
    if ((lowerLine.startsWith("romans chapter 5") || lowerLine.includes("verses 1-11")) && !inSermon && i+1 < lines.length && lines[i+1].toLowerCase().includes("therefore since we have been justified")) {
        console.log(`Identified potential scripture reading (Romans 5:1-11): ${line}`);
        // This is tricky, as the sermon is ON Romans 5. We need to distinguish the reading FROM the sermon.
        // If the next lines start the exposition, this current line is probably part of the reading.
        // This needs very careful context. For now, we'll assume direct reading if not already in sermon.
        isNonSermonLine = true;
    }


    if (isNonSermonLine) {
        // Check if this "non-sermon" line MIGHT actually be the start of a sermon
        // e.g. "Our message today is from Romans chapter 5"
        const potentialSermonCueInNonSermonLine = sermonStartCues.find(cue => lowerLine.includes(cue.toLowerCase()));
        if (potentialSermonCueInNonSermonLine) {
            const cueIndex = lowerLine.indexOf(potentialSermonCueInNonSermonLine.toLowerCase());
             // If the sermon cue is prominent and there's substantial text after it, it might be a sermon start.
            if (line.length > cueIndex + potentialSermonCueInNonSermonLine.length + 15) {
                 console.log(`Potential sermon start within non-sermon line: ${line}. Cue: ${potentialSermonCueInNonSermonLine}`);
                 inSermon = true; // Start sermon here
                 // Take the part from the cue onwards
                 sermonParts.push(line.substring(cueIndex));
                 continue;
            }
        }
        console.log(`Excluding non-sermon line: ${line}`);
        inSermon = false; // Stop sermon if non-sermon content is encountered
        continue;
    }

    if (isSermonStartIndicator && !inSermon) {
      console.log(`Sermon start detected at: ${line}`);
      inSermon = true;
    }

    // Additional filter for song-like lines or very short interjections
    if (inSermon) {
        if (isLikelySongLyric(line)) {
            console.log(`Skipping likely song lyric: ${line}`);
            continue;
        }
        if (line.length < 20 && line.split(' ').length < 4 && !(/[a-zA-Z]\.[a-zA-Z]/.test(line))) { // Allow for e.g. "vs. 1"
            console.log(`Skipping very short line in sermon: ${line}`);
            // Potentially an interjection, or end of a paragraph before a non-sermon part.
            // Keep `inSermon` true for now, next line will determine if it continues.
            continue;
        }
        sermonParts.push(line);
    }
  }

  if (sermonParts.length === 0) {
    return "No sermon content could be identified in the transcript.";
  }

  return sermonParts.join(' ').trim(); // Join with space for continuous text
}


// --- Main Cloud Function ---
// Export the function with the name 'processSermon'
exports.processSermon = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity, restrict in production
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Handle preflight requests for CORS
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Prioritize pasted transcript
  const { transcript: pastedTranscript, url: youtubeUrl } = req.body;
  let rawTranscript = "";
  let warningMessage = "";

  if (pastedTranscript && typeof pastedTranscript === 'string' && pastedTranscript.trim() !== "") {
    console.log("Processing directly provided transcript.");
    rawTranscript = pastedTranscript;
  } else if (youtubeUrl && typeof youtubeUrl === 'string') {
    // Fallback to URL fetching if no transcript provided - using placeholder
    console.log("Attempting to fetch transcript by URL (placeholder) as no transcript was pasted.");
     if (!youtubeUrl.match(/https?:\/\/(www\.)?youtube\.com\/(watch\?v=[\w-]+|embed\/[\w-]+|v\/[\w-]+|shorts\/[\w-]+)|https?:\/\/youtu\.be\/[\w-]+/)) {
        return res.status(400).json({ error: "Invalid YouTube URL provided for fetching." });
    }
    try {
      rawTranscript = await fetchKomeTranscriptByUrl(youtubeUrl);
    } catch (error) {
      console.error("Error fetching transcript by URL:", error);
      return res.status(500).json({ error: error.message || "Unable to generate transcript for the provided YouTube video." });
    }
  } else {
    return res.status(400).json({ error: 'Please provide a church service transcript to process.' });
  }

  if (!rawTranscript || rawTranscript.trim() === "") {
      return res.status(500).json({error: "Transcript (provided or fetched) was empty."});
  }
  if (rawTranscript.includes("[Transcript ends abruptly]")) {
      warningMessage = "Transcript may be incomplete";
  }

  const transcriptWithoutTimestamps = removeTimestamps(rawTranscript);
  const sermonText = isolateSermonContent(transcriptWithoutTimestamps);

  const responseJson = {
    sermon: sermonText, // Will be "No sermon content..." if nothing found
    status: "ready for clipboard"
  };

  if (sermonText === "No sermon content could be identified in the transcript." && !warningMessage) {
    // If isolateSermonContent returns specific message, don't override with generic warning
  } else if (warningMessage) {
    responseJson.warning = warningMessage;
  }


  return res.status(200).json(responseJson);
});

  