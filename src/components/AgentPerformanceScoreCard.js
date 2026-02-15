import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';

const AgentPerformanceScoreCard = ({ agentId }) => {
  const [metrics, setMetrics] = useState({
    aht: 0, // Average Handling Time (in seconds)
    frt: 0, // First Response Time (in seconds)
    fcr: 0, // First Call Resolution (%)
    asa: 0, // Average Speed of Answer (in seconds)
    avar: 0, // Average Call Abandonment Rate (%)
    unansweredRate: 0, // Unanswered Rate (%)
    csat: 0, // Customer Satisfaction Score (1-5)
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call to fetch metrics
    const fetchMetrics = async () => {
      try {
        // Simulated API call
        const response = await fetch(`/api/agent-metrics/${agentId}`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching agent metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [agentId]);

  const getScoreColor = (score, type) => {
    if (type === 'percentage') {
      if (score >= 80) return 'success';
      if (score >= 60) return 'warning';
      return 'error';
    }
    if (type === 'time') {
      if (score <= 180) return 'success'; // 3 minutes or less
      if (score <= 300) return 'warning'; // 5 minutes or less
      return 'error';
    }
    if (type === 'csat') {
      if (score >= 4) return 'success';
      if (score >= 3) return 'warning';
      return 'error';
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Agent Performance Score Card
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Time Metrics
                </Typography>
                <Timeline>
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color={getScoreColor(metrics.aht, 'time')} />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1">Average Handling Time (AHT)</Typography>
                      <Typography variant="body2">{formatTime(metrics.aht)}</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(metrics.aht / 600) * 100} 
                        color={getScoreColor(metrics.aht, 'time')}
                      />
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color={getScoreColor(metrics.frt, 'time')} />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1">First Response Time (FRT)</Typography>
                      <Typography variant="body2">{formatTime(metrics.frt)}</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(metrics.frt / 180) * 100} 
                        color={getScoreColor(metrics.frt, 'time')}
                      />
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color={getScoreColor(metrics.asa, 'time')} />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1">Average Speed of Answer (ASA)</Typography>
                      <Typography variant="body2">{formatTime(metrics.asa)}</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(metrics.asa / 60) * 100} 
                        color={getScoreColor(metrics.asa, 'time')}
                      />
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quality Metrics
                </Typography>
                <Timeline>
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color={getScoreColor(metrics.fcr, 'percentage')} />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1">First Call Resolution (FCR)</Typography>
                      <Typography variant="body2">{metrics.fcr}%</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={metrics.fcr} 
                        color={getScoreColor(metrics.fcr, 'percentage')}
                      />
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color={getScoreColor(metrics.avar, 'percentage')} />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1">Call Abandonment Rate</Typography>
                      <Typography variant="body2">{metrics.avar}%</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={metrics.avar} 
                        color={getScoreColor(metrics.avar, 'percentage')}
                      />
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color={getScoreColor(metrics.unansweredRate, 'percentage')} />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1">Unanswered Rate</Typography>
                      <Typography variant="body2">{metrics.unansweredRate}%</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={metrics.unansweredRate} 
                        color={getScoreColor(metrics.unansweredRate, 'percentage')}
                      />
                    </TimelineContent>
                  </TimelineItem>

                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color={getScoreColor(metrics.csat, 'csat')} />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1">Customer Satisfaction (CSAT)</Typography>
                      <Typography variant="body2">{metrics.csat}/5</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(metrics.csat / 5) * 100} 
                        color={getScoreColor(metrics.csat, 'csat')}
                      />
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceScoreCard; 