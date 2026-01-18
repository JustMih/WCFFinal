import React from 'react';
import { Button } from '@mui/material';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  startIndex, 
  endIndex, 
  onPageChange 
}) => {
  return (
    <div style={{ 
      marginTop: "16px", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      flexWrap: "wrap", 
      gap: "10px" 
    }}>
      {/* Showing info */}
      <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
        {totalItems > 0 ? (
          <>
            Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> out of <strong>{totalItems}</strong> tickets
          </>
        ) : (
          "No tickets found"
        )}
      </div>

      {/* Pagination controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          sx={{ 
            minWidth: "32px", 
            padding: "2px 6px",
            fontSize: "12px",
            height: "28px"
          }}
        >
          First
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          sx={{ 
            minWidth: "32px", 
            padding: "2px 6px",
            fontSize: "12px",
            height: "28px"
          }}
        >
          Previous
        </Button>

        <span style={{ 
          padding: "6px 10px", 
          backgroundColor: "#f5f5f5", 
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          height: "28px",
          display: "flex",
          alignItems: "center"
        }}>
          Page {currentPage} of {totalPages || 1}
        </span>

        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          sx={{ 
            minWidth: "32px", 
            padding: "2px 6px",
            fontSize: "12px",
            height: "28px"
          }}
        >
          Next
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          sx={{ 
            minWidth: "32px", 
            padding: "2px 6px",
            fontSize: "12px",
            height: "28px"
          }}
        >
          Last
        </Button>
      </div>
    </div>
  );
};

export default Pagination; 