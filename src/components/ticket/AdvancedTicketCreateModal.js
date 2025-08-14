import React, { useState, useEffect, useRef, useCallback } from "react";

// MUI Components - Individual imports for better tree shaking
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

import { styled } from "@mui/material/styles";
import ChatIcon from '@mui/icons-material/Chat';
import { baseURL } from "../../config";
import EnhancedSearchForm from "../search/EnhancedSearchForm";
import ClaimRedirectButton from "./ClaimRedirectButton.jsx";

// Import the AssignmentFlowChat component and helper function
const getCreatorName = (selectedTicket) =>
  selectedTicket.created_by ||
  (selectedTicket.creator && selectedTicket.creator.name) ||
  `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
  "N/A";

// Utility function to format time difference in human-readable format
const formatTimeDifference = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}min`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w`;
    } else {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths}m`;
    }
  }
};

function AssignmentFlowChat({ assignmentHistory = [], selectedTicket }) {
  const creatorStep = selectedTicket
    ? {
        assigned_to_name: getCreatorName(selectedTicket),
        assigned_to_role: 'Creator',
        reason: selectedTicket.description,
        created_at: selectedTicket.created_at,
      }
    : null;
  // Always add all assignments as steps, even if assignee is same as creator
  const steps = creatorStep ? [creatorStep, ...assignmentHistory] : assignmentHistory;
  
  // Helper function to get aging status color
  const getAgingStatusColor = (status) => {
    switch (status) {
      case 'On Time':
        return '#4caf50'; // Green
      case 'Warning':
        return '#ff9800'; // Orange
      case 'Overdue':
        return '#f44336'; // Red
      case 'Critical':
        return '#d32f2f'; // Dark Red
      default:
        return '#757575'; // Gray
    }
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
        {/* <Typography sx={{ color: "#3f51b5", wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
          Ticket History
        </Typography> */}
      </Box>
      <Divider sx={{ mb: 2 }} />
      {steps.map((a, idx) => {
        let message;
        if (idx === 0) {
          message = selectedTicket.description
            ? `Created the ticket\nDescription: ${selectedTicket.description}`
            : 'Created the ticket';
        } else {
          const prevUser = steps[idx - 1]?.assigned_to_name || 'Previous User';
          if (selectedTicket.status === "Closed" && idx === steps.length - 1) {
            if (a.reason && selectedTicket.resolution_details) {
              message = `Message from ${prevUser}: ${a.reason}\nResolution: ${selectedTicket.resolution_details}`;
            } else if (a.reason) {
              message = `Message from ${prevUser}: ${a.reason}`;
            } else if (selectedTicket.resolution_details) {
              message = `Resolution: ${selectedTicket.resolution_details}`;
            } else {
              message = `Message from ${prevUser}: No message`;
            }
          } else {
            // Build message with workflow details
            let baseMessage = `Message from ${prevUser}: ${a.reason || 'No message'}`;
            
            // Add workflow-specific details
            if (a.workflow_step) {
              baseMessage += `\n\nWorkflow Step: ${a.workflow_step}`;
            }
            
            if (a.coordinator_notes) {
              baseMessage += `\n\nReviewer Notes: ${a.coordinator_notes}`;
            }
            
            if (a.dg_notes) {
              baseMessage += `\n\nDG Notes: ${a.dg_notes}`;
            }
            
            // Show current resolution details from the ticket
            if (selectedTicket.resolution_details) {
              baseMessage += `\n\nResolution Details: ${selectedTicket.resolution_details}`;
            }
            
            message = baseMessage;
          }
        }
        
        // Display aging information for non-creator steps
        const showAging = idx > 0 && a.aging_formatted;
        
        return (
          <Box key={idx} sx={{ display: "flex", mb: 2, alignItems: "flex-start" }}>
            <Avatar sx={{ bgcolor: idx === 0 ? "#43a047" : "#1976d2", mr: 2 }}>
              {a.assigned_to_name ? a.assigned_to_name[0] : "?"}
            </Avatar>
            <Paper elevation={2} sx={{ p: 2, bgcolor: idx === 0 ? "#e8f5e9" : "#f5f5f5", flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography sx={{ fontWeight: "bold" }}>
                  {a.assigned_to_name || a.assigned_to_id || 'Unknown'} {" "}
                  <span style={{ color: "#888", fontWeight: "normal" }}>
                    ({a.assigned_to_role || "N/A"})
                  </span>
                </Typography>
                {showAging && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: getAgingStatusColor(a.aging_status),
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    >
                      {a.aging_status}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.7rem'
                      }}
                    >
                      {a.aging_formatted}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: idx === 0 ? "#43a047" : "#1976d2", wordBreak: 'break-word', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
                {message}
              </Typography>
              <Typography variant="caption" sx={{ color: "#888" }}>
                {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                {a.created_at && (
                  <span style={{ color: "#666", marginLeft: 8 }}>
                    ({formatTimeDifference(a.created_at)} ago)
                  </span>
                )}
              </Typography>
            </Paper>
          </Box>
        );
      })}
    </Box>
  );
}

// Styled components for Autocomplete and SuggestionItem
const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  "& .MuiInputBase-root": {
    padding: "2px 4px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    "&:hover": {
      borderColor: theme.palette.primary.main
    }
  },
  "& .MuiAutocomplete-listbox": {
    "& li": {
      padding: "8px 16px",
      "&:hover": {
        backgroundColor: "#f5f5f5"
      }
    }
  },
  "& .MuiAutocomplete-loading": {
    padding: "10px",
    textAlign: "center"
  }
}));

