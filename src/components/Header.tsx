import { Link } from 'react-router-dom';
import { Lightbulb, Plus } from 'lucide-react';

const Header = () => {
  return (
    <div className="bg-battle-dark border-b border-battle-orange/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-yellow-400" />
            <h1 className="text-xl font-bold text-white">
              IDEAS <span className="text-sm font-normal text-gray-400">Team Building Idea Bank</span>
            </h1>
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
  );
};

export default Header;
