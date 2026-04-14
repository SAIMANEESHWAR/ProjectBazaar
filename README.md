# Project Bazaar 🚀

> **The Ultimate Marketplace for Projects, Ideas, and Collaborations**

ProjectBazaar is a comprehensive platform connecting buyers and sellers in the digital project ecosystem. More than just a marketplace, it empowers users to discover, build, and earn by turning academic and personal projects into real revenue, while providing tools for career growth like resume building, portfolio generation, and mock assessments.

## 🌟 Core Features

### 🛒 Project Marketplace
-   **Buy & Sell**: A vibrant marketplace for project templates and code.
-   **Bid Requests**: Post custom project requirements and receive competitive bids.
-   **Instant Purchase**: Secure and immediate access to ready-made projects.

### 👥 For Freelancers & Professionals
-   **Freelancer Directory**: Showcase your profile and get hired.
-   **Portfolio Builder**: Generate stunning, deployed portfolios from your resume in seconds.
-   **AI Resume Builder**: Create ATS-friendly resumes with AI-powered suggestions.

### 🎓 Learning & Preparation
-   **Mock Assessments**: Practice technical interviews with real-time code execution (20+ languages supported).
-   **Coding Challenges**: LeetCode-style problems to sharpen your skills.
-   **Hackathons**: Discover and track upcoming hackathons across platforms.
-   **Career Guidance**: Roadmaps and resources for your professional journey.

### 📊 Comprehensive Dashboards
-   **Seller Dashboard**: Track earnings, project views, and sales analytics.
-   **Buyer Dashboard**: Manage purchases, wishlists, and track learning progress.
-   **Admin Panel**: Complete platform oversight and moderation tools.

## 🛠️ Technical Stack

**Frontend**
-   **Framework**: React 19 with TypeScript
-   **Build Tool**: Vite 5
-   **Styling**: Tailwind CSS 3.3, Framer Motion
-   **State Management**: React Context API
-   **UI Components**: Radix UI, Lucide React

**Backend (Serverless)**
-   **Compute**: AWS Lambda (Python 3.x)
-   **Database**: Amazon DynamoDB
-   **API**: Amazon API Gateway
-   **Storage**: Amazon S3 (for assets/resumes)
-   **Code Execution**: Judge0 (mock assessments & coding challenges; configurable — see below)

## 🚀 Getting Started

### Prerequisites
-   Node.js 18+
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Project-Bazaar-Org/Project-Bazaar-Dev.git
    cd ProjectBazaar
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory for AI features (optional for basic run):
    ```env
    VITE_AI_API_ENDPOINT=<your-api-endpoint>
    VITE_OPENAI_API_KEY=<your-openai-key>
    VITE_GEMINI_API_KEY=<your-gemini-key>
    ```

    **Code execution (Judge0)**  
    Run/Submit in Mock Assessments and Coding Questions uses [Judge0 CE](https://ce.judge0.com) by default. To use a different instance or authenticate:

    - **Default**: No config needed; uses public Judge0 CE at `https://ce.judge0.com`.
    - **Custom Judge0 host**: Set in `.env`:
      ```env
      VITE_JUDGE0_BASE_URL=https://your-judge0-host.com
      ```
    - **Auth (e.g. RapidAPI or private instance)**: Set in `.env`:
      ```env
      VITE_JUDGE0_AUTH_TOKEN=your-api-key
      ```
      Rebuild after changing (`npm run build` or restart `npm run dev`).

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Build for production**
    ```bash
    npm run build
    ```

## 📂 Project Structure

```
ProjectBazaar/
├── components/         # React UI components (Dashboard, Pages, reusable UI)
├── services/           # API service layer (Buyer, Freelancer, Bids)
├── hooks/              # Custom React hooks
├── context/            # Global state providers (Auth, Theme, Premium)
├── lambda/             # AWS Lambda backend functions (Python)
├── types/              # TypeScript definitions
└── public/             # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
<div align="center">
Built with ❤️ by the ProjectBazaar Team
</div>