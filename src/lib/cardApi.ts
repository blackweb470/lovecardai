import { supabase } from "@/integrations/supabase/client";
import type { ValCard, Section, SectionPublic } from "./cardTypes";

// ─── Section APIs ───

export const createSection = async (name: string): Promise<Section> => {
  const { data, error } = await supabase.functions.invoke("create-section", {
    body: { name },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as Section;
};

export const fetchSectionBySlug = async (slug: string): Promise<SectionPublic | null> => {
  const { data, error } = await supabase.rpc("get_section_by_slug", { p_slug: slug });

  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0] as SectionPublic;
};

export const fetchSectionCards = async (
  slug: string,
  adminToken: string
): Promise<{ section: SectionPublic; cards: ValCard[] }> => {
  const { data, error } = await supabase.functions.invoke("get-section-cards", {
    body: { slug, admin_token: adminToken },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { section: SectionPublic; cards: ValCard[] };
};

// ─── Card APIs ───

export const createCard = async (
  card: Omit<ValCard, "id" | "created_at">
): Promise<void> => {
  const { error } = await supabase.from("val_cards").insert(card as any);
  if (error) throw error;
};

export const uploadMedia = async (
  file: File
): Promise<{ url: string; type: "image" | "video" }> => {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("card-media")
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("card-media").getPublicUrl(path);

  const type = file.type.startsWith("video") ? "video" : "image";
  return { url: publicUrl, type };
};

export const generateAIMessage = async (
  recipientName: string,
  mood: string
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("generate-card", {
    body: { recipientName, mood },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.message;
};

// ─── Direct Card APIs ───

export const sendDirectCard = async (card: {
  recipient_name: string;
  recipient_phone?: string;
  recipient_email?: string;
  message: string;
  emoji: string;
  style: number;
  media_url?: string | null;
  media_type?: string | null;
  sender_phone?: string;
  sender_email?: string;
}): Promise<{
  success: boolean;
  card_id: string;
  view_token: string;
  view_url: string;
  delivery: { whatsapp?: string; email?: string };
}> => {
  const { data, error } = await supabase.functions.invoke("send-direct-card", {
    body: card,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const fetchDirectCard = async (viewToken: string) => {
  const { data, error } = await supabase.functions.invoke("view-direct-card", {
    body: { view_token: viewToken },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.card;
};

export const sendReply = async (viewToken: string, message: string, emoji: string) => {
  const { data, error } = await supabase.functions.invoke("send-reply", {
    body: { view_token: viewToken, message, emoji },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

// ─── Admin APIs ───

export const adminAuth = async (
  password: string,
  action: "get_settings" | "save_settings",
  settings?: Record<string, string>
) => {
  const { data, error } = await supabase.functions.invoke("admin-auth", {
    body: { password, action, settings },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

// ─── Share URLs ───

export const getSectionShareUrl = (slug: string): string => {
  return `${window.location.origin}/s/${slug}`;
};

export const getSectionAdminUrl = (slug: string, adminToken: string): string => {
  return `${window.location.origin}/s/${slug}/admin?token=${adminToken}`;
};

export const getWhatsAppShareUrl = (slug: string, sectionName: string): string => {
  const url = getSectionShareUrl(slug);
  const text = `💌 Send me an anonymous Val Card! Drop yours here: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

export const getEmailShareUrl = (slug: string, sectionName: string): string => {
  const url = getSectionShareUrl(slug);
  const subject = `💌 Send me an anonymous Val Card!`;
  const body = `Hey!\n\nSend me an anonymous appreciation card here:\n${url}\n\nIt's completely anonymous — go for it! 💖\n\n— ${sectionName}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const getDirectCardViewUrl = (viewToken: string): string => {
  return `${window.location.origin}/view/${viewToken}`;
};

export const getDirectCardWhatsAppUrl = (viewToken: string, recipientName: string): string => {
  const url = getDirectCardViewUrl(viewToken);
  const text = `💌 Someone sent you an anonymous Val Card, ${recipientName}! Open it here: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

export const getDirectCardEmailUrl = (
  viewToken: string,
  recipientName: string,
  recipientEmail: string
): string => {
  const url = getDirectCardViewUrl(viewToken);
  const subject = `💌 You received an anonymous Val Card!`;
  const body = `Hey ${recipientName}!\n\nSomeone sent you an anonymous card 💖\n\nOpen it here: ${url}\n\nYou'll never know who sent it 😏`;
  return `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
