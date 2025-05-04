# 🚗 Know Your Cupra – UPCHack2025 Project Submission  
### Team Project for SEAT's Challenge at UPCHack2025

## 🏁 Context & Motivation

With the arrival of the **Cupra TAVASCAN**, SEAT introduces a new era of electric vehicles, blending futuristic design with intelligent technology. However, a challenge exists: **the gap between purchase and vehicle delivery**. During this waiting period, customers typically have **no access to the physical car**, limiting their ability to learn its advanced features.

This disconnect can lead to confusion, underuse of car functionalities, and missed opportunities to build excitement. Our mission is to **transform the customer waiting period into a fun, informative, and interactive journey**, giving future owners full confidence and familiarity with their vehicle even before it's delivered.

---

## 🎯 Project Summary

We developed a **multi-platform, AI-powered interactive experience** that lets users:

- Chat with their car’s manual using **natural language**
- Explore a **realistic 3D model** of the Cupra TAVASCAN
- Engage with **interactive animations and images**
- Use **Augmented Reality (AR)** on mobile to see the car in their environment
- Control elements like **doors, roof, trunk, and wheels** in AR
- Experience **gamified learning** through engaging interactions

All of this is powered by an intelligent backend system using **Google Gemini**, **RAG over the official manual**, and orchestrated via **n8n workflows**.

---

## 🧩 System Architecture & Components

### 🤖 1. Conversational AI Assistant

- Built on **Google Gemini** for multimodal and natural language understanding.
- Uses **Retrieval-Augmented Generation (RAG)** to query the 300+ page PDF manual.
- Users can ask anything—e.g., _"How do I change driving modes?"_ or _"How do I charge the battery?"_
- Intelligent matching links questions with appropriate:
  - Text responses
  - Diagrams
  - Animations
  - 3D/AR interactions

### 🧠 2. Manual Parsing & Knowledge Base

- The official **Cupra TAVASCAN PDF manual** is parsed and indexed using a RAG pipeline.
- Key sections (charging, controls, infotainment, safety, etc.) are extracted and linked with:
  - Tags
  - Image references
  - Triggerable 3D/AR animations

### 🔁 3. Backend Automation with n8n

- All logic is modular and built using **n8n**, a low-code automation tool.
- Orchestrates:
  - Query routing
  - Gemini API calls
  - Image/animation selection
  - Logging and analytics
- Enables fast prototyping and future scalability.

### 🚘 4. 3D Interactive Model

- Users can interact with a **high-fidelity 3D model** of the Cupra TAVASCAN:
  - Rotate, zoom, and inspect
  - Highlight features based on user questions
  - Trigger animations (e.g., opening trunk, roof movement)
- Built with **Three.js** and compatible with WebGL/WebXR.

### 📱 5. Augmented Reality (AR) Experience

- On mobile, users can see the Cupra TAVASCAN in **real-world scale** using AR.
- Interactable features include:
  - Open/close **doors**, **trunk**, and **roof**
  - Bring **wheels closer** for inspection
  - Ask questions and watch the car **respond live**
- Built using **WebAR (WebXR)** and optionally native AR (e.g., ARKit/ARCore wrappers).

### 🖼️ 6. Smart Image & Animation System

- Based on user queries and manual data, the system dynamically selects:
  - Most relevant **image or diagram**
  - Best-suited **3D animation** to play
- Supports contextual explanations (e.g., showing the charging port when asked about charging).

---

## 🧪 Tech Stack

| Component             | Technology / Tool                      |
|----------------------|-----------------------------------------|
| Conversational AI     | Google Gemini (via API)                 |
| Document Parsing      | PDF to Text + Vector Store for RAG      |
| RAG Backend           | Custom with n8n orchestration           |
| Workflow Automation   | **n8n** – visual automation framework   |
| Frontend Framework    | React + Three.js                        |
| AR Integration        | WebXR, AR.js, optionally Unity/Native   |
| Hosting               | Vercel / Firebase                       |

---

## 📸 Core Features in Action

> ✅ Ask the car anything  
> ✅ Open the trunk in AR  
> ✅ Visualize how to set up regenerative braking  
> ✅ Watch the roof move live  
> ✅ Highlight safety features in 3D  
> ✅ View diagrams and animations per request  

---

## 🧑‍💻 Team Contributions

| Name | Responsibility |
|------|----------------|
| [Name 1] | AI integration & RAG setup |
| [Name 2] | Frontend + 3D/AR implementation |
| [Name 3] | Manual processing + animation mapping |
| [Name 4] | Workflow orchestration with n8n & deployment |

---

## 🚀 Future Vision

- 🎮 **Gamification**: Add quizzes, unlockable achievements, and a progress tracker.
- 🔔 **Smart Notifications**: Suggest tips as users prepare for delivery.
- 🧩 **Modular Extensions**: Plug-in for other SEAT car models.
- 🌍 **Multi-language support**: For broader customer access.

---

## 🤝 Acknowledgements

We thank **SEAT** for presenting such an inspiring challenge and **UPCHack2025** for the opportunity to innovate. Huge appreciation for the open-source community and platforms like Google Gemini, n8n, and WebXR.

---

> _"Know your Cupra before you even touch it. Explore. Learn. Drive."_ 🚘✨
