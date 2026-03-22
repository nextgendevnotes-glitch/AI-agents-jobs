# AI Job Matcher - Your 24/7 Job Search Agent

An AI-powered job application automation platform that matches your resume with relevance across LinkedIn, Naukri, Monster, and more — then automatically applies on your behalf.

## 🚀 Features

*   **AI Resume Parsing**: Extracts skills, experience, and target roles from your resume to build a perfect candidate profile.
*   **Smart Job Matching**: Uses AI to match jobs based on relevance scores (70%+).
*   **Direct Application**: Sends customized, human-like application emails directly from your own Gmail account using App Passwords. 
*   **Fraud Detection**: Multi-layer fraud detection (DNS check + AI analysis) to protect you from fake job postings.
*   **Modern Mobile-First UI**: Dark/Light mode support, sleek stats dashboard, and responsive design for all devices.
*   **Detailed Analytics**: Track every application status (Sent, Pending, Failed, Blocked) in real-time.

---

## 🏗️ Project Architecture

*   **Frontend**: React (Vite), custom vanilla CSS design system, Lucide icons, Framer Motion.
*   **Backend**: Node.js, Express, BullMQ (for background automation), Groq Llama-3 (for AI logic).
*   **Database**: Supabase (PostgreSQL) for data storage and authentication.
*   **Worker**: background agent processing for automated job discovery and application.

## ⚡ Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/nextgendevnotes-glitch/AI-agents-jobs.git
cd AI-agents-jobs
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Environment Variables
Create `.env` files in both `frontend/` and `backend/`:

**Backend (.env):**
```
PORT=5000
SUPABASE_URL=...
SUPABASE_KEY=...
GROQ_API_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
REDIS_URL=redis://localhost:6379
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 3. Run Development Servers
```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

---

## 🔒 Safety & Privacy
- Your **Gmail App Passwords** are stored securely in Supabase and only used for sending applications on your behalf.
- **Fraud Detection Agent** automatically blocks suspicious domains and high-risk job listings before they are even processed.

---

Built with ❤️ by NextGen Dev Notes.
