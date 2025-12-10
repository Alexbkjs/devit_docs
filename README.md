# Selecty Documentation

This repository contains the official documentation for Selecty, a Shopify app that helps merchants create language, currency, and market switchers for their international stores.

## Overview

The documentation is built using [Mintlify](https://mintlify.com/), a modern documentation platform that transforms MDX files into beautiful, searchable documentation sites.

### Project Structure

```
selecty-docs/
├── docs/
│   ├── index.mdx              # Homepage
│   ├── quickstart.mdx         # Quick start guide
│   ├── docs.json              # Mintlify configuration
│   ├── features/              # Core features documentation
│   ├── configuration/         # Configuration guides
│   ├── advanced/              # Advanced topics
│   ├── support/               # FAQ and support pages
│   └── *.js                   # Widget scripts (see important note below)
├── CLAUDE.md                  # Project instructions for AI assistants
└── README.md                  # This file
```

## Public Access

The documentation is publicly accessible via Mintlify's hosting platform. The site is connected directly to this GitHub repository through the Mintlify dashboard, which automatically deploys changes when pushed to the main branch.

**Important:** Any changes pushed to the `main` branch will be automatically deployed to the live documentation site.

## Local Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Mintlify CLI

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd selecty-docs
   ```

2. **Install Mintlify CLI:**
   ```bash
   npm install -g mintlify
   ```

3. **Start the development server:**
   ```bash
   mintlify dev
   ```

   The documentation site will be available at `http://localhost:3000`

### Editing Documentation

- All documentation files are located in the `/docs` directory
- Files use the `.mdx` format (Markdown with JSX components)
- Each page requires YAML frontmatter with `title` and `description`
- The navigation structure is defined in `docs/docs.json`

## AI Assistant Widget

The documentation includes an embedded AI assistant widget that helps users find information quickly.

### Important: JavaScript Files in /docs

**All `.js` files located within the `/docs` folder are executed on every page of the documentation site.** This is how the AI assistant widget is injected into the documentation.

### Widget Configuration

The AI assistant widget automatically detects the environment and configures itself accordingly:

- **Local Development:** Connects to `http://localhost:9000`
- **Production:** Connects to `https://rag-docs-api.vercel.app/api/chat`

This auto-detection ensures the widget works seamlessly in both environments without requiring manual configuration or multiple widget versions.

### How It Works

The widget automatically determines the environment based on the current hostname and adjusts its API endpoint accordingly. This eliminates the need for separate dev and production widget files.

### Testing the Widget Locally

To test the AI assistant widget in your local development environment:

1. **Start the backend service:**

   The widget requires a backend service running on `localhost:9000` to handle API requests. This service communicates with your vector store and OpenAI API.

   ```bash
   # Navigate to your backend service directory
   cd /path/to/backend-service

   # Start the service (ensure it runs on port 9000)
   npm start
   ```

2. **Start Mintlify dev server:**

   ```bash
   mintlify dev
   ```

3. **Test the widget:**

   Open `http://localhost:3000` and interact with the AI assistant. The widget will automatically connect to your local backend at `localhost:9000`.

### Production Deployment

When deployed to production, the widget automatically uses the Vercel serverless function hosted at:
```
https://rag-docs-api.vercel.app/api/chat
```

This function handles all API requests for the live documentation site, including:
- Vector store queries
- OpenAI API communication
- Context retrieval and response generation

## Content Guidelines

When contributing to the documentation:

1. **Use second-person voice** ("you" rather than "we")
2. **Include prerequisites** at the start of procedural content
3. **Test all code examples** before publishing
4. **Match existing style** and formatting patterns
5. **Add frontmatter** to all MDX files:
   ```yaml
   ---
   title: Page Title
   description: Brief description for SEO
   ---
   ```

## Git Workflow

- Always create a new branch for changes
- Commit frequently with clear messages
- Never use `--no-verify` when committing (preserves pre-commit hooks)
- Push changes and create pull requests for review
- Changes to `main` are automatically deployed to production

## Support

For questions or issues:
- **Email:** support@devit.software
- **GitHub Issues:** [Create an issue](https://github.com/devitsoftware/selecty-docs/issues)

## License

See the LICENSE file in the `/docs` directory for licensing information.
