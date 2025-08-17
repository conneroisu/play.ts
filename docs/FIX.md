
Inside of ./astro.config.mjs, we configure the base URL and path prefix for the site: (
  site: 'https://conneroisu.github.io',
  base: 'play.ts',
)

When this value is configured, all of your internal page links must be prefixed with your base value:

<a href="/my-repo/about">About</a>

Fix all internal links to use the correct path prefix.

