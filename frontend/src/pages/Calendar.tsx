import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Package, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    date: Date;
    type: 'reminder' | 'deadline' | 'meeting' | 'delivery';
    isOrder?: boolean;
    orderId?: string;
}

const Calendar: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    // Form State
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        type: 'reminder',
        time: '09:00'
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [ordersData, eventsData] = await Promise.all([
                api.getOrders(),
                api.getEvents()
            ]);

            const mappedEvents: CalendarEvent[] = [];

            // Map Orders to Events
            ordersData.forEach((order: any) => {
                if (order.deliveryDate) {
                    mappedEvents.push({
                        id: `order-${order.id}`,
                        title: `Delivery: ${order.clientName} (${order.quantity} items)`,
                        date: new Date(order.deliveryDate),
                        type: 'delivery',
                        isOrder: true,
                        orderId: order.id
                    });
                }
            });

            // Map Custom Events
            eventsData.forEach((evt: any) => {
                mappedEvents.push({
                    id: evt.id,
                    title: evt.title,
                    description: evt.description,
                    date: new Date(evt.event_date),
                    type: evt.type as any,
                    isOrder: false
                });
            });

            setEvents(mappedEvents);
        } catch (error) {
            console.error(error);
            addToast("Failed to load calendar data", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleDateClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        setEditingEvent(null);
        setEventForm({ title: '', description: '', type: 'reminder', time: '09:00' });
        setIsModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
        e.stopPropagation();
        if (event.isOrder) {
            navigate(`/orders/${event.orderId}`);
        } else {
            setEditingEvent(event);
            setSelectedDate(event.date);
            setEventForm({
                title: event.title,
                description: event.description || '',
                type: event.type as string,
                time: event.date.toTimeString().slice(0, 5)
            });
            setIsModalOpen(true);
        }
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;

        try {
            // Construct date string using local components to avoid timezone shifts
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const fullDateTime = `${dateStr}T${eventForm.time}:00`;

            const payload = {
                title: eventForm.title,
                description: eventForm.description,
                eventDate: fullDateTime, // Correct field name for backend
                type: eventForm.type
            };

            if (editingEvent) {
                await api.updateEvent(editingEvent.id, payload);
                addToast("Event updated", 'success');
            } else {
                await api.createEvent(payload);
                addToast("Event added", 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast("Failed to save event", 'error');
        }
    };

    const handleDeleteEvent = async () => {
        if (!editingEvent) return;
        if (confirm("Are you sure you want to delete this event?")) {
            try {
                await api.deleteEvent(editingEvent.id);
                addToast("Event deleted", 'success');
                setIsModalOpen(false);
                fetchData();
            } catch (error) {
                addToast("Failed to delete event", 'error');
            }
        }
    };

    const renderCalendarDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[60px] bg-zinc-50/30 border-b border-r border-zinc-100" />);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const isToday = new Date().toDateString() === date.toDateString();
            const dayEvents = events.filter(e => e.date.toDateString() === date.toDateString());

            days.push(
                <div
                    key={i}
                    onClick={() => handleDateClick(i)}
                    className={`min-h-[60px] border-b border-r border-zinc-100 p-1.5 transition-colors hover:bg-zinc-50 cursor-pointer relative group flex flex-col ${isToday ? 'bg-zinc-50' : 'bg-white'}`}
                >
                    <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-zinc-900 bg-zinc-200 w-6 h-6 rounded-full flex items-center justify-center' : 'text-zinc-500'}`}>
                        {i}
                    </div>

                    <div className="flex-1 space-y-0.5 overflow-hidden">
                        {dayEvents.map((evt, idx) => (
                            <div
                                key={idx}
                                onClick={(e) => handleEventClick(e, evt)}
                                className={`text-[9px] px-1 py-0.5 rounded truncate border cursor-pointer hover:opacity-80
                                    ${evt.type === 'delivery' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        evt.type === 'meeting' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            evt.type === 'deadline' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-blue-50 text-blue-700 border-blue-100'}`}
                            >
                                {evt.type === 'delivery' && <Package size={10} className="inline mr-1" />}
                                {evt.isOrder ? '' : <Clock size={10} className="inline mr-1" />}
                                {evt.title}
                            </div>
                        ))}
                    </div>

                    <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 rounded-full transition-all">
                        <Plus size={14} className="text-zinc-500" />
                    </button>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
                        <CalendarIcon className="text-zinc-400" /> Calendar
                    </h1>
                    <div className="flex items-center bg-white border border-zinc-200 rounded-md shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-zinc-50"><ChevronLeft size={20} className="text-zinc-600" /></button>
                        <span className="px-4 py-1.5 font-medium text-zinc-900 min-w-[140px] text-center border-x border-zinc-200">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-zinc-50"><ChevronRight size={20} className="text-zinc-600" /></button>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedDate(new Date());
                        setEditingEvent(null);
                        setEventForm({ title: '', description: '', type: 'reminder', time: '12:00' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors"
                >
                    <Plus size={16} /> New Event
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-lg border border-zinc-200 shadow-sm flex flex-col overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 grid-rows-6 flex-1">
                    {renderCalendarDays()}
                </div>
            </div>

            {/* Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-semibold text-zinc-900">{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                                <div className="text-sm font-semibold text-zinc-900">
                                    {selectedDate?.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                    placeholder="Event title..."
                                    value={eventForm.title}
                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                        value={eventForm.time}
                                        onChange={e => setEventForm({ ...eventForm, time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                        value={eventForm.type}
                                        onChange={e => setEventForm({ ...eventForm, type: e.target.value })}
                                    >
                                        <option value="reminder">Reminder</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="deadline">Deadline</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500"
                                    placeholder="Add details..."
                                    value={eventForm.description}
                                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                {editingEvent && !editingEvent.isOrder && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteEvent}
                                        className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="flex-1 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    {!editingEvent?.isOrder && (
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors"
                                        >
                                            Save Event
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
