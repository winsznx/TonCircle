import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { GroupProvider } from './contexts/GroupContext';
import { tonConnectOptions } from './services/tonConnect';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Groups } from './pages/Groups';
import { Expenses } from './pages/Expenses';
import { Goals } from './pages/Goals';
import { Escrow } from './pages/Escrow';
import { Profile } from './pages/Profile';

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://scarlet-secure-wren-857.mypinata.cloud/ipfs/bafkreidqnkguqjo3ns4gcfkcihcpffxyepryvjgtivdzzainontnuu72lq">
      <Router>
        <ThemeProvider>
          <GroupProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/escrow" element={<Escrow />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Layout>
          </GroupProvider>
        </ThemeProvider>
      </Router>
    </TonConnectUIProvider>
  );
}

export default App;
