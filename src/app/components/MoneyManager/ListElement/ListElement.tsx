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
