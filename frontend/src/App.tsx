import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { TakerInterface } from "./components/taker/TakerInterface";
import { MakerInterface } from "./components/maker/MakerInterface";
import { WalletProvider, useWallet } from "./contexts/WalletContext";

function NavBar() {
  const { isConnected, connect, address } = useWallet();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Cross-Chain Atomics
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-4">
              <Link
                to="/request"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Request Quote
              </Link>
              <Link
                to="/provide"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Provide Liquidity
              </Link>
            </div>
            {!isConnected ? (
              <button
                onClick={connect}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppRoutes() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Routes>
        <Route path="/" element={<Navigate to="/request" replace />} />
        <Route path="/request" element={<TakerInterface />} />
        <Route path="/provide" element={<MakerInterface />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <AppRoutes />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
