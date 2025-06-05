
Create a multi-step translation comparison web application using **Next.js** and **Tailwind CSS**. The app allows users to input Korean text and compare translations using **GPT-4o mini** and **Gemini 1.5 Flash** APIs, with cost estimation and a recommendation system.

---

🔧 Development Framework:
- Framework: Next.js (App Router, TypeScript optional)
- UI: Tailwind CSS
- API integration: fetch or Axios
- State Management: React hooks or Zustand (optional)
- Deployment-ready: Vercel

---

✅ Project Name: Create a multi-step translation comparison web application using **Next.js** and **Tailwind CSS**. The app allows users to input Korean text and compare translations using **GPT-4o mini** and **Gemini 1.5 Flash** APIs, with cost estimation and a recommendation system.

---

🔧 Development Framework:
- Framework: Next.js (App Router, TypeScript optional)
- UI: Tailwind CSS
- API integration: fetch or Axios
- State Management: React hooks or Zustand (optional)
- Deployment-ready: Vercel

---

✅ Project Name: translate-wise  
🗂 Checklist Document: progress_checklist.md

---

📌 Application Flow (6 Steps with UI Checkboxes):

### [ ] Step 1: Korean Text Input
- UI: Textarea input with placeholder
- Logic: Save text to state

### [ ] Step 2: Target Language Selection
- UI: Multiselect dropdown (default: English, Japanese, German)
- Logic: Save selected languages to state

### [ ] Step 3: Run Translation
- Button: "Translate using GPT-4o and Gemini"
- Logic:
  - Send requests to both APIs in parallel (mock initially)
  - Show loading spinner

### [ ] Step 4: View Translated Results
- UI: 2-column layout with model names
- Each column displays:
  - Translated texts per language
  - Original text above for context

### [ ] Step 5: Cost Estimation
- Logic:
  - Estimate token usage: `tokens = charCount * 2`
  - Cost per model:
    * GPT-4o mini: $0.15 (input) + $0.60 (output) / 1M tokens
    * Gemini Flash: $0.075 (input) + $0.30 (output) / 1M tokens
- UI:
  - Show total input/output tokens and cost per model

### [ ] Step 6: Recommendation
- Compare costs
- Display a summary card:
  - "GPT-4o mini is cheaper" or
  - "Gemini is more efficient for this input"
- Optional: Include a toggle for “prioritize quality over cost”

---

🎨 UI Features:
- Step-by-step cards with checkboxes and green ✅ icons when complete
- Responsive layout for mobile and desktop
- Export button to download results as JSON
- Dark mode toggle

---

📁 Project Structure Example (App Router):
- `app/page.tsx`: Main input form + steps
- `components/StepCard.tsx`: Reusable step UI
- `components/ResultCard.tsx`: Display translation
- `lib/estimateCost.ts`: Token & cost logic
- `app/api/gpt-translate/route.ts`: GPT-4o mini proxy
- `app/api/gemini-translate/route.ts`: Gemini API proxy
- `styles/globals.css`: Tailwind base

---

🚀 Deployment:
- Optimize for Vercel deployment
- Add `.env.local` for API keys (use dummy values initially)

---

🧪 Optional Testing:
- Add test inputs for various length and language combinations
- Track API latency for each model (benchmark feature)

  
🗂 Checklist Document: TransCompare_ProgressChecklist.md

---

📌 Application Flow (6 Steps with UI Checkboxes):

### [ ] Step 1: Korean Text Input
- UI: Textarea input with placeholder
- Logic: Save text to state

### [ ] Step 2: Target Language Selection
- UI: Multiselect dropdown (default: English, Japanese, German)
- Logic: Save selected languages to state

### [ ] Step 3: Run Translation
- Button: "Translate using GPT-4o and Gemini"
- Logic:
  - Send requests to both APIs in parallel (mock initially)
  - Show loading spinner

### [ ] Step 4: View Translated Results
- UI: 2-column layout with model names
- Each column displays:
  - Translated texts per language
  - Original text above for context

### [ ] Step 5: Cost Estimation
- Logic:
  - Estimate token usage: `tokens = charCount / 4`
  - Cost per model:
    * GPT-4o mini: $0.15 (input) + $0.60 (output) / 1M tokens
    * Gemini Flash: $0.075 (input) + $0.30 (output) / 1M tokens
- UI:
  - Show total input/output tokens and cost per model

### [ ] Step 6: Recommendation
- Compare costs
- Display a summary card:
  - "GPT-4o mini is cheaper" or
  - "Gemini is more efficient for this input"
- Optional: Include a toggle for “prioritize quality over cost”

---

🎨 UI Features:
- Step-by-step cards with checkboxes and green ✅ icons when complete
- Responsive layout for mobile and desktop
- Export button to download results as JSON
- Dark mode toggle

---

📁 Project Structure Example (App Router):
- `app/page.tsx`: Main input form + steps
- `components/StepCard.tsx`: Reusable step UI
- `components/ResultCard.tsx`: Display translation
- `lib/estimateCost.ts`: Token & cost logic
- `app/api/gpt-translate/route.ts`: GPT-4o mini proxy
- `app/api/gemini-translate/route.ts`: Gemini API proxy
- `styles/globals.css`: Tailwind base

---

🚀 Deployment:
- Optimize for Vercel deployment
- Add `.env.local` for API keys (use dummy values initially)

---

🧪 Optional Testing:
- Add test inputs for various length and language combinations
- Track API latency for each model (benchmark feature)
