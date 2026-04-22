import prisma from "@/lib/prisma";

/**
 * Returns a client with full thermography context:
 * - ThermographySites with audits, inspections, missions
 * - Existing inspections and recent reports
 * - Annotation/image counts for progress tracking
 */
export async function getClientWithFullContext(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    include: {
      sites: {
        include: {
          inspections: {
            orderBy: { date: "desc" },
            take: 1,
            select: { id: true, date: true, status: true },
          },
        },
      },
      thermographySites: {
        include: {
          audits: {
            orderBy: { createdAt: "desc" },
            include: {
              site: true,
            },
          },
          inspections: {
            include: {
              missions: {
                include: {
                  _count: { select: { images: true } },
                  annotations: {
                    where: { orthoAnnotation: true },
                    select: { id: true, severity: true, faultType: true },
                  },
                },
              },
            },
          },
        },
      },
      inspections: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          site: { select: { name: true } },
          _count: { select: { annotations: true } },
        },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          site: { select: { name: true } },
          inspection: { select: { date: true } },
        },
      },
      _count: {
        select: {
          sites: true,
          inspections: true,
          reports: true,
          annotations: true,
          thermographySites: true,
        },
      },
    },
  });
}

export type ClientWithFullContext = NonNullable<
  Awaited<ReturnType<typeof getClientWithFullContext>>
>;
