/** Platforms the daily pipeline visits. Log in once through the CHROME tab —
 * the dedicated ~/.masa-chrome profile keeps the session, same as any
 * browser. Edit urls here if a program moves; nothing else needs to change. */

export type PlatformFeed = { id: string; name: string; url: string; category: 'social' | 'bounty' };

export const PLATFORM_FEEDS: PlatformFeed[] = [
  { id: 'x', name: 'X / Twitter', url: 'https://twitter.com/home', category: 'social' },
  { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com/', category: 'social' },
  { id: 'discord', name: 'Discord', url: 'https://discord.com/app', category: 'social' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/feed/subscriptions', category: 'social' },
  { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/', category: 'social' },
  { id: 'telegram', name: 'Telegram Web', url: 'https://web.telegram.org/a/', category: 'social' },
  { id: 'hackerone', name: 'HackerOne', url: 'https://hackerone.com/hacktivity', category: 'bounty' },
  { id: 'bugcrowd', name: 'Bugcrowd', url: 'https://bugcrowd.com/programs', category: 'bounty' },
  { id: 'intigriti', name: 'Intigriti', url: 'https://app.intigriti.com/researcher', category: 'bounty' },
  { id: 'yeswehack', name: 'YesWeHack', url: 'https://yeswehack.com/programs', category: 'bounty' },
  { id: 'wordpress', name: 'WordPress (Patchstack)', url: 'https://patchstack.com/database/wordpress', category: 'bounty' },
  { id: 'meta', name: 'Meta Bug Bounty', url: 'https://bugbounty.meta.com/', category: 'bounty' },
  { id: 'immunefi', name: 'Immunefi', url: 'https://immunefi.com/dashboard/', category: 'bounty' },
  { id: 'apple', name: 'Apple Security', url: 'https://security.apple.com/', category: 'bounty' },
  { id: 'msrc', name: 'Microsoft MSRC', url: 'https://msrc.microsoft.com/', category: 'bounty' },
];
