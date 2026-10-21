// UniSport AI Streamer/Gamer Character Avatars (Kick-style 3D Branded Mascots)
export const UNISPORT_AVATARS = [
  {
    id: "bodybuilder",
    name: "Bodybuilder",
    image: "/challenge2/unisport/assets/avatars/bodybuilder.png",
    localImage: "./assets/avatars/bodybuilder.png",
    bg: "from-amber-500 to-orange-600",
    ring: "ring-orange-500/50",
    svg: `<img src="./assets/avatars/bodybuilder.png" onerror="this.src='/challenge2/unisport/assets/avatars/bodybuilder.png'" alt="Bodybuilder" class="w-full h-full object-cover rounded-full" />`
  },
  {
    id: "footballer",
    name: "Striker",
    image: "/challenge2/unisport/assets/avatars/footballer.png",
    localImage: "./assets/avatars/footballer.png",
    bg: "from-brand-orange to-zinc-900",
    ring: "ring-brand-orange/50",
    svg: `<img src="./assets/avatars/footballer.png" onerror="this.src='/challenge2/unisport/assets/avatars/footballer.png'" alt="Striker" class="w-full h-full object-cover rounded-full" />`
  },
  {
    id: "runner",
    name: "Speed Runner",
    image: "/challenge2/unisport/assets/avatars/runner.png",
    localImage: "./assets/avatars/runner.png",
    bg: "from-rose-500 to-brand-orange",
    ring: "ring-orange-400/50",
    svg: `<img src="./assets/avatars/runner.png" onerror="this.src='/challenge2/unisport/assets/avatars/runner.png'" alt="Speed Runner" class="w-full h-full object-cover rounded-full" />`
  },
  {
    id: "bolt",
    name: "Thunder",
    bg: "from-amber-400 to-orange-500",
    ring: "ring-amber-400/50",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  },
  {
    id: "flame",
    name: "Blaze",
    bg: "from-red-500 to-rose-600",
    ring: "ring-rose-500/50",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`
  },
  {
    id: "cyber",
    name: "Cyber",
    bg: "from-emerald-400 to-teal-600",
    ring: "ring-emerald-400/50",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>`
  }
];

export function getAvatarById(id) {
  return UNISPORT_AVATARS.find(a => a.id === id) || UNISPORT_AVATARS[0];
}
