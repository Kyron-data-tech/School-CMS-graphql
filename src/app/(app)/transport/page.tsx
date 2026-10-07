import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import {
  InteractiveTransportClient,
  type TransportRouteItem,
  type StudentTransportAssignment,
} from "@/components/transport/InteractiveTransportClient";

export default async function TransportPage() {
  const ctx = (await getAuthContext())!;

  const canManage = Boolean(
    ctx.roleKeys.includes("headmaster") ||
      ctx.roleKeys.includes("admin") ||
      ctx.roleKeys.includes("HEADMASTER") ||
      ctx.roleKeys.includes("ADMIN")
  );

  let routesData: TransportRouteItem[] = [];
  let myAssignment: StudentTransportAssignment | null = null;

  try {
    const dbRoutes = await db.transportRoute.findMany({
      where: { schoolId: ctx.schoolId },
      include: {
        vehicles: true,
        students: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    routesData = dbRoutes.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      startPoint: r.startPoint,
      endPoint: r.endPoint,
      stops: (r.stops as any) || [],
      fareAmount: r.fareAmount ? Number(r.fareAmount) : null,
      isActive: r.isActive,
      vehicle: r.vehicles[0]
        ? {
            id: r.vehicles[0].id,
            registrationNo: r.vehicles[0].registrationNo,
            driverName: r.vehicles[0].driverName,
            driverPhone: r.vehicles[0].driverPhone,
            capacity: r.vehicles[0].capacity,
            status: r.vehicles[0].status,
          }
        : undefined,
      enrolledStudentsCount: r.students.length,
    }));

    // If student or parent, fetch active transport assignment
    const targetStudentId = ctx.studentId || (ctx.childStudentIds.length > 0 ? ctx.childStudentIds[0] : null);

    if (targetStudentId) {
      const assignment = await db.studentTransport.findFirst({
        where: {
          studentId: targetStudentId,
          isActive: true,
        },
        include: {
          student: true,
          route: {
            include: {
              vehicles: true,
            },
          },
        },
      });

      if (assignment) {
        myAssignment = {
          id: assignment.id,
          studentName: `${assignment.student.firstName} ${assignment.student.lastName}`,
          studentAdm: assignment.student.admissionNo,
          routeCode: assignment.route.code,
          routeName: assignment.route.name,
          stopName: assignment.stopName,
          pickupTime: assignment.pickupTime,
          dropTime: assignment.dropTime,
          driverName: assignment.route.vehicles[0]?.driverName,
          driverPhone: assignment.route.vehicles[0]?.driverPhone,
          vehicleNo: assignment.route.vehicles[0]?.registrationNo,
        };
      }
    }
  } catch (err) {
    // Offline / Demo Fallback
    routesData = [
      {
        id: "rte-01",
        code: "RTE-01",
        name: "Route 1 - Western Express",
        startPoint: "Bandra West",
        endPoint: "Campus Gate 1",
        fareAmount: 12000,
        isActive: true,
        enrolledStudentsCount: 38,
        vehicle: {
          id: "veh-01",
          registrationNo: "MH-02-AZ-4412",
          driverName: "Ramesh Pawar",
          driverPhone: "+91 98201 12345",
          capacity: 42,
          status: "ACTIVE",
        },
        stops: [
          { name: "Bandra Station (W)", time: "07:15 AM", order: 1 },
          { name: "Khar Gymkhana", time: "07:30 AM", order: 2 },
          { name: "Santacruz Signal", time: "07:45 AM", order: 3 },
          { name: "Campus Gate 1", time: "08:10 AM", order: 4 },
        ],
      },
      {
        id: "rte-02",
        code: "RTE-02",
        name: "Route 2 - Eastern Link",
        startPoint: "Powai Galleria",
        endPoint: "Campus Gate 2",
        fareAmount: 14000,
        isActive: true,
        enrolledStudentsCount: 32,
        vehicle: {
          id: "veh-02",
          registrationNo: "MH-03-CD-8899",
          driverName: "Suresh Patil",
          driverPhone: "+91 98334 56789",
          capacity: 38,
          status: "ACTIVE",
        },
        stops: [
          { name: "Hiranandani Gardens", time: "07:10 AM", order: 1 },
          { name: "JVLR Junction", time: "07:25 AM", order: 2 },
          { name: "Marol Naka", time: "07:40 AM", order: 3 },
          { name: "Campus Gate 2", time: "08:05 AM", order: 4 },
        ],
      },
      {
        id: "rte-03",
        code: "RTE-03",
        name: "Route 3 - South Suburban Shuttle",
        startPoint: "Worli Sea Face",
        endPoint: "Campus Main Gate",
        fareAmount: 15000,
        isActive: true,
        enrolledStudentsCount: 26,
        vehicle: {
          id: "veh-03",
          registrationNo: "MH-01-BK-2041",
          driverName: "Mahesh Shinde",
          driverPhone: "+91 98112 34567",
          capacity: 35,
          status: "ACTIVE",
        },
        stops: [
          { name: "Worli Naka", time: "07:05 AM", order: 1 },
          { name: "Prabhadevi Chowk", time: "07:20 AM", order: 2 },
          { name: "Dadar Plaza", time: "07:35 AM", order: 3 },
          { name: "Campus Main Gate", time: "08:15 AM", order: 4 },
        ],
      },
    ];

    if (ctx.studentId || ctx.roleKeys.includes("student")) {
      myAssignment = {
        id: "st-01",
        studentName: ctx.name || "Arjun Mehta",
        studentAdm: "ADM-8001",
        routeCode: "RTE-01",
        routeName: "Route 1 - Western Express",
        stopName: "Bandra Station (W)",
        pickupTime: "07:15 AM",
        dropTime: "03:45 PM",
        driverName: "Ramesh Pawar",
        driverPhone: "+91 98201 12345",
        vehicleNo: "MH-02-AZ-4412",
      };
    }
  }

  const primaryRole = ctx.roleKeys[0] || "student";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buses & Campus Transport"
        subtitle="Live bus routes, stop timetables, driver contacts, and student fleet allocations"
      />

      <InteractiveTransportClient
        routes={routesData}
        myAssignment={myAssignment}
        userRole={primaryRole}
        canManage={canManage}
      />
    </div>
  );
}
