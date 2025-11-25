export async function action({ request }) {
  const formData = await request.formData();
  const message = (formData.get('message') || '').toString();
  const currentState = (formData.get('currentState') || 'IDLE').toString();
  const reportData = (formData.get('reportData') || '{}').toString();
  
  let parsedReportData = {};
  try {
    parsedReportData = JSON.parse(reportData);
  } catch (e) {
    console.error('Error parsing report data:', e);
  }
  
  return {
    success: true,
    payload: {
      message,
      state: currentState,
      reportData: parsedReportData
    }
  };
}
