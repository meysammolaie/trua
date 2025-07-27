
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// In a Next.js app, you would define all of your flows, tools, etc.
// in other files and import them here. This file is then imported by the
// Next.js plugin. You can also define them directly in this file.
//
// See: https://firebase.google.com/docs/genkit/nextjs-framework#project-structure

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
