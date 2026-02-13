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
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import { styled } from "@mui/material/styles";
import ChatIcon from '@mui/icons-material/Chat';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import { baseURL } from "../../config";
import EnhancedSearchForm from "../search/EnhancedSearchForm";
import ClaimRedirectButton from "./ClaimRedirectButton.jsx";
import TicketUpdates from './TicketUpdates';
import ActionMessageModal from "./ActionMessageModal";

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
  { value: "Unguja South", label: "Unguja South" },
  { value: "Pemba North", label: "Pemba North" },
  { value: "Pemba South", label: "Pemba South" }
];

const districtsData = {
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
    { value: "Biharamulo", label: "Biharamulo" },
    { value: "Chato", label: "Chato" }
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
    { value: "Kibondo", label: "Kibondo" },
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
    { value: "Itilima", label: "Itilima" },
    { value: "Maswa", label: "Maswa" },
    { value: "Meatu", label: "Meatu" }
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
    { value: "Mbeya-City", label: "Mbeya City" },
    { value: "Mbeya-Rural", label: "Mbeya Rural" },
    { value: "Chunya", label: "Chunya" },
    { value: "Kyela", label: "Kyela" },
    { value: "Mbarali", label: "Mbarali" },
    { value: "Rujewa", label: "Rujewa" },
    { value: "Ileje", label: "Ileje" },
    { value: "Mbozi", label: "Mbozi" }
  ],
  "Tabora": [
    { value: "Tabora-Urban", label: "Tabora Urban" },
    { value: "Tabora-Rural", label: "Tabora Rural" },
    { value: "Igunga", label: "Igunga" },
    { value: "Nkasi", label: "Nkasi" },
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

function AdvancedTicketCreateModal({ open, onClose, onOpen, initialPhoneNumber = "", functionData = [] }) {
  // Debug functionData prop
  useEffect(() => {
    console.log("AdvancedTicketCreateModal - functionData received:", functionData);
    console.log("functionData length:", functionData ? functionData.length : 0);
    if (functionData && functionData.length > 0) {
      console.log("First functionData item:", functionData[0]);
    }
  }, [functionData]);

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
  const [ticketNumberSearch, setTicketNumberSearch] = useState("");
  const [ticketNumberSearchLoading, setTicketNumberSearchLoading] = useState(false);
  const [ticketNumberSearchResults, setTicketNumberSearchResults] = useState([]);
  const [submitAction, setSubmitAction] = useState("open");
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Enhanced Search Form State ---
  const [searchStep, setSearchStep] = useState("");
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formSearchType, setFormSearchType] = useState("");
  const [searchCompleted, setSearchCompleted] = useState(false);
  
  // --- New State for Form Visibility and User Registration ---
  const [showForm, setShowForm] = useState(false);
  const [showUserNotFound, setShowUserNotFound] = useState(false);
  const [showRegistrationOptions, setShowRegistrationOptions] = useState(false);
  const [registrationType, setRegistrationType] = useState(""); // "employee" or "employer"
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [selectedClaimIndex, setSelectedClaimIndex] = useState(0); // Track which claim is selected
  
  // --- Right Part Visibility Control ---
  const [showRightPart, setShowRightPart] = useState(true);
  const [rightPartContent, setRightPartContent] = useState("no-history"); // "no-history", "hidden", "ticket-history"

  // --- Relations for Representative/Employer (managed by super-admin in Lookup Tables) ---
  const [relations, setRelations] = useState([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationsError, setRelationsError] = useState("");

  // --- Channels State ---
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState("");

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        setRelationsLoading(true);
        setRelationsError("");
        const token = localStorage.getItem("authToken");
        if (!token) {
          setRelationsError("Auth token missing");
          return;
        }
        const res = await fetch(`${baseURL}/lookup-tables/relations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setRelationsError(err.message || "Failed to load relations");
          return;
        }
        const json = await res.json();
        setRelations(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.error("Error fetching relations:", e);
        setRelationsError("Failed to load relations");
      } finally {
        setRelationsLoading(false);
      }
    };

    fetchRelations();
  }, []);

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setChannelsLoading(true);
        setChannelsError("");
        const token = localStorage.getItem("authToken");
        if (!token) {
          setChannelsError("Auth token missing");
          return;
        }
        const res = await fetch(`${baseURL}/channel`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setChannelsError(err.message || "Failed to load channels");
          return;
        }
        const json = await res.json();
        setChannels(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        console.error("Error fetching channels:", e);
        setChannelsError("Failed to load channels");
      } finally {
        setChannelsLoading(false);
      }
    };

    fetchChannels();
  }, []);
  
  // --- Call Phone Number Preservation ---
  const [callPhoneNumber] = useState(initialPhoneNumber); // Preserve call phone number throughout component lifecycle
  // --- End Enhanced Search Form State ---
  
  // --- Region and District State ---
  const [selectedRegion, setSelectedRegion] = useState("");
  // --- End Region and District State ---

  // --- Justification History State ---
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [selectedTicketForJustification, setSelectedTicketForJustification] = useState(null);
  
  // Close modal state variables
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [resolutionType, setResolutionType] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  // --- End Justification History State ---
  // --- End CRM Modal State ---

  // --- Ticket Updates Modal State ---
  const [isTicketUpdatesModalOpen, setIsTicketUpdatesModalOpen] = useState(false);
  const [selectedTicketForUpdates, setSelectedTicketForUpdates] = useState(null);

  // --- Notify User Modal State ---
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [selectedTicketForNotify, setSelectedTicketForNotify] = useState(null);
  const [notifyLoading, setNotifyLoading] = useState(false);
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // --- Ticket Updates Functions ---
  const handleOpenTicketUpdates = (ticket) => {
    console.log("Opening ticket updates for ticket:", ticket);
    setSelectedTicketForUpdates(ticket);
    setIsTicketUpdatesModalOpen(true);
  };

  const handleCloseTicketUpdatesModal = () => {
    setIsTicketUpdatesModalOpen(false);
    setSelectedTicketForUpdates(null);
  };

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
    // Don't change formSearchType here - let it remain as set by the user in Step 0
    // setFormSearchType("employer"); // REMOVED - this was breaking the employee search flow
    setSearchCompleted(true);
    
    // Only show form immediately if user was searching for employer
    // If user was searching for employee, let EnhancedSearchForm handle the flow to Step 2
    if (formSearchType === "employer") {
      setShowForm(true); // Show form after employer is found
    }
    // If formSearchType is "employee", don't show form yet - let EnhancedSearchForm show Step 2
    
    setShowUserNotFound(false);
    setShowRegistrationOptions(false);
    
    // Update form data with employer information while preserving call phone number
    // Extract allocated staff from employer data
    const allocatedStaffUsername = employer.allocated_staff_username || null;
    
    console.log("🔵 EMPLOYER SELECTION - Allocated User:");
    console.log("  - employer.allocated_staff_username:", employer.allocated_staff_username);
    console.log("  - employer.allocated_staff_name:", employer.allocated_staff_name);
    console.log("  - employer.allocated_staff_id:", employer.allocated_staff_id);
    console.log("  - Final allocatedStaffUsername:", allocatedStaffUsername);
    
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
      employerName: employer.name || "",
      // Store allocated staff information from employer
      allocated_user_username: allocatedStaffUsername || prev.allocated_user_username || "",
      allocated_user_name: employer.allocated_staff_name || prev.allocated_user_name || "",
      allocated_user_id: employer.allocated_staff_id || prev.allocated_user_id || ""
    }));
    
    // Fetch institution details
    if (employer.name) {
      fetch("https://mspapi.wcf.go.tz/api/v1/search/details", {
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
    
    // Extract claims data for allocated_user information (new format)
    const claims = employee.claims || [];
    const firstClaim = claims.length > 0 ? claims[0] : null;
    
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
    setSelectedClaimIndex(0); // Reset to first claim when new employee is selected
    
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
      institution: selectedEmployer ? selectedEmployer.name : (employeeData.institution || employeeData.employerName || employeeData.employer_name || ""),
      requester: "Employee",
      // Store allocated user information from search response (check claims first for new format)
      // Use first claim for initial assignment, but store all claims
      allocated_user_username: firstClaim?.allocated_user_username || employeeData.allocated_user_username || "",
      allocated_user_name: firstClaim?.allocated_user || employeeData.allocated_user || "",
      allocated_user_id: firstClaim?.allocated_user_id || employeeData.allocated_user_id || "",
      // Store claim information (use first claim for form, but store all claims)
      claimNumber: firstClaim?.claim_number || employeeData.claim_number || "",
      notification_report_id: firstClaim?.notification_report_id || employeeData.notification_report_id || "",
      // Store all claims as array for future use
      allClaims: claims.length > 0 ? claims : (employeeData.allClaims || []),
      // Store dependents information
      dependents: employee.dependents || employeeData.dependents || []
    }));

    // Set selected suggestion for claim button display (include all claims info)
    const suggestionData = {
      ...employeeData,
      claims: claims, // Store all claims
      allocated_user: firstClaim?.allocated_user || employeeData.allocated_user || null,
      allocated_user_id: firstClaim?.allocated_user_id || employeeData.allocated_user_id || null,
      allocated_user_username: firstClaim?.allocated_user_username || employeeData.allocated_user_username || null,
      claim_number: firstClaim?.claim_number || employeeData.claim_number || null,
      notification_report_id: firstClaim?.notification_report_id || employeeData.notification_report_id || null,
      hasClaim: claims.length > 0 || Boolean(employeeData.claim_number),
      claimId: firstClaim?.claim_number || employeeData.claim_number || null,
      claimsCount: claims.length
    };
    setSelectedSuggestion(suggestionData);

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
    setSearchStep("");
    setSearchCompleted(false);
    setFormSearchType("");
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
        "https://mspapi.wcf.go.tz/api/v1/search/details",
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

      // Handle both old format (data.results) and new format (direct array)
      let searchResults = [];
      if (Array.isArray(data)) {
        // New format: response is directly an array
        searchResults = data;
      } else if (data.results && Array.isArray(data.results)) {
        // Old format: response has results property
        searchResults = data.results;
      }

      if (response.ok && searchResults.length > 0) {
        setSearchResults(searchResults);
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

    // Auto-fill phone number when requester is changed to Employer or Representative
    if (name === "requester" && (value === "Employer" || value === "Representative")) {
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };
        
        // If there's representative phone number data available, auto-fill the main phone number
        if (prev.requesterPhoneNumber && prev.requesterPhoneNumber.trim()) {
          updatedData.phoneNumber = prev.requesterPhoneNumber.trim();
        }
        // If there's main phone number data available, auto-fill the representative phone number
        else if (prev.phoneNumber && prev.phoneNumber.trim()) {
          updatedData.requesterPhoneNumber = prev.phoneNumber.trim();
        }
        
        return updatedData;
      });
    }

    if (name === "functionId") {
      console.log('🔍 functionId changed to:', value);
      console.log('🔍 Available functionData:', functionData);
      
      const selectedFunctionData = functionData.find((item) => item.id === value);
      if (selectedFunctionData) {
        // Try different possible data structures
        const functionName = selectedFunctionData.function?.name || 
                           selectedFunctionData.name || 
                           selectedFunctionData.function_name || 
                           "";
        const sectionName = selectedFunctionData.function?.section?.name || 
                          selectedFunctionData.section?.name || 
                          selectedFunctionData.section_name || 
                          selectedFunctionData.section || 
                          "";
        
        setSelectedFunction(functionName);
        setSelectedSection(sectionName);
        
        console.log('Selected function data:', selectedFunctionData);
        console.log('Function name:', functionName);
        console.log('Section name:', sectionName);
      } else {
        console.log('❌ No function data found for ID:', value);
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
      
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: cleaned };
        
        // Auto-fill representative phone number when main phone number is entered for Employer or Representative
        if ((prev.requester === "Employer" || prev.requester === "Representative") && cleaned.trim()) {
          updatedData.requesterPhoneNumber = cleaned;
        }
        
        return updatedData;
      });
      
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
    
    // Handle representative phone number validation and auto-fill
    if (name === "requesterPhoneNumber") {
      let cleaned = value.replace(/[^\d+]/g, "");
      if (cleaned.startsWith("+") && cleaned.slice(1).includes("+")) {
        cleaned = cleaned.replace(/\+/g, "");
        cleaned = "+" + cleaned;
      }
      if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
      
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: cleaned };
        
        // Auto-fill the main phone number field if requester is Employer or Representative
        if ((prev.requester === "Employer" || prev.requester === "Representative") && cleaned.trim()) {
          updatedData.phoneNumber = cleaned;
        }
        
        return updatedData;
      });
      
      if (!/^\+?\d{0,13}$/.test(cleaned)) {
        setFormErrors((prev) => ({ ...prev, requesterPhoneNumber: "Phone number must contain only numbers" }));
      } else {
        setFormErrors((prev) => ({ ...prev, requesterPhoneNumber: undefined }));
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
      // Extract allocated user from suggestion (which now includes employer fallback)
      const allocatedUserUsername = suggestion.allocated_user_username || null;
      
      console.log("🔵 SETTING FORM DATA - Allocated User:");
      console.log("  - suggestion.allocated_user_username:", suggestion.allocated_user_username);
      console.log("  - rawData.allocated_user_username:", rawData.allocated_user_username);
      console.log("  - rawData.employer?.allocated_staff_username:", rawData.employer?.allocated_staff_username);
      console.log("  - Final allocatedUserUsername for formData:", allocatedUserUsername);
      
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
        // Store allocated user information
        allocated_user_username: allocatedUserUsername,
        allocated_user_name: suggestion.allocated_user || rawData.employer?.allocated_staff_name || null,
        allocated_user_id: suggestion.allocated_user_id || rawData.employer?.allocated_staff_id || null,
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
      fetch("https://mspapi.wcf.go.tz/api/v1/search/details", {
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
        "https://mspapi.wcf.go.tz/api/v1/search/details",
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
      
      // Handle both old format (data.results) and new format (direct array)
      let results = [];
      if (Array.isArray(data)) {
        // New format: response is directly an array
        results = data;
      } else if (data.results && Array.isArray(data.results)) {
        // Old format: response has results property
        results = data.results;
      }
      
      // Process the results to flatten the structure and preserve dependents
      const suggestionsWithDependents = results.map(result => {
        // Extract employee data and dependents from the result
        const employeeData = result.employee || result;
        const dependents = result.dependents || [];
        
        // Extract claims data for allocated_user information
        const claims = result.claims || [];
        const firstClaim = claims.length > 0 ? claims[0] : null;
        
        console.log("Processing result:", result); // Debug: Log each result
        console.log("Employee data:", employeeData); // Debug: Log employee data
        console.log("Dependents:", dependents); // Debug: Log dependents
        console.log("Claims:", claims); // Debug: Log claims
        
        // Extract allocated user from multiple sources (claim, employer, employee)
        const allocatedUserFromClaim = firstClaim?.allocated_user_username || null;
        const allocatedUserFromEmployer = result.employer?.allocated_staff_username || 
                                         result.employee?.employer?.allocated_staff_username || 
                                         employeeData?.employer?.allocated_staff_username || 
                                         null;
        const allocatedUserFromEmployee = employeeData?.allocated_user_username || null;
        
        // Priority: claim > employer > employee
        const finalAllocatedUser = allocatedUserFromClaim || allocatedUserFromEmployer || allocatedUserFromEmployee;
        
        console.log("🔵 ALLOCATED USER EXTRACTION FROM SEARCH RESULT:");
        console.log("  - allocatedUserFromClaim:", allocatedUserFromClaim);
        console.log("  - allocatedUserFromEmployer:", allocatedUserFromEmployer);
        console.log("  - allocatedUserFromEmployee:", allocatedUserFromEmployee);
        console.log("  - finalAllocatedUser:", finalAllocatedUser);
        console.log("  - result.employer:", result.employer);
        console.log("  - employeeData.employer:", employeeData?.employer);
        
        return {
          ...employeeData, // Spread employee data to top level
          dependents: dependents, // Add dependents at top level
          allocated_user: firstClaim?.allocated_user || result.employer?.allocated_staff_name || employeeData?.allocated_user || null,
          allocated_user_id: firstClaim?.allocated_user_id || result.employer?.allocated_staff_id || employeeData?.allocated_user_id || null,
          allocated_user_username: finalAllocatedUser,
          claim_number: firstClaim?.claim_number || null,
          notification_report_id: firstClaim?.notification_report_id || null,
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
      // Routing Rules for Inquiry Tickets:
      // 1. If Inquiry + has claim + has allocated user → Send to allocated user (priority over checklist user)
      // 2. If Inquiry + has claim + no allocated user → Send to focal person (backend will handle)
      // 3. If Inquiry + no claim + has allocated user → Send to allocated user
      // 4. If Inquiry + no claim + no allocated user → Send to focal person (backend will handle)
      // For other categories: Follow normal routing (claim → checklist user, etc.)
      let employerAllocatedStaffUsername = "";
      
      // Get the selected claim based on selectedClaimIndex
      const selectedClaim = formData.allClaims && formData.allClaims.length > 0 
        ? formData.allClaims[selectedClaimIndex] 
        : null;

      // For Inquiry tickets: Different priority based on sub-section
      // SPECIAL RULE: For "Compliance Section" only:
      //   - Priority: allocated_staff_username from employer/institution (NOT allocated_user_username from claim)
      // FOR OTHER SUB-SECTIONS:
      //   - Priority: allocated_user_username from claim/suggestion/formData (old logic)
      //   - Fallback: allocated_staff_username from employer/institution
      
      // Get sub-section to determine priority logic
      const ticketSubSection = parentFunction ? parentFunction.name : formData.sub_section || "";
      const normalizedSubSection = ticketSubSection.toLowerCase().trim();
      const isComplianceSection = normalizedSubSection === "compliance section";
      const isClaimsAdministrationSection = normalizedSubSection === "claims administration section";
      
      console.log("🔵 Inquiry Sub-Section Check:");
      console.log("  - ticketSubSection:", ticketSubSection);
      console.log("  - normalizedSubSection:", normalizedSubSection);
      console.log("  - isComplianceSection:", isComplianceSection);
      console.log("  - isClaimsAdministrationSection:", isClaimsAdministrationSection);
      
      if (isComplianceSection) {
        // SPECIAL SUB-SECTION: Compliance Section
        // Priority 1: allocated_staff_username from employer/institution (NOT allocated_user_username from claim)
        // Priority 2: Focal-person of Compliance Section (if allocated_staff_username is null)
        // CRITICAL: Even if there's a claim, use allocated_staff_username, NOT allocated_user_username (checklist user)
        console.log("🔵 SPECIAL SUB-SECTION DETECTED (Compliance Section): Using allocated_staff_username priority (NOT checklist user)");
        if (selectedEmployer && selectedEmployer.allocated_staff_username && selectedEmployer.allocated_staff_username.trim() !== "") {
          employerAllocatedStaffUsername = selectedEmployer.allocated_staff_username;
          console.log("🔵 Inquiry (Compliance Section) - Using allocated_staff_username from employer:", employerAllocatedStaffUsername);
          console.log("🔵 Inquiry (Compliance Section) - Even if claim exists, using allocated_staff_username (NOT checklist user)");
        } else if (selectedInstitution && selectedInstitution.allocated_staff_username && selectedInstitution.allocated_staff_username.trim() !== "") {
          employerAllocatedStaffUsername = selectedInstitution.allocated_staff_username;
          console.log("🔵 Inquiry (Compliance Section) - Using allocated_staff_username from institution:", employerAllocatedStaffUsername);
          console.log("🔵 Inquiry (Compliance Section) - Even if claim exists, using allocated_staff_username (NOT checklist user)");
        } else {
          // No allocated_staff_username found, backend will assign to focal-person of Compliance Section
          employerAllocatedStaffUsername = "";
          console.log("🔵 Inquiry (Compliance Section) - No allocated_staff_username found, backend will assign to focal-person of Compliance Section");
        }
      } else if (isClaimsAdministrationSection) {
        // SPECIAL SUB-SECTION: Claims Administration Section
        // If allocated_user_username from claim exists and is not null → use that (checklist user)
        // Otherwise → backend will assign to focal-person (don't send allocated_staff_username)
        console.log("🔵 SPECIAL SUB-SECTION DETECTED (Claims Administration Section): Checking for checklist user");
        if (selectedClaim && selectedClaim.allocated_user_username && selectedClaim.allocated_user_username.trim() !== "") {
          // Use checklist user from claim
          employerAllocatedStaffUsername = selectedClaim.allocated_user_username;
          console.log("🔵 Inquiry (Claims Administration Section) - Using checklist user (allocated_user_username) from claim:", employerAllocatedStaffUsername);
        } else if (selectedSuggestion && selectedSuggestion.allocated_user_username && selectedSuggestion.allocated_user_username.trim() !== "") {
          // Fallback: Use from suggestion
          employerAllocatedStaffUsername = selectedSuggestion.allocated_user_username;
          console.log("🔵 Inquiry (Claims Administration Section) - Using checklist user (allocated_user_username) from suggestion:", employerAllocatedStaffUsername);
        } else if (formData.allocated_user_username && formData.allocated_user_username.trim() !== "") {
          // Fallback: Use from formData
          employerAllocatedStaffUsername = formData.allocated_user_username;
          console.log("🔵 Inquiry (Claims Administration Section) - Using checklist user (allocated_user_username) from formData:", employerAllocatedStaffUsername);
        } else {
          // No checklist user found, backend will assign to focal-person
          employerAllocatedStaffUsername = "";
          console.log("🔵 Inquiry (Claims Administration Section) - No checklist user found, backend will assign to focal-person");
        }
      } else {
        // OTHER SUB-SECTIONS: Always go to focal-person (ignore checklist user and allocated user)
        // Even if there's a checklist user, allocated user, or claim number, send to focal-person
        console.log("🔵 REGULAR SUB-SECTION: Always assigning to focal-person (ignoring checklist user and allocated user)");
        employerAllocatedStaffUsername = "";
        console.log("🔵 Inquiry (Regular Sub-Section) - No allocated user sent, backend will assign to focal-person of sub-section:", ticketSubSection);
      }

      // Get claim information from selected claim or fallback
      const claimId = selectedClaim?.claim_number || selectedSuggestion?.claimId || formData.claimNumber || null;
      const notificationReportId = selectedClaim?.notification_report_id || formData.notification_report_id || null;

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
        // Add claim number for routing decision (use selected claim)
        claimId: claimId,
        claimNumber: selectedClaim?.claim_number || formData.claimNumber || claimId || "",
        notification_report_id: notificationReportId,
        // Add routing information for backend
        hasClaim: Boolean(claimId),
        isInquiry: formData.category === "Inquiry",
        // Add allocated user details for routing
        // CRITICAL: For Inquiry, prioritize allocated_staff_username from employer/institution (actual allocated user)
        // NOT allocated_user_username from claim (which might be checklist user)
        // For special sub-sections (Claims Administration Section, Compliance Section): prioritize allocated_staff_username
        // For other sub-sections: prioritize allocated_user_username (old logic)
        // For Compliance Section: send allocated_staff_username
        // For Claims Administration Section: send allocated_user_username (checklist user) if exists
        // For other sub-sections: send null (backend will assign to focal-person)
        // For Compliance Section: send allocated_staff_username (NOT allocated_user_username from claim, even if claim exists)
        // For Claims Administration Section: send allocated_user_username (checklist user) if exists
        // For other sub-sections: send null (backend will assign to focal-person)
        allocated_user_id: isComplianceSection
          ? (selectedEmployer?.allocated_staff_id || selectedInstitution?.allocated_staff_id || null)
          : isClaimsAdministrationSection
          ? (selectedClaim?.allocated_user_id || selectedSuggestion?.allocated_user_id || formData.allocated_user_id || null)
          : null,
        allocated_user_name: isComplianceSection
          ? (selectedEmployer?.allocated_staff_name || selectedInstitution?.allocated_staff_name || null)
          : isClaimsAdministrationSection
          ? (selectedClaim?.allocated_user || selectedSuggestion?.allocated_user || formData.allocated_user_name || null)
          : null,
        allocated_user_username: isComplianceSection
          ? (selectedEmployer?.allocated_staff_username || selectedInstitution?.allocated_staff_username || null)
          : isClaimsAdministrationSection
          ? (selectedClaim?.allocated_user_username || selectedSuggestion?.allocated_user_username || formData.allocated_user_username || null)
          : null,
        // Add employer information from search
        employer: formData.employer || selectedSuggestion?.employer || "",
        employerName: formData.employerName || "",
      };
      
      // Debug allocated user
      console.log("🔵 FRONTEND ALLOCATED USER DEBUG:");
      console.log("  - selectedClaim?.allocated_user_username:", selectedClaim?.allocated_user_username);
      console.log("  - selectedSuggestion?.allocated_user_username:", selectedSuggestion?.allocated_user_username);
      console.log("  - formData.allocated_user_username:", formData.allocated_user_username);
      console.log("  - selectedEmployer?.allocated_staff_username:", selectedEmployer?.allocated_staff_username);
      console.log("  - selectedInstitution?.allocated_staff_username:", selectedInstitution?.allocated_staff_username);
      console.log("  - employerAllocatedStaffUsername:", employerAllocatedStaffUsername);
      console.log("  - ticketData.allocated_user_username:", ticketData.allocated_user_username);
      console.log("  - ticketData.employerAllocatedStaffUsername:", ticketData.employerAllocatedStaffUsername);
      console.log("  - category:", formData.category);
      console.log("  - isInquiry:", formData.category === "Inquiry");
      console.log("  - hasClaim:", Boolean(claimId));
      console.log("  - claimId:", claimId);
      console.log("  - For Inquiry with claim, allocated user should take priority over checklist user");
      
      // Debug phone number
      console.log("🔍 FRONTEND PHONE NUMBER DEBUG:");
      console.log("- formData.phoneNumber:", formData.phoneNumber);
      console.log("- ticketData.phoneNumber:", ticketData.phoneNumber);
      console.log("- Type:", typeof ticketData.phoneNumber);
      console.log("- Is empty:", ticketData.phoneNumber === "");
      console.log("- Is null:", ticketData.phoneNumber === null);
      console.log("- Is undefined:", ticketData.phoneNumber === undefined);
      
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
        
        // Reset all form-related state
        setFormErrors({});
        setSelectedClaimIndex(0);
        setSearchSuggestions([]);
        setInputValue("");
        setSelectedFunction("");
        setSelectedSection("");
        setInstitutionSearch("");
        setInstitutionSuggestions([]);
        setHistorySearch("");
        setTicketNumberSearch("");
        setTicketNumberSearchResults([]);
        setCreationFoundTickets([]);
        setCreationActiveTicketId(null);
        
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
        message: ` Ticket saved, Failed to send SMS or Email`,
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
            // Only set to "no-history" if we don't have selected employee/institution/employer
            if (!selectedEmployee && !selectedInstitution && !selectedEmployer) {
              setRightPartContent("no-history");
            }
          }
        })
        .catch(() => {
          setCreationFoundTickets([]);
          // Only set to "no-history" if we don't have selected employee/institution
          if (!selectedEmployee && !selectedInstitution) {
            setRightPartContent("no-history");
          }
        })
        .finally(() => setCreationTicketsLoading(false));
    } else if (!normalizedPhone || normalizedPhone.length < 7) {
      // No phone number, but if we have selected employee/institution/employer, keep showing ticket-history
      setCreationFoundTickets([]);
      if (!selectedEmployee && !selectedInstitution && !selectedEmployer) {
        setRightPartContent("no-history");
      }
      // If we have selectedEmployee, selectedInstitution, or selectedEmployer, keep rightPartContent as "ticket-history"
    }
  }, [formData.phoneNumber, showRightPart, rightPartContent, selectedEmployee, selectedInstitution, selectedEmployer]);

  // Search ticket by ticket number (ticket_id like WCF-CC-20251226-000002)
  const handleSearchByTicketNumber = async () => {
    if (!ticketNumberSearch.trim()) {
      return;
    }

    setTicketNumberSearchLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      // Search by ticket_id (the formatted ticket number)
      const response = await fetch(`${baseURL}/ticket/search-by-ticket-id/${encodeURIComponent(ticketNumberSearch.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success && data.ticket) {
        // Convert single ticket to array format for consistency
        setTicketNumberSearchResults([data.ticket]);
        setCreationFoundTickets([data.ticket]);
        setRightPartContent("ticket-history");
      } else {
        setTicketNumberSearchResults([]);
        setCreationFoundTickets([]);
        setRightPartContent("no-history");
      }
    } catch (error) {
      console.error("Error searching by ticket number:", error);
      setTicketNumberSearchResults([]);
      setCreationFoundTickets([]);
      setRightPartContent("no-history");
    } finally {
      setTicketNumberSearchLoading(false);
    }
  };

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

  // Check if there's data to show floating button
  const hasData = formData.firstName || formData.lastName || formData.phoneNumber || 
                  formData.institution || formData.requester || selectedEmployer || selectedEmployee;
  
  // Check if there's significant data (more than just phone number)
  const hasSignificantData = formData.firstName || formData.lastName || 
                             formData.institution || formData.requester || 
                             selectedEmployer || selectedEmployee;

  // Close modal handlers
  const handleCloseModalSubmit = async () => {
    if (!resolutionType || !resolutionDetails.trim()) {
      setModal({
        isOpen: true,
        type: "error",
        message: "Please provide both resolution type and details",
      });
      return;
    }

    setIsLoading(true);
    try {
      // First create the ticket normally - only include relevant fields based on requester type
      const ticketData = {
        ...formData,
        status: "Open", // Create as open first
        shouldClose: true // Indicate that this ticket should be closed after creation
      };

      // Only include employer fields if requester is "Employer"
      // Use the same mapping as normal create (line 1709-1717)
      if (formData.requester === "Employer") {
        ticketData.employerRegistrationNumber = formData.nidaNumber || null;
        ticketData.employerName = formData.institution || null; // Map institution to employerName
        ticketData.employerTin = formData.nidaNumber || null;
        ticketData.employerPhone = formData.phoneNumber || null;
        ticketData.employerEmail = formData.employerEmail || null;
        ticketData.employerStatus = formData.employerStatus || null;
        ticketData.employerAllocatedStaffId = formData.employerAllocatedStaffId || null;
        ticketData.employerAllocatedStaffName = formData.employerAllocatedStaffName || null;
        ticketData.employerAllocatedStaffUsername = formData.employerAllocatedStaffUsername || null;
      }

      // Map representative fields to backend field names if requester is Representative or Employer
      // Use the same mapping as normal create (line 1718-1725)
      if (formData.requester === "Representative" || formData.requester === "Employer") {
        ticketData.representative_name = formData.requesterName || null;
        ticketData.representative_phone = formData.requesterPhoneNumber || null;
        ticketData.representative_email = formData.requesterEmail || null;
        ticketData.representative_address = formData.requesterAddress || null;
        ticketData.representative_relationship = formData.relationshipToEmployee || null;
      }

      // Remove undefined values to prevent backend errors
      Object.keys(ticketData).forEach(key => {
        if (ticketData[key] === undefined) {
          delete ticketData[key];
        }
      });

      // If requester is not "Employer", remove all employer-related fields
      if (ticketData.requester !== "Employer") {
        delete ticketData.employerRegistrationNumber;
        delete ticketData.employerName;
        delete ticketData.employerTin;
        delete ticketData.employerPhone;
        delete ticketData.employerEmail;
        delete ticketData.employerStatus;
        delete ticketData.employerAllocatedStaffId;
        delete ticketData.employerAllocatedStaffName;
        delete ticketData.employerAllocatedStaffUsername;
      }

      // DO NOT delete representative fields for Employer - they are needed!
      // Only delete if requester is neither "Representative" nor "Employer"
      if (ticketData.requester !== "Representative" && ticketData.requester !== "Employer") {
        delete ticketData.representative_name;
        delete ticketData.representative_phone;
        delete ticketData.representative_email;
        delete ticketData.representative_address;
        delete ticketData.representative_relationship;
      }

      console.log('DEBUG: Creating ticket with data:', ticketData);
      console.log('DEBUG: Requester type:', ticketData.requester);
      console.log('DEBUG: Using endpoint:', `${baseURL}/ticket/create-ticket`);

      const response = await fetch(`${baseURL}/ticket/create-ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(ticketData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned invalid response. Status: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to create ticket. Status: ${response.status}`);
      }

      // Now close the ticket using the close endpoint (like reviewer does)
      const createdTicketId = data.ticket?.id;
      if (!createdTicketId) {
        throw new Error("Ticket created but no ID returned");
      }

      console.log('DEBUG: Ticket created successfully, now closing with ID:', createdTicketId);

      const token = localStorage.getItem("authToken");
      const closeFormData = new FormData();
      closeFormData.append("status", "Closed");
      closeFormData.append("resolution_type", resolutionType);
      closeFormData.append("resolution_details", resolutionDetails);
      closeFormData.append("date_of_resolution", new Date().toISOString());
      closeFormData.append("userId", localStorage.getItem("userId"));
      
      if (attachment) {
        closeFormData.append("attachment", attachment);
      }

      console.log('DEBUG: Close form data:', {
        status: "Closed",
        resolution_type: resolutionType,
        resolution_details: resolutionDetails,
        userId: localStorage.getItem("userId"),
        hasAttachment: !!attachment
      });

      const closeResponse = await fetch(`${baseURL}/ticket/${createdTicketId}/close`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: closeFormData
      });

      console.log('DEBUG: Close response status:', closeResponse.status);

      if (closeResponse.ok) {
        setModal({
          isOpen: true,
          type: "success",
          message: "Ticket created and closed successfully",
        });
        setIsCloseModalOpen(false);
        setResolutionType("");
        setResolutionDetails("");
        setAttachment(null);
        onClose();
      } else {
        const closeData = await closeResponse.json();
        throw new Error(closeData.message || "Failed to close ticket");
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModalCancel = () => {
    setIsCloseModalOpen(false);
    setResolutionType("");
    setResolutionDetails("");
    setAttachment(null);
  };

  // Add the full JSX structure from the CRM modal here
  return (
    <>
      {/* Floating Ticket Button - Show when modal is closed but has data */}
      {!open && hasData && (
        <Box
          sx={{
            position: 'fixed',
            left: '20px',
            bottom: '20px',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => {
            // Reopen the modal
            console.log('Floating button clicked - attempting to reopen modal');
            console.log('Current form data:', formData);
            console.log('Selected employer:', selectedEmployer);
            console.log('Selected employee:', selectedEmployee);
            
            if (onOpen) {
              onOpen();
            } else {
              console.warn('onOpen prop not provided - cannot reopen modal');
            }
          }}
          title="Resume Ticket Creation - Click to reopen your ticket form with saved data"
        >
          <Box
            sx={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)'
              }
            }}
          >
            <AssignmentIcon sx={{ color: 'white', fontSize: 28 }} />
            {/* Notification badge for significant data */}
            {hasSignificantData && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#f44336',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white',
                  fontWeight: 'bold',
                  border: '2px solid white'
                }}
              >
                !
              </Box>
            )}
          </Box>
          {/* Enhanced Tooltip */}
          <Box
            sx={{
              position: 'absolute',
              left: '70px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.9)',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
              '&:hover': {
                opacity: 1
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: '6px solid rgba(0,0,0,0.9)'
              }
            }}
          >
            📝 Resume Ticket Creation
          </Box>
        </Box>
      )}

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
                       onClick={() => {
                         // Reset everything back to initial state
                         resetSearch();
                         // Ensure we're back to step 0 (initial search type selection)
                         setSearchStep("");
                         // Clear all search-related state
                         setSearchResults([]);
                         setCurrentSearchQuery("");
                         setShowForm(false);
                         setShowUserNotFound(false);
                         setShowRegistrationOptions(false);
                       }}
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


                  {/* Update the claim status section - for employee */}
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
                        flexDirection: "column",
                        marginBottom: formData.dependents && formData.dependents.length > 0 ? "12px" : "0"
                      }}>
                        <div style={{ marginBottom: "8px" }}>
                          <Typography
                            variant="subtitle2"
                            style={{ fontWeight: "bold", marginBottom: "8px" }}
                          >
                            {formData.allClaims && formData.allClaims.length > 0 && 
                             formData.allClaims.some(claim => {
                               // Check if claim has valid claim_number (non-empty string)
                               const hasValidClaimNumber = claim.claim_number && typeof claim.claim_number === 'string' && claim.claim_number.trim().length > 0;
                               // Check if claim has notification_report_id (number or non-empty string)
                               const hasNotificationReportId = claim.notification_report_id != null && claim.notification_report_id !== '' && claim.notification_report_id !== 0;
                               return hasValidClaimNumber || hasNotificationReportId;
                             }) ? (
                              <>
                                {formData.allClaims.length === 1 ? (
                                  <>Claim (1):</>
                                ) : (
                                  <>
                                    Claims ({formData.allClaims.length}):
                                  </>
                                )}
                              </>
                            ) : (formData.claimNumber && formData.claimNumber.trim() && formData.claimNumber.trim().length > 0) ? (
                              <>
                                Claim Number:{" "}
                                <span style={{ color: "#1976d2" }}>
                                  {formData.claimNumber}
                                </span>
                                {/* Show small button when there's a claim */}
                                {(selectedEmployer || selectedInstitution || formData.institution) && (
                                  <div style={{ marginTop: "8px" }}>
                                    <ClaimRedirectButton
                                      notificationReportId={
                                        (selectedEmployer?.registration_number) || 
                                        (selectedInstitution?.registration_number) || 
                                        ""
                                      }
                                      buttonText="View Employer Profile"
                                      searchType="employer"
                                      isEmployerSearch={true}
                                      employerData={selectedEmployer || selectedInstitution}
                                      openMode="new-tab"
                                      openEarlyNewTab={true}
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        minHeight: "28px"
                                      }}
                                      onSuccess={(data) => {
                                        console.log('Employer profile redirect successful:', data);
                                      }}
                                      onError={(error) => {
                                        console.error('Employer profile redirect failed:', error);
                                      }}
                                    />
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                No Active Claim
                                {/* Always show button when there's no active claim */}
                                <div style={{ marginTop: "8px" }}>
                                  {(() => {
                                    // Check for employer data from various sources
                                    const hasEmployerData = selectedEmployer || selectedInstitution || formData.institution || 
                                      (selectedEmployee?.employee?.employer_name) || 
                                      (formSearchType === "employer" && formData.institution);
                                    
                                    const employerRegistrationNumber = selectedEmployer?.registration_number || 
                                      selectedInstitution?.registration_number || 
                                      formData.employerRegistrationNumber ||
                                      "";
                                    
                                    const employerData = selectedEmployer || selectedInstitution;
                                    
                                    console.log("No Active Claim - Checking for employer data:", {
                                      hasEmployerData,
                                      selectedEmployer,
                                      selectedInstitution,
                                      formDataInstitution: formData.institution,
                                      selectedEmployeeEmployer: selectedEmployee?.employee?.employer_name,
                                      formSearchType,
                                      employerRegistrationNumber
                                    });
                                    
                                    return (
                                      <ClaimRedirectButton
                                        notificationReportId={employerRegistrationNumber}
                                        buttonText="View Employer Profile"
                                        searchType="employer"
                                        isEmployerSearch={true}
                                        employerData={employerData}
                                        openMode="new-tab"
                                        openEarlyNewTab={true}
                                        onSuccess={(data) => {
                                          console.log('Employer profile redirect successful:', data);
                                        }}
                                        onError={(error) => {
                                          console.error('Employer profile redirect failed:', error);
                                        }}
                                      />
                                    );
                                  })()}
                                </div>
                              </>
                            )}
                          </Typography>
                          
                          {/* Display all claims - both single and multiple */}
                          {/* Only show claims if they have valid claim_number (not empty) or notification_report_id */}
                          {formData.allClaims && formData.allClaims.length > 0 && 
                           formData.allClaims.some(claim => {
                             const hasValidClaimNumber = claim.claim_number && typeof claim.claim_number === 'string' && claim.claim_number.trim().length > 0;
                             const hasNotificationReportId = claim.notification_report_id != null && claim.notification_report_id !== '' && claim.notification_report_id !== 0;
                             return hasValidClaimNumber || hasNotificationReportId;
                           }) && (
                            <div style={{ marginTop: "8px" }}>
                              {formData.allClaims
                                .filter(claim => {
                                  const hasValidClaimNumber = claim.claim_number && typeof claim.claim_number === 'string' && claim.claim_number.trim().length > 0;
                                  const hasNotificationReportId = claim.notification_report_id != null && claim.notification_report_id !== '' && claim.notification_report_id !== 0;
                                  return hasValidClaimNumber || hasNotificationReportId;
                                }) // Filter out invalid/empty claims
                                .map((claim, index) => (
                                <div
                                  key={index}
                                  onClick={() => setSelectedClaimIndex(index)}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    marginBottom: "8px",
                                    backgroundColor: selectedClaimIndex === index ? "#e3f2fd" : "#f5f5f5",
                                    borderRadius: "4px",
                                    border: selectedClaimIndex === index ? "2px solid #1976d2" : "1px solid #e0e0e0",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    gap: "12px"
                                  }}
                                >
                                  <div style={{ flex: "1", minWidth: 0, overflow: "hidden" }}>
                                    <Typography
                                      variant="body2"
                                      style={{ color: "#1976d2", fontWeight: "500", wordBreak: "break-word" }}
                                    >
                                      {claim.claim_number && claim.claim_number.trim() 
                                        ? claim.claim_number 
                                        : "No Claim Number"}
                                    </Typography>
                                    {claim.incident_stage && (
                                      <Typography
                                        variant="caption"
                                        style={{ color: "#666", display: "block", marginTop: "2px", wordBreak: "break-word" }}
                                      >
                                        Status: {claim.incident_stage}
                                      </Typography>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, whiteSpace: "nowrap" }}>
                                    {claim.notification_report_id && (
                                      <ClaimRedirectButton
                                        notificationReportId={claim.notification_report_id}
                                        employerId={formData.employerId || ''}
                                        buttonText={formData.allClaims.length === 1 ? "View Claim in MAC" : "View Claim"}
                                        searchType="claim"
                                        isEmployerSearch={false}
                                        employerData={selectedEmployer}
                                        openMode="new-tab"
                                        openEarlyNewTab={true}
                                        onSuccess={(data) => {
                                          console.log('Claim redirect successful:', data);
                                        }}
                                      />
                                    )}
                                    {(selectedEmployer?.registration_number || selectedInstitution?.registration_number || formData.employerRegistrationNumber) && (
                                      <ClaimRedirectButton
                                        notificationReportId={
                                          selectedEmployer?.registration_number || 
                                          selectedInstitution?.registration_number || 
                                          formData.employerRegistrationNumber || 
                                          ""
                                        }
                                        buttonText="View Employer Profile"
                                        searchType="employer"
                                        isEmployerSearch={true}
                                        employerData={selectedEmployer || selectedInstitution}
                                        openMode="new-tab"
                                        openEarlyNewTab={true}
                                        onSuccess={(data) => {
                                          console.log('Employer profile redirect successful:', data);
                                        }}
                                        onError={(error) => {
                                          console.error('Employer profile redirect failed:', error);
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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

                  {/* Update the claim status section - for employer */}
                  {(formSearchType === "employer" || registrationType === "employer") && (selectedEmployer || selectedInstitution || formData.institution) && (
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
                        flexDirection: "column",
                        marginBottom: formData.dependents && formData.dependents.length > 0 ? "12px" : "0"
                      }}>
                        <div style={{ marginBottom: "8px" }}>
                          <Typography
                            variant="subtitle2"
                            style={{ fontWeight: "bold", marginBottom: "8px" }}
                          >
                            {formData.allClaims && formData.allClaims.length > 0 && 
                             formData.allClaims.some(claim => {
                               // Check if claim has valid claim_number (non-empty string)
                               const hasValidClaimNumber = claim.claim_number && typeof claim.claim_number === 'string' && claim.claim_number.trim().length > 0;
                               // Check if claim has notification_report_id (number or non-empty string)
                               const hasNotificationReportId = claim.notification_report_id != null && claim.notification_report_id !== '' && claim.notification_report_id !== 0;
                               return hasValidClaimNumber || hasNotificationReportId;
                             }) ? (
                              <>
                                {formData.allClaims.length === 1 ? (
                                  <>Claim (1):</>
                                ) : (
                                  <>
                                    Claims ({formData.allClaims.length}):
                                  </>
                                )}
                              </>
                            ) : (formData.claimNumber && formData.claimNumber.trim() && formData.claimNumber.trim().length > 0) ? (
                              <>
                                Claim Number:{" "}
                                <span style={{ color: "#1976d2" }}>
                                  {formData.claimNumber}
                                </span>
                                {/* Show small button when there's a claim */}
                                {(selectedEmployer || selectedInstitution || formData.institution) && (
                                  <div style={{ marginTop: "8px" }}>
                                    <ClaimRedirectButton
                                      notificationReportId={
                                        (selectedEmployer?.registration_number) || 
                                        (selectedInstitution?.registration_number) || 
                                        ""
                                      }
                                      buttonText="View Employer Profile"
                                      searchType="employer"
                                      isEmployerSearch={true}
                                      employerData={selectedEmployer || selectedInstitution}
                                      openMode="new-tab"
                                      openEarlyNewTab={true}
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        minHeight: "28px"
                                      }}
                                      onSuccess={(data) => {
                                        console.log('Employer profile redirect successful:', data);
                                      }}
                                      onError={(error) => {
                                        console.error('Employer profile redirect failed:', error);
                                      }}
                                    />
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                No Active Claim
                                {/* Always show button when there's no active claim */}
                                <div style={{ marginTop: "8px" }}>
                                  <ClaimRedirectButton
                                    notificationReportId={
                                      (selectedEmployer?.registration_number) || 
                                      (selectedInstitution?.registration_number) || 
                                      formData.employerRegistrationNumber ||
                                      ""
                                    }
                                    buttonText="View Employer Profile"
                                    searchType="employer"
                                    isEmployerSearch={true}
                                    employerData={selectedEmployer || selectedInstitution}
                                    openMode="new-tab"
                                    openEarlyNewTab={true}
                                    onSuccess={(data) => {
                                      console.log('Employer profile redirect successful:', data);
                                    }}
                                    onError={(error) => {
                                      console.error('Employer profile redirect failed:', error);
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </Typography>
                        </div>
                      </div>
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
                            {/* <span style={{ 
                              color: "#1976d2", 
                              fontSize: "0.75rem", 
                              marginLeft: "8px",
                              fontWeight: "500"
                            }}>
                              📞 Representative
                            </span> */}
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
                                : formData.requesterPhoneNumber && formData.requesterPhoneNumber.trim()
                                  ? "2px solid #1976d2" 
                                  : "1px solid #ccc",
                              backgroundColor: formData.requesterPhoneNumber && formData.requesterPhoneNumber.trim() ? "#f8f9fa" : "white",
                              fontWeight: formData.requesterPhoneNumber && formData.requesterPhoneNumber.trim() ? "500" : "normal"
                            }}
                            title={formData.requesterPhoneNumber && formData.requesterPhoneNumber.trim() ? "Representative phone number - will auto-fill main phone number" : ""}
                          />
                          {formErrors.requesterPhoneNumber && (
                            <span style={{ color: "red", fontSize: "0.75rem" }}>
                              {formErrors.requesterPhoneNumber}
                            </span>
                          )}
                          {/* {formData.requesterPhoneNumber && formData.requesterPhoneNumber.trim() && (
                            <span style={{ 
                              color: "#1976d2", 
                              fontSize: "0.75rem",
                              fontStyle: "italic"
                            }}>
                              This number will auto-fill the main phone number field
                            </span>
                          )} */}
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
                            {formData.requester === "Employer"
                              ? "Representative Position/Role"
                              : "Relationship to Employee"}: <span style={{ color: "red" }}>*</span>
                          </label>
                          <select
                            name="relationshipToEmployee"
                            value={formData.relationshipToEmployee}
                            onChange={handleChange}
                            disabled={relationsLoading}
                            style={{
                              height: "32px",
                              fontSize: "0.875rem",
                              padding: "4px 8px",
                              border: formErrors.relationshipToEmployee
                                ? "1px solid red"
                                : "1px solid #ccc",
                              width: "100%",
                              backgroundColor: relationsLoading ? "#f5f5f5" : "white",
                              cursor: relationsLoading ? "not-allowed" : "pointer"
                            }}
                          >
                            <option value="">
                              {relationsLoading
                                ? "Loading relationships..."
                                : relationsError
                                ? "Error loading relationships"
                                : formData.requester === "Employer"
                                ? "Select position/role"
                                : "Select relationship"}
                            </option>
                            {relations.length > 0 ? (
                              relations.map((rel) => (
                                <option key={rel.id} value={rel.name}>
                                  {rel.name}
                                </option>
                              ))
                            ) : !relationsLoading && !relationsError ? (
                              <option value="" disabled>
                                No relationships available. Please contact admin.
                              </option>
                            ) : null}
                          </select>
                          {relationsError && (
                            <span style={{ color: "orange", fontSize: "0.75rem", display: "block", marginTop: "4px" }}>
                              {relationsError} - Using default options may not be available.
                            </span>
                          )}
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
                        disabled={channelsLoading}
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
                        {channelsLoading ? (
                          <option value="">Loading channels...</option>
                        ) : channelsError ? (
                          <option value="">Error loading channels</option>
                        ) : (
                          channels.map((channel) => (
                            <option key={channel.id} value={channel.name}>
                              {channel.name}
                            </option>
                          ))
                        )}
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
                        {functionData && functionData.length > 0 ? (
                          functionData.map((item) => {
                            console.log('🔍 Dropdown item:', item);
                            return (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            );
                          })
                        ) : (
                          <option value="" disabled>No subjects available</option>
                        )}
                      </select>
                      {formErrors.functionId && (
                        <span style={{ color: "red", fontSize: "0.75rem" }}>
                          {formErrors.functionId}
                        </span>
                      )}
                      {/* Debug info */}
                      {functionData && functionData.length === 0 && (
                        <span style={{ color: "orange", fontSize: "0.75rem" }}>
                          No function data loaded. Please check if subjects are configured.
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

                  {/* File Upload */}
                  {/* <div className="modal-form-group">
                    <label style={{ fontSize: "0.875rem" }}>Attachment (Optional):</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          // Check file size (50MB limit)
                          const maxSize = 50 * 1024 * 1024; // 50MB in bytes
                          if (file.size > maxSize) {
                            alert(`File size too large! Maximum allowed size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
                            e.target.value = ''; // Clear the input
                            setAttachment(null);
                            return;
                          }
                          setAttachment(file);
                        } else {
                          setAttachment(null);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        fontSize: "0.9rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc"
                      }}
                    />
                    {attachment && (
                      <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                        File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                      </Typography>
                    )}
                  </div> */}

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
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      className="submit-btn"
                      onClick={(e) => handleSubmit(e)}
                    >
                      Submit to Backoffice
                    </button>
                    {formData.category === "Inquiry" && (
                      <button
                        className="close-btn"
                        style={{ background: "gray", color: "white", borderRadius: "4px", padding: "8px 16px" }}
                        onClick={() => setIsCloseModalOpen(true)}
                      >
                        Close Ticket
                      </button>
                    )}
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
                {(selectedInstitution || selectedEmployee || selectedEmployer) && (
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
                        {formData.allClaims && formData.allClaims.length > 0 && (
                          <div>
                            <strong>Checklist User:</strong>{" "}
                            {formData.allClaims[selectedClaimIndex]?.allocated_user_username 
                              ? formData.allClaims[selectedClaimIndex].allocated_user_username
                                  .replace(/\./g, ' ')
                                  .split(' ')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                  .join(' ')
                              : "Not assigned"}
                          </div>
                        )}
                      </>
                    )}
                    {selectedEmployee && (
                      <>
                        {!selectedInstitution && (
                          <>
                            <div>
                              <strong>Employee Name:</strong> {`${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()}
                            </div>
                            {(formData.allClaims && formData.allClaims.length > 0 || formData.claimNumber) && (
                              <div>
                                <strong>Claim Number:</strong>{" "}
                                {formData.allClaims && formData.allClaims.length > 1 ? (
                                  <span>
                                    {formData.allClaims.length} claims:{" "}
                                    {formData.allClaims.map((c, i) => (c.claim_number && c.claim_number.trim()) ? c.claim_number : "No Claim Number").join(", ")}
                                  </span>
                                ) : (
                                  formData.claimNumber || formData.allClaims?.[0]?.claim_number || "No active claim"
                                )}
                              </div>
                            )}
                          </>
                        )}
                        {!selectedInstitution && (
                          <div>
                            <strong>Checklist User:</strong>{" "}
                            {formData.allClaims && formData.allClaims.length > 0
                              ? (formData.allClaims[selectedClaimIndex]?.allocated_user_username 
                                  ? formData.allClaims[selectedClaimIndex].allocated_user_username
                                      .replace(/\./g, ' ')
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                      .join(' ')
                                  : (formData.allocated_user_username 
                                      ? formData.allocated_user_username
                                          .replace(/\./g, ' ')
                                          .split(' ')
                                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                          .join(' ')
                                      : "Not assigned"))
                              : (formData.allocated_user_username 
                                  ? formData.allocated_user_username
                                      .replace(/\./g, ' ')
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                      .join(' ')
                                  : (formData.allocated_user_name || "Not assigned"))}
                          </div>
                        )}
                      </>
                    )}
                    {selectedEmployer && !selectedInstitution && !selectedEmployee && (
                      <>
                        <div>
                          <strong>Name:</strong> {selectedEmployer.name || "N/A"}
                        </div>
                        {selectedEmployer.tin && (
                          <div>
                            <strong>TIN:</strong> {selectedEmployer.tin}
                          </div>
                        )}
                        {selectedEmployer.phone && (
                          <div>
                            <strong>Phone:</strong> {selectedEmployer.phone}
                          </div>
                        )}
                        {selectedEmployer.email && (
                          <div>
                            <strong>Email:</strong> {selectedEmployer.email}
                          </div>
                        )}
                        {selectedEmployer.employer_status && (
                          <div>
                            <strong>Status:</strong> {selectedEmployer.employer_status}
                          </div>
                        )}
                        {selectedEmployer.allocated_staff_name && (
                          <div>
                            <strong>Allocated User:</strong> {selectedEmployer.allocated_staff_name}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Search by Ticket Number */}
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#1976d2', fontSize: '0.875rem' }}>
                    Search by Ticket Number
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Enter ticket number (e.g., WC"
                      value={ticketNumberSearch}
                      onChange={(e) => setTicketNumberSearch(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchByTicketNumber();
                        }
                      }}
                      sx={{ 
                        flex: 1,
                        '& .MuiInputBase-root': {
                          height: '32px'
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSearchByTicketNumber}
                      disabled={!ticketNumberSearch.trim() || ticketNumberSearchLoading}
                      sx={{ 
                        minWidth: 100,
                        height: '32px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {ticketNumberSearchLoading ? <CircularProgress size={16} /> : 'Search'}
                    </Button>
                  </Box>
                </Box>

                {/* Ticket history for entered phone number or searched ticket number */}
                {(formData.phoneNumber || ticketNumberSearchResults.length > 0) && (
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
                      {formData.phoneNumber 
                        ? `Ticket History for ${formData.phoneNumber}`
                        : ticketNumberSearchResults.length > 0
                        ? `Ticket: ${ticketNumberSearchResults[0]?.ticket_id || 'Search Result'}`
                        : 'Ticket History'}
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
                          {/* Buttons row - at the top */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 1.5, justifyContent: 'flex-end' }}>
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
                                handleOpenTicketUpdates(ticket);
                              }}
                              sx={{
                                color: '#1976d2',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                                }
                              }}
                              title="View Ticket Updates"
                            >
                              <ChatIcon fontSize="small" />
                            </IconButton>
                            {/* Show "Notify User" button only for agent role and non-closed tickets */}
                            {ticket.status !== "Closed" && localStorage.getItem("role") === "agent" && (
                              <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicketForNotify(ticket);
                                  setNotifyMessage("");
                                  setShowNotifyModal(true);
                                }}
                                sx={{
                                  minWidth: 'auto',
                                  height: 32,
                                  fontSize: '0.7rem',
                                  py: 0.25,
                                  px: 1.25,
                                  textTransform: 'none',
                                  borderRadius: '16px',
                                  boxShadow: 'none',
                                  '&:hover': {
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }
                                }}
                              >
                                Notify
                              </Button>
                            )}
                          </Box>
                          
                          {/* Ticket ID row - below buttons */}
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                            {ticket.ticket_id}
                          </Typography>
                          
                          {/* Ticket details */}
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
                            
                            {/* Resolution Details and Closed By - Show only when ticket is closed */}
                            {ticket.status === "Closed" && (
                              <>
                                {ticket.resolution_details && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: '#666',
                                      mt: 1,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    Resolution Details: {ticket.resolution_details}
                                  </Typography>
                                )}
                                {(ticket.attendedBy?.full_name || ticket.attended_by_name || ticket.closed_by_name) && (
                                  <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
                                    Closed By: {ticket.attendedBy?.full_name || ticket.attended_by_name || ticket.closed_by_name}
                                    {(ticket.attendedBy?.role || ticket.attended_by_role) && (
                                      <span style={{ color: '#999', marginLeft: '4px' }}>
                                        ({(ticket.attendedBy?.role || ticket.attended_by_role)})
                                      </span>
                                    )}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <div style={{ color: '#888', fontSize: '0.95em', textAlign: 'center', padding: 16 }}>
                        {formData.phoneNumber 
                          ? `No previous tickets found for ${formData.phoneNumber}.`
                          : ticketNumberSearch.trim()
                          ? `No ticket found with number: ${ticketNumberSearch}.`
                          : 'No tickets found.'}
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
      <ActionMessageModal
        open={modal.isOpen}
        type={modal.type || "info"}
        message={modal.message}
        onClose={closeModal}
      />

      {/* Close Modal */}
      <Dialog open={isCloseModalOpen} onClose={handleCloseModalCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Resolution Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Type:
              </Typography>
              <select
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
              >
                <option value="">Select Resolution Type</option>
                <option value="Resolved">Resolved</option>
                <option value="Duplicate">Duplicate</option>
              </select>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Resolution Details:
              </Typography>
              <TextField
                multiline
                rows={4}
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                fullWidth
                placeholder="Enter resolution details..."
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Attachment (Optional):
              </Typography>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  if (file) {
                    // Check file size (10MB = 10 * 1024 * 1024 bytes)
                    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
                    if (file.size > MAX_FILE_SIZE) {
                      alert(`File size exceeds the maximum limit of 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please select a smaller file.`);
                      e.target.value = ''; // Clear the input
                      setAttachment(null);
                      return;
                    }
                    setAttachment(file);
                  } else {
                    setAttachment(null);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              />
              {attachment && (
                <Typography variant="caption" sx={{ color: "green", mt: 1, display: "block" }}>
                  File selected: {attachment.name} ({(attachment.size / (1024 * 1024)).toFixed(2)}MB)
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "gray", mt: 0.5, display: "block", fontSize: "0.75rem" }}>
                Maximum file size: 10MB
              </Typography>
            </Box>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleCloseModalSubmit}
                disabled={!resolutionType || !resolutionDetails.trim() || isLoading}
              >
                {isLoading ? "Creating..." : "Create & Close Ticket"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCloseModalCancel}
                sx={{ ml: 1 }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Ticket Updates Modal */}
      <Dialog 
        open={isTicketUpdatesModalOpen} 
        onClose={handleCloseTicketUpdatesModal} 
        PaperProps={{
          sx: {
            width: { xs: '90%', sm: 600 },
            maxWidth: 600
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mb: -2, color: '#1976d2', fontWeight: 'bold' }}>
              Ticket Updates & Progress
            </Typography>
            <IconButton onClick={handleCloseTicketUpdatesModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '50vh', maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
            
            {/* Divider */}
            <Divider sx={{ my: 1 }} />
            
            {/* Ticket Updates */}
            <Box>
              <TicketUpdates 
                ticketId={selectedTicketForUpdates?.id}
                currentUserId={localStorage.getItem('userId')}
                canAddUpdates={selectedTicketForUpdates?.status !== 'Closed' && selectedTicketForUpdates?.status !== 'Attended and Recommended'}
                isAssigned={selectedTicketForUpdates?.assigned_to_id === localStorage.getItem('userId')}
                ticketStatus={selectedTicketForUpdates?.status}
              />
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Notify User Modal */}
      <Modal 
        open={showNotifyModal} 
        onClose={() => {
          setShowNotifyModal(false);
          setNotifyMessage("");
          setSelectedTicketForNotify(null);
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            outline: 'none'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
            Send Notification
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
            Ticket: <span style={{ color: '#1976d2' }}>{selectedTicketForNotify?.ticket_id || 'N/A'}</span>
          </Typography>
          <TextField
            label="Message"
            multiline
            rows={4}
            fullWidth
            value={notifyMessage}
            onChange={(e) => setNotifyMessage(e.target.value)}
            placeholder="Enter notification message..."
            sx={{ mb: 2 }}
            required
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setShowNotifyModal(false);
                setNotifyMessage("");
                setSelectedTicketForNotify(null);
              }}
              disabled={notifyLoading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                if (!selectedTicketForNotify || !notifyMessage.trim()) return;
                
                setNotifyLoading(true);
                try {
                  const token = localStorage.getItem("authToken");
                  const res = await fetch(`${baseURL}/notifications/notify`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      ticket_id: selectedTicketForNotify.id,
                      category: selectedTicketForNotify.category,
                      message: notifyMessage,
                      channel: selectedTicketForNotify.channel || "In-System",
                      subject: selectedTicketForNotify.subject || selectedTicketForNotify.ticket_id,
                    }),
                  });
                  const data = await res.json();
                  
                  if (res.ok && data.notification) {
                    // Show success message using modal state
                    setModal({
                      isOpen: true,
                      type: "success",
                      message: "Notification sent and saved!"
                    });
                    setShowNotifyModal(false);
                    setNotifyMessage("");
                    setSelectedTicketForNotify(null);
                  } else {
                    // Show error message using modal state
                    setModal({
                      isOpen: true,
                      type: "error",
                      message: data.message || "Failed to save notification."
                    });
                  }
                } catch (error) {
                  // Show error message using modal state
                  setModal({
                    isOpen: true,
                    type: "error",
                    message: "Network error: " + error.message
                  });
                } finally {
                  setNotifyLoading(false);
                }
              }}
              disabled={!notifyMessage.trim() || notifyLoading}
            >
              {notifyLoading ? "Sending..." : "Send"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default AdvancedTicketCreateModal;

