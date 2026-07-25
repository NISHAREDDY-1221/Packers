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
import { MaterialIssueDetails } from './pages/MaterialIssueDetails';
import { PackingExecution } from './pages/PackingExecution';
import { BarcodesLabels } from './pages/BarcodesLabels';
import { QualityCheck } from './pages/QualityCheck';
import { FinishedGoods } from './pages/FinishedGoods';
import { Repacking } from './pages/Repacking';
import { Reports } from './pages/Reports';
import { Approvals } from './pages/Approvals';
import { Notifications } from './pages/Notifications';
import { PackingExecutionDetails } from './pages/PackingExecutionDetails';
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
        element: <Dashboard />,
      },
      {
        path: 'master-data',
        element: <MasterData />,
      },
      {
        path: 'recipe-bom',
        element: <RecipeBOM />,
      },
      {
        path: 'work-orders',
        element: <WorkOrders />,
      },
      {
        path: 'material-issue',
        element: <MaterialIssue />,
      },
      {
        path: 'material-issue/:id',
        element: <MaterialIssueDetails />,
      },
      {
        path: 'packing-execution',
        element: <PackingExecution />,
      },
      {
        path: 'packing-execution/:id',
        element: <PackingExecutionDetails />,
      },
      {
        path: 'barcodes-labels',
        element: <BarcodesLabels />,
      },
      {
        path: 'quality-check',
        element: <QualityCheck />,
      },
      {
        path: 'finished-goods',
        element: <FinishedGoods />,
      },
      {
        path: 'repacking',
        element: <Repacking />,
      },
      {
        path: 'approvals',
        element: <Approvals />,
      },
      {
        path: 'reports',
        element: <Reports />,
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

