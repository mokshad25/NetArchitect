import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Landing from './pages/Landing.jsx';
import NotFound from './pages/NotFound.jsx';

// The designer (and vis-network) and the docs load on demand.
const DesignerPage = lazy(() => import('./pages/DesignerPage.jsx'));
const DocsPage = lazy(() => import('./pages/DocsPage.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="app" element={<DesignerPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
