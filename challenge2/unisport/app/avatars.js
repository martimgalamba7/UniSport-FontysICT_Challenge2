// UniSport AI Streamer/Gamer Character Avatars (Kick-style 3D Branded Mascots)
import { AVATAR_DATA_URIS } from "./avatar-data.js";

export const UNISPORT_AVATARS = [
  {
    id: "bodybuilder",
    name: "Bodybuilder",
    image: AVATAR_DATA_URIS["bodybuilder"] || "./assets/avatars/bodybuilder.png",
    bg: "from-amber-500 to-orange-600",
    ring: "ring-orange-500/50",
    svg: `<img src="${AVATAR_DATA_URIS["bodybuilder"] || './assets/avatars/bodybuilder.png'}" alt="Bodybuilder" class="w-full h-full object-cover rounded-full" />`
  },
  {
    id: "footballer",
    name: "Striker",
    image: AVATAR_DATA_URIS["footballer"] || "./assets/avatars/footballer.png",
    bg: "from-brand-orange to-zinc-900",
    ring: "ring-brand-orange/50",
    svg: `<img src="${AVATAR_DATA_URIS["footballer"] || './assets/avatars/footballer.png'}" alt="Striker" class="w-full h-full object-cover rounded-full" />`
  },
  {
    id: "runner",
    name: "Speed Runner",
    image: AVATAR_DATA_URIS["runner"] || "./assets/avatars/runner.png",
    bg: "from-rose-500 to-brand-orange",
    ring: "ring-orange-400/50",
    svg: `<img src="${AVATAR_DATA_URIS["runner"] || './assets/avatars/runner.png'}" alt="Speed Runner" class="w-full h-full object-cover rounded-full" />`
  }
];

export function getAvatarById(id) {
  return UNISPORT_AVATARS.find(a => a.id === id) || UNISPORT_AVATARS[0];
}
