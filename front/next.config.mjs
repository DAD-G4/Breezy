import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build autonome (server.js + deps minimales) pour une image Docker légère.
  output: "standalone",
  // Le repo contient deux lockfiles (backend à la racine + front) : on force la
  // racine du workspace sur le dossier front pour une sortie standalone déterministe.
  turbopack: { root: __dirname },
};

export default nextConfig;
