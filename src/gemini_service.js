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
  try {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    
    const systemPrompt = `You are the Legal Sentinel Fast-Scout (7B Engine).
    Current Date: ${today}.
    
    STRICT LANGUAGE RULE:
    - ALWAYS RESPOND IN THE EXACT SAME LANGUAGE AS THE USER'S QUESTION.
    - If question is in English, respond ONLY in English.
    - If question is in Hindi, respond ONLY in Hindi.
    - Do not summarize documents in a different language than the question.

    Your tone is crisp, professional, and fast. Keep answers concise. USE PLAINTEXT ONLY (No Markdown, no **).`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'open-mistral-7b', // Switched to high-speed engine
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1 // Faster/more deterministic
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) throw new Error("Empty AI Response");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Sentinel Logic Error:", error);
    throw error;
  }
}

/**
 * Performs a deep audit of a legal document.
 * Returns an Executive Summary, Red-Flag Heatmap, and Actionable Suggestions.
 */
export async function auditContractWithGemini31(documentText) {
  try {
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // Safety: Limit characters for very large docs to prevent API timeout
    const safeText = documentText.substring(0, 30000);

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
          { role: 'user', content: safeText }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Audit Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Audit Engine Fail:", error);
    throw error;
  }
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
