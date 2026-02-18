
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { TransactionRecord, SplitExpense } from "../types";
import { searchUsers } from "./db";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Define tools for the AI
// Transcription engine
export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/webm') => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Audio,
                    mimeType: mimeType
                }
            },
            { text: "Transcribe this audio exactly. Return ONLY the transcribed text, nothing else." }
        ]);
        return result.response.text();
    } catch (error) {
        console.error("Transcription Error:", error);
        throw error;
    }
};

const tools = [
    {
        functionDeclarations: [
            {
                name: "get_financial_summary",
                description: "Get summary of money received or spent by the user, optionally from a specific person or within a timeframe.",
                parameters: {
                    type: "object",
                    properties: {
                        type: { type: "string", enum: ["received", "spent"], description: "Whether to look for incoming or outgoing money." },
                        otherPersonStellarId: { type: "string", description: "Optional stellar ID of the other party (e.g. 'alex@stellar')." },
                        timeframe: { type: "string", enum: ["today", "this_week", "total"], description: "Time range for the summary." }
                    },
                    required: ["type"]
                }
            },
            {
                name: "get_pending_splits",
                description: "Fetch all pending split payments the user needs to pay in groups.",
                parameters: {
                    type: "object",
                    properties: {}
                }
            },
            {
                name: "get_debts",
                description: "Find out how much money the user owes to a specific person across all splits.",
                parameters: {
                    type: "object",
                    properties: {
                        personStellarId: { type: "string", description: "The stellar ID of the person the user might owe money to." }
                    },
                    required: ["personStellarId"]
                }
            },
            {
                name: "search_user",
                description: "Search for a user's stellar ID by their name or part of it.",
                parameters: {
                    type: "object",
                    properties: {
                        searchTerm: { type: "string", description: "The name to search for (e.g. 'Alex')." }
                    },
                    required: ["searchTerm"]
                }
            },
            {
                name: "get_recent_contacts",
                description: "Fetch a list of people the user has recently transacted with.",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        ]
    }
];

export const processAIQuery = async (
    userStellarId: string,
    userMessage: string,
    history: { role: 'user' | 'model', parts: { text: string }[] }[] = [],
    audioData?: { data: string, mimeType: string }
) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: tools as any,
            systemInstruction: `You are Stellar AI, the intelligent backbone of the StellarUpi app.
Your mission is to provide instantaneous, accurate financial insights.

CRITICAL IDENTITY RESOLUTION PROTOCOL (INTERNAL CHECK):
1. IF a user mentions ANY person by name (e.g., "Sutta", "Alex", "Mom") OR uses pronouns like "him/her" referencing a person mentioned earlier in the conversation:
   - STOP giving excuses about not knowing their ID.
   - IMMEDIATELY call 'search_user' with the name, or use the context from the chat history to identify the person.
   - IF 'search_user' returns nothing, call 'get_recent_contacts' to see if you can find them in the recent transaction list.
   - NOTE: Search is case-sensitive. Try variants (e.g. "alex", "Alex") if needed.
2. AFTER obtaining the 'stellarId', proceed to call the relevant financial tool.
3. NEVER ask the user: "What is their stellar ID?". That is your job to find.

CONVERSATIONAL CONTEXT:
- You have access to the chat history. Use it to resolve pronouns (him, her, they) and follow-up questions.
- If the user provides audio, it will be the primary source of their request.

FINANCIAL CONTEXT:
- 'received' means money coming TO the user.
- 'spent' means money going FROM the user.
- 'splits' involve shared group expenses.

Today's Date: ${new Date().toLocaleDateString()}
Current Time: ${new Date().toLocaleTimeString()}
Your (the User's) Identity: ${userStellarId}`
        });

        const chat = model.startChat({
            history: history
        });

        // Prepare message content (could be text or text + audio)
        const messageParts: any[] = [{ text: userMessage || "Please process my voice request." }];
        if (audioData) {
            messageParts.push({
                inlineData: {
                    data: audioData.data,
                    mimeType: audioData.mimeType
                }
            });
        }

        let result = await chat.sendMessage(messageParts);
        let response = result.response;
        let calls = response.functionCalls();


        // Recursive handle function calls
        while (calls && calls.length > 0) {
            const functionResponses = [];

            for (const call of calls) {
                const { name, args } = call;
                let data;

                if (name === "get_financial_summary") {
                    data = await handleFinancialSummary(userStellarId, args as any);
                } else if (name === "get_pending_splits") {
                    data = await handlePendingSplits(userStellarId);
                } else if (name === "get_debts") {
                    data = await handleDebts(userStellarId, (args as any).personStellarId);
                } else if (name === "search_user") {
                    data = await handleSearchUser((args as any).searchTerm);
                } else if (name === "get_recent_contacts") {
                    data = await handleGetRecentContacts(userStellarId);
                }

                functionResponses.push({
                    functionResponse: {
                        name,
                        response: { content: data }
                    }
                });
            }

            result = await chat.sendMessage(functionResponses);
            response = result.response;
            calls = response.functionCalls();
        }


        return response.text();
    } catch (error) {
        console.error("AI Assistant Error:", error);
        return "I am sorry, but I encountered an error. Please try again later. " + (error as Error).message;
    }
};