const SuggestionItem = styled("div")({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  "& .suggestion-name": {
    fontWeight: 600,
    color: "#2c3e50"
  },
  "& .suggestion-details": {
    fontSize: "0.85rem",
    color: "#7f8c8d"
  },
  "& .highlight": {
    backgroundColor: "#fff3cd",
    padding: "0 2px",
    borderRadius: "2px"
  }
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const highlightMatch = (text, query) => {
  if (!query) return text;
  const safeQuery = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${safeQuery})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={index} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const defaultFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  phoneNumber: "",
  nidaNumber: "",
  requester: "",
  institution: "",
  region: "",
  district: "",
  channel: "Call",
  category: "",
  functionId: "",
  description: "",
  status: "Open",
  requesterName: "",
  requesterPhoneNumber: "",
  requesterEmail: "",
  requesterAddress: "",
  relationshipToEmployee: "",
  dependents: [],
};

// Sample data for regions and districts
const regionsData = [
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
  { value: "manyara", label: "Manyara" },
  { value: "mara", label: "Mara" },
  { value: "mbeya", label: "Mbeya" },
  { value: "morogoro", label: "Morogoro" },
  { value: "mtwara", label: "Mtwara" },
  { value: "mwanza", label: "Mwanza" },
  { value: "njombe", label: "Njombe" },
  { value: "pwani", label: "Pwani" },
  { value: "rukwa", label: "Rukwa" },
  { value: "ruvuma", label: "Ruvuma" },
  { value: "shinyanga", label: "Shinyanga" },
  { value: "simiyu", label: "Simiyu" },
  { value: "singida", label: "Singida" },
  { value: "songwe", label: "Songwe" },
  { value: "tabora", label: "Tabora" },
  { value: "tanga", label: "Tanga" },
  { value: "zanzibar-urban", label: "Zanzibar Urban" },
  { value: "zanzibar-rural", label: "Zanzibar Rural" }
];

const districtsData = {
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
    { value: "biharamulo", label: "Biharamulo" },
    { value: "chato", label: "Chato" }
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
    { value: "kibondo", label: "Kibondo" },
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
    { value: "itilima", label: "Itilima" },
    { value: "maswa", label: "Maswa" },
    { value: "meatu", label: "Meatu" }
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
    { value: "mbeya-city", label: "Mbeya City" },
    { value: "mbeya-rural", label: "Mbeya Rural" },
    { value: "chunya", label: "Chunya" },
    { value: "kyela", label: "Kyela" },
    { value: "mbarali", label: "Mbarali" },
    { value: "rujewa", label: "Rujewa" },
    { value: "ileje", label: "Ileje" },
    { value: "mbozi", label: "Mbozi" }
  ],
  "tabora": [
    { value: "tabora-urban", label: "Tabora Urban" },
    { value: "tabora-rural", label: "Tabora Rural" },
    { value: "igunga", label: "Igunga" },
    { value: "nkasi", label: "Nkasi" },
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

function AdvancedTicketCreateModal({ open, onClose, initialPhoneNumber = "", functionData = [] }) {
  // --- CRM Modal State ---
  const [formData, setFormData] = useState({ ...defaultFormData, phoneNumber: initialPhoneNumber });
  const [formErrors, setFormErrors] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" });
  const [showModal, setShowModal] = useState(false);
  const [searchType, setSearchType] = useState("employee");
  const [searchBy, setSearchBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [openAuto, setOpenAuto] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [employerDetails, setEmployerDetails] = useState(null);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [institutionSuggestions, setInstitutionSuggestions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [creationTicketsLoading, setCreationTicketsLoading] = useState(false);
  const [creationFoundTickets, setCreationFoundTickets] = useState([]);
  const [creationActiveTicketId, setCreationActiveTicketId] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [submitAction, setSubmitAction] = useState("open");
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Enhanced Search Form State ---
  const [searchStep, setSearchStep] = useState(0);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formSearchType, setFormSearchType] = useState("employee");
  const [searchCompleted, setSearchCompleted] = useState(false);
  
  // --- New State for Form Visibility and User Registration ---
  const [showForm, setShowForm] = useState(false);
  const [showUserNotFound, setShowUserNotFound] = useState(false);
  const [showRegistrationOptions, setShowRegistrationOptions] = useState(false);
  const [registrationType, setRegistrationType] = useState(""); // "employee" or "employer"
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  
  // --- Right Part Visibility Control ---
  const [showRightPart, setShowRightPart] = useState(true);
  const [rightPartContent, setRightPartContent] = useState("no-history"); // "no-history", "hidden", "ticket-history"
  
  // --- Call Phone Number Preservation ---
  const [callPhoneNumber] = useState(initialPhoneNumber); // Preserve call phone number throughout component lifecycle
  // --- End Enhanced Search Form State ---
  
  // --- Region and District State ---
  const [selectedRegion, setSelectedRegion] = useState("");
  // --- End Region and District State ---

  // --- Justification History State ---
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [selectedTicketForJustification, setSelectedTicketForJustification] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  // --- End Justification History State ---
  // --- End CRM Modal State ---

  // --- Justification History Functions ---
  const handleOpenJustificationHistory = async (ticket) => {
    console.log("Opening justification history for ticket:", ticket);
    try {
      const token = localStorage.getItem("authToken");
      console.log("Token:", token ? "Present" : "Missing");
      console.log("API URL:", `${baseURL}/ticket/${ticket.id}/assignments`);
      
      const response = await fetch(`${baseURL}/ticket/${ticket.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const history = await response.json();
        console.log("Assignment history:", history);
        console.log("History length:", history.length);
        console.log("History structure:", JSON.stringify(history, null, 2));
        
        setAssignmentHistory(history);
        setSelectedTicketForJustification(ticket);
        setIsJustificationModalOpen(true);
        console.log("Modal should be open now");
      } else {
        console.error("Failed to fetch assignment history");
        const errorText = await response.text();
        console.error("Error response:", errorText);
        // Even if API fails, still open modal with empty history
        setAssignmentHistory([]);
        setSelectedTicketForJustification(ticket);
        setIsJustificationModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching assignment history:", error);
      // Even if there's an error, still open modal with empty history
      setAssignmentHistory([]);
      setSelectedTicketForJustification(ticket);
      setIsJustificationModalOpen(true);
    }
  };

  const handleCloseJustificationModal = () => {
    setIsJustificationModalOpen(false);
    setSelectedTicketForJustification(null);
    setAssignmentHistory([]);
  };
  // --- End Justification History Functions ---

  // --- Enhanced Search Form Handlers ---
  const handleEmployerSelection = (employer) => {
    setSelectedEmployer(employer);
    setSelectedEmployee(null);
    setFormSearchType("employer");
    setSearchCompleted(true);
    setShowForm(true); // Show form after employer is found
    setShowUserNotFound(false);
    setShowRegistrationOptions(false);
    
    // Update form data with employer information while preserving call phone number
    setFormData(prev => ({
      ...prev,
      firstName: "",
      middleName: "",
      lastName: "",
      nidaNumber: employer.tin || "",
      // ALWAYS preserve the call phone number - never overwrite it with search results
      phoneNumber: prev.phoneNumber || callPhoneNumber || "",
      institution: employer.name || "",
      requester: "Employer",
      employerName: employer.name || ""
    }));
    
    // Fetch institution details
    if (employer.name) {
      fetch("https://demomspapi.wcf.go.tz/api/v1/search/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          type: "employer",
          name: employer.name,
          employer_registration_number: ""
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            setSelectedInstitution(data.results[0]);
          }
        })
        .catch(() => {
          setSelectedInstitution(null);
        });
    }

    // Show success message
    setModal({
      isOpen: true,
      type: "success",
      message: `Employer selected: ${employer.name}. Employer details filled.`
    });
  };

  const handleEmployeeSelection = (employee) => {
    // Extract employee information from the API response
    const employeeData = employee.employee || employee;
    
    // Parse the name to extract first, middle, and last names
    const fullName = employeeData.name || "";
    const nameWithoutEmployer = fullName.split("—")[0].trim();
    const nameParts = nameWithoutEmployer.split(" ");
    
    const firstName = nameParts[0] || "";
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

    setSelectedEmployee(employee);
    // Don't clear selectedEmployer - preserve it for the institution name
    setFormSearchType("employee");
    setSearchCompleted(true);
    setShowForm(true); // Show form after employee is found
    setShowUserNotFound(false);
    setShowRegistrationOptions(false);
    
    // Update form data with employee information while preserving call phone number
    setFormData(prev => ({
      ...prev,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      nidaNumber: employeeData.nin || "",
      // ALWAYS preserve the call phone number - never overwrite it with search results
      phoneNumber: prev.phoneNumber || callPhoneNumber || "",
      // Preserve the institution name from the selected employer
      institution: selectedEmployer ? selectedEmployer.name : (employeeData.institution || employeeData.employerName || ""),
      requester: "Employee",
      // Store allocated user information from search response
      allocated_user_username: employeeData.allocated_user_username || "",
      allocated_user_name: employeeData.allocated_user || "",
      allocated_user_id: employeeData.allocated_user_id || "",
      // Store claim information
      claimNumber: employeeData.claim_number || "",
      notification_report_id: employeeData.notification_report_id || "",
      // Store dependents information
      dependents: employee.dependents || employeeData.dependents || []
    }));

    // Set selected suggestion for claim button display
    setSelectedSuggestion(employeeData);

    // Show success message
    setModal({
      isOpen: true,
      type: "success",
      message: `Employee selected: ${nameWithoutEmployer}. Employee details filled.`
    });
  };

  // New function to handle user not found scenario
  const handleUserNotFound = (searchQuery, searchType) => {
    setShowUserNotFound(true);
    setShowForm(false);
    setShowRegistrationOptions(true);
    setCurrentSearchQuery(searchQuery);
    setRegistrationType(searchType);
    setSearchCompleted(false);
  };

  // New function to handle registration option selection
  const handleRegistrationOption = (type) => {
    setRegistrationType(type);
    setShowRegistrationOptions(false);
    setShowForm(true);
    setShowUserNotFound(false);
    
    // Pre-fill form based on registration type while preserving call phone number
    if (type === "employer") {
      setFormData(prev => ({
        ...prev,
        requester: "Employer",
        firstName: "",
        middleName: "",
        lastName: "",
        // ALWAYS preserve the call phone number
        phoneNumber: prev.phoneNumber || callPhoneNumber || "",
        // Keep the search query as institution name
        institution: currentSearchQuery,
        // Clear employee-specific fields
        claimNumber: "",
        dependents: [],
        // Add representative fields for new employer registration
        requesterName: "",
        requesterPhoneNumber: prev.phoneNumber || callPhoneNumber || "",
        requesterEmail: "",
        requesterAddress: "",
        relationshipToEmployee: ""
      }));
    } else if (type === "employee") {
      setFormData(prev => ({
        ...prev,
        requester: "Employee",
        // Keep the search query as employee name
        firstName: currentSearchQuery.split(" ")[0] || "",
        middleName: currentSearchQuery.split(" ").slice(1, -1).join(" ") || "",
        lastName: currentSearchQuery.split(" ").slice(-1)[0] || "",
        // ALWAYS preserve the call phone number
        phoneNumber: prev.phoneNumber || callPhoneNumber || "",
        // Clear employer-specific fields
        claimNumber: "",
        dependents: [],
        // Clear representative fields for employee registration
        requesterName: "",
        requesterPhoneNumber: "",
        requesterEmail: "",
        requesterAddress: "",
        relationshipToEmployee: ""
      }));
    }
  };

  const resetSearch = () => {
    setSelectedEmployer(null);
    setSelectedEmployee(null);
    setSearchStep(0);
    setSearchCompleted(false);
    setFormSearchType("employee");
    setShowForm(false);
    setShowUserNotFound(false);
    setShowRegistrationOptions(false);
    setRegistrationType("");
    setSearchResults([]);
    setCurrentSearchQuery("");
    setSelectedRegion(""); // Clear selected region
    
    // Clear institution details panel
    setSelectedInstitution(null);
    
    // Clear all form fields except the call phone number
    setFormData(prev => ({
      ...prev,
      firstName: "",
      middleName: "",
      lastName: "",
      nidaNumber: "",
      // ALWAYS preserve the call phone number - never clear it
      phoneNumber: prev.phoneNumber || callPhoneNumber || "",
      institution: "",
      requester: "",
      employerName: "",
      // Clear allocated user fields
      allocated_user_username: "",
      allocated_user_name: "",
      allocated_user_id: "",
      // Clear claim information
      claimNumber: "",
      // Clear dependents
      dependents: [],
      // Clear representative fields
      requesterName: "",
      requesterPhoneNumber: "",
      requesterEmail: "",
      requesterAddress: "",
      relationshipToEmployee: ""
    }));
    
    // Clear form errors
    setFormErrors({});
    
    // Clear selected suggestion
    setSelectedSuggestion(null);
    
    // Show right part again and reset to no-history state
    setShowRightPart(true);
    setRightPartContent("no-history");
  };

  const handleSearchTypeChange = (newSearchType) => {
    setFormSearchType(newSearchType);
  };

  // Custom search handler for the new flow
  const handleCustomSearch = async (searchQuery, searchType) => {
    if (!searchQuery || searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        "https://demomspapi.wcf.go.tz/api/v1/search/details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            type: searchType,
            name: searchQuery.trim(),
            employer_registration_number: ""
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.results?.length > 0) {
        setSearchResults(data.results);
        // If results found, show them for selection
        setShowUserNotFound(false);
        setShowRegistrationOptions(false);
      } else {
        // No results found - show user not found message
        setSearchResults([]);
        handleUserNotFound(searchQuery, searchType);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setSearchResults([]);
      handleUserNotFound(searchQuery, searchType);
    }
  };

  // Override the original search handlers to work with our new flow
  const handleEmployerSelectionWithFlow = (employer) => {
    // Call the original handler
    handleEmployerSelection(employer);
    // Clear any user not found states
    setShowUserNotFound(false);
    setShowRegistrationOptions(false);
    // Hide right part during form display
    setShowRightPart(false);
    setRightPartContent("hidden");
    
    // Show right part again after a short delay to allow form to display
    setTimeout(() => {
      setShowRightPart(true);
      setRightPartContent("ticket-history");
    }, 100);
  };

  const handleEmployeeSelectionWithFlow = (employee) => {
    // Call the original handler
    handleEmployeeSelection(employee);
    // Clear any user not found states
    setShowUserNotFound(false);
    setShowRegistrationOptions(false);
    // Hide right part during form display
    setShowRightPart(false);
    setRightPartContent("hidden");
    
    // Show right part again after a short delay to allow form to display
    setTimeout(() => {
      setShowRightPart(true);
      setRightPartContent("ticket-history");
    }, 100);
  };
  // --- End Enhanced Search Form Handlers ---

  // --- Handlers from CRM ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "functionId") {
      const selectedFunctionData = functionData.find((item) => item.id === value);
      if (selectedFunctionData) {
        setSelectedFunction(selectedFunctionData.function?.name || "");
        setSelectedSection(selectedFunctionData.function?.section?.name || "");
      } else {
        setSelectedFunction("");
        setSelectedSection("");
      }
    }
    if (name === "phoneNumber") {
      let cleaned = value.replace(/[^\d+]/g, "");
      if (cleaned.startsWith("+") && cleaned.slice(1).includes("+")) {
        cleaned = cleaned.replace(/\+/g, "");
        cleaned = "+" + cleaned;
      }
      if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      if (!/^\+?\d{0,13}$/.test(cleaned)) {
        setFormErrors((prev) => ({ ...prev, phoneNumber: "Phone number must contain only numbers" }));
      } else {
        setFormErrors((prev) => ({ ...prev, phoneNumber: undefined }));
      }
      return;
    }
    if (name === "nidaNumber") {
      let cleaned = value.replace(/[^\d-]/g, "");
      cleaned = cleaned.replace(/--+/g, "-");
      if (cleaned.length > 20) cleaned = cleaned.slice(0, 20);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      const isValid = /^(\d+(-\d+)*$)/.test(cleaned);
      if (!isValid) {
        setFormErrors((prev) => ({
          ...prev,
          nidaNumber: "Only digits and dashes are allowed. No leading/trailing or repeated dashes.",
        }));
      } else {
        setFormErrors((prev) => ({ ...prev, nidaNumber: undefined }));
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for region selection
  const handleRegionChange = (e) => {
    const { value } = e.target;
    setSelectedRegion(value);
    setFormData((prev) => ({ 
      ...prev, 
      region: value,
      district: "" // Clear district when region changes
    }));
    setFormErrors((prev) => ({ ...prev, region: undefined }));
  };

  // Handler for district selection
  const handleDistrictChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, district: value }));
    setFormErrors((prev) => ({ ...prev, district: undefined }));
  };

  const handleSuggestionSelected = (event, suggestion) => {
    console.log("Selected suggestion:", suggestion); // Debug: Log the selected suggestion
    
    if (!suggestion) {
      setSelectedSuggestion(null);
      setInputValue("");
      return;
    }
    
    // Dependents are now at the top level of the suggestion
    const dependents = suggestion.dependents || [];
    console.log("Dependents from suggestion:", dependents); // Debug: Log dependents
    
    const rawData = suggestion.rawData || suggestion;
    console.log("Raw data from suggestion:", rawData); // Debug: Log the raw data
    
    const institutionMatch =
      suggestion.displayName?.match(/—\s*\((.*?)\)/) ||
      suggestion.originalName?.match(/—\s*\((.*?)\)/) ||
      suggestion.name?.match(/—\s*\((.*?)\)/);
    const institutionName = institutionMatch ? institutionMatch[1].trim() : "";
    const selectedWithClaim = {
      ...suggestion,
      hasClaim: Boolean(rawData.claim_number),
      claimId: rawData.claim_number,
      allocated_user: rawData.allocated_user,
      allocated_user_id: rawData.allocated_user_id,
      allocated_user_username: rawData.allocated_user_username
    };
    setSelectedSuggestion(selectedWithClaim);
    setInputValue(suggestion.cleanName || suggestion.name || "");
    setSearchQuery(suggestion.cleanName || suggestion.name || "");
    setOpenAuto(false);
    let updatedFormData = { ...formData };
    if (searchType === "employee") {
      updatedFormData = {
        ...updatedFormData,
        firstName: suggestion.firstname || "",
        middleName: suggestion.middlename || "",
        lastName: suggestion.lastname || "",
        nidaNumber: suggestion.nin || "",
        phoneNumber: suggestion.employee_phone || suggestion.phoneNumber || "",
        institution: institutionName,
        dependents: dependents, // Use dependents from the flattened structure
        // Store both claim number and notification report ID
        claimNumber: suggestion.claim_number || rawData.claim_number || "",
        notification_report_id: suggestion.notification_report_id || rawData.notification_report_id || "",
      };
    } else if (searchType === "employer") {
      updatedFormData = {
        ...updatedFormData,
        firstName: "",
        middleName: "",
        lastName: "",
        nidaNumber: suggestion.tin || "",
        phoneNumber: suggestion.phone || "",
        institution: suggestion.name || "",
        dependents: dependents, // Use dependents from the flattened structure
      };
    }
    console.log("Updated form data with dependents:", updatedFormData.dependents); // Debug: Log the dependents in form data
    
    // Log if dependents were found
    if (updatedFormData.dependents && updatedFormData.dependents.length > 0) {
      console.log("✅ Dependents successfully populated:", updatedFormData.dependents);
    } else {
      console.log("❌ No dependents found in the search response");
    }
    updatedFormData = {
      ...updatedFormData,
      requester: updatedFormData.requester || formData.requester,
      region: updatedFormData.region || formData.region,
      district: updatedFormData.district || formData.district,
      channel: updatedFormData.channel || formData.channel,
      category: updatedFormData.category || formData.category,
      functionId: updatedFormData.functionId || formData.functionId,
      description: updatedFormData.description || formData.description,
      status: updatedFormData.status || formData.status,
      requesterName: updatedFormData.requesterName || rawData.requesterName || "",
      requesterPhoneNumber: updatedFormData.requesterPhoneNumber || rawData.requesterPhoneNumber || "",
      requesterEmail: updatedFormData.requesterEmail || rawData.requesterEmail || "",
      requesterAddress: updatedFormData.requesterAddress || rawData.requesterAddress || "",
      relationshipToEmployee: updatedFormData.relationshipToEmployee || rawData.relationshipToEmployee || ""
    };
    setFormData(updatedFormData);
    let selectedInstitutionName = "";
    if (searchType === "employee") {
      selectedInstitutionName = rawData.institution || rawData.employerName || updatedFormData.institution || "";
    } else if (searchType === "employer") {
      selectedInstitutionName = rawData.name || updatedFormData.institution || "";
    }
    if (selectedInstitutionName) {
      fetch("https://demomspapi.wcf.go.tz/api/v1/search/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          type: "employer",
          name: selectedInstitutionName,
          employer_registration_number: ""
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            setSelectedInstitution(data.results[0]);
          } else {
            setSelectedInstitution(null);
            setModal({
              isOpen: true,
              type: "error",
              message: "Institution not found. Please check the name and try again."
            });
          }
        })
        .catch(() => {
          setSelectedInstitution(null);
          setModal({
            isOpen: true,
            type: "error",
            message: "Institution not found. Please check the name and try again."
          });
        });
    } else {
      setSelectedInstitution(null);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        "https://demomspapi.wcf.go.tz/api/v1/search/details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            type: searchType,
            name: query,
            employer_registration_number: ""
          })
        }
      );
      const data = await response.json();
      console.log("Search API Response:", data); // Debug: Log the full response
      
      // Process the results to flatten the structure and preserve dependents
      const results = data.results || [];
      const suggestionsWithDependents = results.map(result => {
        // Extract employee data and dependents from the result
        const employeeData = result.employee || result;
        const dependents = result.dependents || [];
        
        console.log("Processing result:", result); // Debug: Log each result
        console.log("Employee data:", employeeData); // Debug: Log employee data
        console.log("Dependents:", dependents); // Debug: Log dependents
        
        return {
          ...employeeData, // Spread employee data to top level
          dependents: dependents, // Add dependents at top level
          rawData: result // Preserve the original result structure
        };
      });
      
      console.log("Processed suggestions with dependents:", suggestionsWithDependents); // Debug: Log processed suggestions
      setSearchSuggestions(suggestionsWithDependents);
    } catch (error) {
      console.error("Search error:", error);
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (event, newValue, reason) => {
    setInputValue(newValue);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (reason === "reset" || reason === "clear") {
      setSearchSuggestions([]);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 150);
  };

  const handleSubmit = async (e, action = "create") => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true when submitting

    const requiredFields = {
      phoneNumber: "Phone Number",
      requester: "Requester",
      institution: "Institution",
      region: "Region",
      district: "District",
      channel: "Channel",
      category: "Category",
      functionId: "Subject",
      description: "Description",
    };

    if (formData.requester === "Representative") {
      requiredFields.requesterName = "Representative Name";
      requiredFields.requesterPhoneNumber = "Representative Phone Number";
      requiredFields.relationshipToEmployee = "Relationship to Employee";
    }

    if (formData.requester === "Employer") {
      requiredFields.institution = "Employer Name";
      requiredFields.phoneNumber = "Employer Phone";
      // Add representative fields for employer registration
      requiredFields.requesterName = "Representative Name";
      requiredFields.requesterPhoneNumber = "Representative Phone Number";
      requiredFields.relationshipToEmployee = "Representative Position/Role";
    }

    const errors = {};
    const missing = [];
    Object.entries(requiredFields).forEach(([key, label]) => {
      if (!formData[key] || formData[key].toString().trim() === "") {
        errors[key] = "This field is required";
        missing.push(`• ${label}`);
      }
    });

    if (missing.length > 0) {
      setFormErrors(errors);
      setModal({
        isOpen: true,
        type: "error",
        message: `Please fill the required fields before submitting.`,
      });
      setIsLoading(false); // Set loading to false if validation fails
      return;
    }

    setFormErrors({});
    try {
      // Find the selected subject (FunctionData), parent function, and parent section
      let selectedSubject, parentFunction, parentSection;
      for (const func of functionData) {
        if (func.function && func.function.functionData) {
          selectedSubject = func.function.functionData.find(fd => fd.id === formData.functionId);
          if (selectedSubject) {
            parentFunction = func.function;
            parentSection = func.function.section;
            break;
          }
        }
      }
      
      // If not found in nested structure, try direct search
      if (!selectedSubject) {
        selectedSubject = functionData.find(item => item.id === formData.functionId);
      }
      
      // --- Allocated User Logic ---
      // Routing Rules:
      // 1. If searched details has a claim number → Send to checklist user shown in details
      // 2. If no claim number and it's an inquiry → Send to focal person of the selected section/unit
      // 3. Otherwise → Fallback to institution's allocated staff
      let employerAllocatedStaffUsername = "";

      if (selectedSuggestion && selectedSuggestion.allocated_user_username) {
        // Use allocated user from employee search response
        employerAllocatedStaffUsername = selectedSuggestion.allocated_user_username;
      } else {
        // No allocated user found, will be assigned by backend logic
        employerAllocatedStaffUsername = "";
      }

      const ticketData = {
        ...formData,
        subject: selectedSubject ? selectedSubject.name : "",
        sub_section: parentFunction ? parentFunction.name : "",
        section: parentSection ? parentSection.name : "",
        responsible_unit_id: formData.functionId,
        responsible_unit_name: parentSection ? parentSection.name : "",
        status: action === "closed" ? "Closed" : "Open",
        employerAllocatedStaffUsername,
        shouldClose: action === "closed",
        // Add claim number for routing decision
        claimId: selectedSuggestion?.claimId || null,
        // Add routing information for backend
        hasClaim: Boolean(selectedSuggestion?.claimId),
        isInquiry: formData.category === "Inquiry",
        // Add allocated user details for routing
        allocated_user_id: selectedSuggestion?.allocated_user_id || null,
        allocated_user_name: selectedSuggestion?.allocated_user || null,
        allocated_user_username: selectedSuggestion?.allocated_user_username || null,
        // Add employer information from search
        employer: formData.employer || selectedSuggestion?.employer || "",
        employerName: formData.employerName || "",
      };
      
      if (formData.requester === "Employer") {
        ticketData.employerRegistrationNumber = formData.nidaNumber;
        ticketData.employerName = formData.institution;
        ticketData.employerTin = formData.nidaNumber;
        ticketData.employerPhone = formData.phoneNumber;
        ticketData.employerEmail = formData.employerEmail || "";
        ticketData.employerStatus = formData.employerStatus || "";
        // Removed employer allocated user fields - only using employee search allocated user
      }
      // Map representative fields to backend field names if requester is Representative or Employer
      if (formData.requester === "Representative" || formData.requester === "Employer") {
        ticketData.representative_name = formData.requesterName;
        ticketData.representative_phone = formData.requesterPhoneNumber;
        ticketData.representative_email = formData.requesterEmail;
        ticketData.representative_address = formData.requesterAddress;
        ticketData.representative_relationship = formData.relationshipToEmployee;
      }
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/ticket/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketData),
      });

      const data = await response.json();
      if (response.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: data.message || "Ticket created successfully"
        });
        
        // Reset form data completely
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          phoneNumber: "",
          nidaNumber: "",
          requester: "",
          institution: "",
          region: "",
          district: "",
          channel: "",
          category: "",
          functionId: "",
          description: "",
          status: "Open",
          requesterName: "",
          requesterPhoneNumber: "",
          requesterEmail: "",
          requesterAddress: "",
          relationshipToEmployee: "",
          employerName: "",
          allocated_user_username: "",
          allocated_user_name: "",
          allocated_user_id: "",
          claimNumber: ""
        });
        
        // Reset search state
        resetSearch();
        
        // Close the modal after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setModal({
          isOpen: true,
          type: "error",
          message: data.message || "Ticket creation failed.",
        });
        setIsLoading(false); // Set loading to false after failure
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setModal({
        isOpen: true,
        type: "error",
        message: `Network error. Please try again later.`,
      });
      setIsLoading(false); // Set loading to false after error
    }
  };
  
  // --- End Handlers ---

  // Add closeModal function
  const closeModal = () => {
    setModal({ isOpen: false, type: "", message: "" });
  };

  useEffect(() => {
    setFormData((prev) => ({ ...prev, phoneNumber: initialPhoneNumber }));
  }, [initialPhoneNumber, open]);

  // Add phone normalization helper
  function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.trim();
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('0')) p = '255' + p.slice(1);
    return p;
  }

  useEffect(() => {
    const phone = formData.phoneNumber?.trim();
    const normalizedPhone = normalizePhone(phone);
    const token = localStorage.getItem("authToken");
    
    // Only fetch ticket history if we have a phone number and the right part should be visible
    if (normalizedPhone && normalizedPhone.length >= 7 && token && showRightPart && rightPartContent !== "hidden") {
      setCreationTicketsLoading(true);
      fetch(`${baseURL}/ticket/search-by-phone/${normalizedPhone}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.found && Array.isArray(data.tickets)) {
            setCreationFoundTickets(data.tickets);
            setRightPartContent("ticket-history");
          } else {
            setCreationFoundTickets([]);
            setRightPartContent("no-history");
          }
        })
        .catch(() => {
          setCreationFoundTickets([]);
          setRightPartContent("no-history");
        })
        .finally(() => setCreationTicketsLoading(false));
    } else if (!normalizedPhone || normalizedPhone.length < 7) {
      // No phone number, show no history
      setCreationFoundTickets([]);
      setRightPartContent("no-history");
    }
  }, [formData.phoneNumber, showRightPart, rightPartContent]);

  // Add useEffect to monitor search state and handle not found scenarios
  useEffect(() => {
    // If search is completed but no employee/employer is selected, and we have a search query,
    // it might mean the search returned no results
    if (searchCompleted && !selectedEmployee && !selectedEmployer && currentSearchQuery) {
      // Check if we should show user not found message
      // This will be triggered when the EnhancedSearchForm completes a search but doesn't find results
      setTimeout(() => {
        if (!selectedEmployee && !selectedEmployer && currentSearchQuery) {
          handleUserNotFound(currentSearchQuery, formSearchType);
        }
      }, 1000); // Small delay to allow the search to complete
    }
  }, [searchCompleted, selectedEmployee, selectedEmployer, currentSearchQuery, formSearchType]);

  // Add useEffect to show right part when form is displayed
  useEffect(() => {
    if (showForm) {
      // Show right part when form is displayed
      setShowRightPart(true);
      setRightPartContent("ticket-history");
    }
  }, [showForm]);

  // Add a function to manually trigger user not found (can be called from EnhancedSearchForm)
  const triggerUserNotFound = (searchQuery, searchType) => {
    handleUserNotFound(searchQuery, searchType);
  };

  // Add the full JSX structure from the CRM modal here
  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: 1200,
            maxWidth: "98vw",
            minHeight: searchStep === 0 && !showForm ? 350 : 500,
            maxHeight: "90vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 0
          }}
        >
          <Box
            sx={{
              flex: 3,
              p: 4,
              borderRight: "1px solid #eee",
              overflowY: "auto",
              minWidth: 0,
              maxHeight: "90vh"
            }}
          >
            <div className="modal-form-container">
              <h2 className="modal-title">New Ticket</h2>

              {/* Enhanced Two-Step Search Form */}
              <EnhancedSearchForm
                onEmployerSelect={handleEmployerSelectionWithFlow}
                onEmployeeSelect={handleEmployeeSelectionWithFlow}
                onReset={resetSearch}
                selectedEmployer={selectedEmployer}
                searchStep={searchStep}
                setSearchStep={setSearchStep}
                onSearchTypeChange={handleSearchTypeChange}
                onUserNotFound={triggerUserNotFound}
                currentSearchQuery={currentSearchQuery}
                searchType={formSearchType}
              />

              {/* User Not Found Message */}
              {/* {showUserNotFound && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "15px",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffeaa7",
                    borderRadius: "8px",
                    textAlign: "center"
                  }}
                >
                  <Typography variant="h6" style={{ color: "#856404", marginBottom: "8px" }}>
                    User Not Found
                  </Typography>
                  <Typography variant="body2" style={{ color: "#856404", marginBottom: "10px" }}>
                    No {registrationType} found with the name "{currentSearchQuery}".
                  </Typography>
                  <Typography variant="body2" style={{ color: "#856404" }}>
                    Would you like to register a new {registrationType} or try a different search?
                  </Typography>
                </div>
              )} */}

              {/* Registration Options */}
              {showRegistrationOptions && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px"
                  }}
                >
                  <Typography variant="h6" style={{ marginBottom: "15px", textAlign: "center" }}>
                    Choose an Option
                  </Typography>
                  <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                    <button
                      onClick={() => handleRegistrationOption(registrationType)}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold"
                      }}
                    >
                      Register New {registrationType === "employee" ? "Employee" : "Employer"}
                    </button>
                    <button
                      onClick={resetSearch}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold"
                      }}
                    >
                      Try Different Search
                    </button>
                  </div>
                </div>
              )}

              {/* Form Section - Only show when showForm is true */}
              {showForm && (
                <>
                  {/* Form Header */}
                  <div
                    style={{
                      marginTop: "20px",
                      marginBottom: "15px",
                      padding: "15px",
                      backgroundColor: "#d4edda",
                      border: "1px solid #c3e6cb",
                      borderRadius: "8px"
                    }}
                  >
                    <Typography variant="h6" style={{ color: "#155724", marginBottom: "5px" }}>
                      {registrationType ? `Register New ${registrationType === "employee" ? "Employee" : "Employer"}` : "Ticket Details"}
                    </Typography>
                    <Typography variant="body2" style={{ color: "#155724" }}>
                      {registrationType 
                        ? `Please fill in the details for the new ${registrationType}`
                        : "Please fill in the ticket details below"
                      }
                    </Typography>
                  </div>

                  {/* Update the claim status section */}
                  {formSearchType === "employee" && selectedEmployee && (
                    <div
                      style={{
                        marginTop: "10px",
                        marginBottom: "12px",
                        padding: "15px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef"
                      }}
                    >
                      {/* Claim Number and Button Row */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: formData.dependents && formData.dependents.length > 0 ? "12px" : "0"
                      }}>
                        <div>
                          <Typography
                            variant="subtitle2"
                            style={{ fontWeight: "bold" }}
                          >
                            {formData.claimNumber ? (
                              <>
                                Claim Number:{" "}
                                <span style={{ color: "#1976d2" }}>
                                  {formData.claimNumber}
                                </span>
                                {formData.notification_report_id && (
                                  <>
                                    <br />
                                    Notification ID:{" "}
                                    <span style={{ color: "#28a745" }}>
                                      {formData.notification_report_id}
                                    </span>
                                  </>
                                )}
                              </>
                            ) : (
                              "No Active Claim"
                            )}
                          </Typography>
                        </div>
                        
                        {/* Claim Button with Login Redirect */}
                        {formData.notification_report_id && (
                          <ClaimRedirectButton
                            notificationReportId={formData.notification_report_id}
                            employerId={formData.employerId || ''}
                            buttonText="View Claim in MAC"
                            openMode="new-tab"
                            openEarlyNewTab={true}
                            onSuccess={(data) => {
                              console.log('Claim redirect successful:', data);
                              // You can add additional success handling here
                            }}
                            onError={(error) => {
                              console.error('Claim redirect failed:', error);
                              // You can add additional error handling here
                            }}
                          />
                        )}
                      </div>

                      {/* Dependents Section */}
                      {formData.dependents && formData.dependents.length > 0 && (
                        <div style={{
                          borderTop: "1px solid #dee2e6",
                          paddingTop: "12px"
                        }}>
                          <Typography
                            variant="subtitle2"
                            style={{ 
                              fontWeight: "bold", 
                              marginBottom: "8px",
                              color: "#495057"
                            }}
                          >
                            Dependents ({formData.dependents.length}):
                          </Typography>
                          <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px"
                          }}>
                            {formData.dependents.map((dependent, index) => (
                              <div
                                key={index}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#e3f2fd",
                                  borderRadius: "16px",
                                  border: "1px solid #bbdefb",
                                  color: "#1976d2",
                                  fontSize: "0.875rem",
                                  fontWeight: "500"
                                }}
                              >
                                {dependent}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing form fields */}
                  {formSearchType !== "employer" && (
                    <div className="modal-form-row">
                      <div className="modal-form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.875rem" }}>First Name: <span style={{ color: "red" }}>*</span></label>
                        <input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Enter first name"
                          style={{
                            height: "32px",
                            fontSize: "0.875rem",
                            padding: "4px 8px",
                            border: formErrors.firstName
                              ? "1px solid red"
                              : "1px solid #ccc"
                          }}
                        />
                        {formErrors.firstName && (
                          <span style={{ color: "red", fontSize: "0.75rem" }}>
                            {formErrors.firstName}
                          </span>
                        )}
                      </div>

                      <div className="modal-form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.875rem" }}>
                          Middle Name (Optional):
                        </label>
                        <input
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          placeholder="Enter middle name"
                          style={{
                            height: "32px",
                            fontSize: "0.875rem",
                            padding: "4px 8px",
                            border: "1px solid #ccc"
                          }}
                        />
                      </div>

                      <div className="modal-form-group" style={{ flex: 1 }}>
                        <label style={{ fontSize: "0.875rem" }}>
                          Last Name
                          {formData.requester === "Employer" ? " (Optional)" : <span style={{ color: "red" }}> *</span>}:
                        </label>
                        <input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Enter last name"
                          style={{
                            height: "32px",
                            fontSize: "0.875rem",
                            padding: "4px 8px",
                            border:
                              formErrors.lastName &&
                              formData.requester !== "Employer"
                                ? "1px solid red"
                                : "1px solid #ccc"
                          }}
                        />
                        {formErrors.lastName &&
                          formData.requester !== "Employer" && (
                            <span style={{ color: "red", fontSize: "0.75rem" }}>
                              {formErrors.lastName}
                            </span>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Phone & NIDA */}
                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>
                        Phone Number: <span style={{ color: "red" }}>*</span>
                        {callPhoneNumber && (
                          <span style={{ 
                            color: "#1976d2", 
                            fontSize: "0.75rem", 
                            marginLeft: "8px",
                            fontWeight: "500"
                          }}>
                            📞 From Call
                          </span>
                        )}
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          border: formErrors.phoneNumber
                            ? "1px solid red"
                            : callPhoneNumber 
                              ? "2px solid #1976d2" 
                              : "1px solid #ccc",
                          backgroundColor: callPhoneNumber ? "#f8f9fa" : "white",
                          fontWeight: callPhoneNumber ? "500" : "normal"
                        }}
                        title={callPhoneNumber ? "Phone number preserved from call - will not be overwritten by search results" : ""}
                      />
                      {formErrors.phoneNumber && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.phoneNumber}
                        </span>
                      )}
                      {callPhoneNumber && (
                        <span style={{ 
                          color: "#1976d2", 
                          fontSize: "0.75rem",
                          fontStyle: "italic"
                        }}>
                          This number is preserved from the call and will not be changed by search results
                        </span>
                      )}
                    </div>

                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>
                        {formData.requester === "Employer"
                          ? "TIN:"
                          : "National Identification Number:"}
                      </label>
                      <input
                        name="nidaNumber"
                        value={formData.nidaNumber}
                        onChange={handleChange}
                        placeholder={
                          formData.requester === "Employer"
                            ? "Enter TIN number"
                            : "Enter NIN number"
                        }
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          border: formErrors.nidaNumber
                            ? "1px solid red"
                            : "1px solid #ccc"
                        }}
                      />
                      {formErrors.nidaNumber && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.nidaNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Requester & Institution */}
                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>Requester: <span style={{ color: "red" }}>*</span></label>
                      <select
                        name="requester"
                        value={formData.requester}
                        onChange={handleChange}
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          width: "100%",
                          border: formErrors.requester
                            ? "1px solid red"
                            : "1px solid #ccc"
                        }}
                      >
                        <option value="">Select..</option>
                        <option value="Employee">Employee</option>
                        <option value="Employer">Employer</option>
                        <option value="Pensioners">Pensioners</option>
                        <option value="Stakeholders">Stakeholders</option>
                        <option value="Representative">Representative</option>
                      </select>
                      {formErrors.requester && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.requester}
                        </span>
                      )}
                    </div>

                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>Institution: <span style={{ color: "red" }}>*</span></label>
                      <input
                        name="institution"
                        value={formData.institution}
                        onChange={handleChange}
                        placeholder="Enter Institution"
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          border: formErrors.institution
                            ? "1px solid red"
                            : "1px solid #ccc"
                        }}
                      />
                      {formErrors.institution && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.institution}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* New fields for Representative if selected */}
                  {(formData.requester === "Representative" || formData.requester === "Employer") && (
                    <>
                      <Typography
                        variant="h6"
                        sx={{ mt: 3, mb: 1, fontWeight: "bold" }}
                      >
                        {formData.requester === "Employer" ? "Employer Representative Details" : "Representative Details"}
                      </Typography>
                      <div className="modal-form-row">
                        <div className="modal-form-group">
                          <label style={{ fontSize: "0.875rem" }}>
                            {formData.requester === "Employer" ? "Representative Name" : "Representative Name"}: <span style={{ color: "red" }}>*</span>
                          </label>
                          <input
                            name="requesterName"
                            value={formData.requesterName}
                            onChange={handleChange}
                            placeholder="Enter representative's name"
                            style={{
                              height: "32px",
                              fontSize: "0.875rem",
                              padding: "4px 8px",
                              border: formErrors.requesterName
                                ? "1px solid red"
                                : "1px solid #ccc"
                            }}
                          />
                          {formErrors.requesterName && (
                            <span style={{ color: "red", fontSize: "0.75rem" }}>
                              {formErrors.requesterName}
                            </span>
                          )}
                        </div>
                        <div className="modal-form-group">
                          <label style={{ fontSize: "0.875rem" }}>
                            Representative Phone Number: <span style={{ color: "red" }}>*</span>
                          </label>
                          <input
                            type="tel"
                            name="requesterPhoneNumber"
                            value={formData.requesterPhoneNumber}
                            onChange={handleChange}
                            placeholder="Enter representative's phone number"
                            style={{
                              height: "32px",
                              fontSize: "0.875rem",
                              padding: "4px 8px",
                              border: formErrors.requesterPhoneNumber
                                ? "1px solid red"
                                : "1px solid #ccc"
                            }}
                          />
                          {formErrors.requesterPhoneNumber && (
                            <span style={{ color: "red", fontSize: "0.75rem" }}>
                              {formErrors.requesterPhoneNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="modal-form-row">
                        <div className="modal-form-group">
                          <label style={{ fontSize: "0.875rem" }}>
                            Representative Email (Optional):
                          </label>
                          <input
                            type="email"
                            name="requesterEmail"
                            value={formData.requesterEmail}
                            onChange={handleChange}
                            placeholder="Enter representative's email"
                            style={{
                              height: "32px",
                              fontSize: "0.875rem",
                              padding: "4px 8px",
                              border: "1px solid #ccc"
                            }}
                          />
                        </div>
                        <div className="modal-form-group">
                          <label style={{ fontSize: "0.875rem" }}>
                            Representative Address (Optional):
                          </label>
                          <input
                            name="requesterAddress"
                            value={formData.requesterAddress}
                            onChange={handleChange}
                            placeholder="Enter representative's address"
                            style={{
                              height: "32px",
                              fontSize: "0.875rem",
                              padding: "4px 8px",
                              border: "1px solid #ccc"
                            }}
                          />
                        </div>
                      </div>

                      <div className="modal-form-row">
                        <div className="modal-form-group">
                          <label style={{ fontSize: "0.875rem" }}>
                            {formData.requester === "Employer" ? "Representative Position/Role" : "Relationship to Employee"}: <span style={{ color: "red" }}>*</span>
                          </label>
                          <input
                            name="relationshipToEmployee"
                            value={formData.relationshipToEmployee}
                            onChange={handleChange}
                            placeholder={formData.requester === "Employer" ? "e.g., HR Manager, Director, CEO" : "e.g., Parent, Spouse, Child"}
                            style={{
                              height: "32px",
                              fontSize: "0.875rem",
                              padding: "4px 8px",
                              border: formErrors.relationshipToEmployee
                                ? "1px solid red"
                                : "1px solid #ccc"
                            }}
                          />
                          {formErrors.relationshipToEmployee && (
                            <span style={{ color: "red", fontSize: "0.75rem" }}>
                              {formErrors.relationshipToEmployee}
                            </span>
                          )}
                        </div>
                        <div className="modal-form-group"></div>{" "}
                        {/* Empty for alignment */}
                      </div>
                    </>
                  )}

                  {/* Dependents Section */}
                  {/* Old dependents section removed - now integrated with claim section above */}

                  {/* Region & District */}
                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>Region: <span style={{ color: "red" }}>*</span></label>
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleRegionChange}
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          width: "100%",
                          border: formErrors.region
                            ? "1px solid red"
                            : "1px solid #ccc"
                        }}
                      >
                        <option value="">Select Region</option>
                        {regionsData.map((region) => (
                          <option key={region.value} value={region.value}>
                            {region.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.region && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.region}
                        </span>
                      )}
                    </div>

                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>District: <span style={{ color: "red" }}>*</span></label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleDistrictChange}
                        disabled={!formData.region}
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          width: "100%",
                          border: formErrors.district
                            ? "1px solid red"
                            : "1px solid #ccc",
                          backgroundColor: !formData.region ? "#f5f5f5" : "white"
                        }}
                      >
                        <option value="">
                          {formData.region ? "Select District" : "Select Region First"}
                        </option>
                        {formData.region && districtsData[formData.region] && 
                          districtsData[formData.region].map((district) => (
                            <option key={district.value} value={district.value}>
                              {district.label}
                            </option>
                          ))
                        }
                      </select>
                      {formErrors.district && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.district}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category & Channel */}
                  <div className="modal-form-row">
                    <div className="modal-form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.875rem" }}>Category: <span style={{ color: "red" }}>*</span></label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          width: "100%",
                          border: formErrors.category
                            ? "1px solid red"
                            : "1px solid #ccc"
                        }}
                      >
                        <option value="">Select Category</option>
                        <option value="Inquiry">Inquiry</option>
                        <option value="Complaint">Complaint</option>
                        <option value="Suggestion">Suggestion</option>
                        <option value="Compliment">Compliment</option>
                      </select>
                      {formErrors.category && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.category}
                        </span>
                      )}
                    </div>

                    <div className="modal-form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.875rem" }}>Channel: <span style={{ color: "red" }}>*</span></label>
                      <select
                        name="channel"
                        value={formData.channel}
                        onChange={handleChange}
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          width: "100%",
                          border: formErrors.channel
                            ? "1px solid red"
                            : "1px solid #ccc"
                        }}
                      >
                        <option value="">Select Channel</option>
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                      </select>
                      {formErrors.channel && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.channel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject, Sub-section, Section */}
                  <div className="modal-form-row">
                    <div className="modal-form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: "0.875rem" }}>Subject: <span style={{ color: "red" }}>*</span></label>
                      <select
                        name="functionId"
                        value={formData.functionId}
                        onChange={handleChange}
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          width: "100%",
                          border: formErrors.functionId
                            ? "1px solid red"
                            : "1px solid #ccc"
                        }}
                      >
                        <option value="">Select Subject</option>
                        {functionData.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.functionId && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.functionId}
                        </span>
                      )}
                    </div>

                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>Sub-section:</label>
                      <input
                        value={selectedFunction}
                        readOnly
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          backgroundColor: "#f5f5f5"
                        }}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label style={{ fontSize: "0.875rem" }}>Section:</label>
                      <input
                        value={selectedSection || "Unit"}
                        readOnly
                        style={{
                          height: "32px",
                          fontSize: "0.875rem",
                          padding: "4px 8px",
                          backgroundColor: "#f5f5f5"
                        }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>Description: <span style={{ color: "red" }}>*</span></label>
                    <textarea
                      rows="2"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Detailed descriptions.."
                      style={{
                        fontSize: "0.875rem",
                        padding: "8px",
                        resize: "vertical",
                        border: formErrors.description
                          ? "1px solid red"
                          : "1px solid #ccc"
                      }}
                    />
                    {formErrors.description && (
                      <span style={{ color: "red", fontSize: "0.75rem" }}>
                        {formErrors.description}
                      </span>
                    )}
                  </div>

                  {/* Submit */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "10px",
                      marginTop: "1.5rem"
                    }}
                  >
                    <button
                      className="cancel-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="submit-btn"
                      onClick={(e) => handleSubmit(e)}
                    >
                      Submit to Backoffice
                    </button>
                    <button
                      className="close-btn"
                      style={{ background: "gray", color: "white" }}
                      onClick={(e) => handleSubmit(e, "closed")}
                    >
                      Close Ticket
                    </button>
                  </div>
                </>
              )}
            </div>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 4,
              overflowY: "auto",
              minWidth: 350,
              maxWidth: 450,
              maxHeight: "90vh",
              display: showRightPart ? "block" : "none"
            }}
          >
            {/* Show "No history yet" initially */}
            {rightPartContent === "no-history" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#666",
                  textAlign: "center"
                }}
              >
                <Typography variant="h6" style={{ marginBottom: 8, color: "#1976d2" }}>
                  No History Yet
                </Typography>
                <Typography variant="body2" style={{ color: "#888" }}>
                  Start searching for an employer or employee to see ticket history.
                </Typography>
              </div>
            )}

            {/* Show ticket history when available */}
            {rightPartContent === "ticket-history" && (
              <>
                {/* Employer/Institution Details */}
                {(selectedInstitution || (selectedEmployee && formData.allocated_user_name)) && (
                  <div
                    style={{
                      flex: 1,
                      background: "#e3f2fd",
                      borderRadius: "8px",
                      padding: "16px",
                      minWidth: 0,
                      marginBottom: 16
                    }}
                  >
                    <h4 style={{ color: "#1976d2", marginBottom: 12 }}>
                      {selectedInstitution ? "Institution Details" : "Employee Details"}
                    </h4>
                    {selectedInstitution && (
                      <>
                        <div>
                          <strong>Name:</strong> {selectedInstitution.name}
                        </div>
                        <div>
                          <strong>TIN:</strong> {selectedInstitution.tin}
                        </div>
                        <div>
                          <strong>Phone:</strong> {selectedInstitution.phone}
                        </div>
                        <div>
                          <strong>Email:</strong> {selectedInstitution.email}
                        </div>
                        <div>
                          <strong>Status:</strong> {selectedInstitution.employer_status}
                        </div>
                        <div>
                          <strong>Allocated User:</strong>{" "}
                          {selectedInstitution.allocated_staff_name || "Not assigned"}
                        </div>
                      </>
                    )}
                    {selectedEmployee && formData.allocated_user_name && (
                      <>
                        {!selectedInstitution && (
                          <>
                            <div>
                              <strong>Employee Name:</strong> {`${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()}
                            </div>
                            <div>
                              <strong>Claim Number:</strong> {formData.claimNumber || "No active claim"}
                            </div>
                          </>
                        )}
                        <div>
                          <strong>Checklist User:</strong> {formData.allocated_user_name}
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Ticket history for entered phone number */}
                {formData.phoneNumber && (
                  <div
                    style={{
                      marginTop: 8,
                      background: "#f8f9fa",
                      borderRadius: 8,
                      padding: 0,
                      minHeight: 60
                    }}
                  >
                    <h4 style={{ color: "#1976d2", margin: '16px 0 8px 0', paddingLeft: 16 }}>
                      Ticket History for {formData.phoneNumber}
                    </h4>
                    {creationTicketsLoading ? (
                      <div style={{ textAlign: "center", padding: 12 }}>
                        <CircularProgress size={22} />
                      </div>
                    ) : creationFoundTickets.length > 0 ? (
                      creationFoundTickets.map((ticket) => (
                        <Box
                          key={ticket.id}
                          onClick={() => setCreationActiveTicketId(ticket.id)}
                          sx={{
                            mb: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: creationActiveTicketId === ticket.id ? "#e3f2fd" : "#fff",
                            cursor: "pointer",
                            border: creationActiveTicketId === ticket.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            transition: 'box-shadow 0.2s, border-color 0.2s',
                            '&:hover': {
                              boxShadow: '0 4px 8px rgba(25,118,210,0.1)',
                              borderColor: '#1976d2'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              {ticket.ticket_id}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                sx={{
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '12px',
                                  color: 'white',
                                  background:
                                    ticket.status === 'Closed'
                                      ? '#757575'
                                      : ticket.status === 'Open'
                                      ? '#2e7d32'
                                      : '#1976d2',
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}
                              >
                                {ticket.status}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenJustificationHistory(ticket);
                                }}
                                sx={{
                                  color: '#1976d2',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.1)'
                                  }
                                }}
                                title="View Recomendation History"
                              >
                                <ChatIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                              Created: {new Date(ticket.created_at).toLocaleDateString()}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, color: '#333', mb: 1 }}>
                              Subject: {ticket.subject}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#666',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              Description: {ticket.description}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <div style={{ color: '#888', fontSize: '0.95em', textAlign: 'center', padding: 16 }}>
                        No previous tickets found for this number.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Justification History Modal */}
      <Dialog 
        open={isJustificationModalOpen} 
        onClose={handleCloseJustificationModal} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Justification History - {selectedTicketForJustification?.ticket_id}
        </DialogTitle>
        <DialogContent>
          {selectedTicketForJustification && (
            <AssignmentFlowChat assignmentHistory={assignmentHistory} selectedTicket={selectedTicketForJustification} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal for Success/Error Messages */}
      {modal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1301,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "8px",
            width: "400px",
            textAlign: "center",
            borderLeft: modal.type === "success" ? "6px solid #4caf50" : "6px solid #f44336"
          }}>
            <h3 style={{ margin: "0 0 16px 0", color: modal.type === "success" ? "#4caf50" : "#f44336" }}>
              {modal.type === "success" ? "Success" : "Error"}
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", lineHeight: "1.5" }}>
              {modal.message}
            </p>
            <button 
              onClick={closeModal} 
              style={{
                marginTop: "20px",
                background: "#007bff",
                border: "none",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Close
            </button>
            
          </div>
        </div>
      )}
    </>
  );
}

export default AdvancedTicketCreateModal;

