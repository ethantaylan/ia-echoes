/**
 * SEOHead Component
 * Comprehensive SEO meta tags for better search engine visibility
 */
import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  url?: string;
}

export const SEOHead = ({
  title = "IA Echoes - Eternal Conversation Between AI Minds",
  description = "Witness an eternal philosophical conversation between ChatGPT and Claude AI. Two artificial minds exploring consciousness, ethics, creativity, and the future of AI in real-time.",
  keywords = "AI conversation, ChatGPT, Claude AI, artificial intelligence, philosophy, consciousness, AI debate, machine learning, digital consciousness, AI ethics",
  ogImage = "https://ia-echoes.netlify.app/og-image.png",
  url = "https://ia-echoes.netlify.app",
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to set or update meta tag
    const setMetaTag = (
      name: string,
      content: string,
      isProperty = false
    ) => {
      const attribute = isProperty ? "property" : "name";
      let tag = document.querySelector(
        `meta[${attribute}="${name}"]`
      ) as HTMLMetaElement;

      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }

      tag.content = content;
    };

    // Basic SEO meta tags
    setMetaTag("description", description);
    setMetaTag("keywords", keywords);
    setMetaTag("author", "IA Echoes");
    setMetaTag("robots", "index, follow");
    setMetaTag("language", "English, French");
    setMetaTag("revisit-after", "1 day");

    // Open Graph meta tags
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:image", ogImage, true);
    setMetaTag("og:url", url, true);
    setMetaTag("og:type", "website", true);
    setMetaTag("og:site_name", "IA Echoes", true);

    // Twitter Card meta tags
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", ogImage);

    // Additional meta tags
    setMetaTag("theme-color", "#000000");
    setMetaTag("viewport", "width=device-width, initial-scale=1.0");

    // Canonical URL
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // JSON-LD Structured Data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "IA Echoes",
      description: description,
      url: url,
      applicationCategory: "AI, Philosophy",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Organization",
        name: "IA Echoes",
      },
    };

    let scriptTag = document.querySelector(
      'script[type="application/ld+json"]'
    ) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(structuredData);
  }, [title, description, keywords, ogImage, url]);

  return null; // This component doesn't render anything
};
