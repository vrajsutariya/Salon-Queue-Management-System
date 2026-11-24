# Project Reflection: Salon Queue Management System

**Author:** Vraj Sutariya  
**Course / Program:** MSc IT — Vibe Coding Lab  
**Project:** Salon Queue Management System (*Crown & Blade Luxury Salon*)  
**Submission Date:** November 2026  

---

### 1. Engineering Paradigm & AI Collaboration (Vibe Coding)
Building this multi-device, real-time salon queue system shifted my engineering approach from manual syntax authoring to **architectural stewardship and prompt-driven orchestration**. Rather than jumping directly into frontend views, establishing strict boundary rules up front in `AGENTS.md` and `docs/` served as the project’s constitutional bedrock. The AI assistant operated effectively as a pair programmer because every prompt enforced domain rules: design token CSS variables, dual-language localization (EN/GU), and the strict "Don't Build" constraints (e.g., no online payment gateways, no future booking). When working with AI code generation, the quality of output is directly proportional to how clearly edge cases and state invariants are codified before implementation.

### 2. Technical Hurdles & Algorithmic Problem Solving
The most demanding engineering challenge was maintaining deterministic queue state synchronization across four concurrent surfaces: customer mobile phones (`/status/:id`), the receptionist tablet (`/reception`), individual barber station views (`/barber/:name`), and the 10-foot waiting area TV (`/display`). 

Two critical issues emerged during development:
1. **Race Conditions & Barber Allocation**: The "Call Next" algorithm initially allowed an active barber to inadvertently claim customers who had requested a specific preferred barber. By refining the backend FIFO query to strictly isolate preference tokens (`preferredBarber == barberId` or `"any"`), customer routing integrity was guaranteed.
2. **Production Cold-Start Resilience**: Deploying across decoupled cloud platforms (Vercel for the React frontend, Render for the Express/MongoDB backend) exposed free-tier spin-up latencies and CORS handshake drops. This was resolved by engineering client-side exponential backoff retries, proactive health check pings, and non-blocking wakeup toasts, ensuring high user perceived performance even during server initialization.

### 3. Constraint Adherence & Design Rigor
Adhering strictly to the "Don't Build" list required deliberate design discipline. Resisting feature bloat (such as adding SMS APIs or payment integrations) allowed me to channel focus into crafting a true luxury physical salon experience: responsive SVG circular wait timers, mobile-first touch ergonomics (>= 44px tap targets), synthesized Web Audio chime notifications, and full Gujarati localization without hardcoded strings.

### 4. Key Takeaways
This lab solidified that "vibe coding" is not undisciplined programming; it is **systems thinking elevated by prompt precision**. Rapid iteration is only sustainable when grounded in modular component architecture, automated end-to-end verification, and rigorous state machines. In future iterations, I would explore edge caching and service worker-backed offline ticket persistence.
