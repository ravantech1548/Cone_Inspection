import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import ReferencesPage from './pages/ReferencesPage.jsx';
import InspectionPage from './pages/InspectionPage.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/inspection" replace />} />
            <Route path="/inspection" element={<InspectionPage />} />
            <Route path="/gallery/:batchId" element={<GalleryPage />} />
            <Route path="/image/:imageId" element={<DetailPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/references" element={<ProtectedRoute roles={['admin']}><ReferencesPage /></ProtectedRoute>} />
            <Route path="/upload" element={<Navigate to="/inspection" replace />} />
            <Route path="/admin" element={<Navigate to="/inspection" replace />} />
            <Route path="*" element={<Navigate to="/inspection" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
