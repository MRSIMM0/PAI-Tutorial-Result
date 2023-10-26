import { Db, WithId, ObjectId } from "mongodb";
import { Database } from "../connection";
import { Expense } from "@/types/Expense.types";

export class ExpensesService {
  private static instance: ExpensesService;
  private db!: Db | null;

  private constructor() {
    Database.getInstance()
      .then((database: Database) => {
        this.db = database.getDatabase();
      })
      .catch((err: Error) => {
        this.db = null;
        console.error(err);
      });
  }

  public static async getInstance(): Promise<ExpensesService> {
    if (!ExpensesService.instance) {
      ExpensesService.instance = new ExpensesService();
    }

    return ExpensesService.instance;
  }

  public async addExpense(expense: Expense) {
    if (!this.db) {
      throw new Error("Database connection not established");
    }

    const collection = this.db.collection("expenses");
    return await collection.insertOne(expense);
  }

  public async getExpenses(date: string): Promise<Expense[]> {
    if (!this.db) {
      throw new Error("Database connection not established");
    }

    const collection = this.db.collection("expenses");
    return await collection.find<WithId<Expense>>({ date: date }).toArray();
  }

  public async getTotalExpenses(date: string): Promise<number> {
    if (!this.db) {
      throw new Error("Database connection not established");
    }

    const collection = this.db.collection("expenses");

    const [_, month, year] = date.split("/")

    const pattern = new RegExp(`^\\d{1,2}\\/${month}\\/${year}`)

    const expenses = await collection.find({ date: {$regex: pattern} }).toArray()

    return expenses.reduce((acc, expense) => acc + expense.value, 0);
  }

  public async deleteExpense(id: string): Promise<boolean> {
    if (!this.db) {
      throw new Error("Database connection not established");
    }
    const _id = new ObjectId(id);
    const collection = this.db.collection("expenses");
    const result = await collection.deleteOne({ _id: _id });
    return result.acknowledged;
  }
}
