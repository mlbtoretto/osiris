export type MasaSocialLink = {
  id: string;
  name: string;
  login: string;
  landing: string;
  developer: string;
};

export const MASA_SOCIAL_LINKS: MasaSocialLink[] = [
  { id: 'x', name: 'X', login: 'https://x.com/i/flow/login', landing: 'https://about.x.com/', developer: 'https://developer.x.com/en/docs' },
  { id: 'facebook', name: 'Facebook', login: 'https://www.facebook.com/login/', landing: 'https://www.facebook.com/business/tools', developer: 'https://developers.facebook.com/docs/' },
  { id: 'instagram', name: 'Instagram', login: 'https://www.instagram.com/accounts/login/', landing: 'https://business.instagram.com/', developer: 'https://developers.facebook.com/docs/instagram' },
  { id: 'snapchat', name: 'Snapchat', login: 'https://accounts.snapchat.com/accounts/login', landing: 'https://forbusiness.snapchat.com/', developer: 'https://developers.snap.com/' },
  { id: 'youtube', name: 'YouTube', login: 'https://accounts.google.com/ServiceLogin?service=youtube', landing: 'https://www.youtube.com/', developer: 'https://developers.google.com/youtube/v3' },
  { id: 'telegram', name: 'Telegram', login: 'https://web.telegram.org/', landing: 'https://telegram.org/', developer: 'https://core.telegram.org/' },
  { id: 'discord', name: 'Discord', login: 'https://discord.com/login', landing: 'https://discord.com/developers/applications', developer: 'https://discord.com/developers/docs/intro' },
  { id: 'google-chat', name: 'Google Chat', login: 'https://chat.google.com/', landing: 'https://workspace.google.com/products/chat/', developer: 'https://developers.google.com/workspace/chat' },
  { id: 'whatsapp', name: 'WhatsApp Business', login: 'https://business.facebook.com/', landing: 'https://business.whatsapp.com/', developer: 'https://developers.facebook.com/docs/whatsapp' },
  { id: 'linkedin', name: 'LinkedIn', login: 'https://www.linkedin.com/login', landing: 'https://business.linkedin.com/', developer: 'https://learn.microsoft.com/linkedin/' },
  { id: 'reddit', name: 'Reddit', login: 'https://www.reddit.com/login/', landing: 'https://www.reddit.com/', developer: 'https://www.reddit.com/dev/api/' },
  { id: 'slack', name: 'Slack', login: 'https://app.slack.com/signin', landing: 'https://api.slack.com/', developer: 'https://api.slack.com/authentication' },
];
