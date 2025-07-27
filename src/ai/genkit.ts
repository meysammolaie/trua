import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This file should initialize plugins but not export the ai object
// to prevent it from being bundled in client-side code through chained imports.
// Each flow will create its own instance.
genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
