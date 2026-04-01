import * as XLSX from 'xlsx'
import { decryptPersonnummer } from '@/lib/encryption'

export interface ID06ExportRow {
  full_name: string
  personnummer_encrypted: string | null
  course_title: string
  completion_date: string
  final_score: number
  passing_score: number
  certificate_number?: string | null
  id06_registered: boolean
  submitted_at: string
}

export interface ID06ExportRowFormatted {
  Namn: string
  Personnummer: string
  Kurs: string
  Slutdatum: string
  Betyg: string
  Godkändgräns: string
  Certifikatnummer: string
  'ID06-registrerad': string
  Inlämnad: string
}

/**
 * Generate an XLSX buffer for the ID06 export.
 * Decrypts personnummer server-side. Never call from client code.
 */
export function generateID06Export(rows: ID06ExportRow[]): Buffer {
  const formatted: ID06ExportRowFormatted[] = rows.map(row => {
    let personnummer = '(saknas)'
    if (row.personnummer_encrypted) {
      try {
        personnummer = decryptPersonnummer(row.personnummer_encrypted)
      } catch {
        personnummer = '(dekrypteringsfel)'
      }
    }

    return {
      Namn: row.full_name,
      Personnummer: personnummer,
      Kurs: row.course_title,
      Slutdatum: new Date(row.completion_date).toLocaleDateString('sv-SE'),
      Betyg: `${row.final_score}%`,
      Godkändgräns: `${row.passing_score}%`,
      Certifikatnummer: row.certificate_number ?? '',
      'ID06-registrerad': row.id06_registered ? 'Ja' : 'Nej',
      Inlämnad: new Date(row.submitted_at).toLocaleDateString('sv-SE'),
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(formatted)

  worksheet['!cols'] = [
    { wch: 25 }, // Namn
    { wch: 14 }, // Personnummer
    { wch: 35 }, // Kurs
    { wch: 12 }, // Slutdatum
    { wch: 8  }, // Betyg
    { wch: 12 }, // Godkändgräns
    { wch: 20 }, // Certifikatnummer
    { wch: 16 }, // ID06-registrerad
    { wch: 12 }, // Inlämnad
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ID06-export')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
