import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchActivity, updateActivity } from '../lib/supabase';
import { Activity } from '../types';
import Header from '../components/Header';
import ActivityForm from '../components/ActivityForm';

const EditActivityPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchActivity(id).then((data) => {
        setActivity(data);
        setIsLoading(false);
      });
    }
  }, [id]);

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

  if (!activity || !id) {
    return (
      <div className="min-h-screen bg-battle-black">
        <Header />
        <div className="text-center py-20 text-gray-500">Aktivitet ikke fundet</div>
      </div>
    );
  }

  const { id: _id, createdAt: _ca, archived: _ar, ...initial } = activity;

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          to={`/activity/${id}`}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbage til aktivitet
        </Link>

        <h2 className="text-2xl font-bold text-white mb-6">Rediger aktivitet</h2>

        <ActivityForm
          initial={initial}
          submitLabel="Gem ændringer"
          onSubmit={async (data) => {
            const result = await updateActivity(id, data);
            if (result.success) navigate(`/activity/${id}`);
            return result;
          }}
        />
      </div>
    </div>
  );
};

export default EditActivityPage;
