export interface ValCard {
  id: string;
  recipient_name: string;
  message: string;
  style: number;
  emoji: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  is_ai_generated: boolean;
  created_at: string;
  section_id: string | null;
}

export interface Section {
  id: string;
  slug: string;
  name: string;
  admin_token: string;
  created_at: string;
}

export interface SectionPublic {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export const EMOJIS = ["💖", "🌹", "✨", "💐", "🦋", "🌸", "💌", "🫶", "🔥", "💀", "🥀", "🌙", "💅", "😈", "🖤"];

export const STYLE_CLASSES = [
  "bg-gradient-to-br from-primary to-rose-glow",
  "bg-gradient-to-br from-purple-500 to-pink-500",
  "bg-gradient-to-br from-accent to-primary",
  "bg-gradient-to-br from-blue-500 to-purple-500",
  "bg-gradient-to-br from-red-600 to-rose-500",
  "bg-gradient-to-br from-gray-900 to-gray-700",
];

export const MOODS = [
  { label: "Sweet 💕", value: "sweet and uplifting" },
  { label: "Funny 😂", value: "funny and playful" },
  { label: "Heartfelt 💖", value: "deeply heartfelt and sincere" },
  { label: "Motivational 💪", value: "motivational and empowering" },
  { label: "Romantic 🌹", value: "deeply romantic and passionate" },
  { label: "Flirty 😏", value: "flirty and teasing" },
  { label: "Sexy 🔥", value: "sultry and seductive but tasteful" },
  { label: "Sassy 💅", value: "sassy and confident with attitude" },
  { label: "Savage 🗡️", value: "savage and brutally honest but still kind" },
  { label: "Broken Heart 💔", value: "melancholic about lost love or heartbreak" },
  { label: "Love 🫶", value: "pure unconditional love and admiration" },
  { label: "Poetic ✨", value: "poetic and beautifully lyrical" },
  { label: "Chaotic 🌪️", value: "chaotic and unhinged but funny" },
  { label: "Mysterious 🌙", value: "mysterious and enigmatic" },
  { label: "Wholesome 🥰", value: "wholesome and heartwarming" },
];
