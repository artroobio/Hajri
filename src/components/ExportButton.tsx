import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileSpreadsheet } from 'lucide-react';

interface ExportButtonProps {
    data: any[];
    fileName: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ data, fileName }) => {
    const handleExport = () => {
        // 1. Convert JSON to Worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // 2. Create Workbook and append sheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // 3. Write file and trigger download
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

        saveAs(blob, `${fileName}.xlsx`);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
            title="Download as Excel"
        >
            <FileSpreadsheet size={20} />
            <span>Export to Excel</span>
        </button>
    );
};

export default ExportButton;
