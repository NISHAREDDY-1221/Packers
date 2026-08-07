import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { RoleRoute } from './components/RoleRoute';

// Admin / Manager Pages
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

// Packing Operator Pages
import { OperatorLayout } from './modules/packing-operator/layouts/OperatorLayout';
import { Dashboard as OperatorDashboard } from './modules/packing-operator/pages/Dashboard';
import { MyJobs as OperatorJobs } from './modules/packing-operator/pages/MyJobs';
import { ActivePacking } from './modules/packing-operator/pages/ActivePacking';
import { PackingHistory } from './modules/packing-operator/pages/PackingHistory';
import { Profile as OperatorProfile } from './modules/packing-operator/pages/Profile';
import { ReportIssue as OperatorReportIssue } from './modules/packing-operator/pages/ReportIssue';
import { Notifications as OperatorNotifications } from './modules/packing-operator/pages/Notifications';

// QC Checker Pages
import { QCLayout } from './modules/qc-checker/layouts/QCLayout';
import { Dashboard as QCDashboard } from './modules/qc-checker/pages/Dashboard';
import { MyQCTasks } from './modules/qc-checker/pages/MyQCTasks';
import { ActiveQCInspection } from './modules/qc-checker/pages/ActiveQCInspection';
import { QCHistory } from './modules/qc-checker/pages/QCHistory';
import { Profile as QCProfile } from './modules/qc-checker/pages/Profile';
import { ReportIssue as QCReportIssue } from './modules/qc-checker/pages/ReportIssue';
import { Notifications as QCNotifications } from './modules/qc-checker/pages/Notifications';

// Additional details pages for operator/qc if needed (can be ported or reused from staff for now, but not requested. Leaving them out or using the ones from staff if they exist... Wait, the prompt says "Do not change the existing UI, routes, behaviour, or business flow." Let's keep `TaskExecution` and `PackingHistoryDetails` if they were part of it. Wait, I didn't port them. Let me port them as well since they were in `/staff`)
import { TaskExecution } from './pages/staff/TaskExecution';
import { PackingHistoryDetails } from './pages/staff/PackingHistoryDetails';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <RoleRoute allowedRoles={['ADMIN', 'MANAGER']}>
        <AppLayout />
      </RoleRoute>
    ),
    children: [
      { path: '', element: <Dashboard /> },
      { path: 'master-data', element: <MasterData /> },
      { path: 'recipe-bom', element: <RecipeBOM /> },
      { path: 'work-orders', element: <WorkOrders /> },
      { path: 'material-issue', element: <MaterialIssue /> },
      { path: 'material-issue/:id', element: <MaterialIssueDetails /> },
      { path: 'packing-execution', element: <PackingExecution /> },
      { path: 'packing-execution/:id', element: <PackingExecutionDetails /> },
      { path: 'barcodes-labels', element: <BarcodesLabels /> },
      { path: 'quality-check', element: <QualityCheck /> },
      { path: 'finished-goods', element: <FinishedGoods /> },
      { path: 'repacking', element: <Repacking /> },
      { path: 'approvals', element: <Approvals /> },
      { path: 'reports', element: <Reports /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '/operator',
    element: (
      <RoleRoute allowedRoles={['OPERATOR', 'ADMIN', 'MANAGER']}>
        <OperatorLayout />
      </RoleRoute>
    ),
    children: [
      { path: 'dashboard', element: <OperatorDashboard /> },
      { path: 'jobs', element: <OperatorJobs /> },
      { path: 'jobs/:id', element: <TaskExecution /> },
      { path: 'history', element: <PackingHistory /> },
      { path: 'history/:id', element: <PackingHistoryDetails /> },
      { path: 'active-packing', element: <ActivePacking /> },
      { path: 'notifications', element: <OperatorNotifications /> },
      { path: 'profile', element: <OperatorProfile /> },
      { path: 'report-issue', element: <OperatorReportIssue /> },
    ],
  },
  {
    path: '/qc',
    element: (
      <RoleRoute allowedRoles={['QC', 'QC_INSPECTOR', 'QC_CHECKER', 'ADMIN', 'MANAGER']}>
        <QCLayout />
      </RoleRoute>
    ),
    children: [
      { path: 'dashboard', element: <QCDashboard /> },
      { path: 'tasks', element: <MyQCTasks /> },
      { path: 'tasks/:id', element: <TaskExecution /> },
      { path: 'history', element: <QCHistory /> },
      { path: 'history/:id', element: <PackingHistoryDetails /> },
      { path: 'active-inspection', element: <ActiveQCInspection /> },
      { path: 'notifications', element: <QCNotifications /> },
      { path: 'profile', element: <QCProfile /> },
      { path: 'report-issue', element: <QCReportIssue /> },
    ],
  },

], {
  future: {
    // @ts-ignore
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

import { Toaster } from 'react-hot-toast';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Toaster 
            position="top-center" 
            toastOptions={{
              className: 'text-sm font-semibold rounded-xl border border-gray-200 shadow-xl',
              duration: 3000,
              success: {
                iconTheme: {
                  primary: '#00891D',
                  secondary: '#fff',
                },
                style: {
                  border: '1px solid #c8e6c9',
                  background: '#e8f5ea',
                  color: '#005212',
                },
              },
              error: {
                style: {
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#991b1b',
                },
              }
            }}
          />
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
