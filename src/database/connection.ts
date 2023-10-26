import { Db, MongoClient } from "mongodb";

export class Database {
  private static instance: Database;
  private client: MongoClient;
  private uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}`;

  private constructor() {
    this.client = new MongoClient(this.uri);
  }

  public static async getInstance(): Promise<Database> {
    if (!Database.instance) {
      Database.instance = new Database();
      Database.instance.connect().catch((err: Error) => {console.log(err)});
    }
    console.log("Connected to database")
    return Database.instance;
  }

  private async connect(): Promise<void> {
    await this.client.connect();
  }

  getDatabase(): Db{
    return this.client.db();
  }

}