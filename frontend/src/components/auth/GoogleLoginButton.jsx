import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../ui/Toast';

const redirectFor = (role) => {
  if (role === 'OWNER') return '/owner';
  if (role === 'ADMIN') return '/admin';
  return '/';
};

export default function GoogleLoginButton({ role = 'RENTER' }) {
  const { theme } = useTheme();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const buttonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Identity Services SDK.');
      toast.error('Không thể tải thư viện đăng nhập bằng Google. Vui lòng thử lại sau.');
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script if desired, though usually kept for single-page apps
    };
  }, [toast]);

  const handleCredentialResponse = async (response) => {
    try {
      const me = await loginWithGoogle(response.credential, role);
      toast.success('Đăng nhập Google thành công!');
      
      setTimeout(() => {
        const dest = location.state?.from || redirectFor(me?.role);
        navigate(dest, { replace: true });
      }, 500);
    } catch (err) {
      console.error('Google sign-in error:', err);
      toast.error(err?.displayMessage || 'Đăng nhập bằng Google thất bại.');
    }
  };

  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not configured in environment variables.');
      return;
    }

    try {
      // Initialize Google accounts ID library
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      // Render the button
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    } catch (error) {
      console.error('Error rendering Google Sign-In button:', error);
    }
  }, [scriptLoaded, theme, role]);

  return (
    <div className="w-full flex justify-center">
      <div 
        ref={buttonRef} 
        id="google-signin-button" 
        className="w-full min-h-[44px] overflow-hidden rounded-xl"
      ></div>
    </div>
  );
}
