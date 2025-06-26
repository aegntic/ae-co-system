# aegntic.ecosystem Global Configuration

This directory contains global configuration and attribution standards for all projects within the aegntic.ecosystem.

## Overview

**aegntic.ecosystem [ae.ltd]** is a collaborative AI and automation platform created through the partnership of:
- **Mattae Cooper** (`human@mattaecooper.org`) - `mattaecooper.org`
- **aegntic.ai** (`contact@aegntic.ai`) - AI platform and services
- **Claude** (Anthropic) - AI development assistant

## Global Attribution Setup

To enable consistent attribution across all aegntic projects:

```bash
# Run the global setup script
./setup-global-attribution.sh
```

This configures:
- Global git user and email settings
- Automatic commit message attribution
- Standard gitignore patterns
- Project attribution templates

## Attribution Standards

All commits in aegntic projects should include:

```
Co-Authored-By: Mattae Cooper <human@mattaecooper.org>
Co-Authored-By: aegntic.ai <contact@aegntic.ai>

s/o cld4@thop

#####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ
```

## Project Structure

```
.aegntic/
├── global-attribution.json    # Master attribution configuration
├── git-hooks/                 # Global git hooks
│   └── prepare-commit-msg     # Auto-attribution hook
├── setup-global-attribution.sh # Setup script
└── README.md                  # This file
```

## Current Projects

- **4site.pro** - AI-powered GitHub to website generator
- **aegntic-MCP** - Dynamic MCP server management system  
- **quick-data-mcp** - Analytics and data processing server

## Usage

For new projects:
1. Clone within the `ae-co-system` directory
2. Run `../.aegntic/setup-global-attribution.sh`
3. All commits will automatically include proper attribution

For existing projects:
1. Copy `.aegntic/git-hooks/prepare-commit-msg` to `.git/hooks/`
2. Make executable: `chmod +x .git/hooks/prepare-commit-msg`

## Contact

- **Primary**: Mattae Cooper `<human@mattaecooper.org>`
- **Organization**: aegntic.ai `<contact@aegntic.ai>`
- **Website**: https://mattaecooper.org | https://aegntic.ai

---

#####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