import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CustomerLayout from './layouts/CustomerLayout';
import OwnerLayout from './layouts/OwnerLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// ============ PUBLIC PAGES ============
import Home from './pages/public/Home';
import Vehicles from './pages/public/Vehicles';
import VehicleDetail from './pages/public/VehicleDetail';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Unauthorized from './pages/Unauthorized';

// ============ BOOKING FLOW ============
import BookingConfirm from './pages/booking/BookingConfirm';
import BookingPayment from './pages/booking/BookingPayment';
import BookingSuccess from './pages/booking/BookingSuccess';

// ============ CUSTOMER PAGES ============
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerBookings from './pages/customer/Bookings';
import BookingDetails from './pages/customer/BookingDetails';
import CustomerKYC from './pages/customer/KYC';
import CustomerBranches from './pages/customer/Branches';
import CustomerCalendar from './pages/customer/Calendar';
import CustomerHelp from './pages/customer/Help';
import CustomerWallet from './pages/customer/Wallet';
import CustomerPayment from './pages/customer/Payment';
import CustomerPayments from './pages/customer/Payment';
import PaymentSuccess from './pages/customer/PaymentSuccess';
import PaymentFailed from './pages/customer/PaymentFailed';
import CustomerProfile from './pages/customer/Profile';


// ============ OWNER PAGES ============
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerVehicles from './pages/owner/Vehicles';
import OwnerVehicleDetails from './pages/owner/OwnerVehicleDetails';
import OwnerEarnings from './pages/owner/Earnings';
import OwnerPayouts from './pages/owner/Payouts';
import AddVehicle from './pages/owner/AddVehicle';
import EditVehicle from './pages/owner/EditVehicle';
import OwnerDocuments from './pages/owner/Documents';
import OwnerVehicleDocuments from './pages/owner/VehicleDocuments';
import OwnerBookings from './pages/owner/Bookings';
import OwnerCalendar from './pages/owner/Calendar';
import OwnerNotifications from './pages/owner/Notifications';
import OwnerSettings from './pages/owner/Settings';

// ============ ADMIN PAGES ============
import AdminDashboard from './pages/admin/Dashboard';
import AdminVehicles from './pages/admin/Vehicles';
import VehicleReview from './pages/admin/VehicleReview';
import AdminKYC from './pages/admin/KYC';
import AdminBookings from './pages/admin/Bookings';
import AdminPayments from './pages/admin/Payments';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminBranches from './pages/admin/Branches';
import BranchDetails from './pages/admin/BranchDetails';
import VehicleDocuments from './pages/admin/VehicleDocuments';
import AdminWallets from './pages/admin/Wallets';
import AdminCommissions from './pages/admin/Commissions';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDocuments from './pages/admin/AdminDocuments';
import BecomeOwner from './pages/public/BecomeOwner';
import HowItWorks from './pages/public/HowItWorks';
import About from './pages/public/About';
import RequireAuth from './components/RequireAuth';
import Notifications from './pages/Notifications';
import NotificationBell from './components/NotificationBell';

import VerifyEmail from './pages/auth/VerifyEmail';
import KYCPage from './pages/KYCPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/become-owner" element={<BecomeOwner />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/branches" element={<CustomerBranches />} />
        </Route>

        {/* ============ AUTH ROUTES ============ */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ============ BOOKING FLOW ============ */}
        <Route path="/booking/confirm" element={<BookingConfirm />} />
        <Route path="/booking/payment" element={<BookingPayment />} />
        <Route path="/booking/success" element={<BookingSuccess />} />

        {/* ============ PAYMENT CALLBACKS ============ */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/fail" element={<PaymentFailed />} />

        {/* ============ CUSTOMER ROUTES ============ */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerDashboard /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerBookings /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/bookings/:id" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><BookingDetails /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/kyc" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerKYC /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/branches" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerBranches /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerCalendar /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerWallet /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/payment/:bookingId" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerPayment /></CustomerLayout>
          </ProtectedRoute>
        } />
        // Route
        <Route path="/payments" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerPayments /></CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerHelp /></CustomerLayout>
          </ProtectedRoute>
        } />
        // Route
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout><CustomerProfile /></CustomerLayout>
          </ProtectedRoute>
        } />


        {/* ============ OWNER ROUTES ============ */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerDashboard /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/vehicles" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerVehicles /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/vehicles/new" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><AddVehicle /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/vehicles/:id" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerVehicleDetails /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/vehicles/:id/edit" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><EditVehicle /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/earnings" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerEarnings /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/payouts" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerPayouts /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/documents" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerDocuments /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/vehicle-documents" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerVehicleDocuments /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/bookings" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerBookings /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/calendar" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerCalendar /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/notifications" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerNotifications /></OwnerLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/settings" element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerLayout><OwnerSettings /></OwnerLayout>
          </ProtectedRoute>
        } />

        {/* ============ ADMIN ROUTES ============ */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/vehicles" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminVehicles /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/vehicles/:id/review" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><VehicleReview /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/vehicle-documents" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><VehicleDocuments /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/kyc" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminKYC /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/bookings" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminBookings /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminPayments /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/wallets" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminWallets /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/commissions" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminCommissions /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminUsers /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/branches" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminBranches /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/branches/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><BranchDetails /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminReports /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminAuditLogs /></AdminLayout>
          </ProtectedRoute>
        } />


        // Route
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminLayout><AdminSettings /></AdminLayout>
          </ProtectedRoute>
        } />
        // Add route
        <Route path="/admin/documents" element={
          <RequireAuth allowedRoles={['admin', 'staff']}>
            <AdminDocuments />
          </RequireAuth>
        } />
        <Route path="/notifications" element={
          <RequireAuth>
            <Notifications />
          </RequireAuth>
        } />
        
        <Route path="/kyc" element={<KYCPage />} />
      </Routes>
    </Router>
  );
}

export default App;