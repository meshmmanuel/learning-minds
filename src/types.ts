export type ThemeName = 'calm' | 'playful' | 'adventure';

export interface Kid {
  id: string;
  name: string;
  avatarIcon: string;
  avatarColor: string;
}

export interface Subject {
  id: string;
  label: string;
  icon: string;
  image?: string;
}

export interface Topic {
  id: string;
  label: string;
  icon: string;
}
