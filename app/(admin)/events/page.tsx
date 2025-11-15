"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  organizer?: string;
  isAllDay: boolean;
  color?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [view, setView] = useState<"month" | "week" | "list">("month");

  // Form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    eventType: "Academic",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    organizer: "",
    isAllDay: false,
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const response = await fetch(
        `/api/events/calendar/school-1/${year}/${month}`
      );
      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventForm,
          schoolId: "school-1",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEvents([...events, data.event]);
        setIsCreateModalOpen(false);
        setEventForm({
          title: "",
          description: "",
          eventType: "Academic",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          location: "",
          organizer: "",
          isAllDay: false,
        });
        alert("Event created successfully!");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setEvents(events.filter((e) => e.id !== eventId));
        setIsEventModalOpen(false);
        alert("Event deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  // Calendar generation
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const firstDayOfWeek = firstDay.getDay();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = new Date(event.startDate).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Academic: "bg-blue-500",
      Sports: "bg-green-500",
      Meeting: "bg-purple-500",
      Holiday: "bg-red-500",
      Extracurricular: "bg-yellow-500",
      Exam: "bg-orange-500",
      Trip: "bg-pink-500",
      Other: "bg-gray-500",
    };
    return colors[type] || colors.Other;
  };

  const getEventTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Academic: "bg-blue-100 text-blue-800",
      Sports: "bg-green-100 text-green-800",
      Meeting: "bg-purple-100 text-purple-800",
      Holiday: "bg-red-100 text-red-800",
      Extracurricular: "bg-yellow-100 text-yellow-800",
      Exam: "bg-orange-100 text-orange-800",
      Trip: "bg-pink-100 text-pink-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[type] || colors.Other}>{type}</Badge>;
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">School Calendar & Events</h1>
        <p className="text-gray-600">Manage and view school events and activities</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Calendar View */}
        <div className="col-span-8">
          <Card className="p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{monthYear}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={prevMonth}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" onClick={today}>
                  Today
                </Button>
                <Button size="sm" variant="outline" onClick={nextMonth}>
                  Next
                </Button>
                <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  Add Event
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-sm text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth().map((date, index) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const isToday =
                  date &&
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border rounded-lg p-2 ${
                      date
                        ? "bg-white hover:bg-gray-50 cursor-pointer"
                        : "bg-gray-50"
                    } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => {
                      if (date) {
                        setSelectedDate(date);
                        if (dayEvents.length > 0) {
                          setSelectedEvent(dayEvents[0]);
                          setIsEventModalOpen(true);
                        }
                      }
                    }}
                  >
                    {date && (
                      <>
                        <div
                          className={`text-sm font-semibold mb-1 ${
                            isToday ? "text-blue-600" : "text-gray-700"
                          }`}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded ${getEventTypeColor(
                                event.eventType
                              )} text-white truncate`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          {/* Upcoming Events */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border-l-4 pl-3 py-2 cursor-pointer hover:bg-gray-50 rounded"
                  style={{ borderColor: getEventTypeColor(event.eventType).replace("bg-", "#") }}
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsEventModalOpen(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    {getEventTypeBadge(event.eventType)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Event Types Legend */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-4">Event Types</h3>
            <div className="space-y-2">
              {[
                "Academic",
                "Sports",
                "Meeting",
                "Holiday",
                "Extracurricular",
                "Exam",
                "Trip",
                "Other",
              ].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${getEventTypeColor(type)}`}
                  />
                  <span className="text-sm">{type}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Statistics */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-4">This Month</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Events</span>
                <span className="font-semibold">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Upcoming</span>
                <span className="font-semibold">{upcomingEvents.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Event Detail Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Event Details"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold">{selectedEvent.title}</h3>
              {getEventTypeBadge(selectedEvent.eventType)}
            </div>

            {selectedEvent.description && (
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Description</h4>
                <p className="mt-1">{selectedEvent.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Start Date</h4>
                <p>{new Date(selectedEvent.startDate).toLocaleDateString()}</p>
                {selectedEvent.startTime && <p className="text-sm text-gray-600">{selectedEvent.startTime}</p>}
              </div>
              {selectedEvent.endDate && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-500">End Date</h4>
                  <p>{new Date(selectedEvent.endDate).toLocaleDateString()}</p>
                  {selectedEvent.endTime && <p className="text-sm text-gray-600">{selectedEvent.endTime}</p>}
                </div>
              )}
            </div>

            {selectedEvent.location && (
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Location</h4>
                <p>{selectedEvent.location}</p>
              </div>
            )}

            {selectedEvent.organizer && (
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Organizer</h4>
                <p>{selectedEvent.organizer}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleDeleteEvent(selectedEvent.id)}
              >
                Delete Event
              </Button>
              <Button onClick={() => setIsEventModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Event"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Title *</label>
            <Input
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              placeholder="Mid Term Exams"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Type</label>
            <select
              value={eventForm.eventType}
              onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Academic">Academic</option>
              <option value="Sports">Sports</option>
              <option value="Meeting">Meeting</option>
              <option value="Holiday">Holiday</option>
              <option value="Extracurricular">Extracurricular</option>
              <option value="Exam">Exam</option>
              <option value="Trip">Trip</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Event description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <Input
                type="date"
                value={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={eventForm.endDate}
                onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <Input
                type="time"
                value={eventForm.startTime}
                onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <Input
                type="time"
                value={eventForm.endTime}
                onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <Input
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              placeholder="Main Hall"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organizer</label>
            <Input
              value={eventForm.organizer}
              onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={eventForm.isAllDay}
              onChange={(e) => setEventForm({ ...eventForm, isAllDay: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm font-medium">All Day Event</label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={!eventForm.title || !eventForm.startDate}>
              Create Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
