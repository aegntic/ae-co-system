
// Constants relevant to the Site Generation Engine

export const DEFAULT_PROJECT_TITLE = "My Awesome Project";
export const DEFAULT_PROJECT_DESCRIPTION = "A brief description of this amazing project.";

export const MADE_WITH_PROJECT4SITE_TEXT = "Made with Project4Site Platform";
export const PROJECT4SITE_URL = "https://project4.site"; // Conceptual new URL

export const SOCIAL_SHARE_PLATFORMS = [
  { name: "Twitter", icon: "Twitter", urlPrefix: "https://twitter.com/intent/tweet?url=" },
  { name: "LinkedIn", icon: "Linkedin", urlPrefix: "https://www.linkedin.com/shareArticle?mini=true&url=" },
  { name: "Facebook", icon: "Facebook", urlPrefix: "https://www.facebook.com/sharer/sharer.php?u=" },
  { name: "Copy Link", icon: "Link", urlPrefix: "" } // Special case for copy
];

export const GITHUB_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)(?:\/)?$/i;

// Gemini related constants for any direct calls from Next.js backend (if any)
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const GEMINI_API_TIMEOUT_MS = 30000; // 30 seconds
