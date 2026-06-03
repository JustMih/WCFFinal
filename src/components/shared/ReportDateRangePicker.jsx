import React from "react";
import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { endOfDay, startOfDay } from "date-fns";
import { formatDateForApi, parseApiDate } from "../../utils/reportDateUtils";
import "./ReportDateRangePicker.css";

const fieldSlotProps = {
  size: "small",
  fullWidth: false,
  InputLabelProps: { shrink: true },
  sx: {
    minWidth: { xs: "100%", sm: 168 },
    "& .MuiOutlinedInput-root": {
      height: 40,
      fontSize: "0.875rem",
    },
  },
};

/**
 * Reusable start/end date pickers for reports. Values are YYYY-MM-DD strings.
 */
export default function ReportDateRangePicker({
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  startLabel = "Start Date",
  endLabel = "End Date",
  disabled = false,
  className = "",
  inline = true,
  maxDate = new Date(),
  disableFuture = true,
}) {
  const startValue = parseApiDate(startDate);
  const endValue = parseApiDate(endDate);
  const todayEnd = endOfDay(new Date());
  const max = disableFuture ? (maxDate ? endOfDay(maxDate) : todayEnd) : maxDate;

  const handleStart = (date) => {
    if (!date || Number.isNaN(date.getTime())) {
      onStartDateChange?.("");
      return;
    }
    onStartDateChange?.(formatDateForApi(date));
  };

  const handleEnd = (date) => {
    if (!date || Number.isNaN(date.getTime())) {
      onEndDateChange?.("");
      return;
    }
    onEndDateChange?.(formatDateForApi(date));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        className={`report-date-range-picker${inline ? " report-date-range-picker--inline" : ""} ${className}`.trim()}
        role="group"
        aria-label="Report date range"
      >
        <DatePicker
          label={startLabel}
          value={startValue}
          onChange={handleStart}
          disabled={disabled}
          maxDate={endValue ? endOfDay(endValue) : max}
          disableFuture={disableFuture}
          slotProps={{ textField: fieldSlotProps }}
        />
        <DatePicker
          label={endLabel}
          value={endValue}
          onChange={handleEnd}
          disabled={disabled}
          minDate={startValue ? startOfDay(startValue) : undefined}
          maxDate={max}
          disableFuture={disableFuture}
          slotProps={{ textField: fieldSlotProps }}
        />
      </Box>
    </LocalizationProvider>
  );
}
