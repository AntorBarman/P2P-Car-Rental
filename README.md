# 🚗 UDriveBD - Self-Drive Car Rental Platform

<div align="center">

**A full-stack peer-to-peer self-drive car rental platform designed for the Bangladeshi market**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Live Demo](https://udrive-bd-frontend.vercel.app) • [Report Bug](https://github.com/AntorBarman/udrive-bd/issues) • [Request Feature](https://github.com/AntorBarman/udrive-bd/issues)

</div>

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Demo Credentials](#-demo-credentials)
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

UDriveBD is a full-stack peer-to-peer self-drive car rental platform designed for the Bangladeshi market. It connects vehicle owners with customers through verified profiles, vehicle approval, availability-based booking, online payment, and role-specific dashboards.

The platform includes customer, vehicle-owner, and administrator workflows for authentication, KYC verification, vehicle management, bookings, payments, refunds, reviews, and notifications.

### The Problem

Traditional car rental in Bangladesh faces several challenges:

- **Lack of trust** between vehicle owners and renters
- **No systematic verification** of customers or vehicles
- **Booking conflicts** when multiple users try to book the same vehicle for overlapping dates
- **Insecure payment methods** without proper reconciliation
- **Limited transparency** regarding vehicle condition and owner reliability

### Our Solution

UDriveBD addresses these challenges with:

- **KYC verification workflow** using NID, driving license, and face photo uploads with admin review
- **Multi-layer double-booking prevention** using frontend validation, PostgreSQL transaction locking, and database triggers
- **SSLCommerz sandbox payment integration** with callback handling, refund processing, and commission calculation
- **Role-based dashboards** for customers, vehicle owners, and administrators

> **Note:** Payments are currently processed through the SSLCommerz sandbox environment for demonstration and testing purposes.

---

## 🔑 Demo Credentials

To test the platform without completing the full registration and KYC process, you can use these demo accounts:

### Customer
