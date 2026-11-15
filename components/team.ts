// login is the GitHub account; members without one are shown by name only.
export type TeamMember = { login?: string; name: string; role?: string };

export const TEAM: readonly TeamMember[] = [
  { login: "UMCEKO", name: "Umut" },
  { login: "Xmilon", name: "Xmilon" },
  { login: "arismoko", name: "Ari" },
  { login: "reservedbytes", name: "Isloka" },
];

// The people who make this site, shown apart from the game's contributors.
export const SITE_MAKERS = ["Xmilon", "UMCEKO"] as const;
export const SITE_REPO = "sunrise-org/horizon-site";

export const profileUrl = (login: string) => `https://github.com/${login}`;
export const avatarUrl = (login: string) => `https://avatars.githubusercontent.com/${login}?size=128`;
export const memberOf = (login: string) => TEAM.find((m) => m.login?.toLowerCase() === login.toLowerCase());
