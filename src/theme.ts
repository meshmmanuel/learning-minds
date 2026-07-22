import type { ThemeName } from './types';

export interface ThemePalette {
  name: ThemeName;
  label: string;
  swatch: string;
  pageBg: string;
  cardBg: string;
  accent: string;
  accentText: string;
  textDark: string;
  textMuted: string;
  chipBg: string;
  tileColors: string[];
  kidColors: string[];
  headerBg: string;
  headerText: string;
  starColor: string;
  dashed: string;
}

export const themes: Record<ThemeName, ThemePalette> = {
  calm: {
    name: 'calm',
    label: 'Calm & Gentle',
    swatch: '#8FAE8B',
    pageBg: '#F3EFE4',
    cardBg: '#FAF6EF',
    accent: '#8FAE8B',
    accentText: '#5B7A57',
    textDark: '#4A4741',
    textMuted: '#8F887A',
    chipBg: '#EFEAD9',
    tileColors: ['#C9DFC6', '#AFD3E0', '#F0C9B8', '#D9CDE9', '#EAB6AE', '#E7D3A0', '#B9D8D0'],
    kidColors: ['#8FAE8B', '#8FC1DB', '#E3A98C'],
    headerBg: '#FAF6EF',
    headerText: '#5B7A57',
    starColor: '#E3B23C',
    dashed: '#C7BFA9',
  },
  playful: {
    name: 'playful',
    label: 'High-Energy Playful',
    swatch: '#FF6F61',
    pageBg: '#EDEAE2',
    cardBg: '#FFF4D6',
    accent: '#FF6F61',
    accentText: '#FF6F61',
    textDark: '#5B4A1E',
    textMuted: '#A8862E',
    chipBg: '#FFFFFF',
    tileColors: ['#FF8A80', '#2EC4B6', '#8E7CFF', '#FF6FA5', '#3DDC97', '#4CC3FF', '#FFA630'],
    kidColors: ['#FF6F61', '#2EC4B6', '#8E7CFF'],
    headerBg: '#FF6F61',
    headerText: '#FFFFFF',
    starColor: '#FFD166',
    dashed: '#FFB84D',
  },
  adventure: {
    name: 'adventure',
    label: 'Adventure / Quest',
    swatch: '#E8B33D',
    pageBg: '#0D2C28',
    cardBg: '#123B36',
    accent: '#E8B33D',
    accentText: '#F4EBD0',
    textDark: '#F4EBD0',
    textMuted: '#7FA89C',
    chipBg: '#0D2C28',
    tileColors: ['#E8B33D', '#4FA3A8', '#C2694A', '#8FB33D', '#D97AA0', '#5C8FE8', '#E88F3D'],
    kidColors: ['#E8B33D', '#4FA3A8', '#C2694A'],
    headerBg: '#123B36',
    headerText: '#F4EBD0',
    starColor: '#E8B33D',
    dashed: '#4C7A6E',
  },
};
