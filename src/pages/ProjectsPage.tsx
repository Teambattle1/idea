import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import {
  ArrowLeft,
  Plus,
  Loader2,
  X,
  Trash2,
  Pencil,
  ExternalLink,
  Calendar,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import Header from '../components/Header';
import {
  createCustomProject,
  createProjectIdea,
  deleteCustomProject,
  deleteProjectIdea,
  fetchCustomProjects,
  fetchProjectIdeas,
  updateProjectIdea,
} from '../lib/supabase';
import {
  CUSTOM_PROJECT_COLORS,
  CUSTOM_PROJECT_ICONS,
  CustomProject,
  GAME_PROJECTS,
  GameProject,
  ProjectIdea,
  ProjectIdeaSection,
} from '../types';

type AnyProject = GameProject | (CustomProject & { __custom: true });

type IdeaDraft = {
  title: string;
  url: string;
  note: string;
  dueDate: string;
  section: ProjectIdeaSection;
};

const emptyDraft: IdeaDraft = {
  title: '',
  url: '',
  note: '',
  dueDate: '',
  section: 'improvement',
};

const TRACK_SLUG = 'teamaction';

const SECTION_LABEL: Record<ProjectIdeaSection, string> = {
  new: 'Nye Tasks',
  improvement: 'Improvement',
};

const ProjectIcon = ({
  name,
  className,
  color,
}: {
  name: string;
  className?: string;
  color?: string;
}) => {
  const Component = (Icons as any)[name] || Icons.Rocket;
  return <Component className={className} style={color ? { color } : undefined} />;
};

const ProjectsPage = () => {
  const [customProjects, setCustomProjects] = useState<CustomProject[]>([]);
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectIcon, setNewProjectIcon] = useState(CUSTOM_PROJECT_ICONS[0]);
  const [newProjectColor, setNewProjectColor] = useState(CUSTOM_PROJECT_COLORS[0]);
  const [savingProject, setSavingProject] = useState(false);

  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ProjectIdea | null>(null);
  const [draft, setDraft] = useState<IdeaDraft>(emptyDraft);
  const [savingIdea, setSavingIdea] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<ProjectIdeaSection | null>(null);
  const [newCollapsed, setNewCollapsed] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cp, pi] = await Promise.all([fetchCustomProjects(), fetchProjectIdeas()]);
    setCustomProjects(cp);
    setIdeas(pi);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const allProjects: AnyProject[] = useMemo(() => {
    const custom = customProjects.map((c) => ({ ...c, __custom: true as const }));
    return [...GAME_PROJECTS, ...custom];
  }, [customProjects]);

  const countsBySlug = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of ideas) m.set(i.projectSlug, (m.get(i.projectSlug) || 0) + 1);
    return m;
  }, [ideas]);

  const activeProject = activeSlug
    ? allProjects.find((p) =>
        '__custom' in p ? (p as any).slug === activeSlug : p.slug === activeSlug,
      )
    : null;

  const activeIdeas = activeSlug ? ideas.filter((i) => i.projectSlug === activeSlug) : [];

  const openIdeaForm = (idea?: ProjectIdea, section: ProjectIdeaSection = 'improvement') => {
    if (idea) {
      setEditingIdea(idea);
      setDraft({
        title: idea.title,
        url: idea.url,
        note: idea.note,
        dueDate: idea.dueDate || '',
        section: idea.section,
      });
    } else {
      setEditingIdea(null);
      setDraft({ ...emptyDraft, section });
    }
    setShowIdeaForm(true);
  };

  const closeIdeaForm = () => {
    setShowIdeaForm(false);
    setEditingIdea(null);
    setDraft(emptyDraft);
  };

  const saveIdea = async () => {
    if (!activeSlug || !draft.title.trim()) return;
    setSavingIdea(true);
    const payload = {
      projectSlug: activeSlug,
      title: draft.title.trim(),
      url: draft.url.trim(),
      note: draft.note.trim(),
      section: draft.section,
      dueDate: draft.dueDate || null,
    };
    const result = editingIdea
      ? await updateProjectIdea(editingIdea.id, payload)
      : await createProjectIdea(payload);
    setSavingIdea(false);
    if (result.success) {
      closeIdeaForm();
      await load();
    }
  };

  // Sætter et kort til en specifik sektion (bruges af både knap og drag-and-drop).
  const setIdeaSection = async (idea: ProjectIdea, target: ProjectIdeaSection) => {
    if (idea.section === target) return;
    setIdeas((prev) => prev.map((x) => (x.id === idea.id ? { ...x, section: target } : x)));
    const result = await updateProjectIdea(idea.id, {
      projectSlug: idea.projectSlug,
      title: idea.title,
      url: idea.url,
      note: idea.note,
      section: target,
      dueDate: idea.dueDate,
    });
    if (!result.success) await load();
  };

  // Flytter et kort mellem "Nye Tasks" og "Improvement" uden at åbne formularen.
  const moveIdeaSection = (idea: ProjectIdea) =>
    setIdeaSection(idea, idea.section === 'new' ? 'improvement' : 'new');

  const handleDeleteIdea = async (i: ProjectIdea) => {
    if (!confirm(`Slet idé "${i.title}"?`)) return;
    const { success } = await deleteProjectIdea(i.id);
    if (success) setIdeas((prev) => prev.filter((x) => x.id !== i.id));
  };

  const saveNewProject = async () => {
    if (!newProjectName.trim()) return;
    setSavingProject(true);
    const slug = `custom-${Date.now().toString(36)}`;
    const result = await createCustomProject({
      slug,
      name: newProjectName.trim(),
      icon: newProjectIcon,
      color: newProjectColor,
    });
    setSavingProject(false);
    if (result.success) {
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectIcon(CUSTOM_PROJECT_ICONS[0]);
      setNewProjectColor(CUSTOM_PROJECT_COLORS[0]);
      await load();
    }
  };

  const handleDeleteProject = async (p: CustomProject) => {
    const n = countsBySlug.get(p.slug) || 0;
    if (
      !confirm(
        n > 0
          ? `Slet projekt "${p.name}"? Det har ${n} idé(er) som også slettes.`
          : `Slet projekt "${p.name}"?`,
      )
    )
      return;
    // Delete associated ideas first
    for (const i of ideas.filter((x) => x.projectSlug === p.slug)) {
      await deleteProjectIdea(i.id);
    }
    await deleteCustomProject(p.id);
    await load();
  };

  // Project list view
  if (!activeSlug) {
    return (
      <div className="min-h-screen bg-battle-black">
        <Header />

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Icons.FolderKanban className="w-6 h-6 text-battle-orange" />
                Projekter
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {loading
                  ? 'Indlæser…'
                  : `${allProjects.length} projekter · ${ideas.length} idéer i alt`}
              </p>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nyt projekt
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {allProjects.map((p) => {
                const isCustom = '__custom' in p;
                const slug = isCustom ? (p as any).slug : p.slug;
                const count = countsBySlug.get(slug) || 0;
                return (
                  <button
                    key={slug}
                    onClick={() => setActiveSlug(slug)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center relative shadow-lg group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: p.color }}
                    >
                      <ProjectIcon name={p.icon} className="w-9 h-9 text-white" />
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full bg-battle-orange text-white text-xs font-bold flex items-center justify-center border-2 border-battle-black">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white text-center line-clamp-2 uppercase tracking-wider">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {showNewProject && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-battle-dark border border-white/10 rounded-xl w-full max-w-md mt-10 shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Nyt projekt</h3>
                <button
                  onClick={() => setShowNewProject(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                    Navn
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Ikon
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {CUSTOM_PROJECT_ICONS.map((name) => (
                      <button
                        key={name}
                        onClick={() => setNewProjectIcon(name)}
                        className={`aspect-square rounded-lg border flex items-center justify-center ${
                          newProjectIcon === name
                            ? 'border-battle-orange bg-battle-orange/20'
                            : 'border-white/10 bg-battle-grey hover:border-white/30'
                        }`}
                      >
                        <ProjectIcon name={name} className="w-5 h-5 text-white" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Farve
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CUSTOM_PROJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewProjectColor(c)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newProjectColor === c ? 'border-white' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: newProjectColor }}
                  >
                    <ProjectIcon name={newProjectIcon} className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-sm text-gray-400">Forhåndsvisning</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5"
                >
                  Annullér
                </button>
                <button
                  onClick={saveNewProject}
                  disabled={savingProject || !newProjectName.trim()}
                  className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
                >
                  {savingProject && <Loader2 className="w-4 h-4 animate-spin" />}
                  Opret
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Project detail view
  const project = activeProject as AnyProject;
  const isCustom = project && '__custom' in project;
  const isTrack = project?.slug === TRACK_SLUG;

  const renderIdeaCard = (i: ProjectIdea) => (
    <div
      key={i.id}
      draggable={isTrack}
      onDragStart={(e) => {
        if (!isTrack) return;
        e.dataTransfer.setData('text/plain', i.id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingId(i.id);
      }}
      onDragEnd={() => {
        setDraggingId(null);
        setDragOverSection(null);
      }}
      className={`group bg-battle-grey/30 border border-white/10 rounded-xl p-4 hover:bg-battle-grey/50 transition-opacity ${
        isTrack ? 'cursor-grab active:cursor-grabbing select-none' : ''
      } ${draggingId === i.id ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isTrack ? (
            <div className="flex items-baseline gap-3 flex-wrap">
              <h3 className="text-white font-semibold whitespace-pre-wrap">{i.title}</h3>
              {i.note && (
                <p className="text-sm text-gray-400 whitespace-pre-wrap flex-1 min-w-0">
                  {i.note}
                </p>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-white font-semibold whitespace-pre-wrap">{i.title}</h3>
              {i.note && (
                <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{i.note}</p>
              )}
            </>
          )}
          {(i.url || i.dueDate) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {i.url && (
                <a
                  href={i.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-battle-orange hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Link
                </a>
              )}
              {i.dueDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(i.dueDate).toLocaleDateString('da-DK')}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isTrack && (
            <button
              onClick={() => moveIdeaSection(i)}
              className="p-2 rounded-lg text-gray-400 hover:text-battle-orange hover:bg-white/10"
              title={
                i.section === 'new'
                  ? 'Flyt til Improvement'
                  : 'Flyt til Nye Tasks'
              }
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => openIdeaForm(i)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
            title="Rediger"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteIdea(i)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            title="Slet"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderTrackSection = (section: ProjectIdeaSection) => {
    const items = activeIdeas.filter((i) => i.section === section);
    const addLabel = section === 'new' ? 'Ny task' : 'Ny improvement';
    const emptyLabel =
      section === 'new'
        ? 'Ingen nye tasks endnu. Klik "Ny task" for at tilføje en note.'
        : 'Ingen improvements endnu. Klik "Ny improvement" for at komme i gang.';
    const isDragOver = dragOverSection === section;
    const draggedIdea = draggingId ? ideas.find((x) => x.id === draggingId) : null;
    const willAcceptDrop = !!draggedIdea && draggedIdea.section !== section;
    const collapsible = section === 'new';
    const collapsed = collapsible && newCollapsed;

    const handleDragOver = (e: React.DragEvent) => {
      if (!draggingId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverSection !== section) setDragOverSection(section);
    };
    const handleDragLeave = (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setDragOverSection(null);
      }
    };
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const idea = ideas.find((x) => x.id === id);
      if (idea) {
        setIdeaSection(idea, section);
        if (collapsible) setNewCollapsed(false);
      }
      setDragOverSection(null);
      setDraggingId(null);
    };

    return (
      <div className="mb-8">
        <div
          onDragOver={collapsed ? handleDragOver : undefined}
          onDragLeave={collapsed ? handleDragLeave : undefined}
          onDrop={collapsed ? handleDrop : undefined}
          className={`flex items-center justify-between mb-3 rounded-lg transition-colors ${
            collapsed && isDragOver && willAcceptDrop
              ? 'ring-2 ring-battle-orange bg-battle-orange/5 px-2 py-1 -mx-2'
              : ''
          }`}
        >
          <button
            type="button"
            onClick={() => collapsible && setNewCollapsed((c) => !c)}
            disabled={!collapsible}
            className={`flex items-center gap-1.5 text-sm font-bold text-gray-400 uppercase tracking-wider ${
              collapsible ? 'hover:text-white' : 'cursor-default'
            }`}
          >
            {collapsible &&
              (collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              ))}
            {SECTION_LABEL[section]} · {items.length}
          </button>
          <button
            onClick={() => openIdeaForm(undefined, section)}
            className="px-3 py-1.5 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {addLabel}
          </button>
        </div>
        {!collapsed && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-xl transition-colors ${
              isDragOver && willAcceptDrop
                ? 'ring-2 ring-battle-orange bg-battle-orange/5 p-2 -m-2'
                : ''
            }`}
          >
            {items.length === 0 ? (
              <div className="text-center py-8 bg-battle-grey/50 rounded-xl border border-white/10 border-dashed">
                <p className="text-gray-500 text-xs">{emptyLabel}</p>
              </div>
            ) : (
              <div className="space-y-2">{items.map(renderIdeaCard)}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-battle-black">
      <Header />

      <div className={`${isTrack ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-4 py-6`}>
        <button
          onClick={() => setActiveSlug(null)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbage til projekter
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project?.color }}
          >
            <ProjectIcon name={project?.icon || 'Rocket'} className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white truncate uppercase tracking-wider">{project?.name}</h2>
            <p className="text-sm text-gray-400">
              {activeIdeas.length} {activeIdeas.length === 1 ? 'idé' : 'idéer'}
            </p>
          </div>
          {!isTrack && (
            <button
              onClick={() => openIdeaForm()}
              className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tilføj idé
            </button>
          )}
          {isCustom && (
            <button
              onClick={() => {
                handleDeleteProject(project as any);
                setActiveSlug(null);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              title="Slet projekt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isTrack ? (
          <>
            {renderTrackSection('improvement')}
            {renderTrackSection('new')}
          </>
        ) : activeIdeas.length === 0 ? (
          <div className="text-center py-16 bg-battle-grey/50 rounded-xl border border-white/10 border-dashed">
            <Icons.Lightbulb className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              Ingen idéer endnu. Klik "Tilføj idé" for at komme i gang.
            </p>
          </div>
        ) : (
          <div className="space-y-2">{activeIdeas.map(renderIdeaCard)}</div>
        )}
      </div>

      {showIdeaForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-battle-dark border border-white/10 rounded-xl w-full max-w-lg mt-10 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {(() => {
                  if (!isTrack) return editingIdea ? 'Rediger idé' : 'Ny idé';
                  const sec = draft.section === 'new' ? 'task' : 'improvement';
                  return editingIdea ? `Rediger ${sec}` : `Ny ${sec}`;
                })()}
              </h3>
              <button
                onClick={closeIdeaForm}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isTrack ? (
                <Field
                  label={draft.section === 'new' ? 'Ny task' : 'Improvement'}
                >
                  <textarea
                    autoFocus
                    rows={6}
                    placeholder={
                      draft.section === 'new'
                        ? 'Skriv din task idé…'
                        : 'Beskriv forbedringen…'
                    }
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none resize-y"
                  />
                </Field>
              ) : (
                <>
                  <Field label="Titel">
                    <input
                      type="text"
                      autoFocus
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                    />
                  </Field>

                  <Field label="URL">
                    <input
                      type="url"
                      placeholder="https://…"
                      value={draft.url}
                      onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                      className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                    />
                  </Field>

                  <Field label="Beskrivelse / note">
                    <textarea
                      rows={4}
                      value={draft.note}
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                      className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none resize-y"
                    />
                  </Field>

                  <Field label="Due date (valgfri)">
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                      className="w-full bg-battle-grey border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:border-battle-orange focus:outline-none"
                    />
                  </Field>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10">
              <button
                onClick={closeIdeaForm}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5"
              >
                Annullér
              </button>
              <button
                onClick={saveIdea}
                disabled={savingIdea || !draft.title.trim()}
                className="px-4 py-2 bg-battle-orange hover:bg-battle-orangeLight disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                {savingIdea && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingIdea ? 'Gem' : 'Opret'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </span>
    {children}
  </label>
);

export default ProjectsPage;
