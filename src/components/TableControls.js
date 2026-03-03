import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Modal, Box, Typography, Checkbox, ListItemText, Button, Divider } from '@mui/material';
import { FiSettings, FiDownload, FiFileText } from "react-icons/fi";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// Helper function to capitalize value (handles hyphens and special cases)
const capitalizeValue = (value) => {
  if (!value) return value;
  // Split by hyphen and capitalize each part
  return value
    .split('-')
    .map(part => {
      // Handle special cases like "nyang'hwale"
      if (part.includes("'")) {
        return part
          .split("'")
          .map(subPart => subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase())
          .join("'");
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('-');
};

// Districts data organized by region
const districtsByRegion = {
  "Arusha": [
    { value: "Arusha-City", label: "Arusha City" },
    { value: "Arusha-Rural", label: "Arusha Rural" },
    { value: "Karatu", label: "Karatu" },
    { value: "Longido", label: "Longido" },
    { value: "Meru", label: "Meru" },
    { value: "Monduli", label: "Monduli" },
    { value: "Ngorongoro", label: "Ngorongoro" }
  ],
  "Dar-Es-Salaam": [
    { value: "Ilala", label: "Ilala" },
    { value: "Kinondoni", label: "Kinondoni" },
    { value: "Temeke", label: "Temeke" },
    { value: "Kigamboni", label: "Kigamboni" },
    { value: "Ubungo", label: "Ubungo" }
  ],
  "Dodoma": [
    { value: "Dodoma-City", label: "Dodoma City" },
    { value: "Dodoma-Rural", label: "Dodoma Rural" },
    { value: "Bahi", label: "Bahi" },
    { value: "Chamwino", label: "Chamwino" },
    { value: "Chemba", label: "Chemba" },
    { value: "Kongwa", label: "Kongwa" },
    { value: "Mpwapwa", label: "Mpwapwa" },
    { value: "Kondoa", label: "Kondoa" }
  ],
  "Mwanza": [
    { value: "Mwanza-City", label: "Mwanza City" },
    { value: "Ilemela", label: "Ilemela" },
    { value: "Nyamagana", label: "Nyamagana" },
    { value: "Buchosa", label: "Buchosa" },
    { value: "Magu", label: "Magu" },
    { value: "Misungwi", label: "Misungwi" },
    { value: "Kwimba", label: "Kwimba" },
    { value: "Ukerewe", label: "Ukerewe" },
    { value: "Sengerema", label: "Sengerema" }
  ],
  "Mbeya": [
    { value: "Mbeya-City", label: "Mbeya City" },
    { value: "Mbeya-Rural", label: "Mbeya Rural" },
    { value: "Chunya", label: "Chunya" },
    { value: "Kyela", label: "Kyela" },
    { value: "Mbarali", label: "Mbarali" },
    { value: "Rujewa", label: "Rujewa" }
  ],
  "Kilimanjaro": [
    { value: "Moshi-City", label: "Moshi City" },
    { value: "Moshi-Rural", label: "Moshi Rural" },
    { value: "Hai", label: "Hai" },
    { value: "Siha", label: "Siha" },
    { value: "Rombo", label: "Rombo" },
    { value: "Mwanga", label: "Mwanga" },
    { value: "Same", label: "Same" }
  ],
  "Tanga": [
    { value: "Tanga-City", label: "Tanga City" },
    { value: "Tanga-Rural", label: "Tanga Rural" },
    { value: "Muheza", label: "Muheza" },
    { value: "Pangani", label: "Pangani" },
    { value: "Handeni", label: "Handeni" },
    { value: "Kilindi", label: "Kilindi" },
    { value: "Korogwe", label: "Korogwe" },
    { value: "Lushoto", label: "Lushoto" },
    { value: "Mkinga", label: "Mkinga" }
  ],
  "Morogoro": [
    { value: "Morogoro-City", label: "Morogoro City" },
    { value: "Morogoro-Rural", label: "Morogoro Rural" },
    { value: "Kilosa", label: "Kilosa" },
    { value: "Ulanga", label: "Ulanga" },
    { value: "Kilombero", label: "Kilombero" },
    { value: "Malinyi", label: "Malinyi" },
    { value: "Gairo", label: "Gairo" },
    { value: "Mvomero", label: "Mvomero" }
  ],
  "Geita": [
    { value: "Geita", label: "Geita" },
    { value: "Nyang'hwale", label: "Nyang'hwale" },
    { value: "Chato", label: "Chato" },
    { value: "Mbogwe", label: "Mbogwe" },
    { value: "Bukombe", label: "Bukombe" }
  ],
  "Iringa": [
    { value: "Iringa-Rural", label: "Iringa Rural" },
    { value: "Kilolo", label: "Kilolo" },
    { value: "Mufindi", label: "Mufindi" },
    { value: "Iringa-Urban", label: "Iringa Urban" }
  ],
  "Kagera": [
    { value: "Bukoba-Rural", label: "Bukoba Rural" },
    { value: "Bukoba-Urban", label: "Bukoba Urban" },
    { value: "Karagwe", label: "Karagwe" },
    { value: "Kibondo", label: "Kibondo" },
    { value: "Kakonko", label: "Kakonko" },
    { value: "Muleba", label: "Muleba" },
    { value: "Ngara", label: "Ngara" },
    { value: "Biharamulo", label: "Biharamulo" }
  ],
  "Katavi": [
    { value: "Mpanda-Rural", label: "Mpanda Rural" },
    { value: "Mpanda-Urban", label: "Mpanda Urban" },
    { value: "Mlele", label: "Mlele" }
  ],
  "Kigoma": [
    { value: "Kigoma-Rural", label: "Kigoma Rural" },
    { value: "Kigoma-Urban", label: "Kigoma Urban" },
    { value: "Kasulu", label: "Kasulu" },
    { value: "Buhigwe", label: "Buhigwe" },
    { value: "Ulongwe", label: "Ulongwe" }
  ],
  "Lindi": [
    { value: "Lindi-Rural", label: "Lindi Rural" },
    { value: "Lindi-Urban", label: "Lindi Urban" },
    { value: "Kilwa", label: "Kilwa" },
    { value: "Liwale", label: "Liwale" },
    { value: "Ruangwa", label: "Ruangwa" },
    { value: "Nachingwea", label: "Nachingwea" }
  ],
  "Manyara": [
    { value: "Babati-Rural", label: "Babati Rural" },
    { value: "Babati-Urban", label: "Babati Urban" },
    { value: "Hanang", label: "Hanang" },
    { value: "Kiteto", label: "Kiteto" },
    { value: "Mbulu", label: "Mbulu" },
    { value: "Simanjiro", label: "Simanjiro" }
  ],
  "Mara": [
    { value: "Musoma-Rural", label: "Musoma Rural" },
    { value: "Musoma-Urban", label: "Musoma Urban" },
    { value: "Tarime", label: "Tarime" },
    { value: "Serengeti", label: "Serengeti" },
    { value: "Bunda", label: "Bunda" },
    { value: "Butiama", label: "Butiama" },
    { value: "Rorya", label: "Rorya" }
  ],
  "Mtwara": [
    { value: "Mtwara-Rural", label: "Mtwara Rural" },
    { value: "Mtwara-Urban", label: "Mtwara Urban" },
    { value: "Masasi", label: "Masasi" },
    { value: "Newala", label: "Newala" },
    { value: "Tandahimba", label: "Tandahimba" },
    { value: "Nanyumbu", label: "Nanyumbu" }
  ],
  "Njombe": [
    { value: "Njombe-Rural", label: "Njombe Rural" },
    { value: "Njombe-Urban", label: "Njombe Urban" },
    { value: "Wanging'ombe", label: "Wanging'ombe" },
    { value: "Ludewa", label: "Ludewa" },
    { value: "Makete", label: "Makete" }
  ],
  "Pwani": [
    { value: "Kibaha-Rural", label: "Kibaha Rural" },
    { value: "Kibaha-Urban", label: "Kibaha Urban" },
    { value: "Bagamoyo", label: "Bagamoyo" },
    { value: "Kisarawe", label: "Kisarawe" },
    { value: "Mkuranga", label: "Mkuranga" },
    { value: "Rufiji", label: "Rufiji" },
    { value: "Kibiti", label: "Kibiti" }
  ],
  "Rukwa": [
    { value: "Sumbawanga-Rural", label: "Sumbawanga Rural" },
    { value: "Sumbawanga-Urban", label: "Sumbawanga Urban" },
    { value: "Nkcasi", label: "Nkasi" },
    { value: "Kalambo", label: "Kalambo" }
  ],
  "Ruvuma": [
    { value: "Songea-Rural", label: "Songea Rural" },
    { value: "Songea-Urban", label: "Songea Urban" },
    { value: "Tunduru", label: "Tunduru" },
    { value: "Namtumbo", label: "Namtumbo" },
    { value: "Nyasa", label: "Nyasa" },
    { value: "Mbinga", label: "Mbinga" }
  ],
  "Shinyanga": [
    { value: "Shinyanga-Rural", label: "Shinyanga Rural" },
    { value: "Shinyanga-Urban", label: "Shinyanga Urban" },
    { value: "Kahama", label: "Kahama" },
    { value: "Kishapu", label: "Kishapu" },
    { value: "Maswa", label: "Maswa" },
    { value: "Meatu", label: "Meatu" }
  ],
  "Simiyu": [
    { value: "Bariadi", label: "Bariadi" },
    { value: "Busega", label: "Busega" },
    { value: "Itilima", label: "Itilima" }
  ],
  "Singida": [
    { value: "Singida-Rural", label: "Singida Rural" },
    { value: "Singida-Urban", label: "Singida Urban" },
    { value: "Ikungi", label: "Ikungi" },
    { value: "Manyoni", label: "Manyoni" },
    { value: "Mkalama", label: "Mkalama" },
    { value: "Itigi", label: "Itigi" }
  ],
  "Songwe": [
    { value: "Ileje", label: "Ileje" },
    { value: "Mbozi", label: "Mbozi" }
  ],
  "Tabora": [
    { value: "Tabora-Urban", label: "Tabora Urban" },
    { value: "Tabora-Rural", label: "Tabora Rural" },
    { value: "Igunga", label: "Igunga" },
    { value: "Uroki", label: "Uroki" },
    { value: "Sikonge", label: "Sikonge" },
    { value: "Kaliua", label: "Kaliua" }
  ],
  "Unguja North": [
    { value: "Kaskazini-Unguja", label: "Kaskazini Unguja" },
    { value: "Mjini-Magharibi", label: "Mjini Magharibi" }
  ],
  "Unguja South": [
    { value: "Magharibi", label: "Magharibi" },
    { value: "Kusini-Unguja", label: "Kusini Unguja" }
  ],
  "Pemba North": [
    { value: "Kaskazini-Pemba", label: "Kaskazini Pemba" },
    { value: "Mjini-Kaskazini", label: "Mjini Kaskazini" },
    { value: "Wete", label: "Wete" }
  ],
  "Pemba South": [
    { value: "Kusini-Pemba", label: "Kusini Pemba" },
    { value: "Chake-Chake", label: "Chake Chake" },
    { value: "Mkoani", label: "Mkoani" }
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
  searchPlaceholder = "Search by name, phone, NIN, ticket number, institution, representative name",
  statusOptions = [
    { value: "", label: "All" },
    { value: "Open", label: "Open" },
    { value: "Closed", label: "Closed" }
  ],
  regionOptions = [
    { value: "", label: "All Regions" },
    { value: "Arusha", label: "Arusha" },
    { value: "Dar-Es-Salaam", label: "Dar es Salaam" },
    { value: "Dodoma", label: "Dodoma" },
    { value: "Geita", label: "Geita" },
    { value: "Iringa", label: "Iringa" },
    { value: "Kagera", label: "Kagera" },
    { value: "Katavi", label: "Katavi" },
    { value: "Kigoma", label: "Kigoma" },
    { value: "Kilimanjaro", label: "Kilimanjaro" },
    { value: "Lindi", label: "Lindi" },
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
  onExportExcel,
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
    { key: "fullName", label: "Employee" },
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
    { key: "claim_number", label: "Claim Number" },
    { key: "is_new_registration", label: "Is New Registration" },
    { key: "representative_name", label: "Representative Name" },
    { key: "representative_phone", label: "Representative Phone" },
    { key: "representative_email", label: "Representative Email" },
    { key: "representative_address", label: "Representative Address" },
    { key: "representative_relationship", label: "Representative Relationship" },
    { key: "created_at", label: "Created At" },
    { key: "date_of_resolution", label: "Date of Resolution" },
    { key: "date_of_feedback", label: "Date of Feedback" },
    { key: "date_of_review_resolution", label: "Review Date" },
    { key: "resolution_details", label: "Resolution Details" },
    { key: "aging_days", label: "Aging (Days)" },
    { key: "creator.full_name", label: "Created By" },
    { key: "assignee.full_name", label: "Assigned To (Current)" },
    { key: "age_from_creation", label: "Age (From Creation to Current)" },
    { key: "attendedBy.name", label: "Attended By" },
    { key: "ratedBy.name", label: "Rated By" },
    // { key: "functionData.name", label: "Function Name" }
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
    // Handle nested assignment structure (assignment.ticket.*)
    // If item has a 'ticket' property, use it as the base item for ticket fields
    const baseItem = item.ticket || item;
    
    // Handle creator/createdBy with different property names
    if (columnKey === 'creator.full_name' || columnKey === 'createdBy.name') {
      const creator = baseItem.creator || baseItem.createdBy || item.creator || item.createdBy;
      if (creator) {
        if (typeof creator === 'string') return creator;
        if (creator.full_name) return creator.full_name;
        if (creator.name) return creator.name;
        if (creator.first_name) {
          return `${creator.first_name} ${creator.middle_name || ''} ${creator.last_name || ''}`.trim();
        }
      }
      return 'N/A';
    }
    
    // Handle assignee/assignedTo with different property names
    if (columnKey === 'assignee.full_name' || columnKey === 'assignedTo.name') {
      const assignee = baseItem.assignee || baseItem.assignedTo || item.assignee || item.assignedTo;
      if (assignee) {
        if (typeof assignee === 'string') return assignee;
        if (assignee.full_name) return assignee.full_name;
        if (assignee.name) return assignee.name;
        if (assignee.first_name) {
          return `${assignee.first_name} ${assignee.middle_name || ''} ${assignee.last_name || ''}`.trim();
        }
      }
      return 'N/A';
    }
    
    // Handle attendedBy with different property names
    if (columnKey === 'attendedBy.name' || columnKey === 'attendedBy.full_name') {
      const attendedBy = baseItem.attendedBy || baseItem.attended_by || item.attendedBy || item.attended_by;
      if (attendedBy) {
        if (typeof attendedBy === 'string') return attendedBy;
        if (attendedBy.full_name) return attendedBy.full_name;
        if (attendedBy.name) return attendedBy.name;
        if (attendedBy.first_name) {
          return `${attendedBy.first_name} ${attendedBy.middle_name || ''} ${attendedBy.last_name || ''}`.trim();
        }
      }
      // Fallback to direct fields if attendedBy object is not available
      if (baseItem.attended_by_name || item.attended_by_name) return baseItem.attended_by_name || item.attended_by_name;
      if (baseItem.closed_by_name || item.closed_by_name) return baseItem.closed_by_name || item.closed_by_name;
      return '';
    }
    
    // Handle ratedBy with different property names
    if (columnKey === 'ratedBy.name' || columnKey === 'ratedBy.full_name') {
      const ratedBy = baseItem.ratedBy || baseItem.rated_by || item.ratedBy || item.rated_by;
      if (ratedBy) {
        if (typeof ratedBy === 'string') return ratedBy;
        if (ratedBy.full_name) return ratedBy.full_name;
        if (ratedBy.name) return ratedBy.name;
        if (ratedBy.first_name) {
          return `${ratedBy.first_name} ${ratedBy.middle_name || ''} ${ratedBy.last_name || ''}`.trim();
        }
      }
      return '';
    }
    
    if (columnKey.includes('.')) {
      const keys = columnKey.split('.');
      let value = baseItem;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) break;
      }
      
      // If the final value is an object (like createdBy or assignedTo object), extract name
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Check if it has a name property
        if (value.name) {
          return value.name;
        }
        // Check if it has full_name property
        if (value.full_name) {
          return value.full_name;
        }
        // Check if it has first_name, middle_name, last_name
        if (value.first_name) {
          return `${value.first_name} ${value.middle_name || ''} ${value.last_name || ''}`.trim();
        }
        // If it's still an object, return empty string
        return '';
      }
      
      return value || '';
    }
    
    // Handle fullName specially - construct from individual name fields
    if (columnKey === 'fullName' || columnKey === 'fullname' || columnKey === 'FullName') {
      // Try both snake_case and camelCase versions
      const firstName = (baseItem.first_name || baseItem.firstName || item.first_name || item.firstName || "");
      const middleName = (baseItem.middle_name || baseItem.middleName || item.middle_name || item.middleName || "");
      const lastName = (baseItem.last_name || baseItem.lastName || item.last_name || item.lastName || "");
      
      // Trim and filter out empty strings
      const nameParts = [
        typeof firstName === 'string' ? firstName.trim() : "",
        typeof middleName === 'string' ? middleName.trim() : "",
        typeof lastName === 'string' ? lastName.trim() : ""
      ].filter(part => part !== "");
      
      if (nameParts.length > 0) {
        return nameParts.join(" ");
      }
      
      // If no first_name/last_name, check for representative_name (for representative/employer tickets)
      const representativeName = baseItem.representative_name || baseItem.representativeName || item.representative_name || item.representativeName;
      if (representativeName && typeof representativeName === 'string' && representativeName.trim() !== "") {
        return representativeName.trim();
      }
      
      // Fallback to institution if it's a string
      const institution = baseItem.institution || item.institution;
      if (typeof institution === "string" && institution.trim() !== "") {
        return institution.trim();
      }
      
      // Fallback to institution object
      if (institution && typeof institution === "object" && institution.name && typeof institution.name === "string") {
        return institution.name.trim();
      }
      
      // Return empty string if nothing found
      return "";
    }
    
    // Handle employer field - check both direct field and nested object
    if (columnKey === 'employer') {
      const employer = baseItem.employer || item.employer;
      const institution = baseItem.institution || item.institution;
      
      if (employer && typeof employer === "string") {
        return employer;
      } else if (employer && typeof employer === "object" && employer.name) {
        return employer.name;
      } else if (institution && typeof institution === "string") {
        return institution;
      } else if (institution && typeof institution === "object" && institution.name) {
        return institution.name;
      } else {
        return "N/A";
      }
    }
    
    // Handle age calculation from creation to current time
    if (columnKey === 'age_from_creation') {
      const createdAt = baseItem.created_at || item.created_at;
      if (createdAt) {
        const createdDate = new Date(createdAt);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - createdDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffDays > 0) {
          return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
          return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        } else {
          return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        }
      }
      return "N/A";
    }
    
    // For all other fields, try baseItem first (for nested assignment structure), then fall back to item
    return baseItem[columnKey] !== undefined ? baseItem[columnKey] : (item[columnKey] || '');
  };

  const formatValue = (value, columnKey) => {
    if (value === null || value === undefined) return '';
    
    // Format ticket_id to show actual ticket ID
    if (columnKey === 'ticket_id') {
      return value.toString();
    }
    
    // Format IDs as sequential numbers (1, 2, 3...) - only for 'id' column
    if (columnKey === 'id') {
      // For nested assignment structure, check both item.id and item.ticket?.id
      // Find the index based on the actual item in tableData
      const index = tableData.findIndex(item => {
        // Check if this is the same item by comparing IDs
        if (item.id === value) return true;
        // For nested structure, check ticket.id
        if (item.ticket && item.ticket.id === value) return true;
        // Also check if the value matches the item's ticket id
        if (item.ticket && item.ticket.id && item.ticket.id === value) return true;
        return false;
      });
      // Return sequential number (1-based index) or the value if not found
      return index !== -1 ? (index + 1).toString() : value.toString();
    }
    
    // Format phone numbers as text to prevent scientific notation
    if (columnKey === 'phone_number' || columnKey === 'representative_phone') {
      return String(value);
    }
    
    // Format NIDA numbers as text to prevent scientific notation
    if (columnKey === 'nida_number') {
      return String(value);
    }
    
    // Format is_new_registration as Yes/No
    if (columnKey === 'is_new_registration') {
      if (value === true || value === 'true' || value === 1 || value === '1') {
        return 'Yes';
      }
      return 'No';
    }
    
    // Format claim_number as text
    if (columnKey === 'claim_number') {
      return value ? String(value) : '';
    }
    
    // Format dates
    if (columnKey.includes('created_at') || columnKey.includes('date_')) {
      if (value) {
        return new Date(value).toLocaleString();
      }
      return '';
    }
    
    // Handle nested name properties (createdBy.name, assignedTo.name, creator.full_name, assignee.full_name, etc.)
    if (columnKey.includes('.name') || columnKey.includes('.full_name') || 
        columnKey === 'createdBy.name' || columnKey === 'assignedTo.name' ||
        columnKey === 'creator.full_name' || columnKey === 'assignee.full_name') {
      if (typeof value === 'string' && value.trim() !== '') return value;
      if (value && typeof value === 'object') {
        if (value.full_name) return value.full_name;
        if (value.name) return value.name;
        if (value.first_name) {
          const fullName = `${value.first_name} ${value.middle_name || ''} ${value.last_name || ''}`.trim();
          return fullName || '';
        }
      }
      // If value is already a string from getColumnValue, return it
      if (typeof value === 'string') return value;
      return 'N/A';
    }
    
    return String(value);
  };

  const exportToCSV = (selectedColumns) => {
    if (!tableData || tableData.length === 0) {
      alert('No data to export');
      return;
    }

    // Remove duplicates and normalize column keys (handle both 'fullName' and 'employee')
    const seenKeys = new Set();
    const normalizedColumns = selectedColumns.map(col => {
      // Normalize 'employee' to 'fullName' to avoid duplicates
      if (col === 'employee' || col === 'Employee') {
        return 'fullName';
      }
      return col;
    }).filter(col => {
      if (seenKeys.has(col)) {
        return false; // Skip duplicates
      }
      seenKeys.add(col);
      return true;
    });

    const headers = normalizedColumns.map(col => {
      const columnDef = exportableColumns.find(ec => ec.key === col);
      if (columnDef) {
        return columnDef.label;
      }
      // Fallback: capitalize first letter if no match found
      return col.charAt(0).toUpperCase() + col.slice(1);
    });

    const csvContent = [
      headers.join(','),
      ...tableData.map((item, index) => 
        normalizedColumns.map(col => {
          // Normalize 'employee' to 'fullName' for value extraction
          const actualCol = (col === 'employee' || col === 'Employee') ? 'fullName' : col;
          // For 'id' column, use sequential number based on index (1, 2, 3...)
          if (actualCol === 'id') {
            return `"${(index + 1)}"`;
          }
          const value = getColumnValue(item, actualCol);
          const formattedValue = formatValue(value, actualCol);
          
          // Add tab prefix to phone numbers and NIDA to force Excel to treat as text
          let finalValue = formattedValue;
          if (actualCol === 'phone_number' || actualCol === 'nida_number') {
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

    // Remove duplicates and normalize column keys (handle both 'fullName' and 'employee')
    const uniqueColumns = [];
    const seenKeys = new Set();
    const normalizedColumns = selectedColumns.map(col => {
      // Normalize 'employee' to 'fullName' to avoid duplicates
      if (col === 'employee' || col === 'Employee') {
        return 'fullName';
      }
      return col;
    }).filter(col => {
      if (seenKeys.has(col)) {
        return false; // Skip duplicates
      }
      seenKeys.add(col);
      return true;
    });

    const headers = normalizedColumns.map(col => {
      const columnDef = exportableColumns.find(ec => ec.key === col);
      if (columnDef) {
        return columnDef.label;
      }
      // Fallback: capitalize first letter if no match found
      return col.charAt(0).toUpperCase() + col.slice(1);
    });

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
              ${normalizedColumns.map(col => {
                // Normalize 'employee' to 'fullName' for value extraction
                const actualCol = (col === 'employee' || col === 'Employee') ? 'fullName' : col;
                // For 'id' column, use sequential number based on index (1, 2, 3...)
                let formattedValue;
                if (actualCol === 'id') {
                  formattedValue = (index + 1).toString();
                } else {
                  const value = getColumnValue(item, actualCol);
                  formattedValue = formatValue(value, actualCol);
                }
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

  const exportToExcel = (selectedColumns) => {
    if (!tableData || tableData.length === 0) {
      alert('No data to export');
      return;
    }

    // Remove duplicates and normalize column keys (handle both 'fullName' and 'employee')
    const seenKeys = new Set();
    const normalizedColumns = selectedColumns.map(col => {
      // Normalize 'employee' to 'fullName' to avoid duplicates
      if (col === 'employee' || col === 'Employee') {
        return 'fullName';
      }
      return col;
    }).filter(col => {
      if (seenKeys.has(col)) {
        return false; // Skip duplicates
      }
      seenKeys.add(col);
      return true;
    });

    const headers = normalizedColumns.map(col => {
      const columnDef = exportableColumns.find(ec => ec.key === col);
      if (columnDef) {
        return columnDef.label;
      }
      // Fallback: capitalize first letter if no match found
      return col.charAt(0).toUpperCase() + col.slice(1);
    });

    // Prepare data rows
    const dataRows = tableData.map((item, index) => 
      normalizedColumns.map(col => {
        // Normalize 'employee' to 'fullName' for value extraction
        const actualCol = (col === 'employee' || col === 'Employee') ? 'fullName' : col;
        // For 'id' column, use sequential number based on index (1, 2, 3...)
        if (actualCol === 'id') {
          return (index + 1).toString();
        }
        const value = getColumnValue(item, actualCol);
        const formattedValue = formatValue(value, actualCol);
        return formattedValue;
      })
    );

    // Create worksheet
    const worksheetData = [headers, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for better readability
    const columnWidths = headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...dataRows.map(row => String(row[index] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet['!cols'] = columnWidths;

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate Excel file and download
    const fileName = `${tableTitle}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel(activeColumns);
    } else {
      exportToExcel(activeColumns);
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
                variant="outlined"
                startIcon={<FiDownload />}
                onClick={handleExportExcel}
                size="small"
                sx={{ fontSize: "12px", color: "#28a745", borderColor: "#28a745" }}
              >
             Excel
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