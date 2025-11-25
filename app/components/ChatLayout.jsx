import { Link, useLocation } from 'react-router';

export default function ChatLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <header className="top-bar">
        <nav>
          <ul>
            <li>
              <div className="brand">
                <div className="brand-mark">D</div>
                <div className="brand-details">
                  <strong>Donna</strong>
                  <span>Meeting assistant</span>
                </div>
              </div>
            </li>
          </ul>
          <ul>
            <li>
              <NavLink to="/chat" active={pathname === '/chat'}>
                Chat
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" active={pathname === '/reports'}>
                Reports
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <main className="content-area">
        <div className="chat-container">{children}</div>
      </main>
    </div>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className="nav-link" aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}
