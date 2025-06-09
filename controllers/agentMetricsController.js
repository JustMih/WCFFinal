const AgentMetrics = require('../models/AgentMetrics');
const { Op } = require('sequelize');

// Calculate metrics for a specific agent
const calculateAgentMetrics = async (agentId, startDate, endDate) => {
  try {
    const metrics = await AgentMetrics.findAll({
      where: {
        agentId,
        startTime: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (!metrics || metrics.length === 0) {
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
    const aht = metrics.reduce((acc, metric) => {
      if (!metric.endTime || !metric.startTime) return acc;
      return acc + (new Date(metric.endTime) - new Date(metric.startTime)) / 1000;
    }, 0) / metrics.length;

    // Calculate First Response Time (FRT)
    const frt = metrics.reduce((acc, metric) => {
      if (!metric.firstResponseTime || !metric.startTime) return acc;
      return acc + (new Date(metric.firstResponseTime) - new Date(metric.startTime)) / 1000;
    }, 0) / metrics.length;

    // Calculate First Call Resolution (FCR)
    const resolvedCalls = metrics.filter(metric => metric.resolutionStatus === 'resolved');
    const fcr = (resolvedCalls.length / metrics.length) * 100;

    // Calculate Average Speed of Answer (ASA)
    const asa = metrics.reduce((acc, metric) => {
      if (!metric.answerTime || !metric.startTime) return acc;
      return acc + (new Date(metric.answerTime) - new Date(metric.startTime)) / 1000;
    }, 0) / metrics.length;

    // Calculate Call Abandonment Rate (AVAR)
    const abandonedCalls = metrics.filter(metric => metric.status === 'abandoned');
    const avar = (abandonedCalls.length / metrics.length) * 100;

    // Calculate Unanswered Rate
    const unansweredCalls = metrics.filter(metric => metric.status === 'unanswered');
    const unansweredRate = (unansweredCalls.length / metrics.length) * 100;

    // Calculate Customer Satisfaction (CSAT)
    const csatScores = metrics.filter(metric => metric.csatScore).map(metric => metric.csatScore);
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
const getAgentMetrics = async (req, res) => {
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
};

// Update metrics for a specific call
const updateCallMetrics = async (req, res) => {
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

    const [metric, created] = await AgentMetrics.findOrCreate({
      where: { id: callId },
      defaults: {
        agentId,
        startTime,
        endTime,
        firstResponseTime,
        answerTime,
        resolutionStatus,
        status,
        csatScore
      }
    });

    if (!created) {
      await metric.update({
        endTime,
        firstResponseTime,
        answerTime,
        resolutionStatus,
        status,
        csatScore
      });
    }

    res.json({ message: 'Call metrics updated successfully' });
  } catch (error) {
    console.error('Error updating call metrics:', error);
    res.status(500).json({ error: 'Failed to update call metrics' });
  }
};

module.exports = {
  getAgentMetrics,
  updateCallMetrics,
  calculateAgentMetrics
}; 