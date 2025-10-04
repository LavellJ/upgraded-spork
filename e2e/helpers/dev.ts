import { type Page } from '@playwright/test';

/**
 * Sets UI preferences in localStorage and reduces motion for stable testing
 */
export async function setUiPrefs(
  page: Page,
  options: {
    theme?: 'light' | 'dark';
    density?: 'comfy' | 'compact';
  } = {}
) {
  const { theme = 'light', density = 'comfy' } = options;

  await page.addInitScript(
    ({ theme, density }) => {
      // Set theme preference
      localStorage.setItem('theme', theme);
      
      // Set density preference
      localStorage.setItem('density', density);
      
      // Reduce motion for stable testing
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    },
    { theme, density }
  );
}

/**
 * Seeds localStorage with a fake auth token and user object for dev testing
 */
export async function devLogin(
  page: Page,
  user?: {
    id?: number;
    username?: string;
    email?: string;
    role?: 'student' | 'teacher';
  }
) {
  const defaultUser = {
    id: 1,
    username: 'test-user',
    email: 'test@example.com',
    role: 'teacher',
    ...user,
  };

  await page.addInitScript(
    ({ user }) => {
      // Set fake JWT token
      localStorage.setItem('auth_token', 'fake-jwt-token-for-testing');
      
      // Set user object
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set authenticated flag
      localStorage.setItem('isAuthenticated', 'true');
    },
    { user: defaultUser }
  );
}
