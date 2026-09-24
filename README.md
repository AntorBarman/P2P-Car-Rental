# 🚗 UDriveBD - Premium Car Rental Platform

![UDriveBD Banner](https://res.cloudinary.com/yzq8fktv/image/upload/v1790246389/Screenshot_702.png)

<div align="center">

**Bangladesh's #1 Peer-to-Peer Self-Drive Car Rental Platform**

[![Made with React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

[Live Demo](https://udrive-bd-frontend.vercel.app) • [Report Bug](https://github.com/AntorBarman/P2P-Car-Rental/issues) • [Request Feature](https://github.com/AntorBarman/P2P-Car-Rental/issues)

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 About The Project

**UDriveBD** is a comprehensive car rental platform connecting vehicle owners with customers across Bangladesh. The platform facilitates secure, verified, and hassle-free self-drive car rentals with a focus on trust, safety, and convenience.

### 🎪 The Problem We Solve

Traditional car rental in Bangladesh faces challenges:
- ❌ Lack of trust between owners and renters
- ❌ No proper verification system
- ❌ Double booking issues
- ❌ Insecure payment methods
- ❌ No transparent reviews

### ✨ Our Solution

UDriveBD provides:
- ✅ **Complete KYC Verification** - NID, License, Face Photo
- ✅ **Industry-Level Double Booking Protection** - 3-layer defense
- ✅ **Secure SSLCommerz Payments** - Multiple payment methods
- ✅ **Transparent Review System** - Verified customer reviews
- ✅ **Automatic Commission Split** - 85% owner / 15% platform

---

## 🚀 Key Features

### 🔐 Authentication & Security
| Feature | Description |
|---------|-------------|
| JWT Authentication | Secure access + refresh tokens |
| Email Verification | 24-hour token expiry |
| Password Hashing | Bcrypt with 10 rounds |
| Role-Based Access Control | Customer, Owner, Admin, Staff |
| Token Rotation | Auto-refresh on expiry |

### 📄 KYC Verification System
- **5 Document Types Required:**
  - NID Front & Back
  - Driving License Front & Back  
  - Live Face Photo (Camera Capture)
- **Camera Capture:** HTTPS + localhost support
- **File Upload:** Fallback option with validation
- **Admin Review:** Approve/Reject with reason
- **Re-upload:** On rejection with tracking

### 🚙 Vehicle Management
- Multi-image upload (up to 5 images)
- Document-based compliance checking
- Branch-based pickup locations
- Advanced search with filters
- Real-time availability status

### 📅 Booking System (Industry-Level)
**3-Layer Double Booking Protection:**

1. **Frontend Layer** - Real-time availability check
2. **Backend Layer** - Transaction lock with `FOR UPDATE`
3. **Database Layer** - PostgreSQL trigger preventing overlaps

**Additional Features:**
- 15-minute hold system
- Auto-expiry via cron job
- Full lifecycle: `pending_payment` → `confirmed` → `ongoing` → `completed`
- Automatic cancellation with refund policy

### 💳 Payment Integration (SSLCommerz)
- Multiple methods: bKash, Nagad, Cards, Banks
- Idempotent processing (no duplicate payments)
- Auto commission split: 15% platform / 85% owner
- Refund handling on cancellation
- Webhook callbacks (Success/Fail/Cancel/IPN)

### 💰 Cancellation & Refund Policy

| Time Before Pickup | Refund % | Description |
|-------------------|----------|-------------|
| 48+ hours | 100% | Full refund |
| 24-48 hours | 75% | Partial refund |
| 12-24 hours | 50% | Half refund |
| 6-12 hours | 25% | Small refund |
| < 6 hours | 0% | No refund |

### ⭐ Review & Rating System
- 5-star rating with written reviews
- Only allowed for **completed bookings**
- One review per booking (enforced by DB)
- Dynamic reviews on home page
- Vehicle-wise rating aggregation

### 🔔 Notification System
| Channel | Events |
|---------|--------|
| **In-App** | Booking created, confirmed, cancelled |
| **Email** | Payment success, failed, refund |
| **Push** | KYC approved/rejected, document requests |

### 📊 Role-Based Dashboards
- **Customer:** Bookings, Payments, KYC, Wallet, Reviews
- **Owner:** Vehicles, Bookings, Earnings, Payouts, Analytics
- **Admin:** KYC Reviews, Vehicle Approvals, Payments, Reports

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) | Runtime Environment |
| ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white) | Web Framework |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white) | Primary Database |
| ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) | Cloud Database |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white) | Authentication |
| ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white) | Image Storage |
| ![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?style=flat&logo=gmail&logoColor=white) | Email Service |
| ![SSLCommerz](https://img.shields.io/badge/SSLCommerz-FF6B00?style=flat&logo=stripe&logoColor=white) | Payment Gateway |

### Frontend
| Technology | Purpose |
|------------|---------|
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) | UI Framework |
| ![Redux](https://img.shields.io/badge/Redux-764ABC?style=flat&logo=redux&logoColor=white) | State Management |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=react-router&logoColor=white) | Routing |
| ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwind-css&logoColor=white) | Styling |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | Build Tool |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white) | Animations |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white) | HTTP Client |

### DevOps
| Technology | Purpose |
|------------|---------|
| ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=white) | Backend Hosting |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white) | Frontend Hosting |
| ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) | Database Hosting |
| ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white) | Version Control |

---

## 🏗 System Architecture
