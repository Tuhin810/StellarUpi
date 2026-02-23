
/**
 * Utility to generate avatar URLs supporting both random seeds and direct image URLs
 */
export const getAvatarUrl = (seed: string, isGroup: boolean = false) => {
  if (!seed) return `https://api.dicebear.com/9.x/${isGroup ? 'shapes' : 'dylan'}/svg?seed=default`;

  if (seed.startsWith('http')) {
    return seed;
  }

  // Quirky Croodles look for users, Shapes for groups
  const style = isGroup ? 'shapes' : 'dylan';
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
};
