# Podstawy Aplikacji Internetowych

Fullstackowa aplikacja do zarządzania wydatkami z Next.js.

# Technologie

**Next.js**

**Docker compose**

**MongoDB**

# Wymagania

**Docker**:

- [Windows](https://docs.docker.com/desktop/install/windows-install/)
- [MacOs](https://docs.docker.com/desktop/install/mac-install/)
- [Linuks](https://docs.docker.com/engine/install/ubuntu/)

**Node (** v20.8.0 **):**

- [Windows](https://www.freecodecamp.org/news/nvm-for-windows-how-to-download-and-install-node-version-manager-in-windows-10/)
- [MacOs](https://medium.com/devops-techable/how-to-install-nvm-node-version-manager-on-macos-with-homebrew-1bc10626181)
- [Linuks](https://github.com/nvm-sh/nvm)

******************************Dowolne IDE ([vscode](https://code.visualstudio.com/download))**

# Tworzenie nowego projektu

W celu stworzenia nowego projektu wywołaj komendę

```bash
npx create-next-app@latest
```

Następnie w folderze który został stworzony wykonaj komendę `npm run dev` w celu uruchomienia aplikacji.


Po wykonaniu komendy otwórz przeglądarkę i wejdź na strone `[http://localhost:3000](http://localhost:3000)`


# Baza Danych

Stwórz plik `docker-compose.yml` w głównym folderze (poza src)

Dodaj następującą konfiguracje do pliku `docker-compose.yml`

```docker
version: '3.8'

services:
  mongodb:
    image: mongo
    container_name: mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
    volumes:
      - ./data:/data/db
```

Powyższa konfiguracja zapewnia nam dostęp do bazy danych `MongoDB` na porcie `27017` do której będziesz się logował za pomocą danych admin admin.

Aby uruchomić bazę wykonaj polecenie `docker compose up -d` . Flaga `-d` uruchamia kontener w tle.


Baza danych jest gotowa do połączenia.

Jeżeli będziesz chciał wyłączyć kontener wykonaj polecenie `docker compose down`

W głównym folderze stwórz plik `.env` . W tym pliku przechowywane są zmienne środowiskowe takie jak secret do tokenów czy , jak w naszym przypadku, dane bazy danych. Po stworzeniu folderu dodaj do niego następujące dane:

```
DB_USER=admin
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=27017
```

Wykonaj komendę `npm install mongodb` która doda do projektu bibliotekę `mongodb` która posłuży do połączenia z bazą danych.

W folderze `src` utwórz folder o nazwie `database` a w nim plik `connection.ts`

Dodaj do niego następującą zawartość:

```tsx
import { Db, MongoClient } from 'mongodb';

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
            Database.instance
                .connect()
                .then(() => console.log('Connected to database'))
                .catch((err: Error) => {
                    console.log(err);
                });
        }
        return Database.instance;
    }

    private async connect(): Promise<void> {
        await this.client.connect();
    }

    getDatabase(): Db {
        return this.client.db();
    }
}
```

Powyższy kod tworzy połączenie z bazą danych w formie singletona - przez cały czas działania aplikacji będzię utworzona tylko jedna instancja powyższej klasy.

Teraz stworzymy interfejs który będzie odzwierciedlał strukture pojedyńczego rekordu w bazie danych.

Stwórz folder `src/types` a w nim plik `Expense.types.ts`

```tsx
export interface Expense {
    name: string;
    value: number;
    date: string;
}
```

Kolejnym krokiem jest stworzenie serwisu za pomocą którego będziemy komunikować się z bazą danych.

Stwórz folder `src/database/services` a w nim plik `expense.service.ts` .

```tsx
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
    const [_, month, year] = date.split(".")

    const pattern = new RegExp(`^\\d{1,2}\\.${month}\\.${year}`)

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
```

Powyższa klasa również została zaimplementowana jako singleton. Dostarcza nam funkcjonalności takie jak:

- **addExpense** - dodanie wydatku do konkretnej daty
- **getExpenses** - pobranie wszystkich ó z konkretnej daty
- **getTotalExpenses** - pobranie podsumowania miesięcznego wydatków
- **deleteExpense** - usunięcie wydatku po id

# Backend

Aby zaimplementować backend w Next.js musimy zacząć od stworzenia folderu `api/expenses` w folderze `src/app` i dodania do niego pliku `route.ts`. Ponieważ poszczególne ścieżki odzwierciedlają strukturę folderów. Dzięki temu endpoint będzie dostępny pod adresem `/api/expenses`.

Nazwy poszczególnych funkcji odpowiadają metodom HTTP na które dana funkcja ma odpowiadać. Kolejne endpointy odpowiadają za pobranie wydatków z danego dnia i dodania wydatku.

```tsx
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
```

Następnie dodamy endpoint odpowiedzialny za wyświetalnie miesięcznego podsumowania. Dodajemy folder `src/app/api/expenses/monthly` a w nim plik `route.ts`

```tsx
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
```

Ostatni będzie endpoint odpowiedzialny za usuwanie wydatków. Dodaj folder `src/app/api/expenses/[id]` a w nim plik `route.ts` . Dzięki temu że id jest w nawiasach kwadratowych możemy użyć id jako parametru ścieżki, jest to jedna z funkcji next router.

```tsx
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
```

# Frontend

Zaczniemy od dodania funkcji odpowiadających za komunikację z backend.

Stwórz folder `src/app/actions` a w nim plik `expenses.ts`. W którym będzie znajdowała się logika odpowiedzialna za komunikację z backendem.

```tsx
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
```

Teraz zajmiemy się tworzeniem komponentów. Next.js bazuje na React.js więc tworzenie komponentów wygląda tak samo.

Stwórz folder `components` w folderze `src/app`.

Musisz stworzyć 4 komponenty.

- Indykator ładowania
- Podsumowanie miesięczne wydatków (ile w sumie zostało wydane)
- Element listy wydatków z danego dnia
- ‘Opakowanie’ na liste wydatków i pola do wprowadzania wydatków

Pierwszym komponentem będzie Indykator ładowania

W folderze `src/app` dodaj plik `loading.ts` . Ten komponent ma wskazywać na ładownie danego elementu aplikacji.

```tsx
import React from 'react'
import styles from './page.module.css'

export default function loading() {
  return (
    <div className={styles.loader}>Loading...</div>
  )
}
```

Następnym komponentem będzie miesięczne podsumowanie wydatków.

Stwórz folder `src/app/components/MonthlySpending` i utwórz w nim plik `MonthlySpending.ts` 

Ten komponent ma przyjmować w props (argumenty przyjmowane przez komponent) miesięczne wydatki i wyświetlać podsumowanie tych wydatków.

```tsx
import React from 'react'

export interface MonthlySpendingProps {
    expenses: number
}

export default function MonthlySpending({expenses}: MonthlySpendingProps) {
  return (
    <h2>You spent {expenses} this month</h2>
  )
}
```

Kolejnymi komponentami będą wyżej wspomniane ‘Opakowanie’ i Element listy

Stwórz folder `src/app/components/MoneyManager` i pliki `MoneyManger.ts` oraz `MoneyManager.module.css` . Ten komponent ma za zadanie wyświetlić listę wydatków w danym dniu, oraz umożliwić dodanie nowych wydatków.

```tsx
'use client'
import React, { useEffect } from "react";
import styles from "./MoneyManger.module.css";
import { getDailyExpenses } from "@/app/actions/expenses";
import ListElement from "./ListElement/ListElement";
import Loading from "@/app/loading";
import { Expense } from "@/types/Expense.types";

interface MoneyManagerProps {date: string, onAddExpense:  (name: string, value: number, date: string) => Promise<Boolean>, onDeleteExpense: (id: string) => Promise<void> }

export default function MoneyManager({date, onAddExpense, onDeleteExpense}: MoneyManagerProps) {
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState<number|string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);

  useEffect(() => {
    updateExpenses(date).then((exp) => {
      setExpenses(exp);
      setIsLoading(false);
    });
  }, [date]);

  const updateExpenses = async (date: string) => {
    return (await getDailyExpenses(date));
  }
  
  const handleDeleteExpense = (id: string, date: string) => {
    onDeleteExpense(id).then(() => {
      updateExpenses(date).then((expenses) => {setExpenses(expenses)});
    })
  }

  const handleAddExpense = (name: string, value: number, date: string) => {
    onAddExpense(name, value, date ).then(() => {
      setName("");
      setValue("");
      updateExpenses(date).then((expenses) => {setExpenses(expenses)});
    });
  }

  const displayExpenses = () => {
    if (isLoading) {
      return <Loading />;
    } else {
      return expenses.length ? expenses.map((expense) => (
        <ListElement
          key={expense._id.toString()}
          name={expense.name}
          value={expense.value}
          onDelete={() => handleDeleteExpense(expense._id.toString(), date)}
        />
      )) : <h2>No expenses</h2>;
    }
  }

  return (
    <div className={styles.main}>
      <aside className={styles.scrollView}>
        {displayExpenses()}
      </aside>
      <aside className={styles.inputGroup}>
        <h3>Add Expense</h3>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
        />
        <input
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          type="number"
          placeholder="Value"
        />
        <button
          disabled={name==='' || value===''}
          onClick={() => {
            handleAddExpense(name, value as number, date)
          }}
        >
          Add
        </button>
      </aside>
    </div>
  );
}
```

W powyższym kodzie dzieje się dość dużo - więc rozbijmy go na mniejsze fragmenty.

Na samym początku pliku widać `‘use client’`. Ten fragment mówi next że ten komponent nie jest komponentem serwerowym - wartość nie jest generowana na serwerze tylko u klienta.

Następnie definujemy stany aplikacji, służy do tego funkcja `useState()`, która domyślnie zwraca tablicę `[stan, setterStanu]` .

```tsx
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState<number|string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [expenses, setExpenses] = React.useState<React.ReactElement[]>([]);
```

Kolejna funkcja `useEffect` odpowiada za zmienianie zawartości komponentów po zmianie wybranej daty.

```tsx
  useEffect(() => {
    updateExpenses(date).then((exp) => {
      setExpenses(exp);
      setIsLoading(false);
    });
  }, [date]);
```

`[date]` wskazuje na to że zawartość zostanie wykonana kiedy zmieni się stan pola `date`.

Funkcja `updateExpenses` odpowiada za pobranie komponentów z backend. Funkcja `getDailyExpnenses` zastała zaimplementowana wcześniej. 

```tsx
  const updateExpenses = async (date: string) => {
	    return (await getDailyExpenses(date));
	  }
  }
```

Kolejna funkcja `handleDeleteExpense` odpowiada za usunięcie pojedynczego wydatku. Wykonuje funkcję `onDeleteExpense` która została przekazana do komponentu, a  `updateExpenses` w celu zaktualizowania listy wydatków.

```tsx
  const handleDeleteExpense = (id: string, date: string) => {
    onDeleteExpense(id).then(() => {
      updateExpenses(date).then((expenses) => {setExpenses(expenses)});
    })
  }
```

Ostatnia funkcja służy do wyświetlania zawartości listy wydatków. Jeżeli wydatki nie zostały wczytane wyświetla się komponent `<Loading />` , jeżeli wydatki są wczytane generowana jest lista wydatków. Komponent `<ListElemet />` zostanie dodany w następnym kroku.

```tsx
  const displayExpenses = () => {
    if (isLoading) {
      return <Loading />;
    } else {
      return expenses.length ? expenses.map((expense) => (
        <ListElement
          key={expense._id.toString()}
          name={expense.name}
          value={expense.value}
          onDelete={() => handleDeleteExpense(expense._id.toString(), date)}
        />
      )) : <h2>No expenses</h2>;
    }
  }
```

Style:

```css
.main{
    width: 100%;
    height: 400px;
    min-width: 700px;
    border-radius: 10px;
    padding: 10px;
    -webkit-box-shadow: 0px 0px 15px 0px rgba(66, 68, 90, 0.52);
    -moz-box-shadow: 0px 0px 15px 0px rgba(66, 68, 90, 0.52);
    box-shadow: 0px 0px 15px 0px rgba(66, 68, 90, 0.52);

    display: grid;
    grid-template-columns: 65% 35%;
}

.scrollView{
    padding: 10px;
    width: 100%;
    height: 94%;
    border-radius: 10px;
    display: flex; 
     flex-direction: column; 
    gap: 10px;
    overflow-y: auto;
    overflow-x: unset;
}

.inputGroup{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.inputGroup > input {
    width: 200px;
    height: 1.5em;
    padding: 5px;
    border-radius: 5px;
    outline: none;
    border: 1px solid rgba(66, 68, 90, 0.52);
    font-size: 1.1em;
}

.inputGroup > button {
    margin-top: auto;
    margin-bottom: 50px;
    width: 100px;
    height: 40px;
    font-size: 1.4em;
    border-radius: 10px;
    border: 1px solid rgba(66, 68, 90, 0.52);
    cursor: pointer;
    transition: all 200ms ease-in-out;
    color: rgba(66, 68, 90, 0.52);;
}

.inputGroup > button:disabled {
    cursor: not-allowed !important;
    border: 1px solid rgba(66, 68, 90, 0.52) !important;
    background-color: transparent !important;
    color: rgba(92, 93, 102, 0.52) !important;
}

.inputGroup > button:hover {
    background-color: rgba(66, 68, 90, 0.52);
    color: white;
}
```

Ostatnim komponentem będzie Element listy wydatków.

Stwórz folder `src/app/components/MoneyManager/ListElement` następnie dodaj pliki `ListElement.ts` i `ListElement.module.css`

```tsx
import React from 'react'
import styles from './ListElement.module.css'

export interface ListElementProps {
    name: string,
    value: number
    onDelete: () => void
}

export default function ListElement({ name, value, onDelete }: ListElementProps) {
  return (
    <div className={styles.main}>
        <div><strong>Name:</strong> {name}</div>
        <div><strong>Value:</strong> {value}</div>
        <div className={styles.x} onClick={() => onDelete()}><strong>X</strong></div>
    </div>
  )
}
```

Style:

```css
.main{
    width: 90%;
    display: flex;
    padding: 10px;
    border-radius: 10px;
    gap: 10px;
    align-items: center;
    justify-content: center;
    -webkit-box-shadow: 0px 0px 3px 0px rgba(66, 68, 90, 0.52);
    -moz-box-shadow: 0px 0px 3px 0px rgba(66, 68, 90, 0.52);
    box-shadow: 0px 0px 3px 0px rgba(66, 68, 90, 0.52);
}

.x{
    margin-left: auto;
    cursor: pointer;
}
```

Routing w Next.js jest zaimplementowany za pomocą struktury folderów. Wszystkie foldery które są w `src/app` są potencjalnymi ścieżkami. Aby zasygnalizować że dany folder ma być interpretowany jako ścieżka musi zawierać plik `page.ts`

Otwórz folder `src/app` i usuń zawartość pliku `global.css` i `page.module.css`.

```css
.calendarWrapper {
  padding: 10px;
  width: max-content;
  -webkit-box-shadow: 0px 0px 15px 0px rgba(66, 68, 90, 0.52);
  -moz-box-shadow: 0px 0px 15px 0px rgba(66, 68, 90, 0.52);
  box-shadow: 0px 0px 15px 0px rgba(66, 68, 90, 0.52);
  border-radius: 10px;
  height: max-content;
}

.calendarWrapper > div {
  border: none;
}

.main {
  width: 100%;
  height: 80vh;

  display: grid;
  grid-template-columns: 600px 400px;
  justify-content: center;
  align-items: center;;
}

.aside{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  
}

.loader{
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: linear-gradient(90deg, rgba(200, 200, 200, 0.199) 0%, rgba(223, 223, 223, 0.712) 100%);
  border-radius: 10px;
  height: 100%;
  transition: all 200ms ease-in-out;
}

.monthlySpendingWrapper{
  height: 60px;
  width:  600px
}

.background{
  z-index: -1;
}
```

Plik `page.ts` to głowny plik naszego projektu. Tu składamy w całość wszystkie komponenty w jedną aplikację. Jako że plik ten znajduje się w `src/app/page.ts` to strona ta będzie widoczna pod domyślną ścieżką `/` .

Wykonaj polecenie `npm install react-calendar` aby zainstalować bibliotekę do kalendarza.

```tsx
'use client';

import styles from './page.module.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import MoneyManager from './components/MoneyManager/MoneyManager';
import MonthlySpending from './components/MonthlySpending/MonthlySpending';
import { Suspense, useEffect, useState } from 'react';
import Loading from './loading';
import { addExpense, deleteExpense, getMonthlyExpenses } from './actions/expenses';

export default function Home() {
    const [date, setDate] = useState(new Date().toLocaleDateString('pl-PL'));
    const [monthlyExpenses, setMonthlyExpenses] = useState(0);
		
    useEffect(() => {
        getMonthlyExpenses(date).then((expenses) => {
            setMonthlyExpenses(expenses);
        });
    }, [date]);

    const handleAddExpense = async (name: string, value: number, date: string) => {
        return addExpense({ name, value, date }).then(() => {
            setMonthlyExpenses((state) => state + value);
        });
    };

    const handleDeleteExpense = (id: string) => {
        return deleteExpense(id).then(() => {
            getMonthlyExpenses(date).then((expenses) => {
                setMonthlyExpenses(expenses);
            });
        });
    };

    return (
        <main className={styles.main}>
            <section className={styles.calendarWrapper}>
                <Calendar onClickDay={(value) => setDate(value.toLocaleDateString('pl-PL'))} />
            </section>
            <aside className={styles.aside}>
                <div className={styles.monthlySpendingWrapper}>
                    <MonthlySpending expenses={monthlyExpenses} />
                </div>
                <MoneyManager
                    onDeleteExpense={(id) => handleDeleteExpense(id)}
                    onAddExpense={(name, value, date) => handleAddExpense(name, value, date)}
                    date={date}
                />
            </aside>
        </main>
    );
}
```

Ten komponent również nie jest komponentem serwerowym więc na początku pliku znajduje sie `‘use client’`. 

Ustalenie stanów początkowych aplikacji. Datę ustawiamy na dzisiejszy dzień.

```css
    const [date, setDate] = useState(new Date().toLocaleDateString('pl-PL'));
    const [monthlyExpenses, setMonthlyExpenses] = useState(0);
```

W tym przypadku funkcja `useEffect` nasłuchuje zmian w stanie `date`, aby ustalić miesięczne wydatki.

```tsx
useEffect(() => {
        getMonthlyExpenses(date).then((expenses) => {
            setMonthlyExpenses(expenses);
        });
    }, [date]);
```

Funkcja `handleAddExpense` obsługuje dodanie wydatku i jest przekazywana do komponentu `MoneyManager`. Po dodaniu wydatku powiększa miesięczne wydatki o dodaną wartość.

```tsx
const handleAddExpense = async (name: string, value: number, date: string) => {
        return addExpense({ name, value, date }).then(() => {
            setMonthlyExpenses((state) => state + value);
        });
    };

```

Funkcja `handleDeleteExpense` obsługuje usunięcie wydatku i również jest przekazywana do komponentu `MoneyManager`. Po usunięciu wydatku ponownie pobiera miesięczne wydatki.

```tsx
Funckja handleDeleteExpense
    const handleDeleteExpense = (id: string) => {
        return deleteExpense(id).then(() => {
            getMonthlyExpenses(date).then((expenses) => {
                setMonthlyExpenses(expenses);
            });
        });
    };
```

KONIEC!

Przed uruchomieniem aplikacji upewnij się że kontener z bazą danych jest uruchomiony.

Uruchom aplikację komendą

```bash
npm run dev
```

