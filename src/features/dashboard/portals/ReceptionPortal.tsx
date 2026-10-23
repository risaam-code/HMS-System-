import React, { useState } from 'react';
import {
  Users,
  Ticket,
  Calendar,
  Clock,
  Printer,
  Search,
  CheckCircle2,
  UserPlus,
  Stethoscope,
  Building,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface ChannelingDoctor {
  id: string;
  name: string;
  specialty: string;
  room: string;
  tokensIssued: number;
  maxTokens: number;
  status: 'In Session' | 'Starting Soon' | 'Completed';
  currentServing: string;
}

const activeDoctors: ChannelingDoctor[] = [
  {
    id: 'DOC-01',
    name: 'Dr. Janaka Senaratne',
    specialty: 'Consultant Cardiologist',
    room: 'Consultation Room 102',
    tokensIssued: 19,
    maxTokens: 25,
    status: 'In Session',
    currentServing: 'Token #08',
  },
  {
    id: 'DOC-02',
    name: 'Dr. Priyantha Jayasuriya',
    specialty: 'Senior Medical Officer (OPD)',
    room: 'OPD Room 101',
    tokensIssued: 28,
    maxTokens: 35,
    status: 'In Session',
    currentServing: 'Token #14',
  },
  {
    id: 'DOC-03',
    name: 'Dr. Shirani Ranasinghe',
    specialty: 'Consultant Paediatrician',
    room: 'Child Health Room 106',
    tokensIssued: 16,
    maxTokens: 20,
    status: 'In Session',
    currentServing: 'Token #06',
  },
  {
    id: 'DOC-04',
    name: 'Dr. Harsha Alwis',
    specialty: 'Consultant Orthopaedic Surgeon',
    room: 'Ortho Suite 105',
    tokensIssued: 12,
    maxTokens: 20,
    status: 'Starting Soon',
    currentServing: 'Starting 10:00 AM',
  },
];

interface CheckedInPatient {
  token: string;
  name: string;
  nic: string;
  doctor: string;
  room: string;
  time: string;
  status: 'Waiting' | 'With Doctor' | 'Completed';
}

const recentCheckins: CheckedInPatient[] = [
  {
    token: 'T-19',
    name: 'Kamal Gunawardena',
    nic: '198224500912',
    doctor: 'Dr. Janaka Senaratne',
    room: 'Room 102',
    time: '09:40 AM',
    status: 'Waiting',
  },
  {
    token: 'T-18',
    name: 'Amina Farook',
    nic: '199175402311',
    doctor: 'Dr. Shirani Ranasinghe',
    room: 'Room 106',
    time: '09:35 AM',
    status: 'Waiting',
  },
  {
    token: 'T-17',
    name: 'Suresh Kumar',
    nic: '197608901234',
    doctor: 'Dr. Priyantha Jayasuriya',
    room: 'Room 101',
    time: '09:30 AM',
    status: 'With Doctor',
  },
];

export const ReceptionPortal: React.FC = () => {
  const { addToast } = useToast();
  const [patientName, setPatientName] = useState('');
  const [patientNIC, setPatientNIC] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(activeDoctors[0].name);
  const [checkins, setCheckins] = useState<CheckedInPatient[]>(recentCheckins);

  const handleIssueToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      addToast({ type: 'warning', title: 'Missing Name', message: 'Please enter patient full name.' });
      return;
    }

    const nextTokenNum = checkins.length + 20;
    const newTokenStr = `T-${nextTokenNum}`;
    const newEntry: CheckedInPatient = {
      token: newTokenStr,
      name: patientName,
      nic: patientNIC || 'NIC Not Provided',
      doctor: selectedDoctor,
      room: activeDoctors.find((d) => d.name === selectedDoctor)?.room || 'Room 101',
      time: 'Just now',
      status: 'Waiting',
    };

    setCheckins([newEntry, ...checkins]);
    setPatientName('');
    setPatientNIC('');
    setPatientPhone('');

    addToast({
      type: 'success',
      title: `Token ${newTokenStr} Issued`,
      message: `Checked in ${newEntry.name} for ${newEntry.doctor}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-sky-100 mb-2 border border-white/20">
              <Building className="w-3.5 h-3.5 text-sky-300" />
              Main Lobby Reception & OPD Channeling Desk • Counter #01
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reception & Patient Registration</h1>
            <p className="text-sky-100 text-sm mt-1">
              Logged in as <span className="font-semibold text-white">Kasun Wickramasinghe</span> (Chief Receptionist)
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Display Screen Synced',
                  message: 'OPD Waiting Lounge TV Display refreshed with live tokens.',
                });
              }}
            >
              <Ticket className="w-4 h-4 mr-1.5" />
              Lounge TV
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-sky-500 hover:bg-sky-600 text-white shadow-md border-0 text-xs h-10 sm:h-9 justify-center"
              onClick={() => {
                const searchEl = document.getElementById('patientNameInput');
                searchEl?.focus();
              }}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Check-in Patient
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Simple Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tokens Issued Today</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">118</div>
          <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium">89 served, 29 in lounge</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Doctors In Session</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">4 Doctors</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Rooms 101, 102, 105, 106</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patients in Waiting Area</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">19 Waiting</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average wait: 14 mins</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-sky-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Emergency Ambulance</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">1990 Ready</div>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">Suwa Seriya Hotline linked</p>
        </div>
      </div>

      {/* Main Row: Quick Issue Token Form (1 col) + Doctors Live Channels (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fast Issue Token Form */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Quick Issue OPD Channeling Token
            </h2>
            <p className="text-xs text-slate-500">Fast 1-minute registration for walking and channeled patients</p>
          </div>

          <form onSubmit={handleIssueToken} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Patient Full Name *
              </label>
              <input
                id="patientNameInput"
                type="text"
                required
                placeholder="e.g. Ruwanthi Jayasinghe"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  National ID (NIC)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 199468200123"
                  value={patientNIC}
                  onChange={(e) => setPatientNIC(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (Sri Lanka)
                </label>
                <input
                  type="text"
                  placeholder="077 123 4567"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Consulting Doctor
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {activeDoctors.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name} - {doc.specialty} ({doc.room})
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold h-11 sm:h-10 py-2 rounded-xl shadow-sm text-sm justify-center"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Generate Token & Print Slip
            </Button>
          </form>
        </div>

        {/* Doctor Consultation Rooms Status */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Live OPD Channeling Rooms
              </h2>
              <p className="text-xs text-slate-500">Real-time room occupancy and queue load</p>
            </div>
            <Badge variant="success">4 Live Rooms</Badge>
          </div>

          <div className="space-y-3">
            {activeDoctors.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{doc.name}</h3>
                    <p className="text-xs text-sky-600 dark:text-sky-400">{doc.specialty}</p>
                  </div>
                  <Badge variant={doc.status === 'In Session' ? 'success' : 'outline'}>
                    {doc.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{doc.room}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Currently: {doc.currentServing}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full"
                    style={{ width: `${(doc.tokensIssued / doc.maxTokens) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Capacity: {doc.tokensIssued} / {doc.maxTokens} tokens</span>
                  <span>{doc.maxTokens - doc.tokensIssued} tokens remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Check-ins List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Recent OPD Check-ins & Active Tokens
          </h3>
          <span className="text-xs text-slate-500">Live reception stream</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {checkins.map((entry, idx) => (
            <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-mono shrink-0">
                  {entry.token}
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{entry.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    NIC: {entry.nic} • Assigned to: <strong className="text-slate-700 dark:text-slate-300">{entry.doctor}</strong> ({entry.room})
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                <Badge variant={entry.status === 'With Doctor' ? 'info' : 'warning'}>
                  {entry.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-10 sm:h-9 px-3 justify-center"
                  onClick={() => {
                    addToast({
                      type: 'info',
                      title: 'Token Slip Printed',
                      message: `Slip printed for Token ${entry.token} (${entry.name}).`,
                    });
                  }}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Slip
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
