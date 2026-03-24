import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  ListChecks,
} from 'lucide-react';
import { fetchIdeaList, fetchActivities, deleteIdeaList } from '../lib/supabase';
import { IdeaList, Activity } from '../types';
import Header from '../components/Header';
import ActivityCard from '../components/ActivityCard';
import ShareButton from '../components/ShareButton';

const IdeaListDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<IdeaList | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (listId: string) => {
    setIsLoading(true);
    const [listData, allActivities] = await Promise.all([
      fetchIdeaList(listId),
      fetchActivities(),
    ]);
    setList(listData);
    if (listData) {
      const ordered = listData.activityIds
        .map((aid) => allActivities.find((a) => a.id === aid))
        .filter((a): a is Activity => !!a);
      setActivities(ordered);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await deleteIdeaList(id);
    if (result.success) navigate('/lists');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-battle-black">
        <Header />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-battle-orange animate-spin" />
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-battle-black">
        <Header />
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">Ide-liste ikke fundet</p>
          <Link to="/lists" className="text-battle-orange hover:underline">
            Tilbage til ide-lister
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/lists"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle ide-lister
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton path={`/list/${list.id}`} />
            <Link
              to={`/list/edit/${list.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Rediger
            </Link>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Bekræft slet
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-white/10 text-gray-300 rounded-lg text-sm"
                >
                  Annuller
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ListChecks className="w-6 h-6 text-battle-orange" />
            <h1 className="text-2xl font-bold text-white">{list.title}</h1>
          </div>
          {list.description && (
            <p className="text-gray-400 ml-9">{list.description}</p>
          )}
          <p className="text-xs text-gray-600 ml-9 mt-2">
            af {list.author} · {activities.length} aktiviteter
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Denne liste har ingen aktiviteter endnu
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative">
                <span className="absolute -top-2 -left-2 z-10 w-7 h-7 bg-battle-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaListDetailPage;
