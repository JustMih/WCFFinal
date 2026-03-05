import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PerformanceScorecard = () => {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      try {
        const dummyData = [
          {
            name: 'Carter Geldt',
            avatar: 'https://i.pravatar.cc/40?img=1',
            score: 147,
            assigned: 82,
            resolvedRate: 83,
            aht: '00:05:30',
            frt: '00:00:45',
            fcr: 91,
            asa: '00:00:30',
            avar: 3,
            unanswered: 2,
            csat: 4.8,
          },
          {
            name: 'Livia Corder',
            avatar: 'https://i.pravatar.cc/40?img=2',
            score: 82,
            assigned: 68,
            resolvedRate: 80,
            aht: '00:06:15',
            frt: '00:01:10',
            fcr: 85,
            asa: '00:00:50',
            avar: 5,
            unanswered: 4,
            csat: 4.5,
          },
          {
            name: 'Leo Curtis',
            avatar: 'https://i.pravatar.cc/40?img=3',
            score: 68,
            assigned: 60,
            resolvedRate: 73,
            aht: '00:04:40',
            frt: '00:00:55',
            fcr: 88,
            asa: '00:00:40',
            avar: 2,
            unanswered: 1,
            csat: 4.7,
          },
        ];

        setTimeout(() => setMetrics(dummyData), 500);
      } catch (err) {
        console.error('Failed to fetch metrics', err);
      }
    };

    fetchPerformanceMetrics();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded shadow-md border border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">🎯 Agent Productivity Scorecard</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border border-gray-300 rounded overflow-hidden">
          <thead className="bg-blue-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 border-r border-gray-300">Agent</th>
              <th className="px-4 py-3 border-r border-gray-300">Performance Score</th>
              <th className="px-4 py-3 border-r border-gray-300">Tickets Assigned</th>
              <th className="px-4 py-3 border-r border-gray-300">Tickets Resolved</th>
              <th className="px-4 py-3 border-r border-gray-300">Avg. Handle Time</th>
              <th className="px-4 py-3 border-r border-gray-300">FRT</th>
              <th className="px-4 py-3 border-r border-gray-300">FCR</th>
              <th className="px-4 py-3 border-r border-gray-300">ASA</th>
              <th className="px-4 py-3 border-r border-gray-300">AVAR</th>
              <th className="px-4 py-3 border-r border-gray-300">Unanswered</th>
              <th className="px-4 py-3">CSAT</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((agent, idx) => (
              <tr key={idx} className="hover:bg-blue-50">
                <td className="px-4 py-3 border-r border-gray-200 font-medium flex items-center gap-2">
                  <img src={agent.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                  <span className="text-gray-800">{agent.name}</span>
                </td>
                <td className="px-4 py-3 border-r border-gray-200 text-purple-700 font-semibold">{agent.score}</td>
                <td className="px-4 py-3 border-r border-gray-200">{agent.assigned}</td>
                <td className="px-4 py-3 border-r border-gray-200">
                  <div className="w-full bg-gray-200 rounded h-4">
                    <div
                      className="h-4 rounded bg-blue-500"
                      style={{ width: `${agent.resolvedRate}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{agent.resolvedRate}%</span>
                </td>
                <td className="px-4 py-3 border-r border-gray-200 text-green-600 font-semibold">{agent.aht}</td>
                <td className="px-4 py-3 border-r border-gray-200">{agent.frt}</td>
                <td className="px-4 py-3 border-r border-gray-200 text-blue-800 font-medium">{agent.fcr}%</td>
                <td className="px-4 py-3 border-r border-gray-200">{agent.asa}</td>
                <td className="px-4 py-3 border-r border-gray-200 text-red-500">{agent.avar}%</td>
                <td className="px-4 py-3 border-r border-gray-200 text-red-500">{agent.unanswered}%</td>
                <td className="px-4 py-3 text-yellow-700 font-medium">{agent.csat} / 5</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceScorecard;
