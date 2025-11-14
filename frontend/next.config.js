/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export para S3
  output: 'export',
  
  // Deshabilitar optimización de imágenes para static export
  images: {
    unoptimized: true,
  },
  
  // Trailing slash para mejor compatibilidad con S3
  trailingSlash: true,
  
  // Variables de entorno
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://fqttaemgp7.execute-api.us-east-1.amazonaws.com/prod',
  },
};

module.exports = nextConfig;
