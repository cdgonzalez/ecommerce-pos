import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      { 
        index: true, 
        element: <Home /> 
      },
      // Iteraciones futuras:
      // { path: 'products/:id', element: <ProductDetail /> },
      // { path: 'cart', element: <Cart /> }
    ],
  },
  // Iteraciones futuras (Rutas administrativas y POS):
  // {
  //   path: '/admin',
  //   element: <AdminLayout />,
  //   children: [...]
  // }
]);

export const AppRouter = () => <RouterProvider router={router} />;