# ProjectBazaar Documentation

> **The Ultimate Marketplace for Projects, Ideas, and Collaborations**

ProjectBazaar is a comprehensive platform that connects buyers and sellers in the digital project ecosystem. It empowers users to discover, build, and earn by turning academic and personal projects into real revenue.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [User Roles](#user-roles)
4. [Platform Modules](#platform-modules)
5. [Technical Stack](#technical-stack)
6. [API Services](#api-services)
7. [Getting Started](#getting-started)

---

## Overview

ProjectBazaar serves as a bridge between project creators (sellers) and those seeking quality digital products (buyers). The platform offers a rich ecosystem that goes beyond simple transactions—providing tools for skill development, career growth, and professional networking.

### Key Value Propositions

| For Buyers | For Sellers |
|------------|-------------|
| Browse curated projects | Monetize your creations |
| Hire skilled freelancers | Build professional presence |
| Competitive bidding system | Access analytics & insights |
| Secure transactions | Portfolio & resume tools |

---

## Core Features

### 1. 🛒 Project Marketplace

The heart of ProjectBazaar—a vibrant marketplace where users can:

- **Browse Projects**: Explore a wide range of projects across multiple categories
- **Place Bids**: Submit competitive offers on bid-request projects
- **Purchase Directly**: Buy ready-made projects instantly
- **Wishlist**: Save favorite projects for later
- **Cart System**: Manage multiple purchases efficiently

### 2. 👥 Freelancer Directory

Connect with talented professionals:

- Browse 500+ verified freelancers
- Filter by skills, experience, and ratings
- View detailed portfolios and work history
- Direct hiring capabilities

### 3. 📝 AI-Powered Resume Builder

Create professional resumes effortlessly:

- **Multiple Templates**: Choose from various professionally designed templates
  - Modern, Classic, Creative, Minimal, Professional, and more
- **AI Suggestions**: Get intelligent content recommendations for:
  - Professional summaries (Fresher, Mid-Level, Senior)
  - Experience bullet points
  - Skills based on job title
- **Rich Text Editing**: Format content with bold, italic, lists, and links
- **Theme Customization**: Pick custom accent colors
- **Real-time Preview**: See changes instantly
- **PDF Export**: Download high-quality PDF resumes

#### Resume Sections:
- Personal Details
- Professional Summary
- Work Experience
- Education
- Skills
- Projects

### 4. 🌐 Portfolio Builder

Generate stunning portfolios in seconds:

- **Resume-to-Portfolio**: Upload your resume and get a complete portfolio
- **6 Professional Templates**:
  - Minimal (Clean & Simple)
  - Modern Dark (Purple Gradients)
  - Professional (Corporate Blue)
  - Creative (Bold & Asymmetric)
  - Developer (Terminal-inspired)
  - Elegant (Sophisticated Serif)
- **One-Click Deployment**: Deploy to live URL instantly
- **Edit Mode**: Customize extracted content before publishing
- **Portfolio History**: Track all generated portfolios

### 5. 📊 Mock Assessments

Prepare for technical interviews with comprehensive assessments:

- **Multiple Categories**: Technical, Language, Framework, Database, DevOps
- **Assessment Types**:
  - Multiple Choice Questions (MCQ)
  - Programming Challenges
- **Features**:
  - Timed and Practice modes
  - 20+ supported programming languages
  - Real-time code execution via Piston API
  - Detailed explanations for answers
  - Performance tracking and history
  - Leaderboard system
  - Achievement badges
  - Daily challenges
  - Downloadable certificates

#### Supported Languages:
Python, JavaScript, Java, C++, C, TypeScript, Go, Rust, Ruby, PHP, Kotlin, Swift, C#, Scala, R, Perl, Lua, Bash, Dart, Elixir, Haskell, Clojure

### 6. 💻 Coding Interview Questions

Practice with curated coding problems:

- LeetCode-style problems
- Multiple difficulty levels
- Topic-wise categorization
- Solution explanations

### 7. 🏆 Hackathons

Discover and participate in hackathons:

- **Browse Events**: View upcoming and live hackathons
- **Filters**: Search by status, mode (Online/Offline), location
- **Featured Events**: Highlighted top hackathons
- **Event Details**: Dates, prizes, platforms, and registration links

### 8. 📈 Analytics Dashboard

Comprehensive insights for both buyers and sellers:

**Buyer Analytics:**
- Purchase history
- Spending trends
- Wishlist activity
- Cart analytics

**Seller Analytics:**
- Earnings overview
- Project performance
- Bid success rates
- Payout tracking

### 9. 🎓 Learning & Courses

Expand your skills:

- Browse curated courses
- Track learning progress
- Course recommendations based on interests

### 10. 🤝 Career Guidance

Navigate your career path:

- Industry insights
- Career planning tools
- Skill roadmaps

---

## User Roles

### 👤 Regular User

- Browse and purchase projects
- Create wishlists and manage cart
- Access resume and portfolio builders
- Take mock assessments
- View courses and hackathons

### 🏪 Seller

All user features plus:
- List projects for sale
- Post bid-request projects
- Manage project inventory
- View earnings and analytics
- Track payouts

### 🔐 Admin

Full platform access:
- User management
- Content moderation
- Platform analytics
- System configuration

---

## Platform Modules

```
ProjectBazaar/
├── components/
│   ├── admin/              # Admin dashboard components
│   ├── resume-builder/     # Resume builder module
│   │   ├── PersonalDetailForm
│   │   ├── SummaryForm
│   │   ├── ExperienceForm
│   │   ├── EducationForm
│   │   ├── SkillsForm
│   │   ├── ProjectsForm
│   │   ├── TemplatePicker
│   │   ├── ThemeColorPicker
│   │   ├── ResumePreview
│   │   └── RichTextEditor
│   └── ui/                 # Reusable UI components
├── services/               # API service layers
├── hooks/                  # Custom React hooks
├── context/                # React context providers
├── types/                  # TypeScript type definitions
└── mock/                   # Mock data for development
```

---

## Technical Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript |
| **Styling** | Tailwind CSS 3.3.7, CSS-in-JS |
| **Animation** | Framer Motion, Motion |
| **State Management** | React Context API |
| **Code Editor** | Monaco Editor |
| **Build Tool** | Vite 5.x |
| **Testing** | Vitest, React Testing Library |
| **UI Components** | Radix UI (Primitives) |
| **Icons** | Lucide React |
| **Backend** | AWS Lambda (Serverless) |
| **Code Execution** | Piston API |

---

## API Services

### `buyerApi.ts`
- User data management
- Wishlist operations (like/unlike)
- Cart management (add/remove)
- Purchase tracking
- Hackathon data fetching

### `freelancersApi.ts`
- Freelancer listings
- Profile management
- Skill matching

### `bidRequestProjectsApi.ts`
- Bid-request project management
- Bid submission and tracking
- Project status updates

### `bidsService.ts`
- Bid management
- Bid history
- Bid notifications

### `AIResumeService.ts`
- AI-powered summary generation
- Experience bullet point suggestions
- Skills recommendations

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd ProjectBazaar

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Generate coverage report |

### Environment Variables

Create a `.env` file for optional AI features:

```env
VITE_AI_API_ENDPOINT=<your-api-endpoint>
VITE_OPENAI_API_KEY=<your-openai-key>
VITE_GEMINI_API_KEY=<your-gemini-key>
```

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Home page |
| `/auth` | Login/Register |
| `/dashboard` | Buyer dashboard |
| `/seller` | Seller dashboard |
| `/admin` | Admin panel |
| `/browse-freelancers` | Freelancer directory |
| `/browse-projects` | Project marketplace |
| `/build-portfolio` | Portfolio builder |
| `/build-resume` | Resume builder |
| `/mock-assessment` | Mock tests |
| `/coding-questions` | Coding practice |
| `/faq` | FAQ section |

---

## Premium Features

ProjectBazaar offers a premium tier with additional benefits:

- **Credits System**: Premium users receive 100 credits
- **AI-Enhanced Tools**: Advanced AI features for resume and portfolio
- **Priority Support**: Faster response times
- **Exclusive Templates**: Access to premium templates

---

## Support

For questions or issues, visit the Help Center within the dashboard or contact support through the platform.

---

<div align="center">

**Built with ❤️ by the ProjectBazaar Team**

*Discover. Build. Earn.*

</div>
