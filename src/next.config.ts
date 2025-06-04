
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      // Allow requests from the Firebase Studio / Cloud Workstations preview origin
      'https://6000-firebase-studio-1749050148103.cluster-4xpux6pqdzhrktbhjf2cumyqtg.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
