'use client'

import React, { useState, useEffect } from 'react'
import { RoomItem, ClientItem, getRooms, createRoom, getClients } from '../services/room.service'

interface RoomSidebarProps {
    activeRoomId: string | null
    onSelectRoom: (roomId: string) => void
    refreshTrigger?: number
}

export default function RoomSidebar({
    activeRoomId,
    onSelectRoom,
    refreshTrigger,
}: RoomSidebarProps) {
    const [rooms, setRooms] = useState<RoomItem[]>([])
    const [clients, setClients] = useState<ClientItem[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)

    // New room form state
    const [newRoomId, setNewRoomId] = useState('')
    const [newRoomName, setNewRoomName] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const data = await getRooms()
            setRooms(data || [])
        } catch (err) {
            console.error('Failed to fetch rooms', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchClients = async (roomId: string) => {
        try {
            const data = await getClients(roomId)
            setClients(data || [])
        } catch (err) {
            console.error('Failed to fetch clients', err)
        }
    }

    useEffect(() => {
        fetchRooms()
    }, [refreshTrigger])

    useEffect(() => {
        if (activeRoomId) {
            fetchClients(activeRoomId)
            const interval = setInterval(() => fetchClients(activeRoomId), 8000)
            return () => clearInterval(interval)
        } else {
            setClients([])
        }
    }, [activeRoomId])

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError(null)

        const id = newRoomId.trim()
        const name = newRoomName.trim()

        if (!id || !name) {
            setCreateError('Please enter both Room ID and Room Name')
            return
        }

        try {
            setCreating(true)
            await createRoom({ id, name })
            setNewRoomId('')
            setNewRoomName('')
            setShowCreate(false)
            await fetchRooms()
            onSelectRoom(id)
        } catch (err: any) {
            console.error('Error creating room', err)
            setCreateError(err.response?.data?.error || 'Failed to create room')
        } finally {
            setCreating(false)
        }
    }

    const filteredRooms = rooms.filter(
        (r) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.id.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <aside className="w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
                            Rooms
                        </h2>
                        <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                            {rooms.length}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            setShowCreate(!showCreate)
                            setCreateError(null)
                        }}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                    >
                        {showCreate ? 'Cancel' : '+ New Room'}
                    </button>
                </div>

                {/* Inline Create Form */}
                {showCreate && (
                    <form
                        onSubmit={handleCreateRoom}
                        className="p-3 mb-3 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-2.5"
                    >
                        <div className="text-xs font-medium text-zinc-300">Create New Room</div>
                        {createError && (
                            <div className="text-[11px] text-red-400 bg-red-950/50 p-2 rounded border border-red-900/50">
                                {createError}
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="Room ID (e.g. 1, dev, general)"
                            value={newRoomId}
                            onChange={(e) => setNewRoomId(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                        />
                        <input
                            type="text"
                            placeholder="Room Name (e.g. Go Developers)"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                        />
                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create & Join'}
                        </button>
                    </form>
                )}

                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search rooms..."
                    className="w-full bg-zinc-900 border border-zinc-800/80 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
            </div>

            {/* Room list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading && rooms.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-500 font-mono">
                        Loading rooms...
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center py-8 px-4 text-xs text-zinc-500">
                        No rooms found. Click "+ New Room" above to create one.
                    </div>
                ) : (
                    filteredRooms.map((room) => {
                        const isActive = activeRoomId === room.id
                        return (
                            <button
                                key={room.id}
                                onClick={() => onSelectRoom(room.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer border ${
                                    isActive
                                        ? 'bg-zinc-900 border-zinc-700/80 text-zinc-100 shadow-sm'
                                        : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                                }`}
                            >
                                <div className="truncate">
                                    <div className="text-xs font-medium truncate text-zinc-200">
                                        {room.name}
                                    </div>
                                    <div className="text-[11px] font-mono text-zinc-500">
                                        #{room.id}
                                    </div>
                                </div>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                            </button>
                        )
                    })
                )}
            </div>

            {/* Participants in Active Room */}
            {activeRoomId && (
                <div className="border-t border-zinc-800 p-3 bg-zinc-950/70">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                            Room Members
                        </span>
                        <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">
                            {clients.length}
                        </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {clients.length === 0 ? (
                            <div className="text-[11px] text-zinc-500 italic">No members visible</div>
                        ) : (
                            clients.map((c) => (
                                <div
                                    key={c.id + c.username}
                                    className="flex items-center gap-2 text-xs text-zinc-300 py-0.5"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                    <span className="truncate">{c.username}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </aside>
    )
}
