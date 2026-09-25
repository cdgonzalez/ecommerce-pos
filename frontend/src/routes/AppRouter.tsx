import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import Login from '../features/auth/Login';
import ProtectedRoute from './ProtectedRoute';
import UsersList from '../features/admin/UserLists';
import ProductDetail from '../features/products/ProductDetail';
import InventoryList from '../features/admin/InventoryList';
import CustomersList from '../features/admin/CustomersList';
import CartPage from '../features/cart/CartPage';
import CheckoutPage from '../features/checkout/CheckoutPage';
import POSLayout from '../layouts/POSLayout';
import POSPage from '../features/pos/POSPage';
import TransactionsHistory from '../features/admin/TransactionHistory';
import CustomerAccount from '../features/account/CustomerAccount';
import AdminDashboard from '../features/admin/AdminDashboard';
import ReportsView from '../features/admin/ReportsView';
import AuditLogsView from '../features/admin/AuditLogsView';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: 'products/:slug', element: <ProductDetail /> },
      { path: 'cart', element: <CartPage /> },

      // Rutas de cliente protegido (E-Commerce B2C)
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'account', element: <CustomerAccount /> }
        ]
      }
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    // Grupo de Rutas Protegidas
    path: '/admin',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UsersList /> },
      { path: 'inventory', element: <InventoryList /> },
      { path: 'customers', element: <CustomersList /> },
      { path: 'transactions', element: <TransactionsHistory /> },
      { path: 'reports', element: <ReportsView /> },
      { path: 'audit', element: <AuditLogsView /> }
    ]
  },
  // TERMINAL POS ROUTES
  {
    path: '/pos/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <POSLayout />,
        children: [
          { index: true, element: <POSPage /> },
        ]
      }
    ]
  }
]);

export const AppRouter = () => <RouterProvider router={router} />;