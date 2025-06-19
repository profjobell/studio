
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/project-images-public/**', // Allows images from this specific path
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This configuration is for Webpack builds (when --turbopack is NOT used)
    config.module.rules.push({
      test: /\.(hbs|handlebars)$/,
      loader: 'handlebars-loader',
    });

    // Provide fallbacks for Node.js core modules that might be
    // incorrectly pulled into client-side bundles by dependencies.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback, 
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
  // Add Turbopack specific configuration here as per Next.js docs
  // This section will be used when running with --turbopack
  turbo: {
    loaders: {
      // Configure handlebars-loader for .hbs and .handlebars files
      '**/*.hbs': ['handlebars-loader'],
      '**/*.handlebars': ['handlebars-loader'],
    },
    // Note: For Node.js core module shimming (like fs, path, os),
    // Turbopack often doesn't require explicit `resolve.fallback: false` as Webpack does.
    // Turbopack aims to handle these more effectively by default.
    // If specific errors about these modules arise with Turbopack,
    // consult Turbopack documentation for alternatives like `resolveAlias`.
  },
};

export default nextConfig;
