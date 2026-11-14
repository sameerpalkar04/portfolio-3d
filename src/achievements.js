// Achievements on the wall above the iMac. Each entry goes into one frame of the wall
// (`frame` = its slot in createCertificateWall's layout: 0 = top left, 2 = top right, 5 = bottom middle …).
// To add one: put the certificate image in public/achievements/ and add an entry here.
export const ACHIEVEMENTS = [
  {
    id: 'yantra-2024', frame: 0, image: '/achievements/yantra-2024.jpg', aspect: 1178 / 843,
    project: 'https://github.com/sameerpalkar04/scriptsync', // optional: shows a View project button
    place: '1st place', title: 'Yantra Central Hackathon', event: 'Yantra 2024 · VIT Vellore', date: '12–14 April 2024',
    summary: 'Won first place at the central hackathon of Yantra, VIT Vellore’s week-long technical fest.',
    points: [
      'Built ScriptSync: real-time translation of video into 150+ languages.',
      'A multithreaded pipeline with GPU-accelerated OCR and frame differencing that cut processing time by 60%.',
    ],
  },
  {
    id: 'devjams-2024', frame: 2, image: '/achievements/devjams-2024.jpg', aspect: 1280 / 880,
    place: '3rd place', title: 'DEVJAMS’24', event: 'graVITas’24 · VIT Vellore', date: '27–29 September 2024',
    summary: 'Stood third at Google Developer Group’s hackathon.',
    points: [
      'Built StoryScape: an audio-visual generator for any block of text.',
      'Paired AI-generated narration with matching visuals, scene by scene, so a passage plays out like a short film.',
    ],
  },
]

