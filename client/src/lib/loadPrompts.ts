export interface PromptFile {
  path: string;
  name: string;
  text: string;
}

export function loadPrompts(): PromptFile[] {
  try {
    // Use Vite's glob import with proper typing
    const modules = (import.meta as any).glob('/prompts/**/*.{md,txt}', { as: 'raw', eager: true });
    
    return Object.entries(modules).map(([path, text]) => {
      const name = path.split('/').pop() || path;
      return {
        path,
        name,
        text: text as string,
      };
    });
  } catch (error) {
    console.error('Failed to load prompts:', error);
    return [];
  }
}