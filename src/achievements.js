// Achievements on the wall above the iMac. Each entry goes into one frame of the wall
// (`frame` = its slot in createCertificateWall's layout: 0 = top left, 2 = top right, 5 = bottom middle …).
// To add one: put the certificate image in public/achievements/ and add an entry here.
export const ACHIEVEMENTS = [
  {
    id: 'yantra-2024', frame: 0, kind: 'win', short: 'Yantra', plate: '1st place · Yantra 2024', image: '/achievements/yantra-2024.jpg', aspect: 1178 / 843,
    project: 'https://github.com/sameerpalkar04/scriptsync', // optional: shows a View project button
    place: '1st place', title: 'Yantra Central Hackathon', event: 'Yantra 2024 · VIT Vellore', date: '12–14 April 2024',
    summary: 'Won first place at the central hackathon of Yantra, VIT Vellore’s week-long technical fest.',
    points: [
      'Built ScriptSync: real-time translation of video into 150+ languages.',
      'A multithreaded pipeline with GPU-accelerated OCR and frame differencing that cut processing time by 60%.',
    ],
  },
  {
    id: 'devjams-2024', frame: 2, kind: 'win', short: 'DEVJAMS', plate: '3rd place · DEVJAMS’24', image: '/achievements/devjams-2024.jpg', aspect: 1280 / 880,
    place: '3rd place', title: 'DEVJAMS’24', event: 'graVITas’24 · VIT Vellore', date: '27–29 September 2024',
    summary: 'Stood third at Google Developer Group’s hackathon.',
    points: [
      'Built StoryScape: an audio-visual generator for any block of text.',
      'Paired AI-generated narration with matching visuals, scene by scene, so a passage plays out like a short film.',
    ],
  },
  // certificates of recognition: the smaller frames on the bottom row (shown after the two hackathon wins)
  {
    id: 'riviera-2026', frame: 3, kind: 'recognition', short: 'Riviera 2026', image: '/achievements/riviera-2026.jpg', aspect: 1320 / 928,
    place: 'Recognition', title: 'Riviera 2026', event: 'Organizer, Design & Print · VIT Vellore', date: '26 Feb – 1 Mar 2026',
    summary: 'Recognised as an Organizer of Riviera 2026, VIT Vellore’s annual international sports and cultural fest.',
    points: ['Led the digital design team for a festival of 40,000+ people.', 'Oversaw visual content strategy, promotions and multimedia coordination.'],
  },
  {
    id: 'riviera-2025', frame: 4, kind: 'recognition', short: 'Riviera 2025', image: '/achievements/riviera-2025.jpg', aspect: 1308 / 924,
    place: 'Recognition', title: 'Riviera 2025', event: 'Student Manager, Design & Media · VIT Vellore', date: 'February 2025',
    summary: 'Recognised as a Student Manager for organising Riviera 2025.',
    points: ['Designed social media posts, brochures and promotional material for the festival.', 'Kept communication smooth between the design, media and organising teams.'],
  },
  {
    id: 'gravitas-2024', frame: 5, kind: 'recognition', short: 'graVITas’24', image: '/achievements/gravitas-2024.jpg', aspect: 1304 / 805,
    place: 'Recognition', title: 'graVITas 2024', event: 'Student Coordinator · VIT Vellore', date: '27–29 September 2024',
    summary: 'Recognised as a Student Coordinator of graVITas’24, VIT Vellore’s annual techno-management fest.',
    points: ['Designed the social media posts that publicised graVITas’24.', 'Helped keep operations running smoothly within the design team.'],
  },
]

