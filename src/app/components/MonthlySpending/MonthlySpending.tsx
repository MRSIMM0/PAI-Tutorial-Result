import { getMontylyExpenses } from '@/app/actions/expenses'
import React from 'react'

export interface MonthlySpendingProps {
    date: string
}

const getData = async (date: string) => {
  const res = await getMontylyExpenses(date);
  return res;
}

export default function MonthlySpending({date}: MonthlySpendingProps) {
  return (
    <h2>You spent {getData(date)} this month</h2>
  )
}
