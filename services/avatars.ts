
/**
 * Utility to generate avatar URLs supporting both random seeds and direct image URLs
 */
export const getAvatarUrl = (seed: string, isGroup: boolean = false) => {
  if (!seed) return `https://api.dicebear.com/7.x/${isGroup ? 'shapes' : 'lorelei'}/svg?seed=default`;
  
  if (seed.startsWith('http')) {
    return seed;
  }
  
  // New premium look: Lorelei for users, Shapes for groups
  const style = isGroup ? 'shapes' : 'lorelei';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
};
