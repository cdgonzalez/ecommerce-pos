import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
        element: <ProtectedRoute />, // Requiere AuthStore.isAuthenticated
        children: [
          { path: 'checkout', element: <CheckoutPage /> } // <--- AGREGADO
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
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { path: 'admin/users', element: <UsersList /> },
      { path: 'admin/inventory', element: <InventoryList /> },
      { path: 'admin/customers', element: <CustomersList /> }
    ]
  }
]);

export const AppRouter = () => <RouterProvider router={router} />;