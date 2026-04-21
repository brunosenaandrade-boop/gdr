import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/afiliado", "/api"],
      },
    ],
    sitemap: "https://www.guardadinheiro.com.br/sitemap.xml",
  };
}
