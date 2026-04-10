import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import CategoryList from './pages/categories/CategoryList';
import SupplierList from './pages/suppliers/SupplierList';
import SupplierForm from './pages/suppliers/SupplierForm';
import WarehouseList from './pages/warehouses/WarehouseList';
import StockIOList from './pages/stock-io/StockIOList';
import StockIOForm from './pages/stock-io/StockIOForm';
import InventoryList from './pages/inventory/InventoryList';
import InventoryAlerts from './pages/inventory/InventoryAlerts';
import UserList from './pages/users/UserList';
import RoleList from './pages/roles/RoleList';

interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<CategoryList />} />
        <Route path="suppliers" element={<SupplierList />} />
        <Route path="suppliers/new" element={<SupplierForm />} />
        <Route path="suppliers/:id" element={<SupplierForm />} />
        <Route path="warehouses" element={<WarehouseList />} />
        <Route path="stock-io" element={<StockIOList />} />
        <Route path="stock-io/new" element={<StockIOForm />} />
        <Route path="stock-io/:id" element={<StockIOForm />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/alerts" element={<InventoryAlerts />} />
        <Route path="users" element={<UserList />} />
        <Route path="roles" element={<RoleList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}