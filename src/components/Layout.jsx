
const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col items-center bg-bg relative overflow-x-hidden overflow-y-auto">
            {/* Dynamic Background Blobs for iPhone Glass Effect */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply opacity-60 animate-float" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply opacity-60 animate-float-delayed" />
            <div className="fixed top-[40%] left-[20%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[90px] pointer-events-none mix-blend-multiply opacity-50 animate-pulse-slow" />

            <div className="w-full max-w-[1200px] h-full min-h-screen flex flex-col relative z-10">
                <main className="flex-1 w-full h-full flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
