import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import RestaurantPage from '@/pages/RestaurantPage';
import GerichtePage from '@/pages/GerichtePage';
import BestellungenPage from '@/pages/BestellungenPage';
import PublicFormRestaurant from '@/pages/public/PublicForm_Restaurant';
import PublicFormGerichte from '@/pages/public/PublicForm_Gerichte';
import PublicFormBestellungen from '@/pages/public/PublicForm_Bestellungen';
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69e742df70dfb1e5316788c9" element={<PublicFormRestaurant />} />
              <Route path="public/69e742e2cf5fc9c325cecbe7" element={<PublicFormGerichte />} />
              <Route path="public/69e742e32ffc6b123a5e9512" element={<PublicFormBestellungen />} />
              <Route element={<Layout />}>
                <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
                <Route path="restaurant" element={<RestaurantPage />} />
                <Route path="gerichte" element={<GerichtePage />} />
                <Route path="bestellungen" element={<BestellungenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
