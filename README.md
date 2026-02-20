# Qadah Tracker | متتبع القضاء

**Qadah Tracker** is a dedicated tool designed to help Muslims simplify the process of making up missed prayers (*Qada*). Built with a focus on privacy and ease of use, it provides a structured way to turn a spiritual goal into a manageable daily habit.

![Qadah Tracker Hero](./client/public/hero.jpg)

## ✨ Features

- **Smart Calculator**: Automatically calculates your total missed prayers based on the dates you provide.
- **Visual Dashboard**: Intuitive progress bars and summaries for Fajr, Dhuhr, Asr, Maghrib, and Isha.
- **Jurisprudence Rulings**: Includes essential guidance and rulings from the four major schools of thought (Maliki, Hanafi, Shafi'i, and Hanbali).
- **Multi-language Support**: Fully localized in English and Arabic with a seamless toggle.
- **Privacy First**: All data is stored locally in your browser using IndexedDB. No server-side tracking.
- **Data Management**: Export your progress to a JSON file and import it back on any device.
- **Modern UI/UX**: Built with a premium aesthetic featuring glassmorphism, dark mode, and smooth micro-animations.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Icons**: Lucide React
- **State & Data**: TanStack Query (React Query), IndexedDB
- **Build Tool**: Vite
- **Deployment**: Docker, Docker Compose

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/qadah-tracker.git
   cd qadah-tracker
   ```

2. **Run with Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

3. **Access the app**:
   Open [http://localhost:5000](http://localhost:5000) in your browser.

## 📖 Accessing Information

Even after setting up your prayer tracking, you can always go back to the landing page and jurisprudence summary by:
- Clicking the **"About" (Info)** icon (ⓘ) in the header.
- Navigating directly to `/#info`.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Made with 🕯️ for spiritual growth.*
