import React, { useState, useEffect } from 'react';
import { BrandProfile, ContentIdea, GeneratedPost } from '../types';
import { generateContentPlan, generatePostCaptionAndImagePrompt, generateImageFromPrompt, getTrendingTopicsPH } from '../services/geminiService';
import { savePost, getUserPosts } from '../services/storage';
import { Calendar as CalendarIcon, Loader2, Plus, Wand2, Image as ImageIcon, RefreshCcw, Flame, ThumbsUp, MessageCircle, Share2, MoreHorizontal, LayoutList, LayoutGrid, Save, Check } from 'lucide-react';

interface Props {
  profile: BrandProfile;
  userId: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ContentCalendar: React.FC<Props> = ({ profile, userId }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // Oct 2025 default
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedPost | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    // Load trends
    const trends = await getTrendingTopicsPH();
    setTrendingTopics(trends);
    
    // Load saved posts from DB
    const savedPosts = getUserPosts(userId);
    setPosts(savedPosts);
    
    // If no ideas and no posts, generate initial plan suggestion? 
    // For now, let user click generate.
  };

  const handleGeneratePlan = async () => {
    setLoadingPlan(true);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const newIdeas = await generateContentPlan(profile, monthName);
    setIdeas(newIdeas);
    setLoadingPlan(false);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    // Check if we already have a saved post for this day
    const existingPost = posts.find(p => {
       const d = new Date(p.date);
       return d.getDate() === day && d.getMonth() === currentDate.getMonth();
    });

    if (existingPost) {
      setGeneratedContent(existingPost);
    } else {
      // If no post but we have an idea, reset content but keep selection
      if (generatedContent && new Date(generatedContent.date).getDate() !== day) {
        setGeneratedContent(null);
      } else if (!generatedContent) {
        // null
      }
    }
  };

