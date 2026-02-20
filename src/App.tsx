import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import HomePage from './pages/HomePage';
import StateDetailsPage from './pages/StateDetailsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/aed-laws/:slug" element={<StateDetailsPage />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
