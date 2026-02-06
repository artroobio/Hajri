// OpenAI API helper functions - API key is managed server-side by Cloudflare Worker

export interface ParsedAttendance {
    worker_name: string;
    status: 'Present' | 'Absent';
    shift?: 'Day' | 'Night';
    notes?: string;
}

export interface ParsedExpense {
    item_name: string;
    quantity: number;
    unit: string;
    amount: number;
    category: 'Material' | 'Transport' | 'Food' | 'Other';
}

export interface ParsedEstimateItem {
    description: string;
    unit: string;
    quantity: number;
    rate: number;
}

export async function parseWorkerCommand(text: string): Promise<ParsedAttendance[]> {
    try {
        const response = await fetch('/api/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // No Authorization header - Cloudflare Worker will add it
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a data entry assistant. Convert user text into a JSON array of attendance objects. Fields allowed: worker_name, status (Present/Absent), shift (Day/Night), notes. Constraint: Return only JSON. No markdown formatting."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("OpenAI API Error:", errorData);
            if (response.status === 401) {
                throw new Error("Invalid API Key. Please check your .env file.");
            }
            if (response.status === 429) {
                throw new Error("Rate limit exceeded or insufficient quota.");
            }
            throw new Error(errorData.error?.message || `API Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (!content) return [];

        // Clean up potential markdown code blocks
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanContent) as ParsedAttendance[];
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", content);
            throw new Error("AI returned invalid JSON format.");
        }

    } catch (error: unknown) {
        console.error("Error calling OpenAI:", error);
        const message = error instanceof Error ? error.message : "Connection to OpenAI failed.";
        throw new Error(message);
    }
}

export async function parseExpenseCommand(text: string): Promise<ParsedExpense[]> {
    try {
        const response = await fetch('/api/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // No Authorization header - Cloudflare Worker will add it
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a construction accountant. Extract expense details from the text into a JSON array. Fields: item_name (string), quantity (number), unit (bags/kg/liters), amount (unit price if available, else total cost given by user), category (Material/Transport/Food/Other). Constraint: Return only JSON. No markdown formatting. IMPORTANT: Do NOT calculate totals. Only extract the numbers explicitly stated by the user."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("OpenAI API Error:", errorData);
            if (response.status === 401) {
                throw new Error("Invalid API Key. Please check your .env file.");
            }
            if (response.status === 429) {
                throw new Error("Rate limit exceeded or insufficient quota.");
            }
            throw new Error(errorData.error?.message || `API Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (!content) return [];

        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanContent) as ParsedExpense[];
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", content);
            throw new Error("AI returned invalid JSON format.");
        }

    } catch (error: unknown) {
        console.error("Error calling OpenAI:", error);
        const message = error instanceof Error ? error.message : "Connection to OpenAI failed.";
        throw new Error(message);
    }
}

export async function parseEstimateCommand(text: string, imageBase64?: string): Promise<ParsedEstimateItem[]> {
    try {
        const response = await fetch('/api/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // No Authorization header - Cloudflare Worker will add it
            },
            body: JSON.stringify({
                model: imageBase64 ? "gpt-4o" : "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a Quantity Surveyor. Extract BOQ items from the input into a JSON array. Fields: description (string), unit (bags/sqft/nos), quantity (number), rate (number, optional). Logic: If rate is missing, set it to 0. If unit is missing, infer it (e.g., Cement -> bags). Constraint: Return only JSON. No markdown formatting. IMPORTANT: Do NOT calculate amounts or totals. Only extract quantity and rate."
                    },
                    {
                        role: "user",
                        content: imageBase64 ? [
                            { type: "text", text: text || "Extract BOQ items from this image." },
                            { type: "image_url", image_url: { url: imageBase64 } }
                        ] : text
                    }
                ],
                temperature: 0,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("OpenAI API Error:", errorData);
            if (response.status === 401) {
                throw new Error("Invalid API Key. Please check your .env file.");
            }
            if (response.status === 429) {
                throw new Error("Rate limit exceeded or insufficient quota.");
            }
            throw new Error(errorData.error?.message || `API Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (!content) return [];

        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanContent) as ParsedEstimateItem[];
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", content);
            throw new Error("AI returned invalid JSON format.");
        }

    } catch (error: unknown) {
        console.error("Error calling OpenAI:", error);
        const message = error instanceof Error ? error.message : "Connection to OpenAI failed.";
        throw new Error(message);
    }
}
