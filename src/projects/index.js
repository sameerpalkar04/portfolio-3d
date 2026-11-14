// Projects shown in the iMac's Projects folder. Each one is a Markdown file in this folder; add an entry
// here (and drop its PDF, if any, in public/projects/) to add a project.
import geospatial from './geospatial-segmentation.md?raw'
import scriptsync from './scriptsync.md?raw'
import mindgarden from './mindgarden.md?raw'
import afterword from './afterword.md?raw'

export const PROJECTS = [
  {
    id: 'geospatial-segmentation', file: 'Geospatial-Segmentation.md', date: 'Today, 11:30 PM', size: '3 KB',
    title: 'Geospatial Image Segmentation and Temporal Change Analysis',
    tags: ['PyTorch', 'U-Net', 'Computer vision', 'Research'],
    summary: 'Developing a deep learning framework for land cover segmentation and temporal change detection using U-Net and DeepLabV3+.',
  points: ['It enables monitoring of urban expansion and deforestation via multi-temporal analysis and pixel-wise differencing.'],
  tools: ['Python', 'PyTorch', 'U-Net', 'DeepLabV3+', 'torchvision', 'NumPy', 'scikit-learn', 'Pillow', 'Matplotlib', 'YAML'],
  markdown: geospatial,
    links: {
      github: 'https://github.com/sameerpalkar04/Geospatial-Image-Segmentation',
      ieee: 'https://ieeexplore.ieee.org/document/11455786',
      pdf: '/projects/geospatial-segmentation.pdf',
      pdfName: 'Land_Cover_Change_Detection_Using_DeepLabv3-ResNet50.pdf',
    },
  },
  {
    id: 'scriptsync', file: 'ScriptSync.md', date: 'Today, 12:25 AM', size: '3 KB',
    title: 'ScriptSync',
    tags: ['Python', 'Computer vision', 'Hackathon winner'],
    points: [
      'Developed a multithreaded video translation pipeline with GPU-accelerated OCR and frame differencing, cutting processing time by 60%.',
      'Won 1st place at VIT Central Hackathon with real-time multi-language translation for 150+ languages.',
      'Integrated OpenCV, thread-safe caching, fuzzy text matching, and visual text replacement.',
    ],
    tools: ['Python', 'OpenCV', 'EasyOCR', 'Threading', 'Google Translate API', 'FFmpeg'],
    markdown: scriptsync,
    links: { github: 'https://github.com/sameerpalkar04/scriptsync' },
  },
  {
    id: 'mindgarden', file: 'Mindgarden.md', date: 'Today, 12:38 AM', size: '2 KB',
    title: 'Mindgarden',
    tags: ['Full stack', 'Knowledge graph'],
    summary: 'A full-stack personal knowledge graph for capturing notes in Markdown, connecting related ideas, and exploring them as an interactive graph.',
    points: [
      'Built tags, named relationships, backlinks and related-note suggestions, shown in a searchable graph grouped and coloured by tag.',
      'Added version history, offline drafts that sync on reconnect, Markdown/CSV/JSON import and export, and read-only sharing between accounts.',
      'Generates note summaries and related-idea suggestions locally, without an external AI service.',
    ],
    tools: ['React', 'TypeScript', 'Vite', 'React Router', 'React Flow', 'Node.js', 'Express.js', 'Prisma', 'PostgreSQL', 'JWT'],
    markdown: mindgarden,
    links: { github: 'https://github.com/sameerpalkar04/mindgarden-personal-knowledge-graph' },
  },
  {
    id: 'afterword', file: 'Afterword-Recap.md', date: 'Today, 12:48 AM', size: '3 KB',
    title: 'Afterword — The Recap Journal',
    tags: ['Full stack', 'Generative AI'],
    summary: 'A full-stack web app for browsing TV shows and generating concise, AI-written episode recaps.',
    points: [
      'Generates recaps server-side with Google Gemini, using TMDB for show search and popular shows.',
      'Added Google OAuth sign-in with signed session cookies, guest recaps, and a saved recap history in PostgreSQL.',
      'Scales horizontally with Docker Compose, Traefik load balancing across API containers, and a shared Redis cache and rate limiter.',
    ],
    tools: ['React', 'TypeScript', 'Vite', 'Node.js', 'Express.js', 'PostgreSQL', 'Redis', 'Docker', 'Traefik', 'Google Gemini', 'TMDB', 'Google OAuth'],
    markdown: afterword,
    links: { github: 'https://github.com/sameerpalkar04/recap-website' },
  },
]
