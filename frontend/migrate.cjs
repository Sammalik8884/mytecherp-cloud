const fs = require('fs');
const file = 'd:/mytecherp/MytechERP/frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');
const routesMatch = content.match(/<Routes>([\s\S]*?)<\/Routes>/);
if (routesMatch) {
    const newRouter = `const router = createBrowserRouter(
    createRoutesFromElements(
        <Route>
${routesMatch[1]}        </Route>
    )
);

function App() {
    return (
        <AuthProvider>
            <SyncProvider>
                <NotificationProvider>
                    <RouterProvider router={router} />
                    <SyncStatusWidget />
                    <Toaster position="top-right" toastOptions={{
                        className: 'bg-secondary/90 text-foreground border border-border backdrop-blur',
                    }} />
                </NotificationProvider>
            </SyncProvider>
        </AuthProvider>
    );
}

export default App;`;
    content = content.replace(/function App\(\) \{[\s\S]*export default App;/m, newRouter);
    fs.writeFileSync(file, content);
    console.log('success');
} else {
    console.log('no match');
}