async function handleGetRecentContacts(myId: string) {
    const { getTransactions } = await import("./db");
    const transactions = await getTransactions(myId);

    const contacts = new Map<string, string>();
    transactions.forEach(tx => {
        if (tx.fromId !== myId) contacts.set(tx.fromId, tx.fromName);
        if (tx.toId !== myId) contacts.set(tx.toId, tx.toName);
    });

    return Array.from(contacts.entries()).map(([id, name]) => ({ stellarId: id, displayName: name }));
}

async function handleSearchUser(searchTerm: string) {
    const users = await searchUsers(searchTerm);
    return users.map(u => ({ displayName: u.displayName, stellarId: u.stellarId }));
}

async function handleFinancialSummary(myId: string, args: { type: "received" | "spent", otherPersonStellarId?: string, timeframe?: "today" | "this_week" | "total" }) {
    const { type, otherPersonStellarId, timeframe } = args;
    const colRef = collection(db, "transactions");

    let q = query(
        colRef,
        where(type === "received" ? "toId" : "fromId", "==", myId)
    );

    if (otherPersonStellarId) {
        q = query(q, where(type === "received" ? "fromId" : "toId", "==", otherPersonStellarId));
    }

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(d => d.data() as TransactionRecord);

    let filtered = transactions;
    const now = new Date();

    if (timeframe === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        filtered = transactions.filter(tx => (tx.timestamp as Timestamp).toMillis() >= today);
    } else if (timeframe === "this_week") {
        const lastWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        filtered = transactions.filter(tx => (tx.timestamp as Timestamp).toMillis() >= lastWeek);
    }

    const total = filtered.reduce((acc, tx) => acc + tx.amount, 0);

    return {
        count: filtered.length,
        totalAmount: total,
        currency: filtered[0]?.currency || "XLM",
        timeframe: timeframe || "total",
        type
    };
}

async function handlePendingSplits(myId: string) {
    const q = query(collection(db, "splitExpenses"));
    const snapshot = await getDocs(q);
    const allSplits = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SplitExpense));

    const myPending = allSplits.filter(s =>
        s.participants.some(p => p.stellarId === myId && p.status === "PENDING")
    ).map(s => ({
        description: s.description,
        totalAmount: s.totalAmount,
        myShare: s.participants.find(p => p.stellarId === myId)?.amount,
        paidBy: s.paidBy,
        date: (s.timestamp as Timestamp)?.toDate().toLocaleDateString()
    }));

    return myPending;
}

async function handleDebts(myId: string, personId: string) {
    const q = query(collection(db, "splitExpenses"), where("paidBy", "==", personId));
    const snapshot = await getDocs(q);
    const splitsPaidByPerson = snapshot.docs.map(d => d.data() as SplitExpense);

    const debts = splitsPaidByPerson.filter(s =>
        s.participants.some(p => p.stellarId === myId && p.status === "PENDING")
    );

    const totalOwed = debts.reduce((acc, s) => {
        const me = s.participants.find(p => p.stellarId === myId);
        return acc + (me?.amount || 0);
    }, 0);

    return {
        totalOwed,
        currency: "XLM",
        personStellarId: personId,
        transactionCount: debts.length
    };
}
