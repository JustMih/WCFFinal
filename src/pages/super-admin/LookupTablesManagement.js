import React, { useState } from "react";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";
import RelationManagement from "../../components/lookup-tables/RelationManagement";
import DirectorateManagement from "../../components/lookup-tables/DirectorateManagement";
import UnitManagement from "../../components/lookup-tables/UnitManagement";
import SubjectManagement from "../../components/lookup-tables/SubjectManagement";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lookup-tabpanel-${index}`}
      aria-labelledby={`lookup-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `lookup-tab-${index}`,
    "aria-controls": `lookup-tabpanel-${index}`,
  };
}

const LookupTablesManagement = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{ width: "100%", minHeight: "100vh", bgcolor: "background.default" }}
    >
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Lookup Tables Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage Relations, Directorates, Units, and Subjects
        </Typography>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="lookup tables tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Relations" {...a11yProps(0)} />
          <Tab label="Directorates" {...a11yProps(1)} />
          <Tab label="Units" {...a11yProps(2)} />
          <Tab label="Subjects" {...a11yProps(3)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <RelationManagement />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <DirectorateManagement />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <UnitManagement />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <SubjectManagement />
      </TabPanel>
    </Box>
  );
};

export default LookupTablesManagement;
