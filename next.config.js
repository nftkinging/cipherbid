/** @type {import('next').NextConfig} */
const nextConfig = {
  // REQUIRED: the Zama FHE engine runs in a Web Worker that needs SharedArrayBuffer,
  // which only works with these cross-origin isolation headers. Without them,
  // useEncrypt/useUserDecrypt fail silently in the browser.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
