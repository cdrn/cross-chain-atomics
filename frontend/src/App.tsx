import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { TakerInterface } from "./components/taker/TakerInterface";
import { MakerInterface } from "./components/maker/MakerInterface";
import { MyQuotesInterface } from "./components/taker/MyQuotesInterface";
import { WalletProvider, useWallet } from "./contexts/WalletContext";

function NavBar() {
  const { isConnected, connect, address } = useWallet();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 animate-pulse opacity-75"></div>
                <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 3 C10 7 14 7 12 12 C 10 17 14 17 12 21" className="animate-spin-slow" style={{ transformOrigin: 'center', animationDuration: '3s' }} />
                    <path d="M3 12 C7 10 7 14 12 12 C 17 10 17 14 21 12" className="animate-spin-slow" style={{ transformOrigin: 'center', animationDuration: '3s', animationDelay: '0.5s' }} />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">Cross-Chain Atomics</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-4">
              <Link
                to="/request"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 12H4M4 12L10 6M4 12L10 18" />
                </svg>
                Request Quote
              </Link>
              <Link
                to="/provide"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v16m-8-8h16" />
                </svg>
                Provide Liquidity
              </Link>
              <Link
                to="/my-quotes"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                My Quotes
              </Link>
            </div>
            {!isConnected ? (
              <button
                onClick={connect}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 5 C10 7 14 9 12 11 C 10 13 14 15 12 17" />
                  <path d="M5 12 C7 10 9 14 11 12 C 13 10 15 14 17 12" />
                </svg>
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 shadow-sm">
                <svg className="w-4 h-4 mr-2 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 5 C10 7 14 9 12 11 C 10 13 14 15 12 17" />
                  <path d="M5 12 C7 10 9 14 11 12 C 13 10 15 14 17 12" />
                </svg>
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
        <Route path="/my-quotes" element={<MyQuotesInterface />} />
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
