#\!/usr/bin/env node

import { launch } from "puppeteer";
import chalk from "chalk";

const quickTest = async () => {
  console.log(chalk.blue("🧪 Quick app functionality test..."));
  
  const browser = await launch({ 
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  
  const page = await browser.newPage();
  
  let hasErrors = false;
  
  // Listen for console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(chalk.red(`❌ Console Error: ${msg.text()}`));
      hasErrors = true;
    }
  });
  
  // Listen for page errors
  page.on("pageerror", (error) => {
    console.log(chalk.red(`💥 Page Error: ${error.message}`));
    hasErrors = true;
  });
  
  try {
    console.log(chalk.blue("🌐 Loading http://localhost:5173..."));
    await page.goto("http://localhost:5173", { 
      waitUntil: "networkidle0",
      timeout: 15000 
    });
    
    // Wait for React to mount
    await page.waitForTimeout(2000);
    
    // Check if the app loaded without infinite loops
    const hasReactRoot = await page.evaluate(() => {
      return document.querySelector("#root") \!== null;
    });
    
    const hasContent = await page.evaluate(() => {
      const root = document.querySelector("#root");
      return root && root.children.length > 0;
    });
    
    const title = await page.title();
    
    console.log(chalk.green(`✅ React root found: ${hasReactRoot}`));
    console.log(chalk.green(`✅ Content rendered: ${hasContent}`));
    console.log(chalk.green(`📄 Page title: ${title}`));
    
    if (\!hasErrors && hasContent) {
      console.log(chalk.green("🎉 SUCCESS: App loaded without infinite loops\!"));
      
      // Test the main functionality - check if URL input exists
      const hasUrlInput = await page.evaluate(() => {
        return document.querySelector("input[placeholder*=\"github\"], input[placeholder*=\"repo\"]") \!== null;
      });
      
      console.log(chalk.green(`✅ URL input found: ${hasUrlInput}`));
      
      if (hasUrlInput) {
        console.log(chalk.green("🚀 App is fully functional\!"));
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.log(chalk.red(`💥 Test Error: ${error.message}`));
    return false;
  } finally {
    await browser.close();
  }
};

const success = await quickTest();
process.exit(success ? 0 : 1);
