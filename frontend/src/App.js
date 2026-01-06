import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { CollaborativeProvider } from './context/CollaborativeContext';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const SupplyInventory = lazy(() => import('./components/SupplyInventory'));
const ContactDirectory = lazy(() => import('./components/ContactDirectory'));
const CalendarManagement = lazy(() => import('./components/CalendarManagement'));
const DocumentManagement = lazy(() => import('./components/DocumentManagement'));
const PhotoDocumentation = lazy(() => import('./components/PhotoDocumentation'));
const MapsViewer = lazy(() => import('./components/MapsViewer'));

const AppContent = () => {
  const { toast } = useApp();

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <div className="App min-h-screen pb-16">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/supply" element={<SupplyInventory />} />
          <Route path="/contact" element={<ContactDirectory />} />
          <Route path="/schedule" element={<CalendarManagement />} />
          <Route path="/documents" element={<DocumentManagement />} />
          <Route path="/photos" element={<PhotoDocumentation />} />
          <Route path="/maps" element={<MapsViewer />} />
        </Routes>
      </Suspense>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <AppProvider>
            <CollaborativeProvider>
              <AppContent />
            </CollaborativeProvider>
          </AppProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
