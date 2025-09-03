# PWA Configuration for Caption Caching

**Note:** The following configuration should be added to `vite.config.ts` to enable offline caching of caption files:

```typescript
import { VitePWA } from 'vite-plugin-pwa';

// Add to plugins array:
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /\.vtt$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'caption-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
})
```

This configuration:
- Caches all `.vtt` files using StaleWhileRevalidate strategy
- Limits cache to 100 caption files
- Expires cached files after 30 days
- Provides offline access to previously viewed captions

To implement: Add the above configuration to the `plugins` array in `vite.config.ts`.