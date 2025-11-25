import { useEffect, useRef, useState } from 'react';
import { useFetcher, useLoaderData } from 'react-router';
import ChatBubble from '../components/ChatBubble.jsx';
import ChatInput from '../components/ChatInput.jsx';
import ChatLayout from '../components/ChatLayout.jsx';

export { loader } from './chat.loader.js';
export { action } from './chat.action.js';

export default function Chat() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();

  const [messages, setMessages] = useState([]);
  const [currentState, setCurrentState] = useState('IDLE');
  const [reportData, setReportData] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const messagesEndRef = useRef(null);
  const streamAbortRef = useRef(null);

  useEffect(() => {
    if (!initialized) {
      setMessages(loaderData.messages);
      setCurrentState(loaderData.currentState);
      setReportData(loaderData.reportData);
      setIsClient(true);
      setInitialized(true);
    }
  }, [loaderData, initialized]);

  useEffect(() => {
    if (isClient) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage, isClient]);

  useEffect(() => {
    if (fetcher.data?.success && fetcher.data.payload) {
      startSSEStream(fetcher.data.payload);
    }
  }, [fetcher.data]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const pushMessage = (sender, text) => {
    const message = {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  };

  const persistReport = (report) => {
    try {
      const savedReports = localStorage.getItem('donna_reports');
      const reports = savedReports ? JSON.parse(savedReports) : [];
      reports.push({
        ...report,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('donna_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const finalizeStream = (text, finalState, finalReportData, stateReceived) => {
    setIsStreaming(false);
    pushMessage('donna', text);
    setStreamingMessage('');

    if (!stateReceived) {
      setCurrentState(finalState);
      setReportData(finalReportData);
    }

    if (finalState === 'COMPLETED' && finalReportData?.client) {
      persistReport(finalReportData);
    }
  };

  const startSSEStream = async (payload) => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
    }

    const controller = new AbortController();
    streamAbortRef.current = controller;
    setIsStreaming(true);
    setStreamingMessage('');

    const requestBody = {
      message: payload.message,
      state: payload.state,
      reportData: payload.reportData,
    };

    let accumulatedText = '';
    let stateReceived = false;
    let finalState = payload.state;
    let finalReportData = payload.reportData;
    let streamCompleted = false;

    try {
      const response = await fetch('/sse/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Unable to start streaming response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);

          if (rawEvent.startsWith('data:')) {
            const payloadString = rawEvent.slice(5).trim();

            if (payloadString) {
              try {
                const data = JSON.parse(payloadString);

                if (data.type === 'state') {
                  finalState = data.newState;
                  finalReportData = data.reportData;
                  setCurrentState(data.newState);
                  setReportData(data.reportData);
                  stateReceived = true;
                } else if (!data.done) {
                  accumulatedText += data.content;
                  setStreamingMessage(accumulatedText);
                } else if (!streamCompleted) {
                  if (data.content) {
                    accumulatedText += data.content;
                  }
                  streamCompleted = true;
                  finalizeStream(accumulatedText, finalState, finalReportData, stateReceived);
                }
              } catch (error) {
                console.error('Error parsing SSE chunk:', error);
              }
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      }

      if (!streamCompleted && accumulatedText) {
        finalizeStream(accumulatedText, finalState, finalReportData, stateReceived);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Streaming fetch error:', error);
      }
      setIsStreaming(false);
      setStreamingMessage('');
    } finally {
      streamAbortRef.current = null;
    }
  };

  const handleSendMessage = (text) => {
    pushMessage('user', text);

    const formData = new FormData();
    formData.append('message', text);
    formData.append('currentState', currentState);
    formData.append('reportData', JSON.stringify(reportData));

    fetcher.submit(formData, { method: 'post' });
  };

  const today = new Date();
  const dateLabel = today
    .toLocaleString('en-US', { month: 'short', day: '2-digit' })
    .toUpperCase();

  if (!isClient) {
    return (
      <ChatLayout>
        <section className="chat-panel">
          <div className="chat-placeholder">Loading chat...</div>
          <ChatInput onSend={() => {}} disabled />
        </section>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout>
      <section className="chat-panel">
        <div className="chat-status">
          <span className="date-pill">{dateLabel} | TODAY</span>
          <span className="live-pill">
            <span className="live-dot" />
            Live
          </span>
        </div>

        <div className="chat-thread">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              sender={message.sender}
              timestamp={message.timestamp}
            />
          ))}

          {isStreaming && streamingMessage && (
            <ChatBubble message={streamingMessage} sender="donna" isStreaming />
          )}

          {isStreaming && !streamingMessage && (
            <ChatBubble message="..." sender="donna" isStreaming />
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
      </section>
    </ChatLayout>
  );
}
