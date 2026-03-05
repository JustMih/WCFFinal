const express = require('express');
const router = express.Router();

// Initialize database connection
let db;
const initializeDatabase = (databaseConnection) => {
  db = databaseConnection;
};

// Calculate metrics for a specific agent
const calculateAgentMetrics = async (agentId, startDate, endDate) => {
  try {
    // Get all calls for the agent within the date range
    const calls = await db.query(
      `SELECT * FROM calls 
       WHERE agent_id = ? 
       AND start_time BETWEEN ? AND ?`,
      [agentId, startDate, endDate]
    );

    if (!calls || calls.length === 0) {
      return {
        aht: 0,
        frt: 0,
        fcr: 0,
        asa: 0,
        avar: 0,
        unansweredRate: 0,
        csat: 0
      };
    }

    // Calculate Average Handling Time (AHT)
    const aht = calls.reduce((acc, call) => {
      if (!call.end_time || !call.start_time) return acc;
      return acc + (new Date(call.end_time) - new Date(call.start_time)) / 1000; // Convert to seconds
    }, 0) / calls.length;

    // Calculate First Response Time (FRT)
    const frt = calls.reduce((acc, call) => {
      if (!call.first_response_time || !call.start_time) return acc;
      return acc + (new Date(call.first_response_time) - new Date(call.start_time)) / 1000;
    }, 0) / calls.length;

    // Calculate First Call Resolution (FCR)
    const resolvedCalls = calls.filter(call => call.resolution_status === 'resolved');
    const fcr = (resolvedCalls.length / calls.length) * 100;

    // Calculate Average Speed of Answer (ASA)
    const asa = calls.reduce((acc, call) => {
      if (!call.answer_time || !call.start_time) return acc;
      return acc + (new Date(call.answer_time) - new Date(call.start_time)) / 1000;
    }, 0) / calls.length;

    // Calculate Call Abandonment Rate (AVAR)
    const abandonedCalls = calls.filter(call => call.status === 'abandoned');
    const avar = (abandonedCalls.length / calls.length) * 100;

    // Calculate Unanswered Rate
    const unansweredCalls = calls.filter(call => call.status === 'unanswered');
    const unansweredRate = (unansweredCalls.length / calls.length) * 100;

    // Calculate Customer Satisfaction (CSAT)
    const csatScores = calls.filter(call => call.csat_score).map(call => call.csat_score);
    const csat = csatScores.length > 0 
      ? csatScores.reduce((acc, score) => acc + score, 0) / csatScores.length 
      : 0;

    return {
      aht: Math.round(aht),
      frt: Math.round(frt),
      fcr: Math.round(fcr),
      asa: Math.round(asa),
      avar: Math.round(avar),
      unansweredRate: Math.round(unansweredRate),
      csat: Math.round(csat * 10) / 10
    };
  } catch (error) {
    console.error('Error calculating agent metrics:', error);
    throw error;
  }
};

// Get metrics for a specific agent
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await calculateAgentMetrics(agentId, start, end);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching agent metrics:', error);
    res.status(500).json({ error: 'Failed to fetch agent metrics' });
  }
});

// Update metrics for a specific call
router.post('/call/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    const { 
      agentId,
      startTime,
      endTime,
      firstResponseTime,
      answerTime,
      resolutionStatus,
      status,
      csatScore
    } = req.body;

    await db.query(
      `INSERT INTO calls (
        call_id, agent_id, start_time, end_time, 
        first_response_time, answer_time, 
        resolution_status, status, csat_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        end_time = VALUES(end_time),
        first_response_time = VALUES(first_response_time),
        answer_time = VALUES(answer_time),
        resolution_status = VALUES(resolution_status),
        status = VALUES(status),
        csat_score = VALUES(csat_score)`,
      [
        callId, agentId, startTime, endTime,
        firstResponseTime, answerTime,
        resolutionStatus, status, csatScore
      ]
    );

    res.json({ message: 'Call metrics updated successfully' });
  } catch (error) {
    console.error('Error updating call metrics:', error);
    res.status(500).json({ error: 'Failed to update call metrics' });
  }
});

module.exports = {
  router,
  initializeDatabase,
  calculateAgentMetrics
}; 