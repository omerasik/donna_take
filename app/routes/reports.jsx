import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import ChatLayout from '../components/ChatLayout.jsx';

export { loader } from './reports.loader.js';

export default function Reports() {
  const loaderData = useLoaderData();
  const [reports, setReports] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const savedReports = localStorage.getItem('donna_reports');
    const loadedReports = savedReports ? JSON.parse(savedReports) : [];
    setReports(loadedReports);
    setIsClient(true);
  }, [loaderData]);

  if (!isClient) {
    return (
      <ChatLayout>
        <section className="reports-panel">
          <div className="chat-placeholder">Loading reports...</div>
        </section>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout>
      <section className="reports-panel">
        <header>
          <div>
            <small className="date-pill">Logs</small>
            <h1>Meeting reports</h1>
          </div>
          <Link to="/chat" role="button" className="contrast">
            Back to chat
          </Link>
        </header>

        {reports.length === 0 ? (
          <div className="empty-state">
            <h2>No reports yet</h2>
            <p>Log a meeting in chat to see it here.</p>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report, index) => (
              <article key={report.id || index} className="report-card">
                <div className="report-meta">
                  <h3>Meeting with {report.client}</h3>
                  <span>{new Date(report.timestamp).toLocaleString()}</span>
                </div>
                <div className="report-fields">
                  <ReportField label="Outcome" value={report.outcome} />
                  <ReportField label="Next steps" value={report.nextSteps} />
                  <ReportField label="Sales reps" value={report.salesReps} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </ChatLayout>
  );
}

function ReportField({ label, value }) {
  return (
    <div className="report-field">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}
