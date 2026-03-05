# 🤖 AIVA.ai — AI-Powered Content Creation Platform

<div align="center">

![AIVA.ai Banner](https://img.shields.io/badge/AIVA.ai-AI%20Platform-5044E5?style=for-the-badge&logo=openai&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-336791?style=for-the-badge&logo=postgresql&logoColor=white)
[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://quick-ai-six-sooty.vercel.app/)

**Transform your content creation with a suite of premium AI tools.**  
Write articles, generate images, review resumes, and more — all in one place.

[🌐 Live Demo](https://quick-ai-six-sooty.vercel.app/) • [✨ Features](#-features) • [🛠 Tech Stack](#-tech-stack) • [🚀 Getting Started](#-getting-started) • [📁 Project Structure](#-project-structure) • [🔑 Environment Variables](#-environment-variables)

</div>

---

## ✨ Features

| Feature | Description | Access |
|---|---|---|
| 📝 **Write Article** | Generate full-length, well-structured articles using Gemini AI | Free (10 uses) |
| 🏷️ **Blog Titles** | Generate catchy, SEO-optimized blog title ideas | Free (10 uses) |
| 🖼️ **Generate Images** | Create stunning images from text prompts via Clipdrop | Premium |
| ✂️ **Remove Background** | Instantly remove image backgrounds with AI | Premium |
| 🧹 **Remove Object** | Erase any object from a photo using Cloudinary AI | Premium |
| 📄 **Review Resume** | Get a comprehensive AI resume review with ATS analysis | Premium |
| 🌐 **Community** | Browse and explore AI-generated images shared by the community | Free |

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **Vite** — fast, modern UI
- **React Router v7** — client-side routing
- **Clerk** — authentication & user management
- **Lucide React** — beautiful icons
- **Vanilla CSS** — custom styling

### Backend
- **Node.js** + **Express 5** — REST API server
- **Clerk Express** — server-side auth middleware
- **Multer** — file upload handling
- **pdf-parse v2** — PDF text extraction for resume review

### AI & Cloud Services
- **Google Gemini AI** (via OpenAI-compatible API) — text generation
- **Clipdrop API** — image generation & background removal
- **Cloudinary** — image storage + AI object removal

### Database
- **NeonDB** (Serverless PostgreSQL) — stores users' creations

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- A [Clerk](https://clerk.com) account
- A [NeonDB](https://neon.tech) PostgreSQL database
- A [Cloudinary](https://cloudinary.com) account
- A [Google Gemini AI](https://aistudio.google.com) API key
- A [Clipdrop](https://clipdrop.co/apis) API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/aiva-ai.git
cd aiva-ai
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `server/` directory (see [Environment Variables](#-environment-variables) below).

Create a `.env` file in the `client/` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 4. Run the development servers

```bash
# Terminal 1 — Start the backend
cd server
npm run server

# Terminal 2 — Start the frontend
cd client
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## 📁 Project Structure

```
aiva-ai/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Images, SVGs, icons
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── AiTools.jsx
│   │   │   ├── Plan.jsx
│   │   │   └── Testimonial.jsx
│   │   ├── pages/              # Route-level pages
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WriteArticle.jsx
│   │   │   ├── BlogTitles.jsx
│   │   │   ├── GenerateImages.jsx
│   │   │   ├── RemoveBackground.jsx
│   │   │   ├── RemoveObject.jsx
│   │   │   ├── ReviewResume.jsx
│   │   │   └── Community.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
│
└── server/                     # Node.js backend
    ├── configs/
    │   ├── db.js               # NeonDB connection
    │   ├── cloudinary.js       # Cloudinary config
    │   └── multer.js           # File upload config
    ├── controllers/
    │   ├── aiController.js     # All AI feature logic
    │   └── userController.js   # User data handling
    ├── middlewares/
    │   └── auth.js             # Clerk auth middleware
    ├── routes/
    │   ├── aiRoutes.js
    │   └── userRoutes.js
    └── server.js               # Express app entry point
```

---

## 🔑 Environment Variables

Create `server/.env` with the following:

```env
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...

# NeonDB (PostgreSQL)
DATABASE_URL=postgresql://...

# Google Gemini AI
GEMINI_AI_KEY=AIza...

# Clipdrop API (image generation & background removal)
CLIPDROP_API_KEY=...

# Cloudinary (image storage & AI object removal)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 💳 Pricing & Plans

| | Free | Premium |
|---|:---:|:---:|
| Write Article | ✅ (10 uses) | ✅ Unlimited |
| Blog Titles | ✅ (10 uses) | ✅ Unlimited |
| Generate Images | ❌ | ✅ |
| Remove Background | ❌ | ✅ |
| Remove Object | ❌ | ✅ |
| Review Resume | ❌ | ✅ |
| Community Access | ✅ | ✅ |

---

## 📸 Screenshots

<img width="1919" height="852" alt="image" src="https://github.com/user-attachments/assets/53c37f39-356b-4085-bcc8-22758e19eea3" />
<img width="1919" height="869" alt="image" src="https://github.com/user-attachments/assets/00f4587f-6588-4bca-a07e-d2d9f8d21f04" />
<img width="1919" height="807" alt="image" src="https://github.com/user-attachments/assets/16f0ad8a-17df-4b69-b5e1-19b643179596" />
<img width="1919" height="856" alt="image" src="https://github.com/user-attachments/assets/47bf9e0b-4ec7-4b82-911b-e7bbe3796f78" />

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is for personal/educational use. All rights reserved © 2026 Aditi Bansal.

---

<div align="center">
  Made with ❤️ by <strong>Aditi Bansal</strong>
</div>
