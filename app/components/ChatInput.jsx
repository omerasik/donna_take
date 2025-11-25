import { useState } from 'react';

const quickReplies = [
  { label: 'Next meeting', text: "What's my next meeting?" },
  { label: 'Log a report', text: 'I want to log a report' },
];

export default function ChatInput({ onSend, disabled = false }) {
  const [value, setValue] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit(event);
    }
  };

  const handleQuickReply = (text) => {
    if (disabled) return;
    onSend(text);
  };

  return (
    <form onSubmit={submit} className="chat-input">
      <fieldset aria-label="Quick replies">
        <legend>Quick replies</legend>
        <div className="quick-actions">
          {quickReplies.map((item) => (
            <button
              key={item.text}
              type="button"
              className="secondary"
              onClick={() => handleQuickReply(item.text)}
              disabled={disabled}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="input-row">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled ? 'Donna is responding...' : 'Ask Donna about your meetings'
          }
          disabled={disabled}
          aria-label="Type a message for Donna"
        />
        <button type="submit" className="contrast" disabled={disabled || !value.trim()}>
          Send
        </button>
      </div>
    </form>
  );
}
