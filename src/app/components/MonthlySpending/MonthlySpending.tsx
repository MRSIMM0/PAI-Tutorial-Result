import React from 'react'

export interface MonthlySpendingProps {
    expenses: number
}

export default function MonthlySpending({expenses}: MonthlySpendingProps) {
  return (
    <h2>You spent {expenses} this month</h2>
  )
}
