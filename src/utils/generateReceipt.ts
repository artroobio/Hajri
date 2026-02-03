import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PaymentData {
    id: string
    payment_date: string
    amount: number
    method?: string
    status?: string // e.g. 'completed'
    planName?: string // Optional, pass if available
}

interface MemberData {
    full_name: string
    phone?: string
}

export const generateReceipt = (payment: PaymentData, member: MemberData, settings?: { name?: string, address?: string }) => {
    const doc = new jsPDF()

    const title = settings?.name || 'Project Site'
    const subtitle = 'Construction Management'

    // 1. Header - Project/Company Name
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text(title, 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, 14, 28)

    if (settings?.address) {
        doc.text(settings.address, 14, 34)
    }

    // 2. Title - RECEIPT
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('RECEIPT', 140, 22, { align: 'left' }) // Position on right side

    // 3. Receipt Details (Right aligned under title)
    doc.setFontSize(10)
    doc.text(`Receipt #: ${payment.id.slice(0, 8).toUpperCase()}`, 140, 30)
    doc.text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 140, 36)
    if (payment.method) {
        doc.text(`Method: ${payment.method}`, 140, 42)
    }

    // 4. Billed To (Left side)
    doc.text('Billed To:', 14, 50)
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(member.full_name, 14, 56)
    if (member.phone) {
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(member.phone, 14, 62)
    }

    // 5. Table - Item & Amount
    // Define columns and rows
    const tableColumn = ["Item / Description", "Amount"]
    const tableRows = [
        [
            payment.planName || 'Wage / Advance Payment',
            `Rs. ${payment.amount.toLocaleString()}`
        ]
    ]

    // Use autoTable to generate
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] }, // Dark gray header
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 40, halign: 'right' }
        }
    })

    // 6. Total Amount
    // @ts-ignore - finalY exists in autoTable results
    const finalY = doc.lastAutoTable.finalY + 10

    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total Paid: Rs. ${payment.amount.toLocaleString()}`, 140, finalY, { align: 'left' })

    // 7. Footer
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text('Thank you for your hard work!', 105, 280, { align: 'center' })
    doc.text(title, 105, 285, { align: 'center' })

    // 8. Save
    doc.save(`receipt-${payment.id.slice(0, 8)}.pdf`)
}
