/**
 * Converts an array of objects to CSV format and triggers a download.
 * @param data Array of objects to export
 * @param filename Name of the file to download (without extension)
 */
export const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        console.warn("No data to export");
        return;
    }

    // specific formatting for dates and currency if needed, 
    // but usually better handled by caller or generic stringify.
    // We will extract headers from the first object.
    const headers = Object.keys(data[0]);

    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(fieldName => {
                const value = row[fieldName];
                // Handle strings with commas or quotes
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
