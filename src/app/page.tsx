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

    useEffect(() => {
        getMonthlyExpenses(date).then((expenses) => {
            setMonthlyExpenses(expenses);
        });
    }, [date]);

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
