// Case-study content for each project: the cover card in Finder and the page it opens.
// Everything here comes from each project's README or Sameer's own description.
export const CASE = {
  'geospatial-segmentation': {
    team: true, // built as a team: the page says "we"
    name: 'Geospatial Segmentation',
    tagline: 'Mapping how land changes over time, pixel by pixel, from paired satellite images.',
    category: 'Deep learning · Research',
    color: '#1f5a46', tint: '#dcebe2', ink: '#f4f1e8', accent: '#e8c35a',
    stats: [['4,662', 'image pairs'], ['512²', 'pixels per image'], ['7', 'land classes'], ['IEEE', 'Xplore paper']],
    objectives: [
      ['See change, not just land', 'How might two images of the same place show exactly what changed between them?'],
      ['Handle uneven classes', 'How might a model stay accurate when some land classes are much rarer than others?'],
      ['Experiments you can repeat', 'How might every training run be named, versioned and reproducible?'],
    ],
    features: [
      {
        name: 'Dual-input segmentation',
        why: 'Change only shows up when both dates are looked at together.',
        decisions: [
          'Both images go into one U-Net, stacked as 6 input channels.',
          'The model outputs two 3-class masks, one for each date.',
          'Pixel-wise differencing of the masks highlights where land changed.',
        ],
        tradeoff: 'About 31M parameters, a 120 MB model and 2–8 GB of GPU memory.',
      },
      {
        name: 'Training at scale',
        why: 'Thousands of 512 × 512 image pairs are too heavy for a simple training loop.',
        decisions: [
          'Mixed precision with gradient scaling for faster GPU training.',
          'Focal loss to handle class imbalance.',
          'Warm-restart cosine scheduling, with early stopping after 10 flat epochs.',
          'Checkpoints every 10 epochs, so training can resume.',
        ],
        tradeoff: 'A full run still takes 2–8 hours on a GPU.',
      },
      {
        name: 'Config-driven runs',
        why: 'Editing scripts by hand makes runs hard to compare.',
        decisions: [
          'Every parameter lives in a YAML file.',
          'Experiments are named and versioned.',
          'A quick-test config trains on 20 images for 5 epochs.',
        ],
        tradeoff: 'More configuration to keep in sync than a single script.',
      },
    ],
  },
  scriptsync: {
    team: true,
    name: 'ScriptSync',
    tagline: 'Translates a whole video, from the words on screen to the voice, into another language.',
    category: 'Video translation · Languages',
    color: '#c8432f', tint: '#f8e1da', ink: '#fff7ef', accent: '#ffd166',
    stats: [['60%', 'faster processing'], ['150+', 'languages'], ['1st', 'VIT YANTRA Central Hackathon']],
    objectives: [
      ['Text in the frame too', 'How might text burned into the video be translated and redrawn in place?'],
      ['Skip what hasn’t changed', 'How might the pipeline avoid running OCR on frames whose text is the same?'],
      ['Dub the voice', 'How might speech be transcribed, translated and spoken again in the new language?'],
    ],
    features: [
      {
        name: 'On-screen text',
        why: 'Subtitles miss text that’s part of the picture itself.',
        decisions: [
          'GPU-accelerated OCR finds the text in each frame.',
          'The translation is drawn back over the original text.',
          'Fuzzy text matching reuses translations for near-identical text.',
          'A thread-safe cache shares results across workers.',
        ],
        tradeoff: 'Redrawn text can’t match every original font exactly.',
      },
      {
        name: 'Frame differencing',
        why: 'OCR on every frame is the slowest part of the pipeline.',
        decisions: [
          'Each frame is compared with the last one processed.',
          'Only frames that changed past a threshold go to OCR.',
          'A cap on consecutive skips keeps the text from drifting.',
          'Multithreaded workers, with a limit on concurrent GPU jobs.',
        ],
        tradeoff: 'Set the threshold too high and small text changes can be missed.',
      },
      {
        name: 'Audio dubbing',
        why: 'A translated picture with the original voice still isn’t watchable.',
        decisions: [
          'faster-whisper transcribes the speech.',
          'NLLB-200 translates the transcript.',
          'MMS-TTS speaks it in the target language.',
          'FFmpeg joins the new video and audio into the final MP4.',
        ],
        tradeoff: 'The first run has to download the model weights.',
      },
    ],
  },
  mindgarden: {
    name: 'Mindgarden',
    tagline: 'A calm, private place to capture notes and watch your ideas connect.',
    category: 'Full stack · Knowledge graph',
    color: '#5b4bb7', tint: '#e6e1f7', ink: '#f7f4ff', accent: '#b8e986',
    stats: [['3', 'import & export formats'], ['0', 'external AI services'], ['Offline', 'drafts that sync']],
    objectives: [
      ['Capture without friction', 'How might writing a note feel as quick as having the thought?'],
      ['Make connections visible', 'How might related notes find each other?'],
      ['Keep it yours', 'How might notes stay private, portable and usable offline?'],
    ],
    features: [
      {
        name: 'Graph explorer',
        why: 'A list of notes hides how the ideas relate.',
        decisions: [
          'Notes are nodes and connections are edges, drawn with React Flow.',
          'The graph is grouped and coloured by tag.',
          'Search and tag filters narrow what’s on screen.',
        ],
        tradeoff: 'Big graphs get dense, so filters do a lot of the work.',
      },
      {
        name: 'Connections',
        why: 'Ideas grow when they’re linked, not when they sit in folders.',
        decisions: [
          'Tags, named relationships and backlinks between notes.',
          'Related-note suggestions and quick summaries.',
          'Suggestions are generated locally, without an external AI service.',
        ],
        tradeoff: 'Local suggestions are simpler than a hosted model, but nothing leaves the server.',
      },
      {
        name: 'Safe and portable',
        why: 'Notes are only useful if you can trust that they’ll still be there.',
        decisions: [
          'Version history you can restore from.',
          'Local drafts that sync when you reconnect.',
          'Markdown, CSV and JSON import and export.',
          'Read-only sharing with other accounts, revocable at any time.',
        ],
        tradeoff: 'Offline drafts stay on one device until it reconnects.',
      },
    ],
  },
  afterword: {
    name: 'Afterword',
    tagline: 'Catch up on any episode in a minute: pick a show, choose an episode, read a short recap.',
    category: 'Full stack · Generative AI',
    color: '#24283b', tint: '#e3e5ee', ink: '#f6f1e7', accent: '#f2b84b',
    stats: [['Gemini', 'writes the recaps'], ['3+', 'API containers'], ['Redis', 'shared cache']],
    objectives: [
      ['A recap for any episode', 'How might a short recap be ready for any show, season and episode?'],
      ['Fast the second time', 'How might popular recaps avoid being regenerated for every user?'],
      ['Grow without surprises', 'How might the API scale across containers with shared limits?'],
    ],
    features: [
      {
        name: 'AI recaps',
        why: 'Catching up on a show shouldn’t mean rewatching it.',
        decisions: [
          'Google Gemini writes each recap on the server.',
          'TMDB powers show search and popular shows.',
          'API keys live only on the server, never in the browser.',
        ],
        tradeoff: 'Every new recap costs a model call, which is why caching matters.',
      },
      {
        name: 'Accounts & history',
        why: 'Recaps are worth keeping once you’ve read them.',
        decisions: [
          'Google sign-in with OAuth 2.0.',
          'OAuth state and login cookies are signed with HMAC.',
          'Saved recaps are stored in PostgreSQL under each account.',
          'Guests can generate recaps without signing in.',
        ],
        tradeoff: 'Guest recaps skip the cache, so they’re always generated fresh.',
      },
      {
        name: 'Built to scale',
        why: 'One server falls over the moment a recap gets popular.',
        decisions: [
          'Docker Compose runs the full stack.',
          'Traefik load-balances across backend containers.',
          'Redis is a shared cache and rate limiter for every instance.',
          'HTTPS with Let’s Encrypt for public deploys.',
        ],
        tradeoff: 'A deleted recap stays in the shared cache until it expires.',
      },
    ],
  },
}
