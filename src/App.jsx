import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import { AppProvider, useAppStore } from './store/AppStore';

const Main = () => {
    const { currentProfile } = useAppStore();
    return (
        <Layout>
            {currentProfile ? <Dashboard /> : <Auth />}
        </Layout>
    );
};

function App() {
    return (
        <AppProvider>
            <Main />
        </AppProvider>
    );
}

export default App;
