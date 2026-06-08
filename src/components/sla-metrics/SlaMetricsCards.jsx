import React from "react";
import {
  FaClipboardCheck,
  FaClock,
  FaHeadphones,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./SlaMetricsCards.css";

export const DEFAULT_SLA_METRICS = {
  averageResponseTime: 0,
  averageHandleTime: 0,
  serviceLevel: 0,
  abandonmentRate: 0,
};

function SlaMetricCard({
  period,
  variant,
  icon: Icon,
  value,
  badge,
  title,
  sublabel,
}) {
  return (
    <div className={`sla-metric-card ${variant}`}>
      <div className="sla-metric-card__icon-wrap">
        <Icon />
      </div>
      <div className="sla-metric-card__body">
        <span className="sla-metric-card__period">{period}</span>
        <span className="sla-metric-card__count">{value}</span>
        <div className="sla-metric-card__summary">
          <div className="sla-metric-card__desc">
            <div className="sla-metric-card__label">{title}</div>
            <div className="sla-metric-card__sublabel">{sublabel}</div>
          </div>
          {badge ? (
            <span className="sla-metric-card__percent">{badge}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SlaMetricsCards({ metrics = DEFAULT_SLA_METRICS }) {
  const data = { ...DEFAULT_SLA_METRICS, ...metrics };

  return (
    <section className="sla-metrics-section" aria-label="SLA metrics">
      <div className="sla-metrics-grid">
        <SlaMetricCard
          period="SLA"
          variant="sla-service-level"
          icon={FaClipboardCheck}
          value={`${data.serviceLevel}%`}
          badge={null}
          title="Service Level"
          sublabel="Current"
        />
        <SlaMetricCard
          period="SLA"
          variant="sla-avg-response"
          icon={FaClock}
          value={`${data.averageResponseTime}s`}
          badge={null}
          title="Avg Response Time"
          sublabel="Seconds"
        />
        <SlaMetricCard
          period="SLA"
          variant="sla-avg-handle"
          icon={FaHeadphones}
          value={`${data.averageHandleTime}s`}
          badge={null}
          title="Avg Handle Time"
          sublabel="Seconds"
        />
        <SlaMetricCard
          period="SLA"
          variant="sla-abandonment"
          icon={FaExclamationTriangle}
          value={`${data.abandonmentRate}%`}
          badge={null}
          title="Abandonment Rate"
          sublabel="Percent"
        />
      </div>
    </section>
  );
}
