import type { MetadataRoute } from "next";

const BASE = "https://www.guardadinheiro.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/planos`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/como-funciona`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/login`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/register`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/esqueci-senha`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/termos`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacidade`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
