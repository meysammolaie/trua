# Trusva - AI-Powered Investment Platform

Welcome to Trusva, an international crypto-based investment project powered by modern web technologies and artificial intelligence. This platform allows users to invest in various funds, earn profits, and participate in a monthly lottery.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React Framework)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Artificial Intelligence**: [Google's Genkit](https://firebase.google.com/docs/genkit)
- **Backend & Database**: [Firebase (Firestore)](https://firebase.google.com/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/trusva.git
   cd trusva
   ```

2. **Install NPM packages:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   - Create a new file named `.env.local` in the root of your project.
   - Copy the contents of `.env.example` into your new `.env.local` file.
   - Fill in the required values for your Firebase project and Gemini API key.

4. **Run the development server:**
   ```sh
   npm run dev
   ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Creates a production build of the application.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code analysis.
- `npm run typecheck`: Runs TypeScript for type checking.
