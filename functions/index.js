
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- Placeholder for Kome.ai Transcript Fetching ---
// This function remains as a placeholder if the Cloud Function needs to fetch by URL for other purposes.
// For the sermon-extractor.html page, the transcript will be sent directly.
async function fetchKomeTranscriptByUrl(url) {
  console.log(`[Placeholder] Fetching transcript for URL: ${url}`);
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

  if (url.includes("youtube.com/watch?v=example_sermon_video")) {
    return `
[00:00:00] Welcome everyone! Today's announcements are...
[00:00:05] [Music: Opening Hymn - Amazing Grace]
[00:00:10] La la la, singing the hymn.
[00:00:15] [Congregation sings]
[00:00:20] And now for a time of prayer. Heavenly Father, we thank you...
[00:00:30] Our scripture reading today is from John chapter 3.
[00:00:35] Today’s sermon is about the incredible love of God.
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
  } else if (url.includes("youtube.com/watch?v=incomplete_video")) {
    return `
[00:00:00] The sermon today focuses on...
[00:00:05] ...and this leads us to understand grace more deeply.
[00:00:10] [Transcript ends abruptly]
`;
  } else if (url.includes("youtube.com/watch?v=no_sermon_video")) {
    return `
[00:00:00] [Music only for 5 minutes]
[00:05:00] Announcements for the week.
[00:10:00] That's all folks!
`;
  } else if (!url || !url.match(/https?:\/\/(www\.)?youtube\.com\/(watch\?v=[\w-]+|embed\/[\w-]+|v\/[\w-]+|shorts\/[\w-]+)|https?:\/\/youtu\.be\/[\w-]+/)) {
    console.error('Invalid YouTube URL format for placeholder fetch:', url);
    throw new Error("Invalid input. Please provide a valid YouTube video URL for fetching.");
  } else {
    console.warn(`[Placeholder] Kome.ai failed to generate transcript for: ${url}`);
    throw new Error("Unable to generate transcript for the provided YouTube video (simulated Kome.ai failure).");
  }
}

// --- Timestamp Removal Function ---
function removeTimestamps(text) {
  if (!text) return "";
  const timestampRegex = /(\[\s*\d{1,2}:\d{2}(:\d{2})?(\.\d{3})?\s*\]|^\s*\d{1,2}:\d{2}(:\d{2})?(\.\d{3})?\s*)/gm;
  let cleanedText = text.replace(timestampRegex, '');
  cleanedText = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
  return cleanedText;
}

// --- Sermon Isolation Function ---
function isolateSermonContent(transcript) {
  if (!transcript) return "";

  const lines = transcript.split('\n');
  const sermonParts = [];
  let inSermon = false;
  let potentialSermonStart = false;

  const sermonStartCues = [
    "sermon", "message", "scripture", "let us turn to", "today we explore",
    "the word of God", "our text today", "pastor", "preaching", "teaching"
  ];
  const nonSermonCues = [
    "[music]", "[singing]", "[congregation sings]", "hymn:", "announcement", "pray", "prayer",
    "heavenly father", "good morning", "welcome", "coffee fellowship", "closing song",
    "benediction", "offering", "tithes"
  ];
  const actionTagRegex = /\[[^\]]*?(pastor|speaker|audience|congregation|applause|laughs|coughs|clears throat|sips water|walks|stands|sits)[^\]]*?\]/i;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    let originalLine = line.trim();

    if (actionTagRegex.test(lowerLine) && originalLine.replace(actionTagRegex, "").trim() === "") {
        continue;
    }
    originalLine = originalLine.replace(actionTagRegex, "").trim();
    if (!originalLine) continue;

    let isNonSermonIndicator = nonSermonCues.some(cue => lowerLine.includes(cue));
    let isSermonIndicator = sermonStartCues.some(cue => lowerLine.includes(cue));

    if (isNonSermonIndicator) {
      if (!(isSermonIndicator && lowerLine.length > originalLine.indexOf(sermonStartCues.find(c => lowerLine.includes(c)) || "") + 20) ) {
        inSermon = false;
        potentialSermonStart = false;
        continue; 
      }
    }

    if (isSermonIndicator) {
      inSermon = true;
      potentialSermonStart = true;
    }

    const isLikelySermonText = originalLine.length > 20 && (originalLine.split(' ').length > 4);

    if (inSermon || (potentialSermonStart && isLikelySermonText)) {
      const words = originalLine.split(/\s+/);
      if (words.length > 1 && words[0].toLowerCase() === words[1].toLowerCase() && words.length < 5) {
          // Likely a song lyric or chant
      } else if (originalLine.length > 5) {
          sermonParts.push(originalLine);
          potentialSermonStart = true;
      }
    } else {
        potentialSermonStart = false;
    }
  }
  return sermonParts.join(' ').trim();
}

// --- Main Cloud Function ---
exports.processSermon = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); 
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url: youtubeUrl, transcript: pastedTranscript } = req.body;
  let rawTranscript = "";
  let warningMessage = "";

  if (pastedTranscript && typeof pastedTranscript === 'string' && pastedTranscript.trim() !== "") {
    console.log("Processing directly provided transcript.");
    rawTranscript = pastedTranscript;
  } else if (youtubeUrl && typeof youtubeUrl === 'string') {
    console.log("Attempting to fetch transcript by URL (placeholder).");
    if (!youtubeUrl.match(/https?:\/\/(www\.)?youtube\.com\/(watch\?v=[\w-]+|embed\/[\w-]+|v\/[\w-]+|shorts\/[\w-]+)|https?:\/\/youtu\.be\/[\w-]+/)) {
        return res.status(400).json({ error: "Invalid input. Please provide a valid YouTube video URL for fetching." });
    }
    try {
      rawTranscript = await fetchKomeTranscriptByUrl(youtubeUrl);
    } catch (error) {
      console.error("Error fetching transcript by URL:", error);
      return res.status(500).json({ error: error.message || "Unable to generate transcript for the provided YouTube video." });
    }
  } else {
    return res.status(400).json({ error: 'Invalid input. Please provide either a "transcript" or a "url" field in the JSON body.' });
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
    sermon: sermonText || "No sermon content could be identified in the transcript.",
    status: "ready for clipboard"
  };

  if (warningMessage) {
    responseJson.warning = warningMessage;
  }

  return res.status(200).json(responseJson);
});
