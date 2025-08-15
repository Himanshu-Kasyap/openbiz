# Udyam Registration Replica

A full-stack web application that replicates the first two steps of the official Udyam registration process from the government portal.

## Project Structure

```
udyam-registration-replica/
├── frontend/                 # Next.js React frontend
├── backend/                  # Express.js API server
├── scraper/                  # Puppeteer web scraper
├── docker-compose.yml        # Production Docker setup
├── docker-compose.dev.yml    # Development Docker setup
└── package.json             # Root package.json for monorepo
```

## Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, React Hook Form
- **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL, Redis
- **Scraper**: Puppeteer, Cheerio, Node.js
- **Development**: ESLint, Prettier, Jest, Docker

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for containerized development)

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development environment with Docker**:
   ```bash
   npm run docker:dev
   ```

3. **Or start services individually**:
   ```bash
   # Start all services
   npm run dev
   
   # Or start individual services
   npm run dev:frontend    # Frontend on http://localhost:3000
   npm run dev:backend     # Backend on http://localhost:4000
   npm run dev:scraper     # Scraper service
   ```

### Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all projects
- `npm run test` - Run tests for all projects
- `npm run lint` - Lint all projects
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:build` - Build Docker images

### Environment Variables

Create `.env` files in each service directory:

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend (.env)**:
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://udyam_user:udyam_pass@localhost:5432/udyam_db
REDIS_URL=redis://localhost:6379
```

**Scraper (.env)**:
```
NODE_ENV=development
OUTPUT_DIR=./output
```

## Development Guidelines

### Code Style

- ESLint and Prettier are configured for consistent code formatting
- JSDoc comments are required for all functions and classes
- Follow the established naming conventions and project structure

### Testing

- Unit tests using Jest
- Integration tests for API endpoints
- E2E tests for frontend workflows
- Minimum 80% code coverage required

### Git Workflow

1. Create feature branches from `main`
2. Follow conventional commit messages
3. Ensure all tests pass before merging
4. Code review required for all PRs

## Architecture

The application follows a microservices-inspired architecture:

- **Web Scraper**: Extracts form structure from Udyam portal
- **Frontend**: Responsive React application with form validation
- **Backend**: REST API with data validation and storage
- **Database**: PostgreSQL for persistent data storage
- **Cache**: Redis for session management and caching

## Deployment

### Development
- Frontend and Backend run locally with hot reload
- PostgreSQL and Redis via Docker containers

### Production
- Frontend: Deployed to Vercel
- Backend: Deployed to Railway
- Database: Managed PostgreSQL service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Submit a pull request

## License

This project is for educational purposes only.