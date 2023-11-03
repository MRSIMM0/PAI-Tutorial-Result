import { Expense } from "@/types/Expense.types";
import { WithId } from "mongodb";

const API_URL = '/api/expenses'

export const getMonthlyExpenses = async (date: string): Promise<number> => {
    
     const response = await fetch(`${API_URL}/monthly/?date=${date}`);
     const data = await response.json();

     return data.data;   
}

export const getDailyExpenses = async (date: string): Promise<WithId<Expense>[]> => {

    const response = await fetch(`${API_URL}/?date=${date}`);
    const data = await response.json();

    return data.data;
}

export const deleteExpense = async (id: string): Promise<string> => {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const data = await response.json();
    
        return data.message;
}

export const addExpense = async (expense: Expense): Promise<boolean> => {
    const response = await fetch(`${API_URL}`, {
        method: 'POST',
        body: JSON.stringify(expense),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    return data.acknowledged;
}