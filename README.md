# 🌿 EcoPulse — Smart Waste Management System

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=node.js"/>
  <img src="https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/Styling-Tailwind%20%7C%20Framer%20Motion-38B2AC?style=for-the-badge&logo=tailwind-css"/>
</p>

---

## 🌟 What is EcoPulse?

Keeping our cities clean should not be complicated. Today, if someone sees garbage on the street, there is no quick and efficient way to report it. At the same time, waste collectors often do not know exactly where their work is needed.

**EcoPulse** solves this problem. It is a smart and easy-to-use platform that connects **Citizens**, **Waste Collectors (Swachhta Mitras)**, and **Admins** in one system.

By using modern technology, EcoPulse transforms city cleaning into a fast, organized, and collaborative process. It is a full-stack MERN application designed to create real-world impact.

---

## 🚀 The 5-Step Smart Workflow

We have designed a simple and smooth process so that anyone can use EcoPulse easily:

1. **🔐 Easy Login**  
   Users can log in using **Email** or **Google OAuth**. The system automatically identifies their role: **Citizen**, **Swachhta Mitra**, or **Admin**.

2. **📸 Smart Reporting**  
   Citizens take a photo of the garbage, add a short description, and the system captures the **location automatically**.

3. **🤖 Automatic Assignment**  
   The system assigns the report to the correct **zone** and notifies the nearest **Swachhta Mitra**.

4. **🧹 Quick Action**  
   The **Swachhta Mitra** checks the task, cleans the area, and marks it as **Resolved**.

5. **🏅 Rewards & Updates**  
   The citizen gets notified and earns **points and badges** (like *Clean Zone Hero*) for helping keep the city clean.

---

## 🔥 Core Features

| Feature | Description |
| :--- | :--- |
| **📊 Glassmorphic Dashboard** | A modern and clean dashboard showing real-time reports, stats, and performance. |
| **📍 Location-Based Reporting** | Upload garbage reports with accurate location and images. |
| **🚛 Swachhta Mitra Portal** | Dedicated panel for workers to view, accept, and complete tasks. |
| **🛡️ Admin Control Panel** | Full control for admins to manage users, reports, and zones. |
| **🏆 Reward System** | Users earn badges and points for active participation. |
| **📈 Analytics Dashboard** | Interactive charts (Recharts) to track progress and trends. |
| **🔔 Notifications System** | Real-time updates for report status and task assignments. |

---

## 🛠️ Tech Stack & Tools

> **Built with a focus on performance, scalability, and clean design.**

* **Frontend**: React.js (Vite) for fast and smooth user experience.
* **Styling**: Tailwind CSS + Framer Motion for a modern and animated UI.
* **Backend**: Node.js & Express.js to build secure and scalable APIs.
* **Database**: MongoDB Atlas with Mongoose for flexible data storage.
* **Security**: JWT authentication + Bcrypt for secure user data.
* **State Management**: React Context API for managing global state easily.

---

## 📂 Project Architecture

```text
EcoPulse/
 ├── client/          # Frontend (React + Vite)
 │    ├── src/        # Components, Context, Hooks
 │    └── public/     # Static files and assets
 ├── server/          # Backend (Node.js + Express)
 │    ├── models/     # Database models (User, Report, Badge, Notification)
 │    ├── routes/     # API endpoints
 │    └── middleware/ # Authentication and role-based logic
 └── package.json     # Project dependencies and setup
```

-----

## ⚙️ Installation & Setup

### 1\. Clone the Repository

```bash
git clone https://github.com/gauravpatil-06/EcoPulse.git
cd EcoPulse
```

### 2\. Dependency Management

```bash
# Setup Backend
cd server
npm install

# Setup Frontend
cd ../client
npm install
```

### 3\. Environment Configuration

Create a `.env` file in the **server** directory:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_hyper_secure_secret
GOOGLE_CLIENT_ID=your_google_auth_id
```

### 4\. Launching the App

```bash
# Run both Client and Server (if using concurrently) or separately
npm run dev
```

-----

## 🛡️ Security & Reliability

- **RBAC (Role-Based Access Control)**  
  Strict middleware ensures that **Swachhta Mitras** and **Citizens** cannot access Admin-only features.

- **Encrypted Communication**  
  All sensitive data is securely hashed, and authentication is handled using stateless JWT.

- **Performance Optimization**  
  Implemented **Lazy Loading** and **MongoDB Indexing** for fast dashboard performance.

- **Responsive Design**  
  Built using a mobile-first approach so users can access the app easily on any device.

---

## 🚧 Challenges & Solutions

- **Real-Time Sync**  
  Implemented a notification system to update the Citizen UI when a **Swachhta Mitra** completes a task.

- **Complex Role Handling**  
  Built a custom `ModuleLayout` system to dynamically manage UI for different user roles without code duplication.

- **Data Visualization**  
  Used **Recharts** to convert raw data into simple and meaningful graphs for Admin insights.

---

## 👥 The Team

- **Gaurav Patil**
- **Abhishek Survase**  
- **Suraj Desale**  
- **Snehal Aakhud**  
- **Vaishnavi Badgujar**  

---

> "EcoPulse is more than just a project; it's a working solution designed to eliminate friction in municipal waste management. We didn't just build a UI; we built a system that works for the community."

---

<div align="center">

**🌐 [Live Web App](https://ecopulsex.vercel.app/)** | **📁 [Source Code](https://github.com/gauravpatil-06/EcoPulse/)**

✨ **Report. Resolve. Reward. Making our cities cleaner and smarter.**

</div>