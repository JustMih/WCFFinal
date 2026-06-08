import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
export default function ReportExportColumnSelect({
  columns = [],
  selectedKeys = [],
  onChange,
  label = "Export columns",
  disabled = false,
  className = "",
  minWidth = 220,
}) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  const handleSelectAll = (event) => {
    event.stopPropagation();
    onChange(columns.map((col) => col.key));
  };

  const handleDeselectAll = (event) => {
    event.stopPropagation();
    onChange([]);
  };

  const renderValue = (selected) => {
    if (!selected.length) {
      return (
        <Typography variant="body2" color="text.secondary">
          No columns selected
        </Typography>
      );
    }
    if (selected.length <= 2) {
      return (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {selected.map((key) => {
            const col = columns.find((c) => c.key === key);
            return (
              <Chip
                key={key}
                label={col?.label || key}
                size="small"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            );
          })}
        </Box>
      );
    }
    return (
      <Chip
        label={`${selected.length} columns`}
        size="small"
        sx={{ height: 20, fontSize: "0.7rem" }}
      />
    );
  };

  return (
    <FormControl
      size="small"
      className={className}
      disabled={disabled || columns.length === 0}
      sx={{ minWidth }}
    >
      <InputLabel id="report-export-columns-label" shrink>
        {label}
      </InputLabel>
      <Select
        labelId="report-export-columns-label"
        id="report-export-columns"
        multiple
        value={selectedKeys}
        onChange={handleChange}
        label={label}
        renderValue={renderValue}
        notched
        sx={{
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minHeight: "32px !important",
          },
        }}
      >
        <MenuItem disabled dense sx={{ opacity: "1 !important" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Columns to export
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button
                size="small"
                variant="text"
                onClick={handleSelectAll}
                sx={{ fontSize: "0.7rem", minWidth: "auto", py: 0 }}
              >
                All
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={handleDeselectAll}
                sx={{ fontSize: "0.7rem", minWidth: "auto", py: 0 }}
              >
                None
              </Button>
            </Box>
          </Box>
        </MenuItem>
        <Divider />
        {columns.map((column) => (
          <MenuItem key={column.key} value={column.key} dense>
            <Checkbox
              checked={selectedKeys.indexOf(column.key) > -1}
              size="small"
            />
            <ListItemText
              primary={column.label}
              primaryTypographyProps={{ fontSize: "0.8125rem" }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
