import { ExpensesService } from "@/database/services/expense.service";
import { NextRequest } from "next/server";

export const DELETE = async (req: NextRequest, {params}: {params: {id: string}}) => {

    const id  = params.id;
    if(id === null){
      return Response.json({ message: "Missing id parameter" }, { status: 400 });
    }
    const expensesService = await ExpensesService.getInstance();
    expensesService.deleteExpense(id!);
    return Response.json({ message: id }, { status: 200 });
};