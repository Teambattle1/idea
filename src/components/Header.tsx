import { Link, useLocation } from 'react-router-dom';
import { Lightbulb, ListChecks, Plus } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isLists = location.pathname.startsWith('/list');

  return (
    <div className="bg-battle-dark border-b border-battle-orange/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            <h1 className="text-xl font-bold text-white">Teambuilding Idebank</h1>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isHome
                  ? 'bg-battle-orange text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Aktiviteter
            </Link>
            <Link
              to="/lists"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isLists
                  ? 'bg-battle-orange text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Ide-lister
            </Link>
            <Link
              to="/create"
              className="ml-2 px-3 py-2 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ny aktivitet
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;
