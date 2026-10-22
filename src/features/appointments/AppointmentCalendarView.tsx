import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getStatusColor } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
} from 'lucide-react';

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  onBookSlot?: (date: string, time: string) => void;
}

export function AppointmentCalendarView({
  appointments,
  onSelectAppointment,
  onBookSlot,
}: AppointmentCalendarViewProps) {
  // Calendar base date
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-10-21T00:00:00'));

  // Generate 7 days of the active week
  const weekDays = useMemo(() => {
    const days: { dateStr: string; label: string; dayName: string; isToday: boolean }[] = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: dateStr === '2026-10-21',
      });
    }
    return days;
  }, [currentDate]);

  const hours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ];

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-10-21T00:00:00'));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-xs">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800 text-sm">
            Hospital Clinical Schedule — Week of {weekDays[0]?.label} to {weekDays[6]?.label}, 2026
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center border border-slate-300 rounded bg-white">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded-l"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1 hover:bg-slate-100 text-slate-600 rounded-r border-l border-slate-200"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-100/70 font-semibold text-slate-700">
            <div className="p-2.5 text-center text-[11px] text-slate-400 border-r border-slate-200">Time</div>
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                className={`p-2.5 text-center border-r border-slate-200 last:border-r-0 ${
                  d.isToday ? 'bg-blue-100/60 text-blue-900 font-bold' : ''
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider">{d.dayName}</div>
                <div className="text-sm font-bold">{d.label}</div>
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-slate-100">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[68px]">
                {/* Time Label */}
                <div className="p-2 text-right font-mono text-[11px] text-slate-400 border-r border-slate-200 bg-slate-50/50">
                  {hour}
                </div>

                {/* Day Cells */}
                {weekDays.map((day) => {
                  // Find appointments falling in this hour slot on this date
                  const hourPrefix = hour.split(':')[0];
                  const slotAppointments = appointments.filter((a) => {
                    const aptDate = a.date || a.scheduledAt.split('T')[0];
                    if (aptDate !== day.dateStr) return false;
                    const aptStartHour = (a.startTime || a.scheduledAt.split('T')[1]).split(':')[0];
                    return aptStartHour === hourPrefix;
                  });

                  return (
                    <div
                      key={day.dateStr}
                      className={`p-1 border-r border-slate-200 last:border-r-0 relative group transition-colors hover:bg-slate-50/70 ${
                        day.isToday ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {slotAppointments.map((apt) => {
                        const color = getStatusColor(apt.status);
                        return (
                          <div
                            key={apt.id}
                            onClick={() => onSelectAppointment(apt)}
                            className={`p-1.5 rounded border mb-1 cursor-pointer shadow-xs transition-all hover:scale-[1.02] ${color.bg} ${color.border}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-[10px] text-blue-700 truncate">
                                {apt.startTime}-{apt.endTime}
                              </span>
                              <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
                            </div>
                            <div className="font-bold text-slate-900 truncate mt-0.5">{apt.patientName}</div>
                            <div className="text-[10px] text-slate-600 truncate">{apt.doctorName}</div>
                            <div className="text-[9px] text-slate-500 font-medium truncate">{apt.department}</div>
                          </div>
                        );
                      })}

                      {/* Hover Slot Booking Link */}
                      {slotAppointments.length === 0 && onBookSlot && (
                        <div
                          onClick={() => onBookSlot(day.dateStr, hour)}
                          className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-blue-600 font-medium cursor-pointer"
                        >
                          + Book
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
