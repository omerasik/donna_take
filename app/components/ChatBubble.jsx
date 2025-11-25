export default function ChatBubble({
  message,
  sender,
  timestamp,
  isStreaming = false,
}) {
  const isDonna = sender === 'donna';
  const lines = (message ?? '').split('\n');

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const renderLine = (line) => {
    const isBoldLine = line.startsWith('**') && line.endsWith('**');
    if (isBoldLine) {
      return <strong>{line.slice(2, -2)}</strong>;
    }
    return line;
  };

  return (
    <article
      role="article"
      className={`chat-bubble ${isDonna ? 'donna secondary' : 'user contrast'}`}
    >
      <header>
        <strong>{isDonna ? 'Donna' : 'You'}</strong>
        {formattedTime ? <span>{formattedTime}</span> : null}
      </header>
      <div>
        {lines.map((line, index) => (
          <p key={`${line}-${index}`}>{renderLine(line)}</p>
        ))}
        {isStreaming && (
          <span className="typing-indicator" aria-live="polite">
            <span />
            <span />
            <span />
          </span>
        )}
      </div>
    </article>
  );
}
