export const MEETINGS = [
  {
    id: '1',
    time: '14:00',
    client: 'Faruk Bey',
    company: 'Artevelde University',
    topic: 'Donna POC',
  },
  {
    id: '2',
    time: '11:00',
    client: 'Omer Asik',
    company: 'Nvidia',
    topic: 'AI Integration',
  },
];

export const REPORT_STATES = {
  IDLE: 'IDLE',
  ASKING_CLIENT: 'ASKING_CLIENT',
  ASKING_OUTCOME: 'ASKING_OUTCOME',
  ASKING_NEXT_STEPS: 'ASKING_NEXT_STEPS',
  ASKING_SALES_REPS: 'ASKING_SALES_REPS',
  COMPLETED: 'COMPLETED',
};

const MEETING_KEYWORDS = [
  'meeting',
  'next meeting',
  'upcoming meeting',
  'what is my next meeting',
  'my next meeting',
  'when is my meeting',
  'schedule',
  'calendar',
  'appointment',
  'when is',
  'what time',
];

const REPORT_KEYWORDS = [
  'log a report',
  'log report',
  'create report',
  'meeting report',
  'log meeting',
  'i want to log',
];

const normalize = (text) => text.toLowerCase();

export function isAskingAboutMeetings(userMessage) {
  const normalized = normalize(userMessage);
  return MEETING_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isLoggingReport(userMessage) {
  const normalized = normalize(userMessage);
  return REPORT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function getNextMeeting() {
  const sorted = [...MEETINGS].sort((a, b) => {
    const timeA = Number.parseInt(a.time.replace(':', ''), 10);
    const timeB = Number.parseInt(b.time.replace(':', ''), 10);
    return timeA - timeB;
  });

  return sorted[0];
}

export function formatMeetingResponse(meeting) {
  return `You have a meeting at ${meeting.time} with ${meeting.client} from ${meeting.company}. The topic is: ${meeting.topic}.`;
}

export function processMessage(userMessage, currentState = REPORT_STATES.IDLE, reportData = {}) {
  if (isAskingAboutMeetings(userMessage)) {
    const meeting = getNextMeeting();
    return {
      response: formatMeetingResponse(meeting),
      newState: REPORT_STATES.IDLE,
      reportData: {},
    };
  }

  if (isLoggingReport(userMessage) && currentState === REPORT_STATES.IDLE) {
    return {
      response: 'Happy to log that. Who did you meet with?',
      newState: REPORT_STATES.ASKING_CLIENT,
      reportData: {},
    };
  }

  switch (currentState) {
    case REPORT_STATES.ASKING_CLIENT:
      return {
        response: `Got it, ${userMessage}. What was the main outcome?`,
        newState: REPORT_STATES.ASKING_OUTCOME,
        reportData: { ...reportData, client: userMessage },
      };

    case REPORT_STATES.ASKING_OUTCOME:
      return {
        response: 'Great. What are the next steps?',
        newState: REPORT_STATES.ASKING_NEXT_STEPS,
        reportData: { ...reportData, outcome: userMessage },
      };

    case REPORT_STATES.ASKING_NEXT_STEPS:
      return {
        response: 'Understood. How many sales reps do they have?',
        newState: REPORT_STATES.ASKING_SALES_REPS,
        reportData: { ...reportData, nextSteps: userMessage },
      };

    case REPORT_STATES.ASKING_SALES_REPS: {
      const finalReport = { ...reportData, salesReps: userMessage };
      const summary = `
Thank you! Here's the summary of your meeting report:

**Client:** ${finalReport.client}
**Outcome:** ${finalReport.outcome}
**Next Steps:** ${finalReport.nextSteps}
**Sales Reps:** ${finalReport.salesReps}

Your report has been logged successfully!
      `.trim();

      return {
        response: summary,
        newState: REPORT_STATES.COMPLETED,
        reportData: finalReport,
      };
    }

    default:
      return {
        response:
          "I'm Donna, your meeting assistant. Ask about upcoming meetings or say 'I want to log a report' to record a meeting summary.",
        newState: REPORT_STATES.IDLE,
        reportData: {},
      };
  }
}

export function isInReportFlow(state) {
  return state !== REPORT_STATES.IDLE && state !== REPORT_STATES.COMPLETED;
}

export function getRuleBasedDonnaResponse(userMessage, currentState = REPORT_STATES.IDLE, reportData = {}) {
  return processMessage(userMessage, currentState, reportData);
}
