// UniSport AI Streamer/Gamer Character Avatars (Kick-style 3D Branded Mascots)
import { AVATAR_DATA_URIS } from "./avatar-data.js";

export const UNISPORT_AVATARS = [
  {
    id: "bodybuilder",
    name: "Bodybuilder",
    image: AVATAR_DATA_URIS["bodybuilder"] || "./assets/avatars/bodybuilder.png",
    bg: "bg-transparent",
    ring: "ring-zinc-200 dark:ring-zinc-800",
    svg: `<img src="${AVATAR_DATA_URIS["bodybuilder"] || './assets/avatars/bodybuilder.png'}" alt="Bodybuilder" class="w-full h-full object-cover rounded-full" />`
  },
  {
    id: "footballer",
    name: "Striker",
    image: AVATAR_DATA_URIS["footballer"] || "./assets/avatars/footballer.png",
    bg: "bg-transparent",
    ring: "ring-zinc-200 dark:ring-zinc-800",
    svg: `<img src="${AVATAR_DATA_URIS["footballer"] || './assets/avatars/footballer.png'}" alt="Striker" class="w-full h-full object-cover rounded-full" />`
  },
  {
    id: "runner",
    name: "Speed Runner",
    image: AVATAR_DATA_URIS["runner"] || "./assets/avatars/runner.png",
    bg: "bg-transparent",
    ring: "ring-zinc-200 dark:ring-zinc-800",
    svg: `<img src="${AVATAR_DATA_URIS["runner"] || './assets/avatars/runner.png'}" alt="Speed Runner" class="w-full h-full object-cover rounded-full" />`
  }
];

export function getAvatarById(id) {
  return UNISPORT_AVATARS.find(a => a.id === id) || UNISPORT_AVATARS[0];
}
