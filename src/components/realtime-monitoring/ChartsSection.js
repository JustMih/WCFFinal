import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%,rgb(214, 210, 218) 100%)',
  color: 'white',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  },
}));

const ChartsSection = ({ dashboardData }) => {
  // Chart options for call volume
  const callVolumeOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent'
    },
    colors: ['#667eea'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100]
      }
    },
    grid: {
      borderColor: '#e0e0e0',
      strokeDashArray: 5
    },
    xaxis: {
      categories: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
      labels: { style: { colors: '#666' } }
    },
    yaxis: {
      labels: { style: { colors: '#666' } }
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px' }
    }
  };

  // Chart options for call types
  const callTypesOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false }
    },
    colors: ['#4facfe', '#fa709a', '#a8edea'],
    labels: ['Inbound', 'Outbound', 'Internal'],
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val + '%';
      }
    },
    legend: {
      position: 'bottom',
      labels: { colors: '#666' }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Calls',
              color: '#666'
            }
          }
        }
      }
    }
  };

  return (
    <Grid spacing={4} sx={{ mb: 4 }}>
      {/* Call Volume Chart */}
      <Grid item xs={12} lg={12} xl={12} sx={{ mb: 3 }}>
  <StyledCard>
    <CardContent sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Call Volume (24 Hours)
      </Typography>
      <ReactApexChart
        options={callVolumeOptions}
        series={[{ name: 'Calls', data: dashboardData.callVolume }]}
        type="area"
        height={350}
      />
    </CardContent>
  </StyledCard>
</Grid>


      {/* Call Types Chart */}
      <Grid item xs={12} lg={4}>
        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Call Distribution
            </Typography>
            <ReactApexChart
              options={callTypesOptions}
              series={[dashboardData.callTypes.inbound, dashboardData.callTypes.outbound, dashboardData.callTypes.internal]}
              type="donut"
              height={350}
            />
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );
};

export default ChartsSection; 