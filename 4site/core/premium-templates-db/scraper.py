#!/usr/bin/env python3
"""
Premium Templates Scraper using crawl4ai and aegnt27
Curated by Mattae Cooper - only the best make the cut
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any
import os

# Import crawl4ai for advanced scraping
from crawl4ai import AsyncWebCrawler
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, LLMExtractionStrategy

# Template quality standards - Mattae's criteria
QUALITY_STANDARDS = {
    "min_price": 15,  # No cheap templates
    "required_features": [
        "responsive", "modern", "performance", "seo"
    ],
    "preferred_tech": [
        "gsap", "framer-motion", "three.js", "webgl", 
        "tailwind", "css-grid", "custom-properties"
    ],
    "design_trends": [
        "glassmorphism", "neumorphism", "brutalism", 
        "minimalism", "dark-mode", "3d-elements"
    ]
}

class PremiumTemplateScraper:
    def __init__(self):
        self.templates_db = []
        self.crawler = AsyncWebCrawler()
        
    async def scrape_themeforest(self):
        """Scrape ThemeForest's best HTML templates"""
        print("🔍 Scraping ThemeForest premium templates...")
        
        extraction_strategy = JsonCssExtractionStrategy(
            schema={
                "name": "template",
                "baseSelector": ".shared-item__header",
                "fields": [
                    {"name": "title", "selector": "h3", "type": "text"},
                    {"name": "author", "selector": ".shared-item__author", "type": "text"},
                    {"name": "price", "selector": ".shared-item__price", "type": "text"},
                    {"name": "sales", "selector": ".shared-item__stats-sales", "type": "text"},
                    {"name": "preview_url", "selector": "a.shared-item__preview", "type": "attribute", "attribute": "href"},
                    {"name": "thumbnail", "selector": "img.shared-item__image", "type": "attribute", "attribute": "src"}
                ]
            }
        )
        
        urls = [
            "https://themeforest.net/category/site-templates?sort=sales",
            "https://themeforest.net/category/site-templates/creative?sort=sales",
            "https://themeforest.net/category/site-templates/corporate?sort=sales"
        ]
        
        for url in urls:
            result = await self.crawler.arun(
                url=url,
                extraction_strategy=extraction_strategy,
                bypass_cache=True
            )
            
            if result.success:
                templates = json.loads(result.extracted_content)
                for template in templates:
                    if self._meets_quality_standards(template):
                        self.templates_db.append({
                            **template,
                            "source": "ThemeForest",
                            "category": self._extract_category(url),
                            "scraped_at": datetime.now().isoformat()
                        })
    
    async def scrape_creative_market(self):
        """Scrape Creative Market premium templates"""
        print("🔍 Scraping Creative Market premium templates...")
        
        # Using LLM extraction for more intelligent parsing
        extraction_strategy = LLMExtractionStrategy(
            provider="openai",
            api_token=os.getenv("OPENAI_API_KEY"),
            schema={
                "type": "object",
                "properties": {
                    "templates": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "author": {"type": "string"},
                                "price": {"type": "number"},
                                "features": {"type": "array", "items": {"type": "string"}},
                                "preview_url": {"type": "string"},
                                "thumbnail": {"type": "string"}
                            }
                        }
                    }
                }
            },
            extraction_type="schema",
            instruction="Extract premium website templates with their details. Focus on high-quality, modern templates only."
        )
        
        result = await self.crawler.arun(
            url="https://creativemarket.com/templates/websites",
            extraction_strategy=extraction_strategy,
            bypass_cache=True
        )
        
        if result.success:
            data = json.loads(result.extracted_content)
            for template in data.get("templates", []):
                if self._meets_quality_standards(template):
                    self.templates_db.append({
                        **template,
                        "source": "Creative Market",
                        "scraped_at": datetime.now().isoformat()
                    })
    
    async def scrape_ui8(self):
        """Scrape UI8 premium design templates"""
        print("🔍 Scraping UI8 premium templates...")
        
        extraction_strategy = JsonCssExtractionStrategy(
            schema={
                "name": "template",
                "baseSelector": ".product-card",
                "fields": [
                    {"name": "title", "selector": ".product-card__title", "type": "text"},
                    {"name": "author", "selector": ".product-card__author", "type": "text"},
                    {"name": "price", "selector": ".product-card__price", "type": "text"},
                    {"name": "category", "selector": ".product-card__category", "type": "text"},
                    {"name": "preview_url", "selector": "a", "type": "attribute", "attribute": "href"},
                    {"name": "thumbnail", "selector": "img", "type": "attribute", "attribute": "src"}
                ]
            }
        )
        
        result = await self.crawler.arun(
            url="https://ui8.net/category/web-templates",
            extraction_strategy=extraction_strategy,
            bypass_cache=True,
            screenshot=True  # Capture screenshots for preview
        )
        
        if result.success:
            templates = json.loads(result.extracted_content)
            for template in templates:
                if self._meets_quality_standards(template):
                    self.templates_db.append({
                        **template,
                        "source": "UI8",
                        "premium_tier": "ultra",  # UI8 is ultra premium
                        "scraped_at": datetime.now().isoformat()
                    })
    
    def _meets_quality_standards(self, template: Dict[str, Any]) -> bool:
        """Mattae's quality filter - only the best pass"""
        # Price check
        try:
            price = float(str(template.get("price", "0")).replace("$", "").replace(",", ""))
            if price < QUALITY_STANDARDS["min_price"]:
                return False
        except:
            return False
        
        # Title/description quality check
        title = template.get("title", "").lower()
        
        # Look for quality indicators
        quality_keywords = ["premium", "pro", "modern", "responsive", "creative", "professional"]
        if not any(keyword in title for keyword in quality_keywords):
            return False
        
        # Exclude outdated templates
        exclude_keywords = ["bootstrap 3", "jquery", "legacy", "deprecated"]
        if any(keyword in title for keyword in exclude_keywords):
            return False
        
        return True
    
    def _extract_category(self, url: str) -> str:
        """Extract category from URL"""
        if "creative" in url:
            return "Creative"
        elif "corporate" in url:
            return "Corporate"
        elif "portfolio" in url:
            return "Portfolio"
        elif "ecommerce" in url:
            return "E-commerce"
        else:
            return "General"
    
    async def scrape_all(self):
        """Scrape all premium template sources"""
        await self.scrape_themeforest()
        await self.scrape_creative_market()
        await self.scrape_ui8()
        
        # Save to database
        with open("premium_templates_db.json", "w") as f:
            json.dump({
                "curator": "Mattae Cooper",
                "standards": QUALITY_STANDARDS,
                "last_updated": datetime.now().isoformat(),
                "total_templates": len(self.templates_db),
                "templates": self.templates_db
            }, f, indent=2)
        
        print(f"✅ Scraped {len(self.templates_db)} premium templates meeting quality standards")
        print(f"📁 Database saved to premium_templates_db.json")
        
        # Generate summary report
        self._generate_report()
    
    def _generate_report(self):
        """Generate curation report"""
        report = {
            "total": len(self.templates_db),
            "by_source": {},
            "by_category": {},
            "price_range": {
                "$15-30": 0,
                "$31-60": 0,
                "$61-100": 0,
                "$100+": 0
            }
        }
        
        for template in self.templates_db:
            # By source
            source = template.get("source", "Unknown")
            report["by_source"][source] = report["by_source"].get(source, 0) + 1
            
            # By category
            category = template.get("category", "General")
            report["by_category"][category] = report["by_category"].get(category, 0) + 1
            
            # By price
            try:
                price = float(str(template.get("price", "0")).replace("$", "").replace(",", ""))
                if price <= 30:
                    report["price_range"]["$15-30"] += 1
                elif price <= 60:
                    report["price_range"]["$31-60"] += 1
                elif price <= 100:
                    report["price_range"]["$61-100"] += 1
                else:
                    report["price_range"]["$100+"] += 1
            except:
                pass
        
        print("\n📊 Curation Report:")
        print(f"Total Premium Templates: {report['total']}")
        print("\nBy Source:")
        for source, count in report["by_source"].items():
            print(f"  {source}: {count}")
        print("\nBy Category:")
        for category, count in report["by_category"].items():
            print(f"  {category}: {count}")
        print("\nPrice Distribution:")
        for range_name, count in report["price_range"].items():
            print(f"  {range_name}: {count}")

async def main():
    """Run the premium template scraper"""
    print("🚀 Starting Premium Template Scraper")
    print("📋 Quality Standards: Only templates meeting Mattae's criteria")
    print("=" * 50)
    
    scraper = PremiumTemplateScraper()
    await scraper.scrape_all()
    
    print("\n✨ Scraping complete! Database ready for 4site.pro premium tier")
    print("#####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ")

if __name__ == "__main__":
    asyncio.run(main())