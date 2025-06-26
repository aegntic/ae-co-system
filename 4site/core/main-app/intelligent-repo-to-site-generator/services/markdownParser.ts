
import { marked } from 'marked';
import { Section } from '../types';

// Configure marked
marked.setOptions({
  renderer: new marked.Renderer(),
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false, // Important: Ensure your content source is trusted or implement server-side sanitization if content is user-generated beyond AI. For AI-generated, this is usually fine.
  smartypants: false,
  xhtml: false
});

export const parseMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  try {
    return marked.parse(markdown) as string;
  } catch (error) {
    console.error("Error parsing Markdown:", error);
    return "<p>Error displaying content.</p>";
  }
};

export const parseMarkdownToSections = (markdown: string): Section[] => {
  if (!markdown) return [];

  const sections: Section[] = [];
  // Split by H2 headings (##) as main section delimiters
  // Regex to split by '## heading' and keep the heading line
  const sectionParts = markdown.split(/\n(?=##\s+)/); 

  let globalOrder = 0;

  // Handle content before the first H2, if any, often the main title or intro.
  const firstPart = sectionParts.shift();
  if (firstPart && firstPart.trim() !== '') {
    // If it starts with an H1, treat it as a title section, or part of overview.
    if (firstPart.trim().startsWith('#\s+')) { // H1 title
      const titleMatch = firstPart.match(/^#\s+(.*)/);
      const title = titleMatch ? titleMatch[1].trim() : 'Project Title';
      // The rest of this part could be an intro under the H1
      const contentAfterTitle = firstPart.substring(firstPart.indexOf('\n') + 1).trim();
       sections.push({
        id: 'title_section', // Special ID for title
        title: title,
        content: parseMarkdownToHtml(contentAfterTitle || title), // Parse the content part
        order: globalOrder++,
      });
    } else { // No H1, treat as an initial unnamed section or overview
       sections.push({
        id: `section-${globalOrder}`,
        title: 'Introduction', // Default title for content before first H2
        content: parseMarkdownToHtml(firstPart.trim()),
        order: globalOrder++,
      });
    }
  }

  sectionParts.forEach((part) => {
    const lines = part.trim().split('\n');
    const headingLine = lines.shift() || ''; // e.g., "## Key Features"
    
    const headingMatch = headingLine.match(/^##\s+(.*)/);
    const title = headingMatch ? headingMatch[1].trim() : `Section ${globalOrder}`;
    const contentMarkdown = lines.join('\n').trim();

    if (contentMarkdown) {
      sections.push({
        id: title.toLowerCase().replace(/\s+/g, '-'), // e.g., 'key-features'
        title: title,
        content: parseMarkdownToHtml(contentMarkdown),
        order: globalOrder++,
      });
    }
  });
  
  // If no sections were parsed (e.g. Markdown without H2s), treat the whole thing as one section
  if (sections.length === 0 && markdown.trim() !== '') {
    // Check if the markdown starts with an H1
    const h1Match = markdown.match(/^#\s+([^\n]+)/);
    if (h1Match) {
      const title = h1Match[1].trim();
      const contentAfterH1 = markdown.substring(markdown.indexOf('\n') + 1).trim();
      sections.push({
        id: 'main-content',
        title: title, 
        content: parseMarkdownToHtml(contentAfterH1),
        order: 0,
      });
    } else {
      sections.push({
        id: 'main-content',
        title: 'Content', // Generic title
        content: parseMarkdownToHtml(markdown),
        order: 0,
      });
    }
  }

  return sections;
};
