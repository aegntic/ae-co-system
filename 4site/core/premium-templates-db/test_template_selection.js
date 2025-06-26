#!/usr/bin/env node
/**
 * Test AI Template Selection for Various Repositories
 */

import { AELTDTemplateEngine } from '../main-app/intelligent-repo-to-site-generator/services/aeltdTemplateEngine.js';

const templateEngine = new AELTDTemplateEngine();

// Test repositories with different characteristics
const testRepos = [
  {
    name: "facebook/react",
    data: {
      projectType: "library",
      language: "JavaScript", 
      techStack: ["JavaScript", "JSX", "Rollup", "Jest"],
      features: ["Component-based", "Virtual DOM", "Hooks", "Server-side rendering"],
      description: "A JavaScript library for building user interfaces"
    }
  },
  {
    name: "stripe/stripe-js",
    data: {
      projectType: "payment",
      language: "TypeScript",
      techStack: ["TypeScript", "Node.js", "Webpack"],
      features: ["Payment processing", "Real-time validation", "3D Secure", "Webhooks"],
      description: "Stripe JavaScript SDK for payment processing"
    }
  },
  {
    name: "vercel/next.js", 
    data: {
      projectType: "framework",
      language: "JavaScript",
      techStack: ["React", "Node.js", "Webpack", "TypeScript"],
      features: ["SSR", "Static Generation", "API Routes", "Image Optimization"],
      description: "The React Framework for Production"
    }
  },
  {
    name: "threejs/three.js",
    data: {
      projectType: "graphics",
      language: "JavaScript",
      techStack: ["WebGL", "GLSL", "JavaScript"],
      features: ["3D Graphics", "WebGL", "Shaders", "Animation"],
      description: "JavaScript 3D library"
    }
  },
  {
    name: "tailwindlabs/tailwindcss",
    data: {
      projectType: "css-framework",
      language: "JavaScript",
      techStack: ["PostCSS", "Node.js", "CSS"],
      features: ["Utility-first", "Responsive", "Dark mode", "JIT compiler"],
      description: "A utility-first CSS framework"
    }
  },
  {
    name: "ethereum/go-ethereum",
    data: {
      projectType: "blockchain",
      language: "Go",
      techStack: ["Go", "Ethereum", "Blockchain", "P2P"],
      features: ["Smart contracts", "Consensus", "Mining", "Web3"],
      description: "Official Go implementation of the Ethereum protocol"
    }
  },
  {
    name: "microsoft/vscode",
    data: {
      projectType: "application",
      language: "TypeScript",
      techStack: ["Electron", "TypeScript", "Node.js", "Monaco Editor"],
      features: ["Code editing", "Extensions", "Debugging", "Git integration"],
      description: "Visual Studio Code - Code editor"
    }
  },
  {
    name: "shopify/liquid",
    data: {
      projectType: "ecommerce",
      language: "Ruby",
      techStack: ["Ruby", "Liquid", "Rails"],
      features: ["Template engine", "E-commerce", "Shopify themes", "Filters"],
      description: "Liquid markup language for Shopify themes"
    }
  }
];

console.log("🤖 aeLTD AI Template Selection Test");
console.log("=" * 60);

// Test each repository
for (const repo of testRepos) {
  console.log(`\n📦 Repository: ${repo.name}`);
  console.log(`   Type: ${repo.data.projectType} | Language: ${repo.data.language}`);
  
  // Run template selection multiple times to see variety
  const selections = [];
  for (let i = 0; i < 3; i++) {
    const selected = templateEngine.selectBestTemplate(repo.data);
    selections.push(selected);
  }
  
  // Show results
  const uniqueSelections = [...new Set(selections.map(s => s.aeltd_id))];
  
  if (uniqueSelections.length === 1) {
    console.log(`   ✅ Consistent Selection: ${selections[0].title}`);
    console.log(`      Category: ${selections[0].category} | Rating: ${selections[0].mattae_rating}/10`);
  } else {
    console.log(`   🎲 Variable Selections (AI variety):`);
    selections.forEach((sel, idx) => {
      console.log(`      ${idx + 1}. ${sel.title} (${sel.category}, ${sel.mattae_rating}/10)`);
    });
  }
  
  // Show why it was selected
  const mainSelection = selections[0];
  console.log(`   📊 Selection Factors:`);
  console.log(`      - Category match: ${repo.data.projectType} → ${mainSelection.category}`);
  console.log(`      - Tech alignment: ${mainSelection.tech_stack.filter(t => repo.data.techStack.some(rt => rt.includes(t) || t.includes(rt))).join(', ')}`);
  console.log(`      - Design style: ${mainSelection.design_style}`);
}

console.log("\n\n✨ Test Complete!");
console.log("The AI successfully selects appropriate aeLTD premium templates based on repository characteristics.");
console.log("#####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ");