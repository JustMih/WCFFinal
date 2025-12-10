import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Modal, Box, Typography, Checkbox, ListItemText, Button, Divider } from '@mui/material';
import { FiSettings, FiDownload, FiFileText } from "react-icons/fi";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Districts data organized by region
const districtsByRegion = {
  "HQ": [
    { value: "HQ", label: "HQ" }
  ],
  "arusha": [
    { value: "arusha-city", label: "Arusha City" },
    { value: "arusha-rural", label: "Arusha Rural" },
    { value: "karatu", label: "Karatu" },
    { value: "longido", label: "Longido" },
    { value: "meru", label: "Meru" },
    { value: "monduli", label: "Monduli" },
    { value: "ngorongoro", label: "Ngorongoro" }
  ],
  "dar-es-salaam": [
    { value: "ilala", label: "Ilala" },
    { value: "kinondoni", label: "Kinondoni" },
    { value: "temeke", label: "Temeke" },
    { value: "kigamboni", label: "Kigamboni" },
    { value: "ubungo", label: "Ubungo" }
  ],
  "dodoma": [
    { value: "dodoma-city", label: "Dodoma City" },
    { value: "dodoma-rural", label: "Dodoma Rural" },
    { value: "bahi", label: "Bahi" },
    { value: "chamwino", label: "Chamwino" },
    { value: "chemba", label: "Chemba" },
    { value: "kongwa", label: "Kongwa" },
    { value: "mpwapwa", label: "Mpwapwa" },
    { value: "kondoa", label: "Kondoa" }
  ],
  "mwanza": [
    { value: "mwanza-city", label: "Mwanza City" },
    { value: "ilemela", label: "Ilemela" },
    { value: "nyamagana", label: "Nyamagana" },
    { value: "buchosa", label: "Buchosa" },
    { value: "magu", label: "Magu" },
    { value: "misungwi", label: "Misungwi" },
    { value: "kwimba", label: "Kwimba" },
    { value: "ukerewe", label: "Ukerewe" },
    { value: "sengerema", label: "Sengerema" }
  ],
  "mbeya": [
    { value: "mbeya-city", label: "Mbeya City" },
    { value: "mbeya-rural", label: "Mbeya Rural" },
    { value: "chunya", label: "Chunya" },
    { value: "kyela", label: "Kyela" },
    { value: "mbarali", label: "Mbarali" },
    { value: "rujewa", label: "Rujewa" }
  ],
  "kilimanjaro": [
    { value: "moshi-city", label: "Moshi City" },
    { value: "moshi-rural", label: "Moshi Rural" },
    { value: "hai", label: "Hai" },
    { value: "siha", label: "Siha" },
    { value: "rombo", label: "Rombo" },
    { value: "mwanga", label: "Mwanga" },
    { value: "same", label: "Same" }
  ],
  "tanga": [
    { value: "tanga-city", label: "Tanga City" },
    { value: "tanga-rural", label: "Tanga Rural" },
    { value: "muheza", label: "Muheza" },
    { value: "pangani", label: "Pangani" },
    { value: "handeni", label: "Handeni" },
    { value: "kilindi", label: "Kilindi" },
    { value: "korogwe", label: "Korogwe" },
    { value: "lushoto", label: "Lushoto" },
    { value: "mkinga", label: "Mkinga" }
  ],
  "morogoro": [
    { value: "morogoro-city", label: "Morogoro City" },
    { value: "morogoro-rural", label: "Morogoro Rural" },
    { value: "kilosa", label: "Kilosa" },
    { value: "ulanga", label: "Ulanga" },
    { value: "kilombero", label: "Kilombero" },
    { value: "malinyi", label: "Malinyi" },
    { value: "gairo", label: "Gairo" },
    { value: "mvomero", label: "Mvomero" }
  ],
  "geita": [
    { value: "geita", label: "Geita" },
    { value: "nyang'hwale", label: "Nyang'hwale" },
    { value: "chato", label: "Chato" },
    { value: "mbogwe", label: "Mbogwe" },
    { value: "bukombe", label: "Bukombe" }
  ],
  "iringa": [
    { value: "iringa-rural", label: "Iringa Rural" },
    { value: "kilolo", label: "Kilolo" },
    { value: "mufindi", label: "Mufindi" },
    { value: "iringa-urban", label: "Iringa Urban" }
  ],
  "kagera": [
    { value: "bukoba-rural", label: "Bukoba Rural" },
    { value: "bukoba-urban", label: "Bukoba Urban" },
    { value: "karagwe", label: "Karagwe" },
    { value: "kibondo", label: "Kibondo" },
    { value: "kakonko", label: "Kakonko" },
    { value: "muleba", label: "Muleba" },
    { value: "ngara", label: "Ngara" },
    { value: "biharamulo", label: "Biharamulo" }
  ],
  "katavi": [
    { value: "mpanda-rural", label: "Mpanda Rural" },
    { value: "mpanda-urban", label: "Mpanda Urban" },
    { value: "mlele", label: "Mlele" }
  ],
  "kigoma": [
    { value: "kigoma-rural", label: "Kigoma Rural" },
    { value: "kigoma-urban", label: "Kigoma Urban" },
    { value: "kasulu", label: "Kasulu" },
    { value: "buhigwe", label: "Buhigwe" },
    { value: "ulongwe", label: "Ulongwe" }
  ],
  "lindi": [
    { value: "lindi-rural", label: "Lindi Rural" },
    { value: "lindi-urban", label: "Lindi Urban" },
    { value: "kilwa", label: "Kilwa" },
    { value: "liwale", label: "Liwale" },
    { value: "ruangwa", label: "Ruangwa" },
    { value: "nachingwea", label: "Nachingwea" }
  ],
  "manyara": [
    { value: "babati-rural", label: "Babati Rural" },
    { value: "babati-urban", label: "Babati Urban" },
    { value: "hanang", label: "Hanang" },
    { value: "kiteto", label: "Kiteto" },
    { value: "mbulu", label: "Mbulu" },
    { value: "simanjiro", label: "Simanjiro" }
  ],
  "mara": [
    { value: "musoma-rural", label: "Musoma Rural" },
    { value: "musoma-urban", label: "Musoma Urban" },
    { value: "tarime", label: "Tarime" },
    { value: "serengeti", label: "Serengeti" },
    { value: "bunda", label: "Bunda" },
    { value: "butiama", label: "Butiama" },
    { value: "rorya", label: "Rorya" }
  ],
  "mtwara": [
    { value: "mtwara-rural", label: "Mtwara Rural" },
    { value: "mtwara-urban", label: "Mtwara Urban" },
    { value: "masasi", label: "Masasi" },
    { value: "newala", label: "Newala" },
    { value: "tandahimba", label: "Tandahimba" },
    { value: "nanyumbu", label: "Nanyumbu" }
  ],
  "njombe": [
    { value: "njombe-rural", label: "Njombe Rural" },
    { value: "njombe-urban", label: "Njombe Urban" },
    { value: "wanging'ombe", label: "Wanging'ombe" },
    { value: "ludewa", label: "Ludewa" },
    { value: "makete", label: "Makete" }
  ],
  "pwani": [
    { value: "kibaha-rural", label: "Kibaha Rural" },
    { value: "kibaha-urban", label: "Kibaha Urban" },
    { value: "bagamoyo", label: "Bagamoyo" },
    { value: "kisarawe", label: "Kisarawe" },
    { value: "mkuranga", label: "Mkuranga" },
    { value: "rufiji", label: "Rufiji" },
    { value: "kibiti", label: "Kibiti" }
  ],
  "rukwa": [
    { value: "sumbawanga-rural", label: "Sumbawanga Rural" },
    { value: "sumbawanga-urban", label: "Sumbawanga Urban" },
    { value: "nkcasi", label: "Nkasi" },
    { value: "kalambo", label: "Kalambo" }
  ],
  "ruvuma": [
    { value: "songea-rural", label: "Songea Rural" },
    { value: "songea-urban", label: "Songea Urban" },
    { value: "tunduru", label: "Tunduru" },
    { value: "namtumbo", label: "Namtumbo" },
    { value: "nyasa", label: "Nyasa" },
    { value: "mbinga", label: "Mbinga" }
  ],
  "shinyanga": [
    { value: "shinyanga-rural", label: "Shinyanga Rural" },
    { value: "shinyanga-urban", label: "Shinyanga Urban" },
    { value: "kahama", label: "Kahama" },
    { value: "kishapu", label: "Kishapu" },
    { value: "maswa", label: "Maswa" },
    { value: "meatu", label: "Meatu" }
  ],
  "simiyu": [
    { value: "bariadi", label: "Bariadi" },
    { value: "busega", label: "Busega" },
    { value: "itilima", label: "Itilima" }
  ],
  "singida": [
    { value: "singida-rural", label: "Singida Rural" },
    { value: "singida-urban", label: "Singida Urban" },
    { value: "ikungi", label: "Ikungi" },
    { value: "manyoni", label: "Manyoni" },
    { value: "mkalama", label: "Mkalama" },
    { value: "itigi", label: "Itigi" }
  ],
  "songwe": [
    { value: "ileje", label: "Ileje" },
    { value: "mbozi", label: "Mbozi" }
  ],
  "tabora": [
    { value: "tabora-urban", label: "Tabora Urban" },
    { value: "tabora-rural", label: "Tabora Rural" },
    { value: "igunga", label: "Igunga" },
    { value: "uroki", label: "Uroki" },
    { value: "sikonge", label: "Sikonge" },
    { value: "kaliua", label: "Kaliua" }
  ],
  "zanzibar-urban": [
    { value: "magharibi", label: "Magharibi" },
    { value: "kaskazini-unguja", label: "Kaskazini Unguja" },
    { value: "kusini-unguja", label: "Kusini Unguja" },
    { value: "mjini-magharibi", label: "Mjini Magharibi" }
  ],
  "zanzibar-rural": [
    { value: "kaskazini-pemba", label: "Kaskazini Pemba" },
    { value: "kusini-pemba", label: "Kusini Pemba" },
    { value: "mjini-kaskazini", label: "Mjini Kaskazini" },
    { value: "wete", label: "Wete" },
    { value: "chake-chake", label: "Chake Chake" },
    { value: "mkoani", label: "Mkoani" }
  ]
};

