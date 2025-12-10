/** @type {import('next').NextConfig} */
const nextConfig = {
    // Force restart timestamp: 2025-12-08
    // Enable React strict mode for better debugging
    reactStrictMode: true,

    // Image optimization for vehicle images
    images: {
        domains: ['vpic.nhtsa.dot.gov'],
        unoptimized: false,
    },

    // Headers for security
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
