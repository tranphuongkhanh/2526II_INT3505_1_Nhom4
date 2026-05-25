import { Outlet } from 'react-router-dom';

export function ChatLayout() {
  return (
    <div className="h-screen w-screen bg-base text-primary overflow-hidden">
      <Outlet />
    </div>
  );
}

export default ChatLayout;
