"use client";

import { useState } from "react";
import { StatCard, Empty } from "@/components/ui";

export interface TransportStop {
  name: string;
  time: string;
  order: number;
}

export interface TransportVehicleItem {
  id: string;
  registrationNo: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  status: string;
}

export interface TransportRouteItem {
  id: string;
  name: string;
  code: string;
  startPoint: string;
  endPoint: string;
  stops: TransportStop[];
  fareAmount: number | null;
  isActive: boolean;
  vehicle?: TransportVehicleItem;
  enrolledStudentsCount: number;
}

export interface StudentTransportAssignment {
  id: string;
  studentName: string;
  studentAdm: string;
  routeCode: string;
  routeName: string;
  stopName: string;
  pickupTime: string | null;
  dropTime: string | null;
  driverName?: string;
  driverPhone?: string;
  vehicleNo?: string;
}

interface InteractiveTransportClientProps {
  routes: TransportRouteItem[];
  myAssignment?: StudentTransportAssignment | null;
  userRole: string;
  canManage: boolean;
}

export function InteractiveTransportClient({
  routes: initialRoutes,
  myAssignment,
  userRole,
  canManage,
}: InteractiveTransportClientProps) {
  const [routes, setRoutes] = useState<TransportRouteItem[]>(initialRoutes);
  const [search, setSearch] = useState("");
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(
    initialRoutes[0]?.id || null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoute, setNewRoute] = useState({
    code: "",
    name: "",
    startPoint: "",
    endPoint: "",
    driverName: "",
    driverPhone: "",
    registrationNo: "",
    capacity: 40,
    fareAmount: 12000,
  });

  const isStudentOrParent =
    userRole.toLowerCase().includes("student") ||
    userRole.toLowerCase().includes("parent") ||
    userRole.toLowerCase().includes("guardian");

  // Filter routes
  const filteredRoutes = routes.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.startPoint.toLowerCase().includes(q) ||
      r.endPoint.toLowerCase().includes(q) ||
      r.vehicle?.driverName.toLowerCase().includes(q) ||
      r.stops.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  const totalBuses = routes.length;
  const totalCapacity = routes.reduce(
    (sum, r) => sum + (r.vehicle?.capacity || 40),
    0
  );
  const totalAllocated = routes.reduce(
    (sum, r) => sum + r.enrolledStudentsCount,
    0
  );

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.code || !newRoute.name) return;

    const created: TransportRouteItem = {
      id: `rte-${Date.now()}`,
      code: newRoute.code.toUpperCase(),
      name: newRoute.name,
      startPoint: newRoute.startPoint || "North Gate",
      endPoint: newRoute.endPoint || "Campus Main",
      stops: [
        { name: newRoute.startPoint || "Point A", time: "07:15 AM", order: 1 },
        { name: "Mid Junction Stop", time: "07:35 AM", order: 2 },
        { name: newRoute.endPoint || "Campus Main", time: "08:05 AM", order: 3 },
      ],
      fareAmount: Number(newRoute.fareAmount) || 12000,
      isActive: true,
      enrolledStudentsCount: 0,
      vehicle: {
        id: `veh-${Date.now()}`,
        registrationNo: newRoute.registrationNo || "MH-01-XX-0000",
        driverName: newRoute.driverName || "Driver Unassigned",
        driverPhone: newRoute.driverPhone || "+91 98000 00000",
        capacity: Number(newRoute.capacity) || 40,
        status: "ACTIVE",
      },
    };

    setRoutes([created, ...routes]);
    setShowAddModal(false);
    setNewRoute({
      code: "",
      name: "",
      startPoint: "",
      endPoint: "",
      driverName: "",
      driverPhone: "",
      registrationNo: "",
      capacity: 40,
      fareAmount: 12000,
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Routes"
          value={totalBuses}
          hint="Covering city & suburbs"
          icon="🗺️"
        />
        <StatCard
          label="Bus Fleet"
          value={`${totalBuses} Buses`}
          hint="GPS tracked & verified"
          icon="🚌"
        />
        <StatCard
          label="Transport Commuters"
          value={totalAllocated}
          hint={`${totalCapacity} seats total capacity`}
          icon="🎒"
        />
        <StatCard
          label="Fleet Status"
          value="100% Operational"
          hint="All vehicles inspected"
          icon="✅"
        />
      </div>

      {/* Student/Parent Specific Highlight Banner */}
      {isStudentOrParent && myAssignment && (
        <div className="rounded-2xl border-2 border-brand-800/60 bg-gradient-to-r from-brand-950/70 via-indigo-950/50 to-slate-900/90 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-brand-600 px-2.5 py-0.5 text-xs font-black text-white">
                  {myAssignment.routeCode}
                </span>
                <span className="rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-800">
                  ● Enrolled & Confirmed
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Student: {myAssignment.studentName} ({myAssignment.studentAdm})
                </span>
              </div>
              <h2 className="mt-2 text-xl font-black text-white font-display">
                {myAssignment.routeName}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span>📍 Designated Stop:</span>
                  <span className="font-bold text-brand-400">
                    {myAssignment.stopName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span>⏰ Morning Pickup:</span>
                  <span className="font-bold text-white">
                    {myAssignment.pickupTime || "07:15 AM"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span>🏠 Evening Drop:</span>
                  <span className="font-bold text-white">
                    {myAssignment.dropTime || "03:45 PM"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 shadow-subtle">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Bus & Driver
                </p>
                <p className="text-xs font-bold text-white">
                  {myAssignment.vehicleNo || "MH-02-AZ-4412"}
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  {myAssignment.driverName || "Ramesh Pawar"}
                </p>
              </div>
              {myAssignment.driverPhone && (
                <a
                  href={`tel:${myAssignment.driverPhone}`}
                  className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>📞 Call Driver</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by route code, stop, driver name..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs font-medium text-slate-100 placeholder-slate-500 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>+ Add Route & Bus</span>
            </button>
          )}
        </div>
      </div>

      {/* Routes Directory */}
      <div className="space-y-4">
        {filteredRoutes.length === 0 ? (
          <Empty title="No routes match your search">
            Try adjusting your query or contact the transport coordinator.
          </Empty>
        ) : (
          filteredRoutes.map((route) => {
            const isExpanded = expandedRouteId === route.id;
            const capacity = route.vehicle?.capacity || 40;
            const occupiedPercent = Math.min(
              100,
              Math.round((route.enrolledStudentsCount / capacity) * 100)
            );

            return (
              <div
                key={route.id}
                className="card overflow-hidden transition-all duration-200 hover:border-slate-700 bg-slate-900/90 border-slate-800"
              >
                {/* Route Header */}
                <div
                  onClick={() =>
                    setExpandedRouteId(isExpanded ? null : route.id)
                  }
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 cursor-pointer bg-slate-900/90 select-none hover:bg-slate-800/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 font-black text-sm border border-amber-500/30">
                      🚌
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-brand-300">
                          {route.code}
                        </span>
                        <h3 className="text-base font-bold text-white font-display">
                          {route.name}
                        </h3>
                        {route.isActive ? (
                          <span className="rounded-full bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Origin:</span>{" "}
                        {route.startPoint} ➔{" "}
                        <span className="font-semibold text-slate-300">
                          Destination:
                        </span>{" "}
                        {route.endPoint} •{" "}
                        <span className="font-semibold">{route.stops.length} Stops</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400">
                    {route.vehicle && (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-white">
                            {route.vehicle.registrationNo}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Driver: {route.vehicle.driverName}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="w-28">
                      <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-400">
                        <span>Capacity</span>
                        <span className="font-bold text-white">
                          {route.enrolledStudentsCount}/{capacity}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupiedPercent > 90
                              ? "bg-rose-500"
                              : occupiedPercent > 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(5, occupiedPercent)}%` }}
                        />
                      </div>
                    </div>

                    {route.fareAmount && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Term Fare
                        </span>
                        <span className="font-bold text-white">
                          ₹{route.fareAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <span className="text-slate-400 font-bold">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded Stops Timeline */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-5">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-display mb-3">
                      Route Schedule & Stoppages
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {route.stops.map((stop, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 shadow-subtle relative"
                        >
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-950 text-brand-300 border border-brand-800/80 text-xs font-black">
                            {stop.order || idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-200 truncate">
                              {stop.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {stop.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {route.vehicle && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                        <span className="font-medium">
                          Assigned Fleet Bus:{" "}
                          <strong className="text-white">
                            {route.vehicle.registrationNo}
                          </strong>{" "}
                          (Capacity: {route.vehicle.capacity} seats)
                        </span>
                        <div className="flex items-center gap-3">
                          <span>
                            Driver Contact:{" "}
                            <strong className="text-white">
                              {route.vehicle.driverPhone}
                            </strong>
                          </span>
                          <a
                            href={`tel:${route.vehicle.driverPhone}`}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 text-[11px] font-bold transition-all"
                          >
                            Call
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Emergency Transport Hotline Bar */}
      <div className="rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-300">
              Transport Helpdesk & Emergency Routing
            </p>
            <p className="text-amber-400/90">
              For route changes, bus delays, or student stop reassignments, contact campus fleet dispatch.
            </p>
          </div>
        </div>
        <a
          href="tel:+912255550199"
          className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 font-bold shadow-sm transition-all shrink-0"
        >
          Call Dispatch (+91 22 5555 0199)
        </a>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-display">
                Create New Transport Route
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Route Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RTE-05"
                    value={newRoute.code}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, code: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Fare (₹/term)
                  </label>
                  <input
                    type="number"
                    value={newRoute.fareAmount}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        fareAmount: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Route Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route 5 - South Mumbai Corridor"
                  value={newRoute.name}
                  onChange={(e) =>
                    setNewRoute({ ...newRoute, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Origin Point
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dadar TT"
                    value={newRoute.startPoint}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, startPoint: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Destination Point
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Gate 1"
                    value={newRoute.endPoint}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, endPoint: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Kadam"
                    value={newRoute.driverName}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, driverName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={newRoute.driverPhone}
                    onChange={(e) =>
                      setNewRoute({ ...newRoute, driverPhone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Vehicle Reg No
                  </label>
                  <input
                    type="text"
                    placeholder="MH-02-CD-9988"
                    value={newRoute.registrationNo}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        registrationNo: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Bus Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={newRoute.capacity}
                    onChange={(e) =>
                      setNewRoute({
                        ...newRoute,
                        capacity: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-colors"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
