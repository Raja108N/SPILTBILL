
const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-0 md:p-6 lg:p-8">
            <div className="w-full max-w-[1200px] h-full md:h-[90vh] flex flex-col relative">
                {/* Background Blobs for Premium Feel */}
                <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

                <main className="flex-1 w-full h-full z-10 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
