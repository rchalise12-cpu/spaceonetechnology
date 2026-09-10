# Media and design provenance

Reference: https://spaceonetechnology.com/ (reviewed September 9, 2026).

The public design carries forward the source site’s people-first photography, paired technology/talent paths, clear service grouping, and collaboration video. It uses its own sage, charcoal, warm white, and rust palette, quieter navigation, an editorial heading scale, and consistent Tailwind tokens. No stock portraits are presented as named Space One employees.

Active original URLs are centralized in `src/lib/public/assets.ts`:

- Collaboration photo: https://spaceonetechnology.com/wp-content/uploads/2025/09/71-home-1-1-1024x645.webp
- Responsive photo: https://spaceonetechnology.com/wp-content/uploads/2025/09/71-home-1-1-600x378.webp
- Collaboration video: https://spaceonetechnology.com/wp-content/uploads/2025/09/71-home-1-video.mp4

The video is user-controlled, muted initially, inline, and `preload="none"`; it is not an autoplay background. The hero image has explicit dimensions, responsive sources, and priority loading. Other photos are lazy-loaded. CSP permits media only from the specified Space One host, alongside the application’s own assets.

The public pages use the original remote URLs as requested; there are no duplicated photography files in the deployment. Font files are served locally through Fontsource. Icons are Lucide SVG components.
