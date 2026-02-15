import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { baseURL } from "../../config";
import "./MappingManagement.css";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mapping-tabpanel-${index}`}
      aria-labelledby={`mapping-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const MappingManagement = () => {
  const [value, setValue] = useState(0);
  const [sectionsTabValue, setSectionsTabValue] = useState(0); // 0 = Directorates, 1 = Units
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sectionsData, setSectionsData] = useState([]);
  const [functionsData, setFunctionsData] = useState([]);
  const [functionDataList, setFunctionDataList] = useState([]);
  const [channelsData, setChannelsData] = useState([]);
  const [relationsData, setRelationsData] = useState([]);

  // Modal states
  const [openSectionModal, setOpenSectionModal] = useState(false);
  const [openFunctionModal, setOpenFunctionModal] = useState(false);
  const [openFunctionDataModal, setOpenFunctionDataModal] = useState(false);
  const [openChannelModal, setOpenChannelModal] = useState(false);
  const [openRelationModal, setOpenRelationModal] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'section', 'function', 'functionData', 'channel', 'relation'
  
  // Form states
  const [sectionForm, setSectionForm] = useState({ name: "", id: null });
  const [functionForm, setFunctionForm] = useState({ name: "", section_id: "", id: null });
  const [functionDataForm, setFunctionDataForm] = useState({ name: "", function_id: "", id: null });
  const [channelForm, setChannelForm] = useState({ name: "", id: null });
  const [relationForm, setRelationForm] = useState({ name: "", description: "", id: null });
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSectionsTabChange = (event, newValue) => {
    setSectionsTabValue(newValue);
  };

  // Fetch all mappings
  const fetchAllMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/section/mappings/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch mappings");
      }

      const result = await response.json();
      if (result.success) {
        setSectionsData(result.data.sections.data || []);
        setFunctionsData(result.data.functions.data || []);
        setFunctionDataList(result.data.functionData.data || []);
      } else {
        throw new Error(result.message || "Failed to fetch mappings");
      }
    } catch (err) {
      console.error("Error fetching mappings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch channels
  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/channel`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }

      const result = await response.json();
      if (result.success) {
        setChannelsData(result.data || []);
      } else {
        throw new Error(result.message || "Failed to fetch channels");
      }
    } catch (err) {
      console.error("Error fetching channels:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch relations
  const fetchRelations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/lookup-tables/relations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch relations");
      }

      const result = await response.json();
      if (result.success) {
        setRelationsData(result.data || []);
      } else {
        throw new Error(result.message || "Failed to fetch relations");
      }
    } catch (err) {
      console.error("Error fetching relations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMappings();
    fetchChannels();
    fetchRelations();
  }, []);

  // ========== SECTION CRUD ==========
  const handleOpenSectionModal = (section = null) => {
    if (section) {
      setSectionForm({ name: section.name, id: section.id });
    } else {
      setSectionForm({ name: "", id: null });
    }
    setOpenSectionModal(true);
  };

  const handleSaveSection = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = sectionForm.id
        ? `${baseURL}/section/sections/${sectionForm.id}`
        : `${baseURL}/section/sections`;
      const method = sectionForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: sectionForm.name }),
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save section";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: sectionForm.id ? "Section updated successfully" : "Section created successfully",
          severity: "success",
        });
        setOpenSectionModal(false);
        fetchAllMappings();
      } else {
        throw new Error(result.message || "Failed to save section");
      }
    } catch (err) {
      console.error("Error saving section:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save section",
        severity: "error",
      });
    }
  };

  const handleDeleteSection = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/section/sections/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete section";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Section deleted successfully",
          severity: "success",
        });
        setOpenDeleteDialog(false);
        setDeleteItem(null);
        fetchAllMappings();
      } else {
        throw new Error(result.message || "Failed to delete section");
      }
    } catch (err) {
      console.error("Error deleting section:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete section",
        severity: "error",
      });
    }
  };

  // ========== FUNCTION CRUD ==========
  const handleOpenFunctionModal = (func = null) => {
    if (func) {
      // If func has sectionId, use it; otherwise try to get from section property
      const sectionId = func.sectionId || func.section?.id || func.section_id || "";
      setFunctionForm({ name: func.name, section_id: sectionId, id: func.id });
    } else {
      setFunctionForm({ name: "", section_id: "", id: null });
    }
    setOpenFunctionModal(true);
  };

  const handleSaveFunction = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = functionForm.id
        ? `${baseURL}/section/functions/${functionForm.id}`
        : `${baseURL}/section/functions`;
      const method = functionForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: functionForm.name,
          section_id: functionForm.section_id,
        }),
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save function";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: functionForm.id ? "Function updated successfully" : "Function created successfully",
          severity: "success",
        });
        setOpenFunctionModal(false);
        fetchAllMappings();
      } else {
        throw new Error(result.message || "Failed to save function");
      }
    } catch (err) {
      console.error("Error saving Sub-Section:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save function",
        severity: "error",
      });
    }
  };

  const handleDeleteFunction = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/section/functions/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete function";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Function deleted successfully",
          severity: "success",
        });
        setOpenDeleteDialog(false);
        setDeleteItem(null);
        fetchAllMappings();
      } else {
        throw new Error(result.message || "Failed to delete function");
      }
    } catch (err) {
      console.error("Error deleting Sub-Section:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete function",
        severity: "error",
      });
    }
  };

  // ========== FUNCTION DATA CRUD ==========
  const handleOpenFunctionDataModal = (fd = null) => {
    if (fd) {
      setFunctionDataForm({ name: fd.name, function_id: fd.functionId || "", id: fd.id });
    } else {
      setFunctionDataForm({ name: "", function_id: "", id: null });
    }
    setOpenFunctionDataModal(true);
  };

  const handleSaveFunctionData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = functionDataForm.id
        ? `${baseURL}/section/function-data/${functionDataForm.id}`
        : `${baseURL}/section/function-data`;
      const method = functionDataForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: functionDataForm.name,
          function_id: functionDataForm.function_id,
        }),
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save function data";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: functionDataForm.id
            ? "Function data updated successfully"
            : "Function data created successfully",
          severity: "success",
        });
        setOpenFunctionDataModal(false);
        fetchAllMappings();
      } else {
        throw new Error(result.message || "Failed to save function data");
      }
    } catch (err) {
      console.error("Error saving Subjects:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save function data",
        severity: "error",
      });
    }
  };

  const handleDeleteFunctionData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/section/function-data/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete function data";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Function data deleted successfully",
          severity: "success",
        });
        setOpenDeleteDialog(false);
        setDeleteItem(null);
        fetchAllMappings();
      } else {
        throw new Error(result.message || "Failed to delete function data");
      }
    } catch (err) {
      console.error("Error deleting Subjects:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete function data",
        severity: "error",
      });
    }
  };

  // ========== CHANNEL CRUD ==========
  const handleOpenChannelModal = (channel = null) => {
    if (channel) {
      setChannelForm({ name: channel.name, id: channel.id });
    } else {
      setChannelForm({ name: "", id: null });
    }
    setOpenChannelModal(true);
  };

  const handleSaveChannel = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = channelForm.id
        ? `${baseURL}/channel/${channelForm.id}`
        : `${baseURL}/channel`;
      const method = channelForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: channelForm.name }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save channel";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: channelForm.id ? "Channel updated successfully" : "Channel created successfully",
          severity: "success",
        });
        setOpenChannelModal(false);
        fetchChannels();
      } else {
        throw new Error(result.message || "Failed to save channel");
      }
    } catch (err) {
      console.error("Error saving channel:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save channel",
        severity: "error",
      });
    }
  };

  const handleDeleteChannel = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/channel/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete channel";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Channel deleted successfully",
          severity: "success",
        });
        setOpenDeleteDialog(false);
        setDeleteItem(null);
        fetchChannels();
      } else {
        throw new Error(result.message || "Failed to delete channel");
      }
    } catch (err) {
      console.error("Error deleting channel:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete channel",
        severity: "error",
      });
    }
  };

  // ========== RELATIONS CRUD ==========
  const handleOpenRelationModal = (relation = null) => {
    if (relation) {
      setRelationForm({ name: relation.name, description: relation.description || "", id: relation.id });
    } else {
      setRelationForm({ name: "", description: "", id: null });
    }
    setOpenRelationModal(true);
  };

  const handleSaveRelation = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const url = relationForm.id
        ? `${baseURL}/lookup-tables/relations/${relationForm.id}`
        : `${baseURL}/lookup-tables/relations`;
      const method = relationForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: relationForm.name,
          description: relationForm.description || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save relation";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: relationForm.id ? "Relation updated successfully" : "Relation created successfully",
          severity: "success",
        });
        setOpenRelationModal(false);
        fetchRelations();
      } else {
        throw new Error(result.message || "Failed to save relation");
      }
    } catch (err) {
      console.error("Error saving relation:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save relation",
        severity: "error",
      });
    }
  };

  const handleDeleteRelation = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${baseURL}/lookup-tables/relations/${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete relation";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setSnackbar({
          open: true,
          message: "Relation deleted successfully",
          severity: "success",
        });
        setOpenDeleteDialog(false);
        setDeleteItem(null);
        fetchRelations();
      } else {
        throw new Error(result.message || "Failed to delete relation");
      }
    } catch (err) {
      console.error("Error deleting relation:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete relation",
        severity: "error",
      });
    }
  };

  // ========== DELETE HANDLER ==========
  const handleDeleteClick = (item, type) => {
    setDeleteItem(item);
    setDeleteType(type);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteType === "section") {
      handleDeleteSection();
    } else if (deleteType === "function") {
      handleDeleteFunction();
    } else if (deleteType === "functionData") {
      handleDeleteFunctionData();
    } else if (deleteType === "channel") {
      handleDeleteChannel();
    } else if (deleteType === "relation") {
      handleDeleteRelation();
    }
  };

  // Helper function to determine if section is Directorate or Unit
  const getSectionType = (sectionName) => {
    const name = sectionName.toLowerCase();
    if (name.includes('directorate')) {
      return 'directorate';
    } else if (name.includes('unit')) {
      return 'unit';
    }
    return 'other';
  };

  // Helper function to check if function name is identical to section name
  const isNameIdentical = (functionName, sectionName) => {
    const funcName = functionName.toLowerCase().trim();
    const sectName = sectionName.toLowerCase().trim();
    // Only filter out functions that are exactly identical to the section name
    // This helps filter out redundant functions that are duplicates of section names
    return funcName === sectName;
  };

  // Deduplicate sections by ID and filter out functions with duplicate names
  const processedSectionsData = sectionsData
    .filter((section, index, self) => 
      // Remove duplicate sections by ID
      index === self.findIndex(s => s.id === section.id)
    )
    .map(section => ({
      ...section,
      functions: (section.functions || [])
        .filter(func => {
          // Filter out functions that have the same name as the parent section
          return !isNameIdentical(func.name, section.name);
        })
        .map(func => ({
          ...func,
          functionData: func.functionData || []
        }))
    }));

  // Filter function for search
  const filterBySearch = (data, query) => {
    if (!query || query.trim() === "") {
      return data;
    }
    const searchLower = query.toLowerCase().trim();
    
    return data.map(section => {
      // Check if section name matches
      const sectionMatches = section.name?.toLowerCase().includes(searchLower);
      
      // Filter functions within sections
      const filteredFunctions = (section.functions || []).filter(func => {
        const funcNameMatches = func.name?.toLowerCase().includes(searchLower);
        const funcDataMatches = (func.functionData || []).some(fd => 
          fd.name?.toLowerCase().includes(searchLower)
        );
        
        // Include function if section matches (show all), or if function/functionData matches
        return sectionMatches || funcNameMatches || funcDataMatches;
      }).map(func => {
        const funcNameMatches = func.name?.toLowerCase().includes(searchLower);
        
        // Filter function data within functions
        const filteredFunctionData = (func.functionData || []).filter(fd => {
          const fdNameMatches = fd.name?.toLowerCase().includes(searchLower);
          // Include function data if section/function matches (show all), or if functionData matches
          return sectionMatches || funcNameMatches || fdNameMatches;
        });
        
        return {
          ...func,
          functionData: filteredFunctionData
        };
      });
      
      return {
        ...section,
        functions: filteredFunctions
      };
    }).filter(section => {
      // Only include sections that have matching name, or have matching functions/functionData
      const sectionMatches = section.name?.toLowerCase().includes(searchLower);
      const hasMatchingFunctions = section.functions && section.functions.length > 0;
      return sectionMatches || hasMatchingFunctions;
    });
  };

  // Apply search filter to sections
  const filteredSectionsData = filterBySearch(processedSectionsData, searchQuery);

  // Group sections by type (after filtering)
  const groupedSections = filteredSectionsData.reduce((acc, section) => {
    const type = getSectionType(section.name);
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(section);
    return acc;
  }, {});

  // Filter functions data
  const filteredFunctionsData = searchQuery && searchQuery.trim() !== ""
    ? functionsData.filter(func => {
        const searchLower = searchQuery.toLowerCase().trim();
        const funcNameMatches = func.name?.toLowerCase().includes(searchLower);
        const sectionNameMatches = func.section?.name?.toLowerCase().includes(searchLower);
        const functionDataMatches = (func.functionData || []).some(fd => 
          fd.name?.toLowerCase().includes(searchLower)
        );
        return funcNameMatches || sectionNameMatches || functionDataMatches;
      })
    : functionsData;

  // Filter function data list
  const filteredFunctionDataList = searchQuery && searchQuery.trim() !== ""
    ? functionDataList.filter(fd => {
        const searchLower = searchQuery.toLowerCase().trim();
        const fdNameMatches = fd.name?.toLowerCase().includes(searchLower);
        const functionNameMatches = fd.function?.name?.toLowerCase().includes(searchLower);
        const sectionNameMatches = fd.function?.section?.name?.toLowerCase().includes(searchLower);
        return fdNameMatches || functionNameMatches || sectionNameMatches;
      })
    : functionDataList;

  // Render Directorates View
  const renderDirectoratesView = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!groupedSections.directorate || groupedSections.directorate.length === 0) {
      return (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">Directorates (0)</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenSectionModal()}
            >
              Add Directorate
            </Button>
          </Box>
          <Alert severity="info">No directorates found. Please add directorates first.</Alert>
        </Box>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            Directorates ({groupedSections.directorate.length})
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSectionModal()}
          >
            Add Directorate
          </Button>
        </Box>
        {groupedSections.directorate.map((section) => {
          const hasFunctions = section.functions && section.functions.length > 0;
          const functionCount = section.functions?.length || 0;
          return (
            <Accordion key={section.id} sx={{ mb: 2 }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: hasFunctions ? 'rgba(25, 118, 210, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    backgroundColor: hasFunctions ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                  <Typography variant="body2" sx={{ fontWeight: hasFunctions ? 600 : 400 }}>
                    {section.name}
                  </Typography>
                  <Chip
                    label={`${functionCount} ${functionCount === 1 ? 'Function' : 'Functions'}`}
                    size="small"
                    color={hasFunctions ? "primary" : "default"}
                    variant={hasFunctions ? "filled" : "outlined"}
                    sx={{
                      fontWeight: hasFunctions ? 600 : 400,
                    }}
                  />
                  <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSectionModal(section);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(section, "section");
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFunctionForm({ name: "", section_id: section.id, id: null });
                      setOpenFunctionModal(true);
                    }}
                  >
                    Add Function
                  </Button>
                </Box>
                {hasFunctions ? (
                section.functions.map((func) => {
                  const hasFunctionData = func.functionData && func.functionData.length > 0;
                  const functionDataCount = func.functionData?.length || 0;
                  return (
                  <Accordion key={func.id} sx={{ mb: 1, ml: 2 }}>
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                        '&:hover': {
                          backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                        <Typography variant="body2" sx={{ fontWeight: hasFunctionData ? 600 : 400 }}>
                          {func.name}
                        </Typography>
                        <Chip
                          label={`${functionDataCount} ${functionDataCount === 1 ? 'Subjects:' : 'Subjects:'}`}
                          size="small"
                          color="secondary"
                          variant={hasFunctionData ? "filled" : "outlined"}
                          sx={{
                            fontWeight: hasFunctionData ? 600 : 400,
                          }}
                        />
                        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFunctionModal(func);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(func, "function");
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() =>
                            handleOpenFunctionDataModal({ functionId: func.id })
                          }
                        >
                          Add Subjects:
                        </Button>
                      </Box>
                      {func.functionData && func.functionData.length > 0 ? (
                        <Grid container spacing={2}>
                          {func.functionData.map((fd) => (
                            <Grid item xs={12} sm={6} md={4} key={fd.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {fd.name}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenFunctionDataModal(fd)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteClick(fd, "functionData")}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No function data available
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                  );
                })
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    This section has no functions yet. Click "Add Function" above to add one.
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  // Render Units View
  const renderUnitsView = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!groupedSections.unit || groupedSections.unit.length === 0) {
      return (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">Units (0)</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleOpenSectionModal()}
            >
              Add Unit
            </Button>
          </Box>
          <Alert severity="info">No units found. Please add units first.</Alert>
        </Box>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            Units ({groupedSections.unit.length})
            {(() => {
              const totalFunctions = groupedSections.unit.reduce((sum, section) => {
                return sum + (section.functions?.length || 0);
              }, 0);
              return totalFunctions > 0 ? ` - ${totalFunctions} ${totalFunctions === 1 ? 'Function' : 'Functions'}` : '';
            })()}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSectionModal()}
          >
            Add Unit
          </Button>
        </Box>
        {groupedSections.unit.map((section) => {
          const hasFunctions = section.functions && section.functions.length > 0;
          const functionCount = section.functions?.length || 0;
          return (
            <Accordion key={section.id} sx={{ mb: 2 }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: hasFunctions ? 'rgba(156, 39, 176, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    backgroundColor: hasFunctions ? 'rgba(156, 39, 176, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                  <Typography variant="body2" sx={{ fontWeight: hasFunctions ? 600 : 400 }}>
                    {section.name}
                  </Typography>
                  <Chip
                    label={`${functionCount} ${functionCount === 1 ? 'Function' : 'Functions'}`}
                    size="small"
                    color={hasFunctions ? "secondary" : "default"}
                    variant={hasFunctions ? "filled" : "outlined"}
                    sx={{
                      fontWeight: hasFunctions ? 600 : 400,
                    }}
                  />
                  <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSectionModal(section);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(section, "section");
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFunctionForm({ name: "", section_id: section.id, id: null });
                      setOpenFunctionModal(true);
                    }}
                  >
                    Add Function
                  </Button>
                </Box>
                {hasFunctions ? (
                section.functions.map((func) => {
                  const hasFunctionData = func.functionData && func.functionData.length > 0;
                  const functionDataCount = func.functionData?.length || 0;
                  return (
                  <Accordion key={func.id} sx={{ mb: 1, ml: 2 }}>
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                        '&:hover': {
                          backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                        <Typography variant="body2" sx={{ fontWeight: hasFunctionData ? 600 : 400 }}>
                          {func.name}
                        </Typography>
                        <Chip
                          label={`${functionDataCount} ${functionDataCount === 1 ? 'Subjects:' : 'Subjects:'}`}
                          size="small"
                          color="secondary"
                          variant={hasFunctionData ? "filled" : "outlined"}
                          sx={{
                            fontWeight: hasFunctionData ? 600 : 400,
                          }}
                        />
                        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFunctionModal(func);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(func, "function");
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="secondary"
                          startIcon={<AddIcon />}
                          onClick={() =>
                            handleOpenFunctionDataModal({ functionId: func.id })
                          }
                        >
                          Add Subjects:
                        </Button>
                      </Box>
                      {func.functionData && func.functionData.length > 0 ? (
                        <Grid container spacing={2}>
                          {func.functionData.map((fd) => (
                            <Grid item xs={12} sm={6} md={4} key={fd.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {fd.name}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenFunctionDataModal(fd)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteClick(fd, "functionData")}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No function data available
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                  );
                })
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    This section has no functions yet. Click "Add Function" above to add one.
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  // Render Sections View with Nested Tabs
  const renderSectionsView = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            Total Sections: {((groupedSections.directorate?.length || 0) + (groupedSections.unit?.length || 0))} 
            {groupedSections.directorate && ` (${groupedSections.directorate.length} Directorates, `}
            {groupedSections.unit && `${groupedSections.unit.length} Units`}
            {groupedSections.directorate || groupedSections.unit ? ')' : ''}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSectionModal()}
          >
            Add Section
          </Button>
        </Box>
        
        {/* Nested Tabs for Directorates and Units */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={sectionsTabValue} onChange={handleSectionsTabChange} aria-label="sections nested tabs" sx={{ '& .MuiTab-root': { fontSize: '0.875rem', minHeight: '40px' } }}>
            <Tab label="Directorates" />
            <Tab label="Units" />
          </Tabs>
        </Box>

        <TabPanel value={sectionsTabValue} index={0}>
          {renderDirectoratesView()}
        </TabPanel>
        <TabPanel value={sectionsTabValue} index={1}>
          {renderUnitsView()}
        </TabPanel>
      </Box>
    );
  };

  // Old renderSectionsView content - keeping for reference
  const renderSectionsViewOld = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            Total Sections: {((groupedSections.directorate?.length || 0) + (groupedSections.unit?.length || 0))} 
            {groupedSections.directorate && ` (${groupedSections.directorate.length} Directorates, `}
            {groupedSections.unit && `${groupedSections.unit.length} Units`}
            {groupedSections.directorate || groupedSections.unit ? ')' : ''}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSectionModal()}
          >
            Add Section
          </Button>
        </Box>
        {processedSectionsData.length === 0 ? (
          <Alert severity="info">No sections found. Please add sections first.</Alert>
        ) : (
          <>
            {/* Directorates Section */}
            {groupedSections.directorate && groupedSections.directorate.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: 'primary.main',
                    fontWeight: 600,
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    pb: 1
                  }}
                >
                  Directorates ({groupedSections.directorate.length})
                </Typography>
                {groupedSections.directorate.map((section) => {
            const hasFunctions = section.functions && section.functions.length > 0;
            const functionCount = section.functions?.length || 0;
            return (
              <Accordion key={section.id} sx={{ mb: 2 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: hasFunctions ? 'rgba(25, 118, 210, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                    '&:hover': {
                      backgroundColor: hasFunctions ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                    <Typography variant="body2" sx={{ fontWeight: hasFunctions ? 600 : 400 }}>
                      {section.name}
                    </Typography>
                    <Chip
                      label={`${functionCount} ${functionCount === 1 ? 'Function' : 'Functions'}`}
                      size="small"
                      color={hasFunctions ? "primary" : "default"}
                      variant={hasFunctions ? "filled" : "outlined"}
                      sx={{
                        fontWeight: hasFunctions ? 600 : 400,
                      }}
                    />
                    <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSectionModal(section);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(section, "section");
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setFunctionForm({ name: "", section_id: section.id, id: null });
                        setOpenFunctionModal(true);
                      }}
                    >
                      Add Function
                    </Button>
                  </Box>
                  {hasFunctions ? (
                  section.functions.map((func) => {
                    const hasFunctionData = func.functionData && func.functionData.length > 0;
                    const functionDataCount = func.functionData?.length || 0;
                    return (
                    <Accordion key={func.id} sx={{ mb: 1, ml: 2 }}>
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                          <Typography variant="body2" sx={{ fontWeight: hasFunctionData ? 600 : 400 }}>
                            {func.name}
                          </Typography>
                          <Chip
                            label={`${functionDataCount} ${functionDataCount === 1 ? 'Subjects:' : 'Subjects:'}`}
                            size="small"
                            color="secondary"
                            variant={hasFunctionData ? "filled" : "outlined"}
                            sx={{
                              fontWeight: hasFunctionData ? 600 : 400,
                            }}
                          />
                          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFunctionModal(func);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(func, "function");
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              handleOpenFunctionDataModal({ functionId: func.id })
                            }
                          >
                            Add Subjects:
                          </Button>
                        </Box>
                        {func.functionData && func.functionData.length > 0 ? (
                          <Grid container spacing={2}>
                            {func.functionData.map((fd) => (
                              <Grid item xs={12} sm={6} md={4} key={fd.id}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                      <Box>
                                        <Typography variant="body2" fontWeight="bold">
                                          {fd.name}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleOpenFunctionDataModal(fd)}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleDeleteClick(fd, "functionData")}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No function data available
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                    );
                  })
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      This section has no functions yet. Click "Add Function" above to add one.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
                  );
                })}
              </Box>
            )}

            {/* Units Section */}
            {groupedSections.unit && groupedSections.unit.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: 'secondary.main',
                    fontWeight: 600,
                    borderBottom: '2px solid',
                    borderColor: 'secondary.main',
                    pb: 1
                  }}
                >
                  Units ({groupedSections.unit.length})
                  {(() => {
                    const totalFunctionData = groupedSections.unit.reduce((sum, section) => {
                      const sectionFunctionData = section.functions?.reduce((funcSum, func) => {
                        return funcSum + (func.functionData?.length || 0);
                      }, 0) || 0;
                      return sum + sectionFunctionData;
                    }, 0);
                    return totalFunctionData > 0 ? ` - ${totalFunctionData} Subjects:` : '';
                  })()}
                </Typography>
                {groupedSections.unit.map((section) => {
                  const hasFunctions = section.functions && section.functions.length > 0;
                  // Calculate total function data count across all functions in this section
                  const totalFunctionData = section.functions?.reduce((sum, func) => {
                    return sum + (func.functionData?.length || 0);
                  }, 0) || 0;
                  const hasFunctionData = totalFunctionData > 0;
                  return (
                    <Accordion key={section.id} sx={{ mb: 2 }}>
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                          '&:hover': {
                            backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: hasFunctionData ? 600 : 400 }}>
                            {section.name}
                          </Typography>
                          <Chip
                            label={`${totalFunctionData} ${totalFunctionData === 1 ? 'Subjects:' : 'Subjects:'}`}
                            size="small"
                            color={hasFunctionData ? "secondary" : "default"}
                            variant={hasFunctionData ? "filled" : "outlined"}
                            sx={{
                              fontWeight: hasFunctionData ? 600 : 400,
                            }}
                          />
                          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSectionModal(section);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(section, "section");
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="secondary"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setFunctionForm({ name: "", section_id: section.id, id: null });
                              setOpenFunctionModal(true);
                            }}
                          >
                            Add Function
                          </Button>
                        </Box>
                        {hasFunctions ? (
                        section.functions.map((func) => {
                          const hasFunctionData = func.functionData && func.functionData.length > 0;
                          const functionDataCount = func.functionData?.length || 0;
                          return (
                          <Accordion key={func.id} sx={{ mb: 1, ml: 2 }}>
                            <AccordionSummary 
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                                '&:hover': {
                                  backgroundColor: hasFunctionData ? 'rgba(156, 39, 176, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                }
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: hasFunctionData ? 600 : 400 }}>
                                  {func.name}
                                </Typography>
                                <Chip
                                  label={`${functionDataCount} ${functionDataCount === 1 ? 'Subjects:' : 'Subjects:'}`}
                                  size="small"
                                  color="secondary"
                                  variant={hasFunctionData ? "filled" : "outlined"}
                                  sx={{
                                    fontWeight: hasFunctionData ? 600 : 400,
                                  }}
                                />
                                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenFunctionModal(func);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(func, "function");
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="secondary"
                                  startIcon={<AddIcon />}
                                  onClick={() =>
                                    handleOpenFunctionDataModal({ functionId: func.id })
                                  }
                                >
                                  Add Subjects:
                                </Button>
                              </Box>
                              {func.functionData && func.functionData.length > 0 ? (
                                <Grid container spacing={2}>
                                  {func.functionData.map((fd) => (
                                    <Grid item xs={12} sm={6} md={4} key={fd.id}>
                                      <Card variant="outlined">
                                        <CardContent>
                                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                                            <Box>
                                              <Typography variant="body2" fontWeight="bold">
                                                {fd.name}
                                              </Typography>
                                            </Box>
                                            <Box>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleOpenFunctionDataModal(fd)}
                                              >
                                                <EditIcon fontSize="small" />
                                              </IconButton>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteClick(fd, "functionData")}
                                              >
                                                <DeleteIcon fontSize="small" />
                                              </IconButton>
                                            </Box>
                                          </Box>
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No function data available
                                </Typography>
                              )}
                            </AccordionDetails>
                          </Accordion>
                          );
                        })
                        ) : (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            This section has no functions yet. Click "Add Function" above to add one.
                          </Alert>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </>
        )}
      </Box>
    );
  };

  // Render Functions View
  const renderFunctionsView = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">Total Sub-Sections: {filteredFunctionsData.length}</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenFunctionModal()}
          >
            Add Function
          </Button>
        </Box>
        {filteredFunctionsData.length === 0 ? (
          <Alert severity="info">
            {searchQuery ? "No functions found matching your search." : "No functions found. Please add functions first."}
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredFunctionsData.map((func) => (
              <Grid item xs={12} md={6} key={func.id}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold">{func.name}</Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenFunctionModal(func)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(func, "function")}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    {func.section && (
                      <Chip label={func.section.name} size="small" color="primary" sx={{ mb: 2 }} />
                    )}
                    {func.functionData && func.functionData.length > 0 ? (
                      <>
                        <Typography variant="caption" fontWeight="bold" gutterBottom>
                          Subjects: ({func.functionData.length}):
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {func.functionData.map((fd) => (
                            <Chip
                              key={fd.id}
                              label={fd.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No function data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  // Render Subjects: View
  const renderFunctionDataView = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">Total Subjects: {filteredFunctionDataList.length}</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenFunctionDataModal()}
          >
            Add Sub-Section Data
          </Button>
        </Box>
        {filteredFunctionDataList.length === 0 ? (
          <Alert severity="info">
            {searchQuery ? "No function data found matching your search." : "No function data found. Please add function data first."}
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {filteredFunctionDataList.map((fd) => (
              <Grid item xs={12} sm={6} md={4} key={fd.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{fd.name}</Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenFunctionDataModal(fd)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(fd, "functionData")}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    {fd.function && (
                      <>
                        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                          <Chip
                            label={`Sub-Section: ${fd.function.name}`}
                            size="small"
                            color="primary"
                          />
                          {fd.function.section && (
                            <Chip
                              label={`Section: ${fd.function.section.name}`}
                              size="small"
                              color="secondary"
                            />
                          )}
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  // Render Channels View
  const renderChannelsView = () => {
    const filteredChannels = searchQuery
      ? channelsData.filter((channel) =>
          channel.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
      : channelsData;

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">Total Channels: {filteredChannels.length}</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenChannelModal()}
          >
            Add Channel
          </Button>
        </Box>
        {filteredChannels.length === 0 ? (
          <Alert severity="info">
            {searchQuery ? "No channels found matching your search." : "No channels found. Please add channels first."}
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Channel Name</strong></TableCell>
                  <TableCell><strong>Created By</strong></TableCell>
                  <TableCell><strong>Updated By</strong></TableCell>
                  <TableCell><strong>Created Date</strong></TableCell>
                  <TableCell><strong>Updated Date</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredChannels.map((channel, index) => (
                  <TableRow key={channel.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {channel.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {channel.creator?.full_name || channel.creator?.email || channel.creator?.username || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {channel.updater?.full_name || channel.updater?.email || channel.updater?.username || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {channel.created_at ? new Date(channel.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {channel.updated_at ? new Date(channel.updated_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenChannelModal(channel)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(channel, "channel")}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  // Render Relations View
  const renderRelationsView = () => {
    const filteredRelations = searchQuery
      ? relationsData.filter((relation) =>
          relation.name?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          relation.description?.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
      : relationsData;

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">Total Relations: {filteredRelations.length}</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleOpenRelationModal()}
          >
            Add Relation
          </Button>
        </Box>
        {filteredRelations.length === 0 ? (
          <Alert severity="info">
            {searchQuery ? "No relations found matching your search." : "No relations found. Please add relations first."}
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Relation Name</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Created Date</strong></TableCell>
                  <TableCell><strong>Updated Date</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRelations.map((relation, index) => (
                  <TableRow key={relation.id} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {relation.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {relation.description || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {relation.createdAt ? new Date(relation.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {relation.updatedAt ? new Date(relation.updatedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenRelationModal(relation)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(relation, "relation")}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 2 }}>
      <Paper sx={{ mb: 2, p: 2 }}>
        <Typography variant="h6" component="h1" gutterBottom>
          Mapping Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage the hierarchical structure of Sections, Sub-sections, and Subjects
        </Typography>
      </Paper>

      {/* Search Bar */}
      <Paper sx={{ mb: 2, p: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search sections, sub-section, subject, channel or relations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={value} onChange={handleChange} aria-label="mapping tabs" sx={{ '& .MuiTab-root': { fontSize: '0.875rem', minHeight: '48px' } }}>
            <Tab label="Sections View" />
            <Tab label="Sub-Sections View" />
            <Tab label="Subjects View" />
            <Tab label="Channels View" />
            <Tab label="Relations View" />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          {renderSectionsView()}
        </TabPanel>
        <TabPanel value={value} index={1}>
          {renderFunctionsView()}
        </TabPanel>
        <TabPanel value={value} index={2}>
          {renderFunctionDataView()}
        </TabPanel>
        <TabPanel value={value} index={3}>
          {renderChannelsView()}
        </TabPanel>
        <TabPanel value={value} index={4}>
          {renderRelationsView()}
        </TabPanel>
      </Paper>

      {/* Section Modal */}
      <Dialog open={openSectionModal} onClose={() => setOpenSectionModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{sectionForm.id ? "Edit Section" : "Create Section"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Section Name"
            fullWidth
            variant="outlined"
            value={sectionForm.name}
            onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setOpenSectionModal(false)}>Cancel</Button>
          <Button size="small" onClick={handleSaveSection} variant="contained">
            {sectionForm.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Function Modal */}
      <Dialog open={openFunctionModal} onClose={() => setOpenFunctionModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{functionForm.id ? "Edit Function" : "Create Function"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Function Name"
            fullWidth
            variant="outlined"
            value={functionForm.name}
            onChange={(e) => setFunctionForm({ ...functionForm, name: e.target.value })}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={functionForm.section_id}
              label="Section"
              onChange={(e) => setFunctionForm({ ...functionForm, section_id: e.target.value })}
            >
              {processedSectionsData.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setOpenFunctionModal(false)}>Cancel</Button>
          <Button size="small" onClick={handleSaveFunction} variant="contained">
            {functionForm.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subjects: Modal */}
      <Dialog
        open={openFunctionDataModal}
        onClose={() => setOpenFunctionDataModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {functionDataForm.id ? "Edit Subjects:" : "Create Subjects:"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Subjects: Name"
            fullWidth
            variant="outlined"
            value={functionDataForm.name}
            onChange={(e) =>
              setFunctionDataForm({ ...functionDataForm, name: e.target.value })
            }
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Function</InputLabel>
            <Select
              value={functionDataForm.function_id}
              label="Function"
              onChange={(e) =>
                setFunctionDataForm({ ...functionDataForm, function_id: e.target.value })
              }
            >
              {functionsData.map((func) => (
                <MenuItem key={func.id} value={func.id}>
                  {func.name} {func.section && `(${func.section.name})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setOpenFunctionDataModal(false)}>Cancel</Button>
          <Button size="small" onClick={handleSaveFunctionData} variant="contained">
            {functionDataForm.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Channel Modal */}
      <Dialog open={openChannelModal} onClose={() => setOpenChannelModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{channelForm.id ? "Edit Channel" : "Create Channel"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Channel Name"
            fullWidth
            variant="outlined"
            value={channelForm.name}
            onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setOpenChannelModal(false)}>Cancel</Button>
          <Button size="small" onClick={handleSaveChannel} variant="contained">
            {channelForm.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Relation Modal */}
      <Dialog open={openRelationModal} onClose={() => setOpenRelationModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{relationForm.id ? "Edit Relation" : "Create Relation"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Relation Name"
            fullWidth
            variant="outlined"
            value={relationForm.name}
            onChange={(e) => setRelationForm({ ...relationForm, name: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={relationForm.description}
            onChange={(e) => setRelationForm({ ...relationForm, description: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setOpenRelationModal(false)}>Cancel</Button>
          <Button size="small" onClick={handleSaveRelation} variant="contained">
            {relationForm.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            {deleteItem?.name || "this item"}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button size="small" onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MappingManagement;
