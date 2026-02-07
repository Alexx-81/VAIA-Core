import { useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import './LoginPage.css';

export const LoginPage = () => {
  const { signIn, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const errorMessage = error || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login: handleSubmit called', { email, password: password ? '***' : '' });
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Моля, попълнете имейл и парола.');
      return;
    }

    console.log('Login: calling signIn...');
    setIsLoading(true);
    const result = await signIn(email.trim(), password);
    console.log('Login: signIn result', result);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="login-logo__vaia">VAIA</span>
            <span className="login-logo__core">Core</span>
          </div>
          <p className="login-subtitle">Вход в системата</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email" className="login-label">
              Имейл
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                clearAuthError();
              }}
              placeholder="name@example.com"
              className="login-input"
              autoFocus
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">
              Парола
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
                clearAuthError();
              }}
              placeholder="Въведете парола"
              className="login-input"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {errorMessage && (
            <div className="login-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Влизане...' : 'Вход'}
          </button>
        </form>

        <div className="login-footer">
          <p>ERP система за управление на бизнеса</p>
        </div>
      </div>
    </div>
  );
};
