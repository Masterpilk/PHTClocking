import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Kiosk from '../pages/Kiosk';
import WhoIsIn from '../pages/WhoIsIn';

const router = createBrowserRouter([
  { path: '/kiosk', element: <Kiosk /> },
  { path: '/who-is-in', element: <WhoIsIn /> },
  { path: '*', element: <Kiosk /> }
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
