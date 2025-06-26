const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Print a colored message
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Execute a command and log the output
function execute(command, workingDir = null) {
  log(`Executing: ${command}`, colors.blue);
  try {
    let options = {};
    if (workingDir) {
      options.cwd = workingDir;
      log(`Working directory: ${workingDir}`, colors.yellow);
    }
    
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`Error executing: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

// Main build process
async function build() {
  log('Starting Aegntic Desktop build process...', colors.green);
  
  // Build the React app
  log('Building React app...', colors.green);
  const reactBuildSuccess = execute('npm run build', path.join(__dirname, 'client'));
  
  if (!reactBuildSuccess) {
    log('Failed to build React app. Aborting.', colors.red);
    process.exit(1);
  }
  
  // Install Electron builder and related packages if needed
  log('Checking for Electron builder...', colors.green);
  if (!fs.existsSync(path.join(__dirname, 'node_modules', 'electron-builder'))) {
    log('Installing Electron builder...', colors.yellow);
    execute('npm install electron-builder --save-dev');
  }
  
  // Build the Electron app
  log('Building Electron app...', colors.green);
  const electronBuildSuccess = execute('electron-builder build --dir');
  
  if (!electronBuildSuccess) {
    log('Failed to build Electron app. Aborting.', colors.red);
    process.exit(1);
  }
  
  log('Build process completed successfully!', colors.green);
  log('You can find the distributable in the dist/ directory.', colors.green);
}

// Run the build process
build().catch(error => {
  log(`Build failed: ${error.message}`, colors.red);
  process.exit(1);
});