const TableControls = ({
  itemsPerPage,
  onItemsPerPageChange,
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterRegion,
  onFilterRegionChange,
  filterDistrict,
  onFilterDistrictChange,
  showAllOption = true,
  searchPlaceholder = "Search by name, phone, NIN, ticket number, institution",
  statusOptions = [
    { value: "", label: "All" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" }
  ],
  regionOptions = [
    { value: "", label: "All Regions" },
    { value: "HQ", label: "HQ" },
    { value: "arusha", label: "Arusha" },
    { value: "dar-es-salaam", label: "Dar es Salaam" },
    { value: "dodoma", label: "Dodoma" },
    { value: "geita", label: "Geita" },
    { value: "iringa", label: "Iringa" },
    { value: "kagera", label: "Kagera" },
    { value: "katavi", label: "Katavi" },
    { value: "kigoma", label: "Kigoma" },
    { value: "kilimanjaro", label: "Kilimanjaro" },
    { value: "lindi", label: "Lindi" },
    { value: "Manyara", label: "Manyara" },
    { value: "Mara", label: "Mara" },
    { value: "Mbeya", label: "Mbeya" },
    { value: "Morogoro", label: "Morogoro" },
    { value: "Mtwara", label: "Mtwara" },
    { value: "Mwanza", label: "Mwanza" },
    { value: "Njombe", label: "Njombe" },
    { value: "Pemba North", label: "Pemba North" },
    { value: "Pemba South", label: "Pemba South" },
    { value: "Pwani", label: "Pwani" },
    { value: "Rukwa", label: "Rukwa" },
    { value: "Ruvuma", label: "Ruvuma" },
    { value: "Shinyanga", label: "Shinyanga" },
    { value: "Simiyu", label: "Simiyu" },
    { value: "Singida", label: "Singida" },
    { value: "Songwe", label: "Songwe" },
    { value: "Tabora", label: "Tabora" },
    { value: "Tanga", label: "Tanga" },
    { value: "Unguja North", label: "Unguja North" },
    { value: "Unguja South", label: "Unguja South" }
  ],
  activeColumns: initialActiveColumns,
  onColumnsChange,
  onExportPDF,
  onExportCSV,
  tableData = [],
  tableTitle = "Table Data"
}) => {
  const defaultColumns = ["ticket_id", "fullName", "phone_number", "region", "status"];
  
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [activeColumns, setActiveColumns] = useState(
    initialActiveColumns || defaultColumns
  );

  // Update activeColumns when initialActiveColumns prop changes
  useEffect(() => {
    if (initialActiveColumns) {
      setActiveColumns(initialActiveColumns);
    }
  }, [initialActiveColumns]);

  // Debug: Log filterRegion changes and find matching option
  useEffect(() => {
    console.log("filterRegion prop changed to:", filterRegion, "Type:", typeof filterRegion);
    if (filterRegion && regionOptions) {
      const matchingOption = regionOptions.find(opt => {
        const optValue = String(opt.value || "");
        const filterValue = String(filterRegion || "");
        return optValue === filterValue;
      });
      console.log("Matching option found:", matchingOption);
      if (!matchingOption && filterRegion !== "") {
        console.log("No matching option found! Available values:", regionOptions.map(opt => opt.value));
      }
    }
  }, [filterRegion, regionOptions]);

  // Handle region change and reset district
  const handleRegionChange = (e) => {
    const selectedValue = e.target.value;
    console.log("Region selected:", selectedValue); // Debug log
    // Ensure we pass the event properly with the correct value
    // The region change handler now handles district reset internally
    if (onFilterRegionChange) {
      // Pass the event directly - React synthetic events work correctly
      onFilterRegionChange(e);
    }
    // Note: District reset is now handled in the parent component's onFilterRegionChange handler
    // to avoid race conditions with state updates
  };

  // Get available districts for the selected region
  const getAvailableDistricts = () => {
    if (!filterRegion) {
      return [{ value: "", label: "All Districts" }];
    }
    
    const regionDistricts = districtsByRegion[filterRegion];
    if (!regionDistricts) {
      return [{ value: "", label: "All Districts" }];
    }
    
    return [
      { value: "", label: "All Districts" },
      ...regionDistricts
    ];
  };

  const exportableColumns = [
    { key: "id", label: "#" },
    { key: "ticket_id", label: "Ticket ID" },
    { key: "fullName", label: "Full Name" },
    { key: "phone_number", label: "Phone" },
    { key: "nida_number", label: "NIDA" },
    { key: "employer", label: "Employer" },
    { key: "region", label: "Region" },
    { key: "district", label: "District" },
    { key: "subject", label: "Subject" },
    { key: "category", label: "Category" },
    { key: "section", label: "Section" },
    { key: "sub_section", label: "Sub-section" },
    { key: "channel", label: "Channel" },
    { key: "description", label: "Description" },
    { key: "complaint_type", label: "Complaint Type" },
    { key: "converted_to", label: "Converted To" },
    { key: "assigned_to_role", label: "Assigned Role" },
    { key: "status", label: "Status" },
    { key: "created_at", label: "Created At" },
    { key: "date_of_resolution", label: "Date of Resolution" },
    { key: "date_of_feedback", label: "Date of Feedback" },
    { key: "date_of_review_resolution", label: "Review Date" },
    { key: "resolution_details", label: "Resolution Details" },
    { key: "aging_days", label: "Aging (Days)" },
    { key: "createdBy.name", label: "Created By" },
    { key: "assignedTo.name", label: "Assigned To" },
    { key: "attendedBy.name", label: "Attended By" },
    { key: "ratedBy.name", label: "Rated By" },
    { key: "functionData.name", label: "Function Name" }
  ];

  const handleColumnsChange = (selectedColumns) => {
    if (selectedColumns.length === 0) {
      setActiveColumns(defaultColumns);
      if (onColumnsChange) {
        onColumnsChange(defaultColumns);
      }
    } else {
      setActiveColumns(selectedColumns);
      if (onColumnsChange) {
        onColumnsChange(selectedColumns);
      }
    }
  };

  const handleSelectAll = () => {
    const allKeys = exportableColumns.map(col => col.key);
    handleColumnsChange(allKeys);
  };

  const handleDeselectAll = () => {
    handleColumnsChange([]);
  };

  const handleColumnToggle = (columnKey) => {
    const newColumns = activeColumns.includes(columnKey)
      ? activeColumns.filter(col => col !== columnKey)
      : [...activeColumns, columnKey];
    handleColumnsChange(newColumns);
  };

  // Export utility functions
  const getColumnValue = (item, columnKey) => {
    if (columnKey.includes('.')) {
      const keys = columnKey.split('.');
      let value = item;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) break;
      }
      return value || '';
    }
    
    // Handle fullName specially - construct from individual name fields
    if (columnKey === 'fullName') {
      if (item.first_name && item.first_name.trim() !== "") {
        return `${item.first_name} ${item.middle_name || ""} ${item.last_name || ""}`.trim();
      } else if (typeof item.institution === "string") {
        return item.institution;
      } else if (item.institution && typeof item.institution === "object" && typeof item.institution.name === "string") {
        return item.institution.name;
      } else {
        return "N/A";
      }
    }
    
    // Handle employer field - check both direct field and nested object
    if (columnKey === 'employer') {
      if (item.employer && typeof item.employer === "string") {
        return item.employer;
      } else if (item.employer && typeof item.employer === "object" && item.employer.name) {
        return item.employer.name;
      } else if (item.institution && typeof item.institution === "string") {
        return item.institution;
      } else if (item.institution && typeof item.institution === "object" && item.institution.name) {
        return item.institution.name;
      } else {
        return "N/A";
      }
    }
    
    return item[columnKey] || '';
  };

  const formatValue = (value, columnKey) => {
    if (value === null || value === undefined) return '';
    
    // Format ticket_id to show actual ticket ID
    if (columnKey === 'ticket_id') {
      return value.toString();
    }
    
    // Format IDs as sequential numbers (1, 2, 3...) - only for 'id' column
    if (columnKey === 'id') {
      // Find the index of this item in the tableData array
      const index = tableData.findIndex(item => item.id === value);
      return index !== -1 ? (index + 1).toString() : value.toString();
    }
    
    // Format phone numbers as text to prevent scientific notation
    if (columnKey === 'phone_number') {
      return String(value);
    }
    
    // Format NIDA numbers as text to prevent scientific notation
    if (columnKey === 'nida_number') {
      return String(value);
    }
    
    // Format dates
    if (columnKey.includes('created_at') || columnKey.includes('date_')) {
      if (value) {
        return new Date(value).toLocaleString();
      }
      return '';
    }
    
    // Handle nested name properties (createdBy.name, assignedTo.name, etc.)
    if (columnKey.includes('.name')) {
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') {
        if (value.name) return value.name;
        if (value.first_name) {
          return `${value.first_name} ${value.middle_name || ''} ${value.last_name || ''}`.trim();
        }
      }
      return '';
    }
    
    return String(value);
  };

  const exportToCSV = (selectedColumns) => {
    if (!tableData || tableData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = selectedColumns.map(col => 
      exportableColumns.find(ec => ec.key === col)?.label || col
    );

    const csvContent = [
      headers.join(','),
      ...tableData.map((item, index) => 
        selectedColumns.map(col => {
          const value = getColumnValue(item, col);
          const formattedValue = formatValue(value, col);
          
          // Add tab prefix to phone numbers and NIDA to force Excel to treat as text
          let finalValue = formattedValue;
          if (col === 'phone_number' || col === 'nida_number') {
            finalValue = `\t${formattedValue}`;
          }
          
          // Escape commas and quotes
          return `"${finalValue.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (selectedColumns) => {
    if (!tableData || tableData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = selectedColumns.map(col => 
      exportableColumns.find(ec => ec.key === col)?.label || col
    );

    // Determine orientation based on number of columns
    const isLandscape = selectedColumns.length > 6;
    const orientation = isLandscape ? 'landscape' : 'portrait';
    const pageWidth = isLandscape ? 297 : 210; // A4 dimensions in mm
    const pageHeight = isLandscape ? 210 : 297;

    // Create a hidden div for PDF generation
    const pdfDiv = document.createElement('div');
    pdfDiv.style.position = 'absolute';
    pdfDiv.style.left = '-9999px';
    pdfDiv.style.top = '-9999px';
    pdfDiv.style.width = isLandscape ? '1200px' : '800px';
    pdfDiv.style.backgroundColor = 'white';
    pdfDiv.style.padding = '20px';
    pdfDiv.style.fontFamily = 'Arial, sans-serif';
    pdfDiv.style.fontSize = '11px';

    // Create the table HTML
    const tableHTML = `
      <div style="text-align: center; margin-bottom: 15px; font-size: 16px; font-weight: bold; color: #2c3e50;">
        ${tableTitle}
      </div>
      <table style="border-collapse: collapse; width: 100%; font-size: 10px; margin: 0;">
        <thead>
          <tr>${headers.map(h => 
            `<th style="border: 1px solid #bdc3c7; padding: 5px; text-align: center; font-weight: bold; font-size: 11px; background: linear-gradient(135deg, #3498db, #2980b9); color: white;">${h}</th>`
          ).join('')}</tr>
        </thead>
        <tbody>
          ${tableData.map((item, index) => 
            `<tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
              ${selectedColumns.map(col => {
                const value = getColumnValue(item, col);
                const formattedValue = formatValue(value, col);
                return `<td style="border: 1px solid #bdc3c7; padding: 5px; text-align: left; word-wrap: break-word; max-width: ${isLandscape ? '120px' : '150px'};">${formattedValue}</td>`;
              }).join('')}
            </tr>`
          ).join('')}
        </tbody>
      </table>
    `;

    pdfDiv.innerHTML = tableHTML;
    document.body.appendChild(pdfDiv);

    // Generate PDF from the hidden div with optimized settings
    html2canvas(pdfDiv, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png', 0.8);
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const imgWidth = pageWidth - 30; // Account for margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Add table image to first page
      pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 30); // Account for margins only

      // Add subsequent pages
      while (heightLeft >= 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 30);
      }
      
      pdf.save(`${tableTitle}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Clean up the hidden div
      document.body.removeChild(pdfDiv);
    }).catch(error => {
      console.error('PDF generation error:', error);
      alert('Error generating PDF. Please try again.');
      document.body.removeChild(pdfDiv);
    });
  };

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF(activeColumns);
    } else {
      exportToPDF(activeColumns);
    }
    setIsColumnModalOpen(false);
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV(activeColumns);
    } else {
      exportToCSV(activeColumns);
    }
    setIsColumnModalOpen(false);
  };

  return (
    <div className="controls" style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
      gap: "15px", 
      flexWrap: "wrap",
      marginBottom: "16px",
      padding: "12px 0"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Tooltip title="Columns Settings and Export" arrow>
          <IconButton 
            onClick={() => setIsColumnModalOpen(true)}
            style={{
              padding: "6px",
              height: "32px",
              width: "36px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "white"
            }}
          >
            <FiSettings size={20} />
          </IconButton>
        </Tooltip>
        <label style={{ marginRight: "2px", whiteSpace: "nowrap" }}>
          <strong>Show:</strong>
        </label>
        <select
          className="filter-select"
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            minWidth: "60px",
            height: "36px",
            fontSize: "14px",
            boxSizing: "border-box",
            margin: 0,
            lineHeight: "1"
          }}
        >
          {[5, 10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          {showAllOption && <option value="All">All</option>}
        </select>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          className="search-input"
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={onSearchChange}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            minWidth: "200px",
            height: "36px",
            fontSize: "14px",
            boxSizing: "border-box",
            margin: 0,
            lineHeight: "1",
            verticalAlign: "middle"
          }}
        />
        
        <select
          className="filter-select"
          value={filterStatus}
          onChange={onFilterStatusChange}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            minWidth: "120px",
            height: "36px",
            fontSize: "14px",
            boxSizing: "border-box",
            margin: 0,
            lineHeight: "1"
          }}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <select
          className="filter-select"
          value={filterRegion || ""}
          onChange={handleRegionChange}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "white",
            minWidth: "140px",
            height: "36px",
            fontSize: "14px",
            boxSizing: "border-box",
            margin: 0,
            lineHeight: "1"
          }}
        >
          {regionOptions && regionOptions.length > 0 ? (
            regionOptions.map((option) => {
              const optionValue = String(option.value || "");
              const currentValue = String(filterRegion || "");
              return (
                <option 
                  key={optionValue || option.label} 
                  value={optionValue}
                >
                  {option.label}
                </option>
              );
            })
          ) : (
            <option value="">No regions available</option>
          )}
        </select>
        
        <Tooltip 
          title={!filterRegion ? "Please select a region first" : ""} 
          arrow
          disableHoverListener={filterRegion}
        >
          <select
            className="filter-select"
            value={filterDistrict || ""}
            onChange={onFilterDistrictChange}
            disabled={!filterRegion}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              backgroundColor: filterRegion ? "white" : "#f5f5f5",
              minWidth: "140px",
              height: "36px",
              fontSize: "14px",
              boxSizing: "border-box",
              margin: 0,
              lineHeight: "1",
              cursor: filterRegion ? "pointer" : "not-allowed"
            }}
          >
            {getAvailableDistricts().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Tooltip>
      </div>

      {/* Column Selector Modal */}
      <Modal
        open={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        aria-labelledby="column-selector-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 450,
            maxHeight: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
            overflowY: "auto"
          }}
        >
          <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: "bold" }}>
            Columns Settings and Export
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              sx={{ fontSize: "12px" }}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
              sx={{ fontSize: "12px" }}
            >
              Deselect All
            </Button>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ maxHeight: "300px", overflowY: "auto", mb: 3 }}>
            {exportableColumns.map((column) => (
              <Box
                key={column.key}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 1,
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#f5f5f5" }
                }}
                onClick={() => handleColumnToggle(column.key)}
              >
                <Checkbox
                  checked={activeColumns.includes(column.key)}
                  size="small"
                />
                <ListItemText
                  primary={column.label}
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </Box>
            ))}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Selected: {activeColumns.length} columns
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FiFileText />}
                onClick={handleExportPDF}
                size="small"
                sx={{ fontSize: "12px" }}
              >
              PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<FiDownload />}
                onClick={handleExportCSV}
                size="small"
                sx={{ fontSize: "12px" }}
              >
             CSV
              </Button>
              <Button
                variant="contained"
                onClick={() => setIsColumnModalOpen(false)}
                size="small"
              >
                Close
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default TableControls; 