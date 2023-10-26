"use client";

import styles from "./page.module.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import MoneyManager from "./components/MoneyManager/MoneyManager";
import MonthlySpending from "./components/MonthlySpending/MonthlySpending";
import { Suspense, useState } from "react";
import Loading from "./loading";

export default function Home() {
  const [date, setDate] = useState(new Date().toLocaleDateString());

  return (
    <main className={styles.main}>
      <section className={styles.calendarWrapper}>
        <Calendar onClickDay={(value) => setDate(value.toLocaleDateString())} />
      </section>
          <aside className={styles.aside}>
          <div className={styles.monthlySpendingWrapper}>
          <Suspense fallback={<Loading />}>
            <MonthlySpending date={date} />
          </Suspense>
          </div>
            <MoneyManager date={date} />
          </aside>
          {/* <div className={styles.background}>
            <Image quality={100} fill src='/tlo.jpg' alt=""/>
          </div> */}
    </main>
  );
}
