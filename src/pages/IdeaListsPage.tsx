import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListChecks, Loader2, Clock, User } from 'lucide-react';
import { fetchIdeaLists } from '../lib/supabase';
import { IdeaList } from '../types';
import Header from '../components/Header';
import ShareButton from '../components/ShareButton';

const IdeaListsPage = () => {
  const [lists, setLists] = useState<IdeaList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIdeaLists().then((data) => {
      setLists(data.filter((l) => !l.archived));
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Ide-lister</h2>
          <Link
            to="/list/create"
            className="flex items-center gap-1.5 px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ny ide-liste
          </Link>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Saml dine yndlingsaktiviteter i lister — perfekt til at planlægge en hel dag med teambuilding.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-battle-orange animate-spin" />
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Ingen ide-lister endnu — opret den første!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-battle-grey rounded-xl border border-white/10 hover:border-battle-orange/30 transition-all p-5"
              >
                <Link to={`/list/${list.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <ListChecks className="w-5 h-5 text-battle-orange flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-white font-semibold">{list.title}</h3>
                      {list.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {list.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {list.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(list.createdAt).toLocaleDateString('da-DK')}
                    </span>
                    <span>{list.activityIds.length} aktiviteter</span>
                  </div>
                  <ShareButton path={`/list/${list.id}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaListsPage;
