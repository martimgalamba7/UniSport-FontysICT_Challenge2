# UniSport Eindhoven — Student Sports Community Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-c99700.svg)](LICENSE)
[![Platform: Web / PWA](https://img.shields.io/badge/Platform-Web%20%2F%20PWA-FF4D00.svg)](#)
[![Vanilla: JS (ES6)](https://img.shields.io/badge/Vanilla-JS%20(ES6)-e5a900.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind: CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase: Auth & Firestore](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel: Deployed](https://img.shields.io/badge/Vercel-Deployed-000000.svg?logo=vercel&logoColor=white)](https://fontysict.martimgalamba7.xyz/challenge2/unisport)

> **ICT Semester 1 | Challenge 2 — Fontys University of Applied Sciences**  
> A real-time, community-driven sports web application engineered for students of **Fontys UAS** and **TU Eindhoven** to effortlessly discover upcoming matches, organize workouts, and connect with fellow campus athletes.

🔗 **Live Production URL:** [fontysict.martimgalamba7.xyz/challenge2/unisport](https://fontysict.martimgalamba7.xyz/challenge2/unisport)

---

## 📌 Problem & Motivation

Moving to a new city or balancing tight university schedules frequently leads students to abandon regular exercise. An empirical survey conducted during the research phase ($n = 37$ Eindhoven students) revealed:
- **68%** of respondents skip sports due to a **lack of training partners**.
- **Conflicting Schedules** (22 mentions) and **Skill Level Mismatch** (13 mentions) are the single largest barriers.
- **Group Chat Chaos** (WhatsApp/Discord) leads to unorganized matches, overbooking, and ghosting.

**UniSport** was engineered to solve these challenges by replacing disorganized group chats with a structured, verified campus sports platform featuring instant roster bookings and real-time synchronization.

---

## ✨ Key Features

- **🎓 Verified Campus Authentication:** Exclusively accepts university email domains (`@student.fontys.nl` and `@student.tue.nl`), automatically tagging accounts with their institution's badge to establish trust and safety.
- **⚡ Session Discovery Feed & Pagination:** Displays upcoming Eindhoven games in a responsive 3x3 grid (9 cards), expandable to 3x10 (30 cards) with numbered page controls. Expired or started games are automatically hidden.
- **🎯 Deep Multi-Criteria Filters:** Slide-out filter drawer allowing students to filter matches by **Sport**, **University** (Fontys vs. TU/e), **Date**, **Price** (Free vs. Paid), and **Skill Level**.
- **⏱️ Amsterdam Timezone Validation (`Europe/Amsterdam`):** Session creation requires a minimum **1-hour lead time** in local Amsterdam time, preventing retroactive or impossible scheduling.
- **📋 Real-Time Roster & Host Management:** 
  - Live spot counters (e.g. `4/10`) update dynamically across all clients without reloads.
  - Hosts can edit session details, kick participants, or leave—triggering an automatic cancellation cascade with real-time alerts.
- **👥 Student Directory & 3D Mascot Profiles:** Search peers across campuses, send/accept friend requests, and customize athlete profiles using 3D transparent character avatars (Striker, Bodybuilder, Speed Runner).
- **🔔 Live In-App Notifications:** Real-time alert badges and drawer updates powered by Firestore `onSnapshot` WebSocket streams.
- **📱 PWA & Mobile QR Code Handoff:** Desktop landing page features a direct QR code for quick mobile scanning, plus an in-app guide for adding UniSport to the **iOS (Safari)** or **Android (Chrome)** Home Screen.

---

## 🏗️ System Architecture & Data Flow

UniSport employs a **Serverless Single-Page Application (SPA) + Backend-as-a-Service (BaaS)** architecture:

```
[ Client Tier: Desktop Browser / Mobile PWA ]
  ├── Presentation Layer: Landing Page, Auth View, Feed & Filter Drawer, My Spots, Student Directory
  ├── Application Logic: Auth Guard, Session Lifecycle, Amsterdam Validator, State Manager
  └── LocalStorage: Instant Session Hydration & Offline Fallback Cache
          ▲                                    ▲
          │ (HTTPS Bundle)                     │ (WSS onSnapshot Streams & JWT Auth)
          ▼                                    ▼
[ Delivery Tier: Vercel Edge CDN ]    [ Backend Tier: Google Firebase Cloud ]
  └── Static Routing & cleanUrls        ├── Firebase Authentication (Domain Gated)
                                        ├── Declarative Security Rules (firestore.rules)
                                        └── Cloud Firestore (users, activities, friend_requests, notifications)
```

UML diagrams and source specifications are available in the repository:
- **System Architecture & Topology (PlantUML):** [`uml/System-Architecture-Topology.puml`](uml/System-Architecture-Topology.puml)
- **Sequence Diagram — Communication Protocols (PlantUML):** [`uml/Sequence-Diagram.puml`](uml/Sequence-Diagram.puml)

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **HTML5 & Vanilla JavaScript (ES6 Modules)** | Modular, lightweight client logic without framework/bundler overhead |
| **Styling & Theme** | **Tailwind CSS + Custom CSS (`css/`, `js/theme.js`)** | Responsive multi-breakpoint layouts with dark/light mode persistence |
| **Authentication** | **Google Firebase Authentication** | Secure Email/Password management with campus domain validation |
| **Database & Real-Time** | **Google Cloud Firestore (NoSQL)** | WebSocket delta synchronization via `onSnapshot` listeners ($\le 1.5\text{s}$) |
| **Security** | **Firestore Security Rules (`firestore.rules`)** | Role-based access control locking host permissions (`uid == hostId`) |
| **Hosting & Delivery** | **Vercel Edge Network (`vercel.json`)** | Global HTTPS edge delivery with serverless URL rewrites and custom 404 |

---

## 📁 Project Structure

```
.
├── 404.html                          # Branded 404 error page with 3D mascot
├── index.html                        # Project Hub index
├── vercel.json                       # Vercel edge routing & rewrite rules
├── css/
│   └── 404.css                       # Styles for the custom 404 error page
├── js/
│   └── 404.js                        # Dynamic path display for the 404 error page
├── challenge2/                       # Challenge 2 deployment root
│   └── unisport/
│       ├── index.html                # Marketing Landing Page with QR code handoff
│       ├── css/
│       │   └── landing.css           # Landing page custom styles & animations
│       ├── js/
│       │   └── landing.js            # Landing page interactive logic & theme toggle
│       ├── assets/                   # Shared image assets & 3D mascots
│       └── app/                      # UniSport Web Application (SPA)
│           ├── index.html            # Main App shell (Feed, My Spots, Profile, Settings)
│           ├── login.html            # Campus login portal
│           ├── register.html         # Multi-step registration flow
│           ├── welcome.html          # Authenticated welcome confirmation screen
│           ├── css/
│           │   └── app.css           # Application layout, sidebar, mobile nav & chip styles
│           ├── js/
│           │   ├── app.js            # Core state controller (window.UniSport)
│           │   ├── ui-controller.js  # UI hydration, navigation, community & profile logic
│           │   ├── auth.js           # Campus domain guard & session handling
│           │   ├── login.js          # Student sign-in form controller
│           │   ├── register.js       # Multi-step onboarding controller
│           │   ├── welcome.js        # Welcome confirmation controller
│           │   ├── avatars.js        # Mascot avatar helper functions
│           │   ├── avatar-data.js    # Avatar SVG/image dataset
│           │   ├── firebase-config.js# Firebase v10.12 SDK initialization
│           │   └── theme.js          # Tailwind config & color mode manager
│           └── assets/               # 3D character avatars & mascot illustrations
├── survey/                           # Research Survey web app (Challenge 2)
│   ├── index.html                    # Survey markup
│   ├── schema.sql                    # PostgreSQL survey schema
│   ├── vercel.json                   # Standalone survey routing config
│   ├── css/
│   │   └── survey.css                # Survey custom styles & animations
│   └── js/
│       ├── survey.js                 # Survey validation, progress & submission logic
│       └── google_apps_script.js     # Google Sheets Apps Script webhook
└── uml/                              # UML architectural diagrams (.puml)
```

---

## 🚀 Local Development Setup

To run the project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/martimgalamba7/UniSport-FontysICT_Challenge2.git
   cd UniSport-FontysICT_Challenge2
   ```

2. **Serve the project:**
   Since UniSport uses standard ES6 JavaScript modules and HTML5, serve it with any local HTTP server (to satisfy browser CORS for modules):
   ```bash
   # Using Python 3
   python3 -m http.server 5500

   # Or using Node npx serve
   npx serve .
   ```

3. **Open in browser:**
   - Landing Page: `http://localhost:5500/challenge2/unisport/`
   - Web Application: `http://localhost:5500/challenge2/unisport/app/`

---

## 👨‍💻 Author

**Martim Ferreira Galamba**  
Fontys University of Applied Sciences — ICT Semester 1  
Class: EN01

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
