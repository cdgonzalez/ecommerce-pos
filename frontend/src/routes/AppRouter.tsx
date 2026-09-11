import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import Login from '../features/auth/Login';
import ProtectedRoute from './ProtectedRoute';

// Componente temporal para validar acceso protegido
const Dashboard = () => <div className="p-8 text-xl font-bold">Secure Dashboard Area</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
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
      { path: 'dashboard', element: <Dashboard /> }
    ]
  }
]);

export const AppRouter = () => <RouterProvider router={router} />;