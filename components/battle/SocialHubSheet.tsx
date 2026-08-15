'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  Swords,
  Share2,
  Copy,
  Sparkles,
  Send,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SocialHubSheetProps {
  open: boolean
  onClose: () => void
  userName: string
  userRating: number
  onChallengeFriend: (friendName: string, friendRating: number) => void
  onOpenShareProfile: () => void
}

type SocialTab = 'friends' | 'search' | 'requests' | 'challenge'

interface FriendItem {
  id: string
  name: string
  username: string
  rating: number
  college: string
  avatarKey: string
  status: 'online' | 'in_battle' | 'offline'
}

interface IncomingRequest {
  id: string
  name: string
  username: string
  rating: number
  college: string
  avatarKey: string
  timeAgo: string
}

interface SearchDoctor {
  id: string
  name: string
  username: string
  rating: number
  college: string
  avatarKey: string
}

export function SocialHubSheet({
  open,
  onClose,
  userName,
  userRating,
  onChallengeFriend,
  onOpenShareProfile,
}: SocialHubSheetProps) {
  const [tab, setTab] = useState<SocialTab>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [requests, setRequests] = useState<IncomingRequest[]>([])
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({})
  const [searchResults, setSearchResults] = useState<SearchDoctor[]>([])
  const [searching, setSearching] = useState(false)

  // Room code custom challenge
  const [customRoomCode, setCustomRoomCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  // Real-time doctor search via Supabase
  useEffect(() => {
    if (tab !== 'search') return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    setSearching(true)
    let query = supabase
      .from('battle_profiles')
      .select('user_id, battle_username, avatar_key, rating, college')
      .order('rating', { ascending: false })
      .limit(20)

    if (searchQuery.trim()) {
      query = query.ilike('battle_username', `%${searchQuery.trim()}%`)
    }

    query.then(({ data, error }) => {
      setSearching(false)
      if (error || !data) {
        setSearchResults([])
        return
      }
      const results: SearchDoctor[] = data
        .filter((d: any) => d.battle_username !== userName)
        .map((d: any) => ({
          id: d.user_id,
          name: d.battle_username || 'Doctor',
          username: (d.battle_username || 'doc').toLowerCase().replace(/\s+/g, '_'),
          rating: d.rating ?? 1000,
          college: d.college || 'Medical Aspirant',
          avatarKey: d.avatar_key || '🩺',
        }))
      setSearchResults(results)
    })
  }, [tab, searchQuery, userName])

  function handleSendRequest(docId: string, docName: string) {
    setSentRequests((prev) => ({ ...prev, [docId]: true }))
    toast.success(`Friend request sent to ${docName}`)
  }

  function handleAcceptRequest(req: IncomingRequest) {
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    setFriends((prev) => [
      {
        id: req.id,
        name: req.name,
        username: req.username,
        rating: req.rating,
        college: req.college,
        avatarKey: req.avatarKey,
        status: 'online',
      },
      ...prev,
    ])
    toast.success(`You and ${req.name} are now friends!`)
  }

  function handleDeclineRequest(reqId: string) {
    setRequests((prev) => prev.filter((r) => r.id !== reqId))
    toast.info('Request declined')
  }

  function handleGenerateRoom() {
    const code = `MANTIS-${Math.floor(1000 + Math.random() * 9000)}`
    setGeneratedCode(code)
    toast.success(`Room created: ${code}`)
  }

  function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault()
    if (!customRoomCode.trim()) {
      toast.error('Please enter a valid room code')
      return
    }
    toast.success(`Connecting to custom duel room ${customRoomCode.toUpperCase()}...`)
    onChallengeFriend('Dr. Peer Challenger', userRating)
    onClose()
  }

  function copyCode() {
    if (generatedCode) {
      navigator.clipboard.writeText(
        `🩺 Hey! Challenge me to a 1v1 Clinical Duel on Mantis! Join Room Code: ${generatedCode} at ${window.location.origin}/battle`,
      )
      toast.success('Room code & invite link copied to clipboard!')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} showClose className="sm:max-w-xl md:max-w-2xl">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Users size={18} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Doctor Network
              </span>
            </div>
            <h2 className="text-2xl font-extrabold font-[var(--font-display)] mt-1">Friends & 1v1 Challenges</h2>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              onClose()
              onOpenShareProfile()
            }}
            className="gap-1.5 text-xs font-bold"
          >
            <Share2 size={13} /> Share Profile
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-[var(--color-surface-light-muted)] dark:bg-[var(--color-surface-dark-muted)] gap-1">
          {[
            { key: 'friends' as SocialTab, label: `Friends (${friends.length})` },
            { key: 'search' as SocialTab, label: 'Find Doctors' },
            { key: 'requests' as SocialTab, label: `Requests (${requests.length})` },
            { key: 'challenge' as SocialTab, label: '1v1 Custom Room' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center',
                tab === t.key
                  ? 'bg-white dark:bg-neutral-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Friends List */}
        {tab === 'friends' && (
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
            {friends.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                No friends added yet. Click "Find Doctors" to search medical peers!
              </div>
            ) : (
              friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/20 dark:bg-[var(--color-surface-dark-muted)]/20 hover:border-brand-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-xl">
                        {f.avatarKey}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-neutral-900',
                          f.status === 'online'
                            ? 'bg-emerald-500'
                            : f.status === 'in_battle'
                              ? 'bg-amber-500'
                              : 'bg-neutral-400',
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{f.name}</p>
                        <span className="text-[10px] text-neutral-400">@{f.username}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {f.college} · <span className="font-bold text-brand-600 dark:text-brand-400">{f.rating} Elo</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      onChallengeFriend(f.name, f.rating)
                      onClose()
                    }}
                    className="gap-1.5 font-bold text-xs shrink-0"
                  >
                    <Swords size={13} /> Challenge
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Find Doctors */}
        {tab === 'search' && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name, college, or username..."
                className="pl-9 h-10 text-xs"
              />
            </div>

            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {searching ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-400 text-xs">
                  <Loader2 className="animate-spin text-brand-500" size={18} />
                  <span>Searching doctors...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  {searchQuery.trim()
                    ? 'No doctors found matching that name or username.'
                    : 'No other doctors registered yet. Share your profile link to invite friends!'}
                </div>
              ) : (
                searchResults.map((doc) => {
                  const isSent = sentRequests[doc.id]
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/20 dark:bg-[var(--color-surface-dark-muted)]/20"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-xl">
                          {doc.avatarKey}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{doc.name}</p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {doc.college} · <span className="font-bold text-brand-600 dark:text-brand-400">{doc.rating} Elo</span>
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isSent ? 'secondary' : 'primary'}
                        disabled={isSent}
                        onClick={() => handleSendRequest(doc.id, doc.name)}
                        className="gap-1 text-xs font-bold shrink-0"
                      >
                        {isSent ? <Check size={13} /> : <UserPlus size={13} />}
                        {isSent ? 'Sent' : 'Add Friend'}
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Incoming Requests */}
        {tab === 'requests' && (
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                No pending friend requests.
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-[var(--color-surface-light-border)] dark:border-[var(--color-surface-dark-border)] bg-[var(--color-surface-light-muted)]/20 dark:bg-[var(--color-surface-dark-muted)]/20"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-xl">
                      {req.avatarKey}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold truncate">{req.name}</p>
                        <span className="text-[10px] text-neutral-400">{req.timeAgo}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {req.college} · {req.rating} Elo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="flex h-8 px-3 items-center gap-1 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-500 hover:text-rose-500 transition-colors"
                      aria-label="Decline request"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: 1v1 Custom Room Generator */}
        {tab === 'challenge' && (
          <div className="flex flex-col gap-4">
            {/* Create Room Card */}
            <Card className="p-4 bg-gradient-to-br from-brand-500/10 via-transparent to-amber-500/5 border-brand-500/20 flex flex-col gap-3">
              <div>
                <p className="text-sm font-extrabold font-[var(--font-display)]">Create a Private Duel Room</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Generate a custom code and send it to your friend to duel 1v1 in real-time.
                </p>
              </div>

              {generatedCode ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-brand-500/30">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Your Duel Room Code</span>
                    <p className="text-xl font-black font-[var(--font-display)] tracking-wider text-brand-600 dark:text-brand-400">
                      {generatedCode}
                    </p>
                  </div>
                  <Button size="sm" onClick={copyCode} className="gap-1 font-bold text-xs">
                    <Copy size={13} /> Copy & Invite
                  </Button>
                </div>
              ) : (
                <Button size="md" onClick={handleGenerateRoom} className="w-full gap-2 font-bold">
                  <Sparkles size={16} /> Generate Private Room Code
                </Button>
              )}
            </Card>

            {/* Join Room Form */}
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-2">
              <label className="text-xs font-bold text-neutral-500 px-0.5">Or Join a Friend's Duel Room</label>
              <div className="flex gap-2">
                <Input
                  value={customRoomCode}
                  onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MANTIS-4820"
                  className="font-mono text-sm tracking-wider uppercase flex-1"
                />
                <Button type="submit" className="font-bold gap-1.5 shrink-0">
                  <Swords size={16} /> Join Duel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Sheet>
  )
}
