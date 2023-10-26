import { ExpensesService } from "@/database/services/expense.service";
import { Expense } from "@/types/Expense.types";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const date  = req.nextUrl.searchParams.get("date");
  if(date === null){
    return Response.json({ message: "Missing date parameter" }, { status: 400 });
  }
  const expensesService = await ExpensesService.getInstance();
  const result = await expensesService.getExpenses(date);

  return Response.json({ data: result }, { status: 200 });
}

export const POST = async (req: NextRequest) => {
  const { name, value, date }: Expense = await req.json();

  if (name === undefined || value === undefined || date === undefined) {
    return Response.json({ message: "Missing parameters" }, { status: 400 });
  }

  if (typeof value !== "number") {
    return Response.json(
      { message: "Value must be a number" },
      { status: 400 }
    );
  }

  const expensesService = await ExpensesService.getInstance();
  const result = await expensesService.addExpense({ name, value, date });

  return Response.json({ acknowledged: result.acknowledged }, { status: 201 });
};