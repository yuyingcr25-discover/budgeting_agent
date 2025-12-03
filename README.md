# Project Setup Workbook (PSW)

A web application for managing project setup workbooks, including budgeting, resource demand planning, and gross margin calculations.

## Features

- **Project Management**: Create, edit, and track project setup workbooks
- **5-Step Wizard**:
  1. **Project Setup** - SAP project lookup, industry/RM selection, template selection
  2. **Budget Entry** - Work packages, work items, role-based hours grid
  3. **Gross Margin Calculator** - Revenue/cost breakdown, subcontractors, expenses
  4. **Resource Demand** - Weekly scheduling grid for resource planning
  5. **Review & Validation** - Summary with SAP/ProFinda export capabilities
- **Dark Mode** - Full light/dark theme support
- **Responsive Design** - Works on desktop and tablet devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Zustand** for state management (with localStorage persistence)
- **React Router** for navigation
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/tbharthur/psw.git
cd psw

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/         # Header, navigation
│   └── wizard/         # Step 1-5 components
├── data/
│   └── referenceData.ts  # Roles, industries, locations, templates
├── pages/
│   ├── Dashboard.tsx   # Project list
│   └── ProjectWizard.tsx # Main wizard container
├── store/
│   ├── projectStore.ts # Project state management
│   └── themeStore.ts   # Theme state management
├── types/
│   └── index.ts        # TypeScript interfaces
├── App.tsx             # Router setup
└── App.css             # Design system & styles
```

## License

Private - All rights reserved
