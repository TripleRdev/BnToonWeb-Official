import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  canonical?: string;
}

const DEFAULT_TITLE = "BnToon - Read Comics Online";
const DEFAULT_DESCRIPTION = "Your favorite comics in one place. Read manga and comics with a clean, distraction-free reading experience.";
const DEFAULT_IMAGE = "/og-image.png";
const SITE_NAME = "BnToon";

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  canonical,
}: SEOProps) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : DEFAULT_TITLE;
  const fullImage = image.startsWith("http") ? image : `${window.location.origin}${image}`;
  const canonicalUrl = canonical || window.location.href;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const updateMeta = (property: string, content: string, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement("meta");
        if (isName) {
          element.name = property;
        } else {
          element.setAttribute("property", property);
        }
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Update description
    updateMeta("description", description, true);
    
    // Update Open Graph tags
    updateMeta("og:title", fullTitle);
    updateMeta("og:description", description);
    updateMeta("og:image", fullImage);
    updateMeta("og:type", type);
    updateMeta("og:url", canonicalUrl);
    updateMeta("og:site_name", SITE_NAME);

    // Update Twitter tags
    updateMeta("twitter:card", "summary_large_image", true);
    updateMeta("twitter:title", fullTitle, true);
    updateMeta("twitter:description", description, true);
    updateMeta("twitter:image", fullImage, true);

    // Handle robots meta
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement("meta");
        robotsMeta.name = "robots";
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = "noindex, nofollow";
    } else if (robotsMeta) {
      robotsMeta.content = "index, follow";
    }

    // Handle canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Cleanup function to reset to defaults when unmounting
    return () => {
      // Only reset if the component is actually unmounting and not just updating
    };
  }, [fullTitle, description, fullImage, type, canonicalUrl, noindex]);

  return null;
}

// Helper function to truncate text for meta descriptions
export function truncateDescription(text: string, maxLength = 155): string {
  if (!text) return DEFAULT_DESCRIPTION;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + "...";
}

// Helper to generate series description
export function generateSeriesDescription(
  title: string,
  status?: string,
  chaptersCount?: number,
  description?: string
): string {
  const parts: string[] = [];
  
  if (status) {
    parts.push(`Read ${title} (${status})`);
  } else {
    parts.push(`Read ${title}`);
  }
  
  if (chaptersCount) {
    parts.push(`${chaptersCount} chapters available`);
  }
  
  if (description) {
    const truncated = truncateDescription(description, 100);
    parts.push(truncated);
  }
  
  return parts.join(". ") + " - BnToon";
}

// Helper to generate chapter description
export function generateChapterDescription(
  seriesTitle: string,
  chapterNumber: number,
  chapterTitle?: string
): string {
  let text = `Read ${seriesTitle} Chapter ${chapterNumber}`;
  if (chapterTitle) {
    text += ` - ${chapterTitle}`;
  }
  text += " online for free. High quality images with fast loading.";
  return truncateDescription(text);
}
