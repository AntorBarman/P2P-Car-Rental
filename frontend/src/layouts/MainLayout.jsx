import { Outlet, useLocation } from 'react-router-dom';
import { Navbar, Footer, BackButton, Breadcrumbs } from '../components';

const MainLayout = () => {
  const location = useLocation();
  const { pathname } = location;

  const showBackButton = 
    pathname.includes('/vehicles/') ||
    pathname.includes('/bookings/');

  const showBreadcrumbs = 
    pathname.startsWith('/vehicles');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {showBreadcrumbs && <Breadcrumbs />}
          {showBackButton && <BackButton className="mb-4" />}
          <Outlet />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;