import { ExpensesService } from "@/database/services/expense.service";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
    const date  = req.nextUrl.searchParams.get("date");
    if(date === null){
        return Response.json({ message: "Missing date parameter" }, { status: 400 });
    }
    const expensesService = await ExpensesService.getInstance();
    const result = await expensesService.getTotalExpenses(date);
    
    return Response.json({ data: result }, { status: 200 });
}