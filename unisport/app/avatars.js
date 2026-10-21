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
  }
];

export function getAvatarById(id) {
  return UNISPORT_AVATARS.find(a => a.id === id) || UNISPORT_AVATARS[0];
}
