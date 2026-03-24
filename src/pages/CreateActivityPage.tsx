import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createActivity } from '../lib/supabase';
import Header from '../components/Header';
import ActivityForm from '../components/ActivityForm';

const CreateActivityPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbage
        </Link>

        <h2 className="text-2xl font-bold text-white mb-6">Opret ny aktivitet</h2>

        <ActivityForm
          submitLabel="Opret aktivitet"
          onSubmit={async (data) => {
            const result = await createActivity(data);
            if (result.success) navigate('/');
            return result;
          }}
        />
      </div>
    </div>
  );
};

export default CreateActivityPage;
