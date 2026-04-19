import { Link, useLocation } from 'react-router-dom';
import { Building2, Lightbulb, Plus, Sparkles } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const isInspiration = location.pathname === '/inspiration';
  const isAgencies = location.pathname === '/agencies';

  return (
    <div className="bg-battle-dark border-b border-battle-orange/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            <h1 className="text-xl font-bold text-white">
              IDEAS <span className="text-sm font-normal text-gray-400">for Team Events</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/inspiration"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isInspiration
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Inspiration
            </Link>
            <Link
              to="/agencies"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isAgencies
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Agencies
            </Link>
            <Link
              to="/create"
              className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Idea
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
