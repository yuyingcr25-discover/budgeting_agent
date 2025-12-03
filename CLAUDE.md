# CLAUDE.md

This file provides guidance for Claude Code when working with this codebase.

## Project Overview

PSW (Project Setup Workbook) is a React web application for managing project budgeting, resource demand planning, and gross margin calculations. It features a 5-step wizard workflow.

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for build tooling
- **Zustand** for state management (with localStorage persistence)
- **React Router 7** for navigation
- **Lucide React** for icons
- **TanStack React Table** for data grids

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Type-check with tsc and build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── components/
│   ├── layout/           # Header component
│   └── wizard/           # Step 1-5 wizard components, WizardNav
├── data/
│   └── referenceData.ts  # Static reference data (roles, industries, templates)
├── pages/
│   ├── Dashboard.tsx     # Project list view
│   └── ProjectWizard.tsx # Main wizard container
├── store/
│   ├── projectStore.ts   # Project CRUD and state (Zustand)
│   └── themeStore.ts     # Dark/light theme state (Zustand)
├── types/
│   └── index.ts          # All TypeScript interfaces
├── App.tsx               # Router configuration
├── App.css               # Design system and component styles
└── main.tsx              # Entry point
```

## Key Patterns

### State Management
- Zustand stores in `src/store/` with localStorage persistence
- `projectStore` handles all project CRUD operations
- `themeStore` manages dark/light theme toggle

### Types
All types are centralized in `src/types/index.ts`:
- `Project` - main entity with nested budget, subcontractor, expense, and demand data
- `BudgetLine`, `Subcontractor`, `Expense`, `ResourceDemand` - child entities
- `Role`, `Industry`, `Location`, `WorkPackage`, `BudgetTemplate` - reference data types
- `*Metrics` types for calculated values (BudgetMetrics, GrossMarginMetrics, DemandMetrics)

### Wizard Steps
1. **Step1ProjectSetup** - SAP project lookup, industry/RM selection, template selection
2. **Step2Budget** - Work packages, work items, role-based hours grid
3. **Step3GrossMargin** - Revenue/cost breakdown, subcontractors, expenses
4. **Step4Demand** - Weekly scheduling grid for resource planning
5. **Step5Review** - Summary with export capabilities

### Styling
- CSS custom properties for theming (defined in `App.css`)
- Dark mode support via `.dark` class on root element
- Component styles co-located in `App.css` with BEM-like naming

### Routes
- `/` - Dashboard (project list)
- `/project/new` - Create new project
- `/project/:projectId` - Edit existing project

## Code Conventions

- Functional components with hooks
- Named exports for components
- Types imported from `@/types` or relative paths
- ESLint with React Hooks and React Refresh plugins
- Strict TypeScript configuration
