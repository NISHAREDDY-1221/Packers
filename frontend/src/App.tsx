import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { MasterData } from './pages/MasterData';
import { RecipeBOM } from './pages/RecipeBOM';
import { WorkOrders } from './pages/WorkOrders';
import { MaterialIssue } from './pages/MaterialIssue';
import { PackingExecution } from './pages/PackingExecution';
import { BarcodesLabels } from './pages/BarcodesLabels';
import { QualityCheck } from './pages/QualityCheck';
import { FinishedGoods } from './pages/FinishedGoods';
import { Repacking } from './pages/Repacking';
import { Reports } from './pages/Reports';
import { Approvals } from './pages/Approvals';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR', 'QC_CHECKER']}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'master-data',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MasterData />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recipe-bom',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <RecipeBOM />
          </ProtectedRoute>
        ),
      },
      {
        path: 'work-orders',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <WorkOrders />
          </ProtectedRoute>
        ),
      },
      {
        path: 'material-issue',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MaterialIssue />
          </ProtectedRoute>
        ),
      },
      {
        path: 'packing-execution',
        element: (
          <ProtectedRoute allowedRoles={['OPERATOR']}>
            <PackingExecution />
          </ProtectedRoute>
        ),
      },
      {
        path: 'barcodes-labels',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'QC_CHECKER', 'OPERATOR']}>
            <BarcodesLabels />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quality-check',
        element: (
          <ProtectedRoute allowedRoles={['QC_CHECKER']}>
            <QualityCheck />
          </ProtectedRoute>
        ),
      },
      {
        path: 'finished-goods',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <FinishedGoods />
          </ProtectedRoute>
        ),
      },
      {
        path: 'repacking',
        element: (
          <ProtectedRoute allowedRoles={['OPERATOR']}>
            <Repacking />
          </ProtectedRoute>
        ),
      },
      {
        path: 'approvals',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Approvals />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Reports />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

