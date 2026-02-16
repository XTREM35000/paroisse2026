/\*\*

- Routes pour le module Dons refactorisé
- À ajouter dans votre fichier de routage principal (App.tsx)
  \*/

// Routes à ajouter:
const donationRoutes = [
{
path: '/donate',
component: 'Donate',
lazy: () => import('@/pages/Donate').then(m => ({ default: m.default })),
},
{
path: '/donation/success/:donationId',
component: 'DonationSuccess',
lazy: () => import('@/pages/DonationSuccess').then(m => ({ default: m.default })),
},
{
path: '/donation/pending/:donationId',
component: 'DonationPending', // À implémenter
lazy: () => import('@/pages/DonationPending').then(m => ({ default: m.default })),
},
{
path: '/donation/checkout/:donationId',
component: 'DonationCheckout', // À implémenter (Stripe)
lazy: () => import('@/pages/DonationCheckout').then(m => ({ default: m.default })),
},
];

// Exemple intégration dans App.tsx avec React Router v6:
/\*
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Donate from '@/pages/Donate';
import DonationSuccess from '@/pages/DonationSuccess';

const App = () => {
return (
<Router>
<Routes>
{/_ ... autres routes _/}
<Route path="/donate" element={<Donate />} />
<Route path="/donation/success/:donationId" element={<DonationSuccess />} />
{/_ Autres routes donation _/}
</Routes>
</Router>
);
};
\*/
