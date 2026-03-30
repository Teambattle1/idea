import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
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
          Back
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Idea</h2>
          <Link
            to="/scrape"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 rounded-lg text-sm transition-colors"
          >
            <Globe className="w-4 h-4" />
            Scrape
            <span className="text-[10px] text-purple-400 opacity-70">Scan site for ideas</span>
          </Link>
        </div>

        <ActivityForm
          submitLabel="Create Idea"
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
