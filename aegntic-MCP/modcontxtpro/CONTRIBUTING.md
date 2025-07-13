# Contributing to ModContxtPro - Aegntic MCP Standard

First off, thank you for considering contributing to ModContxtPro! It's people like you that make this framework a great tool for the community.

## Code of Conduct

By participating in this project, you are expected to uphold our values of respect, collaboration, and innovation.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Include your environment details** (Node version, OS, etc.)
- **Explain what you expected to happen**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/aegntic-MCP.git
cd aegntic-MCP/modcontxtpro

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Working on the CLI

```bash
cd packages/create-mcp
npm install
npm run build

# Test the CLI locally
node dist/cli.js test-server
```

## Project Structure

```
modcontxtpro/
├── src/                 # Framework source code
│   ├── auth/           # Authentication providers
│   ├── core/           # Core functionality
│   └── utils/          # Utilities
├── examples/           # Example implementations
├── docs/              # Documentation
├── packages/          # Sub-packages
│   └── create-mcp/    # CLI tool
└── tests/             # Test suite
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Maintain strict type safety
- Avoid `any` types unless absolutely necessary
- Use interfaces for public APIs
- Document complex types

### Code Style

- We use Prettier for formatting (run `npm run format`)
- ESLint for linting (run `npm run lint`)
- Follow existing patterns in the codebase
- Write descriptive variable and function names
- Add comments for complex logic

### Testing

- Write tests for new features
- Maintain or improve code coverage
- Use descriptive test names
- Test edge cases
- Mock external dependencies

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include examples for new features
- Update CHANGELOG.md following Keep a Changelog format

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `perf:` Performance improvement
- `test:` Adding missing tests
- `chore:` Changes to build process or auxiliary tools

Examples:
```
feat: add GitHub OAuth provider
fix: resolve rate limiting issue in tool builder
docs: update authentication guide with JWT example
```

## Adding New Features

### Adding an Authentication Provider

1. Create a new file in `src/auth/providers/`
2. Implement the `AuthProvider` interface
3. Add tests in `tests/auth/`
4. Update documentation in `src/auth/README.md`
5. Add an example in `examples/`

### Adding a Tool Builder Feature

1. Modify `src/core/tool-builder.ts`
2. Update type definitions
3. Add tests for the new feature
4. Update the API documentation
5. Add an example showing the feature

## Release Process

1. Update version in package.json files
2. Update CHANGELOG.md
3. Create a pull request
4. After merge, tag the release: `git tag v1.0.1`
5. Push tags: `git push --tags`
6. GitHub Actions will handle npm publishing

## Questions?

Feel free to open an issue with your question or reach out to the maintainers:
- Mattae Cooper <research@aegntic.ai>

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Special thanks in documentation

Thank you for contributing to ModContxtPro! 🎉