  const handleGeneratePost = async (idea: ContentIdea) => {
    setGeneratingPost(true);
    // Draft locally first
    try {
      const result = await generatePostCaptionAndImagePrompt(profile, idea.topic);
      const newPost: GeneratedPost = {
        id: Date.now().toString(),
        userId,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), idea.day).toISOString().split('T')[0],
        topic: idea.topic,
        caption: result.caption,
        imagePrompt: result.imagePrompt,
        viralityScore: result.viralityScore,
        viralityReason: result.viralityReason,
        status: 'Draft',
        format: idea.format
      };
      setGeneratedContent(newPost);
    } catch (e) {
      alert("Failed to generate content. Please try again.");
    } finally {
      setGeneratingPost(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedContent) return;
    setLoadingImage(true);
    const b64 = await generateImageFromPrompt(generatedContent.imagePrompt + ", high quality, professional photography style, 4k");
    if (b64) {
      setGeneratedContent({ ...generatedContent, imageUrl: b64 });
    } else {
      alert("Failed to generate image. Please try again.");
    }
    setLoadingImage(false);
  };

  const handleSavePost = () => {
    if (generatedContent) {
      savePost(generatedContent);
      setPosts(prev => {
        const idx = prev.findIndex(p => p.id === generatedContent.id);
        if (idx >= 0) {
          const newPosts = [...prev];
          newPosts[idx] = generatedContent;
          return newPosts;
        }
        return [...prev, generatedContent];
      });
      alert("Post Saved to Database!");
    }
  };

  // --- Calendar Grid Helpers ---
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendarGrid = () => {
    const totalDays = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const slots = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      slots.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border-b border-r border-slate-100" />);
    }

    // Days
    for (let day = 1; day <= totalDays; day++) {
      const idea = ideas.find(i => i.day === day);
      const post = posts.find(p => {
         const d = new Date(p.date);
         return d.getDate() === day && d.getMonth() === currentDate.getMonth();
      });
      const isSelected = selectedDay === day;

      slots.push(
        <div 
          key={day}
          onClick={() => handleDayClick(day)}
          className={`h-28 border-b border-r border-slate-100 p-2 relative cursor-pointer hover:bg-emerald-50/30 transition group ${isSelected ? 'bg-emerald-50 ring-inset ring-2 ring-emerald-500' : 'bg-white'}`}
        >
          <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>{day}</span>
          
          {post ? (
             <div className="mt-1 p-1.5 rounded-lg bg-emerald-100 border border-emerald-200 text-[10px] text-emerald-800 font-medium truncate shadow-sm">
                {post.status === 'Scheduled' && <Check className="w-3 h-3 inline mr-1"/>}
                {post.topic}
             </div>
          ) : idea ? (
            <div className="mt-1 p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-700 font-medium truncate opacity-80 group-hover:opacity-100">
               {idea.format}: {idea.title}
            </div>
          ) : null}

          {/* Add Button on Hover if Empty */}
          {!post && !idea && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Plus className="w-5 h-5 text-slate-300" />
             </div>
          )}
        </div>
      );
    }
    
    return slots;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6">
      
      {/* Top Bar: Trends & Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 text-xs font-bold uppercase tracking-wider">
               <Flame className="w-3 h-3" /> Trending Now
             </div>
             <div className="flex gap-2 overflow-x-auto max-w-lg pb-1 md:pb-0">
               {trendingTopics.map((t, i) => (
                 <span key={i} className="text-sm text-slate-600 font-medium whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-100">#{t.replace(/\s+/g, '')}</span>
               ))}
             </div>
         </div>
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
               onClick={() => setViewMode('list')}
               className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <LayoutList className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* LEFT: Calendar Grid or List */}
        <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <div className="flex items-center gap-2">
               <h2 className="text-lg font-bold text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
               <div className="flex gap-1 ml-4">
                  <button className="p-1 hover:bg-slate-200 rounded" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))}>&lt;</button>
                  <button className="p-1 hover:bg-slate-200 rounded" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))}>&gt;</button>
               </div>
             </div>
             <button 
                onClick={handleGeneratePlan}
                disabled={loadingPlan}
                className="text-xs flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 px-3 py-2 rounded-lg transition shadow-sm"
              >
                {loadingPlan ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                Auto-Plan Month
              </button>
          </div>

          {viewMode === 'grid' ? (
             <div className="flex-1 overflow-y-auto">
               <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                 {DAYS.map(d => <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>)}
               </div>
               <div className="grid grid-cols-7">
                  {renderCalendarGrid()}
               </div>
             </div>
          ) : (
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* LIST VIEW */}
                {Array.from({length: getDaysInMonth(currentDate)}, (_, i) => i + 1).map(day => {
                   const idea = ideas.find(i => i.day === day);
                   const post = posts.find(p => new Date(p.date).getDate() === day);
                   if (!idea && !post) return null; // Hide empty days in list view? Or show compact?
                   
                   return (
                     <div 
                        key={day} 
                        onClick={() => handleDayClick(day)}
                        className={`flex gap-4 p-4 rounded-xl border transition cursor-pointer ${selectedDay === day ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                     >
                        <div className="w-12 flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 h-12">
                           <span className="text-xs text-slate-500 font-bold uppercase">{currentDate.toLocaleString('default', {month:'short'})}</span>
                           <span className="text-lg font-bold text-slate-800">{day}</span>
                        </div>
                        <div className="flex-1">
                           {post ? (
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">{post.status}</span>
                                    <h4 className="font-bold text-slate-800">{post.topic}</h4>
                                 </div>
                                 <p className="text-sm text-slate-500 line-clamp-1">{post.caption}</p>
                              </div>
                           ) : (
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">Idea</span>
                                    <h4 className="font-bold text-slate-800">{idea?.title}</h4>
                                 </div>
                                 <p className="text-sm text-slate-500">{idea?.topic}</p>
                              </div>
                           )}
                        </div>
                     </div>
                   )
                })}
             </div>
          )}
        </div>

        {/* RIGHT: Editor & Preview */}
        <div className="xl:col-span-5 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-full">
          {selectedDay ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                     {currentDate.toLocaleString('default', {month:'long'})} {selectedDay}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                    {posts.find(p => new Date(p.date).getDate() === selectedDay)?.topic || ideas.find(i => i.day === selectedDay)?.title || "Create Post"}
                  </h3>
                </div>
                <button 
                  className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition shadow-md shadow-emerald-200 flex items-center gap-2"
                  onClick={() => {
                     const idea = ideas.find(i => i.day === selectedDay);
                     // If no idea exists for this random day, create a generic one
                     const fallbackIdea: ContentIdea = { day: selectedDay, title: "Custom Post", topic: "General Update", format: "Image" };
                     handleGeneratePost(idea || fallbackIdea);
                  }}
                  disabled={generatingPost}
                >
                  {generatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : (generatedContent ? <span className="flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> Rewrite</span> : <span className="flex items-center gap-1"><Wand2 className="w-3 h-3"/> AI Draft</span>)}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-0 bg-slate-100 flex flex-col items-center">
                
                {!generatedContent ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Wand2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">Ready to create?</h4>
                    <p className="text-slate-500 text-sm max-w-[250px] mt-2">
                       {ideas.find(i => i.day === selectedDay) 
                         ? `Idea: "${ideas.find(i => i.day === selectedDay)?.topic}"`
                         : "Select 'AI Draft' to generate content for this day."}
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-sm py-8 px-4">
                     {/* Virality Score */}
                     <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500"/> Virality Potential
                          </span>
                          <span className={`text-lg font-black ${
                            (generatedContent.viralityScore || 0) > 75 ? 'text-emerald-600' : 
                            (generatedContent.viralityScore || 0) > 50 ? 'text-orange-500' : 'text-slate-500'
                          }`}>
                            {generatedContent.viralityScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                               (generatedContent.viralityScore || 0) > 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-orange-300 to-orange-500'
                            }`} 
                            style={{ width: `${generatedContent.viralityScore}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 italic leading-relaxed">
                          "{generatedContent.viralityReason}"
                        </p>
                     </div>

                     {/* Phone Preview */}
                     <div className="bg-white rounded-[2rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative mx-auto">
                        <div className="h-6 bg-slate-800 w-full flex justify-between px-6 items-center">
                           <div className="w-12 h-3 bg-black rounded-full" />
                           <div className="flex gap-1">
                             <div className="w-3 h-3 bg-slate-600 rounded-full" />
                             <div className="w-3 h-3 bg-slate-600 rounded-full" />
                           </div>
                        </div>

                        <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs border border-emerald-200">
                             {profile.businessName.substring(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                             <p className="text-xs font-bold text-slate-900">{profile.businessName}</p>
                             <p className="text-[10px] text-slate-500">Sponsored • Kawayan AI</p>
                          </div>
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </div>

                        <div className="aspect-square bg-slate-100 relative group">
                          {generatedContent.imageUrl ? (
                            <img src={generatedContent.imageUrl} alt="Generated" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                               <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                               <p className="text-xs text-slate-400 mb-4 line-clamp-3">{generatedContent.imagePrompt}</p>
                               <button 
                                 onClick={handleGenerateImage}
                                 disabled={loadingImage}
                                 className="bg-slate-800 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-700 transition"
                               >
                                  {loadingImage ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                  Generate Visual
                               </button>
                            </div>
                          )}
                        </div>

                        <div className="p-3 flex justify-between items-center text-slate-700">
                          <div className="flex gap-4">
                             <ThumbsUp className="w-5 h-5" />
                             <MessageCircle className="w-5 h-5" />
                             <Share2 className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="px-3 pb-6">
                          <p className="text-sm text-slate-900 font-bold mb-1">{Math.floor(Math.random() * 500) + 10} likes</p>
                          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                             <span className="font-bold mr-1">{profile.businessName}</span>
                             {generatedContent.caption}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-2 uppercase">View all comments</p>
                        </div>
                     </div>
                     
                     <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500">
                        <p className="font-bold mb-1 uppercase text-[10px]">Image Prompt Used:</p>
                        <p className="italic opacity-70">{generatedContent.imagePrompt}</p>
                     </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-200 bg-white flex gap-3">
                 <button 
                    onClick={handleSavePost}
                    disabled={!generatedContent}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm flex items-center justify-center gap-2"
                 >
                   <Save className="w-4 h-4"/> Save Draft
                 </button>
                 <button 
                   disabled={!generatedContent}
                   className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                   onClick={() => {
                     if(generatedContent) {
                       setGeneratedContent({...generatedContent, status: 'Scheduled'});
                       handleSavePost();
                     }
                   }}
                 >
                   Schedule
                 </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 p-8 text-center bg-slate-50/50">
              <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-slate-400">No Date Selected</h3>
              <p className="text-sm max-w-xs mx-auto mt-2">Click a day on the calendar to start creating content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;
