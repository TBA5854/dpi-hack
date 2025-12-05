'use client';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Share2, Navigation, Bell, Check, X, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

export default function Dashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<[number, number]>([12.9716, 77.5946]); 
  const [dpi, setDpi] = useState<string | null>(null);
  const [myDpi, setMyDpi] = useState<string | null>(null);
  
  // Share/Request State
  const [activeTab, setActiveTab] = useState<'share' | 'request'>('share');
  const [targetUser, setTargetUser] = useState('');
  const [duration, setDuration] = useState('1');
  const [shareStatus, setShareStatus] = useState('');

  // Lists
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [myShares, setMyShares] = useState<any[]>([]);
  const [othersShares, setOthersShares] = useState<any[]>([]);

  useEffect(() => {
    fetchMyDpi();
    fetchLists();
    // Poll every 30s
    const interval = setInterval(fetchLists, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLists = async () => {
    fetchIncomingRequests();
    fetchMyShares();
    fetchOthersShares();
  };

  const fetchMyDpi = async () => {
    const res = await api.get('/location/my-dpi');
    if (res && res.ok) {
      const data = await res.json();
      setMyDpi(data.dpi);
      setLocation([data.latitude, data.longitude]);
      setDpi(data.dpi); 
    } else if (res && res.status === 404) {
      router.push('/onboarding');
    }
  };

  const fetchIncomingRequests = async () => {
    const res = await api.get('/share/incoming');
    if (res && res.ok) setIncomingRequests(await res.json());
  };

  const fetchMyShares = async () => {
    const res = await api.get('/share/active-sent');
    if (res && res.ok) setMyShares(await res.json());
  };

  const fetchOthersShares = async () => {
    const res = await api.get('/share/active-received');
    if (res && res.ok) setOthersShares(await res.json());
  };

  const handleSearch = async () => {
    if (searchQuery.includes('-')) {
        const res = await api.get(`/location/resolve/${searchQuery}`);
        if (res && res.ok) {
            const data = await res.json();
            setLocation([data.lat, data.long]);
            setDpi(searchQuery);
            return;
        }
    }
    const res = await api.post('/location/from-address', { address: searchQuery });
    if (res && res.ok) {
        const data = await res.json();
        setLocation([data.latitude, data.longitude]);
        setDpi(data.dpi);
    }
  };

  const handleShareAction = async () => {
    setShareStatus('Sending...');
    const type = activeTab === 'share' ? 'SHARE_DPI' : 'REQUEST_DPI';
    const res = await api.post('/share/request', {
        targetIdentifier: targetUser,
        type,
        validForHours: parseInt(duration)
    });

    if (res && res.ok) {
        setShareStatus('Sent successfully!');
        setTargetUser('');
        fetchLists();
    } else {
        setShareStatus('Failed to send.');
    }
    setTimeout(() => setShareStatus(''), 3000);
  };

  const handleRespond = async (id: string, action: 'APPROVE' | 'DENY') => {
    await api.post(`/share/${id}/respond`, { action, pin: '000000' }); // Hardcoded PIN for now as per user request flow simplification
    fetchLists();
  };

  // Prepare Map Markers
  const mapMarkers = [
    { lat: location[0], lng: location[1], title: "Me" }
  ];
  
  othersShares.forEach(share => {
    // Determine who the sharer is
    // If type=SHARE_DPI, sharer is fromUser
    // If type=REQUEST_DPI, sharer is toUser (since I am fromUser)
    // Wait, getActiveReceivedShares returns:
    // { toUserId: userId, type: 'SHARE_DPI' } -> Sharer is fromUser
    // { fromUserId: userId, type: 'REQUEST_DPI' } -> Sharer is toUser
    
    // But wait, the backend response structure for `getActiveReceivedShares` includes:
    // toUser (with location) AND fromUser (with location)
    // We need to pick the right one.
    
    // Logic:
    // If I am `toUserId` (I received share), then `fromUser` is the sharer.
    // If I am `fromUserId` (I requested), then `toUser` is the sharer.
    
    // BUT, the backend `getActiveReceivedShares` query logic was:
    // OR: [ { toUserId: userId, type: 'SHARE_DPI' }, { fromUserId: userId, type: 'REQUEST_DPI' } ]
    
    // So we can check `share.type`.
    // If SHARE_DPI, use `share.fromUser`.
    // If REQUEST_DPI, use `share.toUser`.
    
    const sharer = share.type === 'SHARE_DPI' ? share.fromUser : share.toUser;
    if (sharer && sharer.location) {
        mapMarkers.push({
            lat: sharer.location.latitude,
            lng: sharer.location.longitude,
            title: `${sharer.username} (Expires: ${new Date(share.validUntil).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`
        });
    }
  });

  return (
    <AuroraBackground>
      <div className="flex flex-col md:flex-row h-dvh w-full p-2 md:p-6 gap-3 md:gap-6">
        {/* Left Panel (Controls) */}
        <GlassCard className="w-full md:w-1/3 flex flex-col gap-3 md:gap-6 flex-1 min-h-0 overflow-hidden order-2 md:order-1 rounded-t-2xl md:rounded-2xl shadow-xl border-t border-white/50 md:border-t-0">
          <div className="flex items-center gap-3 mb-1 shrink-0 px-1 pt-1">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
              A
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Arch DPI</h1>
            {myDpi && <span className="ml-auto text-xs bg-white/50 text-blue-700 px-3 py-1.5 rounded-full font-mono border border-blue-100 shadow-sm">{myDpi}</span>}
          </div>

          {/* Search */}
          <div className="space-y-2 shrink-0">
            <div className="flex gap-2">
              <Input 
                placeholder="Search Address or DPI..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="shadow-sm"
              />
              <Button onClick={handleSearch} className="aspect-square p-0 w-12 shadow-sm">
                <Search size={20} />
              </Button>
            </div>
          </div>

          {/* Share / Request Tabs */}
          <div className="bg-white/40 rounded-xl p-1.5 flex shrink-0 shadow-inner">
            <button 
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'share' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'}`}
            >
                Share
            </button>
            <button 
                onClick={() => setActiveTab('request')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'request' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'}`}
            >
                Request
            </button>
          </div>

          {/* Action Form */}
          <div className="bg-white/40 rounded-xl p-4 border border-white/40 shrink-0 space-y-3 shadow-sm">
            <Input 
                placeholder={activeTab === 'share' ? "Username or Phone" : "Username or Phone"}
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="bg-white/70 border-0 focus:ring-2 ring-blue-500/20"
            />
            <div className="flex gap-2">
                <select 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-1/3 px-3 py-3 rounded-xl bg-white/70 border-0 focus:outline-none focus:ring-2 ring-blue-500/20 text-sm text-gray-700 font-medium cursor-pointer"
                >
                    <option value="1">1h</option>
                    <option value="4">4h</option>
                    <option value="24">24h</option>
                </select>
                <Button onClick={handleShareAction} className="flex-1 shadow-md hover:shadow-lg transition-shadow">
                    {activeTab === 'share' ? <Share2 size={16} className="mr-2"/> : <User size={16} className="mr-2"/>}
                    {activeTab === 'share' ? 'Share' : 'Request'}
                </Button>
            </div>
            {shareStatus && <div className="text-xs text-center text-blue-600 font-bold animate-pulse">{shareStatus}</div>}
          </div>

          {/* Lists Container */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            
            {/* 1. Requests */}
            <div>
                <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-md py-2 z-10 border-b border-gray-100">
                    <Bell size={16} className="text-blue-500" /> Requests
                </div>
                {incomingRequests.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-xs italic bg-white/20 rounded-xl border border-dashed border-gray-200">No pending requests</div>
                ) : (
                    <div className="space-y-2">
                        {incomingRequests.map((req) => (
                            <div key={req.id} className="bg-white/60 p-3 rounded-xl border border-white/60 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                <div>
                                    <div className="text-sm font-bold text-gray-800">{req.fromUser.username}</div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        {req.type === 'SHARE_DPI' ? 'Shared w/ you' : 'Requested'}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleRespond(req.id, 'DENY')} className="h-9 w-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-100"><X size={16} /></button>
                                    <button onClick={() => handleRespond(req.id, 'APPROVE')} className="h-9 w-9 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors border border-green-100"><Check size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Others Shared to Me */}
            <div>
                <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-md py-2 z-10 border-b border-gray-100">
                    <User size={16} className="text-blue-500" /> Shared w/ Me
                </div>
                {othersShares.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-xs italic bg-white/20 rounded-xl border border-dashed border-gray-200">No active shares</div>
                ) : (
                    <div className="space-y-2">
                        {othersShares.map((share) => {
                            const sharer = share.type === 'SHARE_DPI' ? share.fromUser : share.toUser;
                            const timeLeft = Math.max(0, Math.ceil((new Date(share.validUntil).getTime() - new Date().getTime()) / (1000 * 60)));
                            return (
                                <div key={share.id} className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between cursor-pointer hover:bg-blue-100/80 transition-all shadow-sm group"
                                     onClick={() => {
                                         if(sharer.location) setLocation([sharer.location.latitude, sharer.location.longitude]);
                                     }}>
                                    <div>
                                        <div className="text-sm font-bold text-blue-900 group-hover:text-blue-700 transition-colors">{sharer.username}</div>
                                        <div className="text-xs text-blue-600 font-medium">{timeLeft}m left</div>
                                    </div>
                                    <div className="h-8 w-8 bg-white/50 rounded-full flex items-center justify-center text-blue-500 group-hover:bg-white group-hover:scale-110 transition-all">
                                        <MapPin size={16} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. My Shares */}
            <div>
                <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold text-sm sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-md py-2 z-10 border-b border-gray-100">
                    <Share2 size={16} className="text-blue-500" /> My Shares
                </div>
                {myShares.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-xs italic bg-white/20 rounded-xl border border-dashed border-gray-200">Not sharing</div>
                ) : (
                    <div className="space-y-2">
                        {myShares.map((share) => {
                            const target = share.type === 'SHARE_DPI' ? share.toUser : share.fromUser;
                            const timeLeft = Math.max(0, Math.ceil((new Date(share.validUntil).getTime() - new Date().getTime()) / (1000 * 60)));
                            return (
                                <div key={share.id} className="bg-white/40 p-3 rounded-xl border border-white/50 flex items-center justify-between shadow-sm">
                                    <div>
                                        <div className="text-sm font-bold text-gray-700">{target.username}</div>
                                        <div className="text-xs text-gray-500 font-medium">{timeLeft}m left</div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            await api.post(`/share/${share.id}/revoke`, {});
                                            fetchLists();
                                        }}
                                        className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-semibold border border-red-100"
                                    >
                                        Stop
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

          </div>
          
        </GlassCard>

        {/* Right Panel - Map */}
        <div className="h-[35vh] md:h-full w-full md:flex-1 rounded-2xl overflow-hidden shadow-2xl border border-white/20 relative order-1 md:order-2 shrink-0">
            <Map center={location} zoom={13} markers={mapMarkers} />
        </div>
      </div>
    </AuroraBackground>
  );
}
