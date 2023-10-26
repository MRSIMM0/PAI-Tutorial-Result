import React from 'react'
import styles from './ListElement.module.css'
import Image from 'next/image'

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
        <Image onClick={() => onDelete()} width={15} height={20} src='/trash.svg' alt='' />
    </div>
  )
}
