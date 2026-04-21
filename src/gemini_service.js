/**
 * Legal Sentinel - AI Service Layer
 * Interfaces with the Mistral API (Gemini 3.1 Pro Proxy) for high-fidelity legal analysis.
 */

// Use Vite's environment variable system for production (requires VITE_ prefix in Vercel)
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || 'YOUR_LOCAL_KEY_HERE';
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

/**
 * Standard chat completion with Gemini 3.1 Pro (via Mistral)
 */
export async function invokeGemini31Pro(prompt) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const systemPrompt = `You are the Legal Sentinel AI (version 3.1-PRO). 
  Current Date: ${today}.
  
  Your mission is to provide high-fidelity, professional legal analysis.
  YOU MUST HANDLE INPUT IN ANY INDIAN REGIONAL LANGUAGE (Hindi, Kannada, Tamil, Telugu, Bengali, etc.).
  
  1. RESPOND IN THE SAME LANGUAGE the user used for their question, unless they ask otherwise.
  2. If the user presents a document in a regional language, give its summary and analysis in that language.
  3. Keep the output as plaintext only. NO MARKDOWN, NO BOLD (**), NO HEADERS (#).
  4. Use professional, lawyer-level vocabulary.
  5. Always include the current date (${today}) in your responses where relevant.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Performs a deep audit of a legal document.
 * Returns an Executive Summary, Red-Flag Heatmap, and Actionable Suggestions.
 */
export async function auditContractWithGemini31(documentText) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const systemPrompt = `You are the Legal Sentinel Audit Engine (3.1-PRO).
  Current Date: ${today}.
  
  Perform a deep audit on the provided document text. 
  The document may be in English or a Regional Indian Language (Hindi, Kannada, etc.).
  
  YOU MUST PROVIDE A BILINGUAL REPORT IF THE DOCUMENT IS IN A REGIONAL LANGUAGE:
  - English Summary + Regional Language Summary.
  - English Red-Flags + Regional Language Red-Flags.
  
  MANDATORY STRUCTURE (Use plaintext only, NO MARKDOWN):
  
  1. EXECUTIVE SUMMARY (Crisp TL;DR of the whole document).
  2. RED FLAG HEATMAP (List specific clauses as HIGH, MEDIUM, or LOW risk).
  3. ACTIONABLE SUGGESTIONS (Immediate steps the user should take).
  4. LEGAL STANDING (Mention current laws as of ${today}).
  
  STRICT RULES:
  - NO MARKDOWN (No **, no #, no *).
  - USE PLAIN TEXT FORMATTING (Dashes for lists, CAPS for emphasis).
  - Response must be crisp, professional, and trustworthy.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: documentText }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generates a legal draft (e.g. eviction notice, refund dispute).
 */
export async function generateLegalDraft(type, details) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const systemPrompt = `You are a Senior Legal Draftsman.
  Today's Date: ${today}.
  
  Generate a professional legal ${type} based on the user's details.
  THE DRAFT CAN BE IN ENGLISH OR A REGIONAL INDIAN LANGUAGE as requested by the user.
  
  STRICT RULES:
  - NO MARKDOWN.
  - USE PROFESSIONALLY FORMATTED PLAINTEXT.
  - Include placeholders like [USER NAME] or [DATE: ${today}] where appropriate.
  - The tone must be formal and authoritative.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: details }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
