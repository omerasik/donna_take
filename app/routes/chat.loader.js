import { REPORT_STATES } from '../lib/donnaLogic.js';

export async function loader() {
  return {
    messages: [
      {
        id: 1,
        sender: 'donna',
        text: "Hello! I'm Donna, your meeting assistant. You can ask me about your upcoming meetings or say 'I want to log a report' to record a meeting summary.",
        timestamp: new Date().toISOString()
      }
    ],
    currentState: REPORT_STATES.IDLE,
    reportData: {}
  };
}
