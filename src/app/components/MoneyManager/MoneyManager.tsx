'use client'
import React, { useEffect } from "react";
import styles from "./MoneyManger.module.css";
import { addExpense, deleteExpense, getDailyExpenses } from "@/app/actions/expenses";
import ListElement from "./ListElement/ListElement";
import { tree } from "next/dist/build/templates/app-page";
import Loading from "@/app/loading";

export default function MoneyManager({date}: {date: string}) {
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState<number|string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [expenses, setExpenses] = React.useState<React.ReactElement[]>([]);

  const updateExpenses = async (date: string) => {
    return (await getDailyExpenses(date)).map((expense) => (
          <ListElement
            key={expense._id.toString()}
            name={expense.name}
            value={expense.value}
            onDelete={() => handleDeleteExpense(expense._id.toString(), date)}
          />
        ))
  }
  
  const handleDeleteExpense = (id: string, date: string) => {
    deleteExpense(id).then(() => {
      updateExpenses(date).then((expenses) => {setExpenses(expenses)});
    }).catch((error) => {
      console.error(error);
    });
  }

  const handleAddExpense = (name: string, value: number, date: string) => {
    addExpense({ name, value, date }).then(() => {
      setName("");
      setValue("");
      updateExpenses(date).then((expenses) => {setExpenses(expenses)});
    });
  }
  

  useEffect(() => {
    updateExpenses(date).then((exp) => {
      setExpenses(exp);
      setIsLoading(false);
    });
  }, [date]);

  const displayExpenses = () => {
    if (isLoading) {
      return <Loading />;
    } else {
      return expenses.length ? expenses : <h2>No expenses</h2>;
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
