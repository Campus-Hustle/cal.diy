import db from "@calcom/prisma";
import { Prisma } from "@calcom/prisma/client";
import type { TrpcSessionUser } from "../../../types";

type ListWithTeamOptions = {
  ctx: {
    user: Pick<NonNullable<TrpcSessionUser>, "id">;
  };
};

export const listWithTeamHandler = async ({ ctx }: ListWithTeamOptions) => {
  const userId = ctx.user.id;
  const query = Prisma.sql`SELECT "EventType"."id", "EventType"."teamId", "EventType"."title", "EventType"."slug", "EventType"."length", "j1"."name" as "teamName", "u"."username" as "username"
    FROM "EventType"
    LEFT JOIN "Team" AS "j1" ON ("j1"."id") = ("EventType"."teamId")
    LEFT JOIN "users" AS "u" ON ("u"."id") = ("EventType"."userId")
    WHERE "EventType"."userId" = ${userId}
    UNION
    SELECT "EventType"."id", "EventType"."teamId", "EventType"."title", "EventType"."slug", "EventType"."length", "j1"."name" as "teamName", "u"."username" as "username"
    FROM "EventType"
    INNER JOIN "Team" AS "j1" ON ("j1"."id") = ("EventType"."teamId")
    INNER JOIN "Membership" AS "t2" ON "t2"."teamId" = "j1"."id"
    LEFT JOIN "users" AS "u" ON ("u"."id") = ("EventType"."userId")
    WHERE "t2"."userId" = ${userId} AND "t2"."accepted" = true`;

  const result =
    await db.$queryRaw<
      {
        id: number;
        teamId: number | null;
        title: string;
        slug: string;
        length: number;
        teamName: string | null;
        username: string | null;
      }[]
    >(query);

  return result.map((row) => ({
    id: row.id,
    team: row.teamId ? { id: row.teamId, name: row.teamName || "" } : null,
    title: row.title,
    slug: row.slug,
    length: row.length,
    username: row.teamId ? null : row.username,
  }));
};
