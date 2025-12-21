
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Helper to make the API call
const callGeminiAPI = async (model, apiKey, promptText) => {
    const response = await fetch(`${BASE_URL}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Model ${model} returned error ${response.status}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error(`Model ${model} returned no content.`);
    }
    return data.candidates[0].content.parts[0].text;
};

/**
 * Check which models are available for this API Key
 */
export const checkApiKey = async (apiKey) => {
    try {
        const response = await fetch(`${BASE_URL}/models?key=${apiKey}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Invalid API Key');
        }
        const data = await response.json();
        // Return list of available model names (clean 'models/' prefix)
        return data.models.map(m => m.name.replace('models/', ''));
    } catch (error) {
        // Validation failed
        throw error;
    }
};

export const analyzeInventory = async (apiKey, inventory, history) => {
    // 1. Prepare Data
    const inventoryCsv = inventory.map(i =>
        `${i.barcode},${i.name},${i.stock},${i.price},${i.minStock},${i.category},${i.unit}`
    ).join('\n');

    const historyCsv = history.slice(0, 100).map(h =>
        `${h.timestamp},${h.barcode},${h.type},${h.amount},${h.userId}`
    ).join('\n');

    const promptText = `
    System Role: คุณคือ Lead Inventory Optimization Architect และ Expert Data Scientist... (ตามที่คุณระบุ)

    Constraints:
    1. Calculate precisely.
    2. IMPORTANT: Output Format must be **JSON ONLY** with structure:
    {
      "summary_markdown": "Markdown table summary...",
      "recommendations": [
         { "barcode": "...", "name": "...", "current_stock": 0, "current_min_stock": 0, "recommended_min_stock": 0, "status": "...", "reason": "..." }
      ]
    }
    NO markdown code blocks. Raw JSON.

    Data:
    [Inventory]
    ${inventoryCsv}
    [History]
    ${historyCsv}
    `;

    // 2. Identify Candidates
    let candidates = [];
    try {
        console.log("Fetching available models...");
        const available = await checkApiKey(apiKey);

        // Filter only generation models (exclude embedding/vision only if strict)
        // We look for any model containing 'gemini'
        const geminiModels = available.filter(m => m.includes('gemini') && !m.includes('vision'));

        // Prioritize order: Flash -> Pro -> others
        const priority = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];

        candidates = geminiModels.sort((a, b) => {
            let ia = priority.findIndex(p => a.includes(p));
            let ib = priority.findIndex(p => b.includes(p));
            // If strictly matches full name, higher priority
            if (a === b) return 0;
            if (priority.includes(a)) ia = priority.indexOf(a);
            if (priority.includes(b)) ib = priority.indexOf(b);

            if (ia === -1) ia = 999;
            if (ib === -1) ib = 999;
            return ia - ib;
        });

        if (candidates.length === 0) {
            console.warn("No 'gemini' models found in list. Using defaults.");
            candidates = ['gemini-1.5-flash', 'gemini-pro'];
        }
    } catch (e) {
        console.warn("Could not list models. Using defaults.", e);
        candidates = ['gemini-1.5-flash', 'gemini-pro'];
    }

    console.log("Candidate models:", candidates);

    // 3. Try/Catch Loop Strategy
    let lastError = null;

    for (const model of candidates) {
        console.log(`🧠 Attempting analysis with: ${model}`);
        try {
            const result = await callGeminiAPI(model, apiKey, promptText);
            console.log(`✅ Success with ${model}`);
            return result;
        } catch (err) {
            console.warn(`❌ Failed with ${model}:`, err.message);
            lastError = err;
            // Continue to next model...
        }
    }

    throw new Error(`All AI models failed to respond. Last error: ${lastError?.message || 'Unknown error'}`);
};
