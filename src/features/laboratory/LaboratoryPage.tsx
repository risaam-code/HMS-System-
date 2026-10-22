import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LaboratoryService } from '@/services/laboratoryService';
import { LabRequest, LabTest } from '@/types';
import { LabRequestModal } from './LabRequestModal';
import { SampleCollectionModal } from './SampleCollectionModal';
import { LabResultEntryModal } from './LabResultEntryModal';
import { LabVerificationModal } from './LabVerificationModal';
import { LabReportModal } from './LabReportModal';
import {
  FlaskConical,
  TestTube2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  FileText,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

export function LaboratoryPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'collection' | 'results' | 'catalog'>('requests');
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [catalog, setCatalog] = useState<LabTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isResultEntryModalOpen, setIsResultEntryModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const loadData = () => {
    Promise.all([LaboratoryService.getLabRequests(), LaboratoryService.getLabTests()]).then(([reqList, testList]) => {
      setRequests(reqList);
      setCatalog(testList);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = LaboratoryService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  const totalOrders = requests.length;
  const pendingCollection = requests.filter((r) => r.status === 'requested').length;
  const awaitingVerification = requests.filter((r) => r.status === 'results_entered').length;
  const verifiedOrders = requests.filter((r) => r.status === 'verified').length;

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.requestNumber.toLowerCase().includes(q);
      const matchPat = r.patientName.toLowerCase().includes(q) || r.patientMrn.toLowerCase().includes(q);
      const matchTest = r.testName.toLowerCase().includes(q) || r.testCode.toLowerCase().includes(q);
      const matchBarcode = r.sampleBarcode ? r.sampleBarcode.toLowerCase().includes(q) : false;
      return matchNum || matchPat || matchTest || matchBarcode;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="neutral" size="sm">PENDING COLLECTION</Badge>;
      case 'sample_collected':
        return <Badge variant="info" size="sm">SAMPLE COLLECTED</Badge>;
      case 'processing':
        return <Badge variant="warning" size="sm">IN PROCESSING</Badge>;
      case 'results_entered':
        return <Badge variant="warning" size="sm">AWAITING VERIFICATION</Badge>;
      case 'verified':
        return <Badge variant="success" size="sm">VERIFIED FINAL</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laboratory Information System (LIS)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Diagnostic order workflows, barcode accessioning, analyzer results entry, pathologist verification, and official reports.
          </p>
        </div>
        <div>
          <Button variant="primary" onClick={() => setIsOrderModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Order Lab Test
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FlaskConical className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalOrders}</span>
            <span className="text-xs text-slate-500">All Requisitions</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Pending Specimen</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <TestTube2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingCollection}</span>
            <span className="text-xs text-slate-500">Awaiting Phlebotomy</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Awaiting Sign-off</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{awaitingVerification}</span>
            <span className="text-xs text-amber-700 font-medium">Preliminary Results</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Verified Final</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-900">{verifiedOrders}</span>
            <span className="text-xs text-emerald-700 font-medium">Released to EMR</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          <span>Orders Queue</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{requests.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('collection')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'collection'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TestTube2 className="h-4 w-4" />
          <span>Specimen Accessioning</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{pendingCollection}</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'results'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Results & Pathologist Sign-Off</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
            {awaitingVerification}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Test Catalog</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{catalog.length}</span>
        </button>
      </div>

      {/* Orders Queue Table */}
      {(activeTab === 'requests' || activeTab === 'collection' || activeTab === 'results') && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="all">All Request Statuses</option>
                <option value="requested">Pending Collection</option>
                <option value="sample_collected">Sample Collected</option>
                <option value="results_entered">Awaiting Verification</option>
                <option value="verified">Verified Final</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search test, patient, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <Card className="p-0 border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Test Name & Code</th>
                    <th className="py-3 px-4">Specimen Barcode</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{req.requestNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{req.patientName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{req.patientMrn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{req.testName}</div>
                        <div className="text-[10px] text-slate-500">{req.category} — {req.testCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        {req.sampleBarcode ? (
                          <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 flex items-center gap-1 w-fit">
                            <QrCode className="h-3 w-3 text-blue-600" />
                            {req.sampleBarcode}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not collected</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            req.priority === 'STAT'
                              ? 'bg-rose-100 text-rose-800'
                              : req.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'requested' && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsCollectionModalOpen(true);
                              }}
                            >
                              Collect Sample
                            </Button>
                          )}

                          {req.status === 'sample_collected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsResultEntryModalOpen(true);
                              }}
                            >
                              Enter Results
                            </Button>
                          )}

                          {req.status === 'results_entered' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsVerifyModalOpen(true);
                                }}
                              >
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsReportModalOpen(true);
                                }}
                              >
                                Preview
                              </Button>
                            </>
                          )}

                          {req.status === 'verified' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedRequest(req);
                                setIsReportModalOpen(true);
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1 text-blue-600" />
                              Report
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Diagnostic Test Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((test) => (
            <Card key={test.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700">{test.testCode}</span>
                  <h3 className="font-semibold text-slate-900 text-sm">{test.name}</h3>
                </div>
                <Badge variant="info" size="sm">{test.category}</Badge>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2">{test.description}</p>

              <div className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Specimen Tube:</span>
                  <span className="font-medium text-slate-900">{test.specimenType}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Turnaround Time:</span>
                  <span className="font-medium text-slate-900">~{test.turnaroundHours} hours</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard Price:</span>
                  <span className="font-bold text-emerald-700">${test.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600 block">Normal Reference Ranges:</span>
                <span className="italic">{test.normalRange}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <LabRequestModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={loadData}
      />

      <SampleCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        request={selectedRequest}
        onSuccess={loadData}
      />

      <LabResultEntryModal
        isOpen={isResultEntryModalOpen}
        onClose={() => setIsResultEntryModalOpen(false)}
        request={selectedRequest}
        onSuccess={loadData}
      />

      <LabVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        request={selectedRequest}
        onSuccess={loadData}
      />

      <LabReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        request={selectedRequest}
      />
    </div>
  );
}
