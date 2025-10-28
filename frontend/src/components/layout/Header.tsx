export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-primary-600">Iger</h1>
        </div>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Sistema de Gestión Escolar</span>
        </nav>
      </div>
    </header>
  );
}



