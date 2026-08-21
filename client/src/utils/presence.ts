import { UserInfo } from '../types';

const ADJECTIVES = [
  'Swift', 'Cosmic', 'Quantum', 'Hyper', 'Nova', 'Cyber', 'Atomic',
  'Solar', 'Lunar', 'Vivid', 'Pixel', 'Sonic', 'Astral', 'Zenith'
];

const ANIMALS = [
  'Fox', 'Hawk', 'Falcon', 'Panther', 'Otter', 'Lynx', 'Phoenix',
  'Badger', 'Wolf', 'Dragon', 'Tiger', 'Panda', 'Dolphin', 'Eagle'
];

const CURSOR_COLORS = [
  '#f43f5e', // rose-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#84cc16', // lime-500
];

export function getOrCreateLocalUser(): UserInfo {
  const stored = localStorage.getItem('collab_user_profile');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Ignore parsing error and generate fresh profile
    }
  }

  const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const randomColor = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
  const randomId = Math.random().toString(36).substring(2, 9);

  const newUser: UserInfo = {
    id: randomId,
    name: `${randomAdj} ${randomAnimal}`,
    color: randomColor,
  };

  localStorage.setItem('collab_user_profile', JSON.stringify(newUser));
  return newUser;
}
