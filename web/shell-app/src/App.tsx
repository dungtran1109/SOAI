import Layout from './components/suppliers/Layout';
import HomePage from './pages/HomePage';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path={'/'} element={<HomePage />} />;
                </Route>
            </Routes>
            <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnHover theme="colored" />
        </BrowserRouter>
    );
};

export default App;
