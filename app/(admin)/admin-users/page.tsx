import serverClient from "@/lib/server/serverClient";
import { GET_INVITED_ADMINS } from "@/qraphql/queries/queries";
import { isOwnerOfAnyChatbot } from "@/lib/adminAccess";
import type { InvitedAdminsResponse } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import InviteAdminForm from "./InviteAdminForm";
import RemoveAdminButton from "./RemoveAdminButton";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const isOwner = await isOwnerOfAnyChatbot(userId);
  if (!isOwner) {
    return (
      <div className="flex-1 p-4 md:p-10 pb-24 text-gray-900 w-full max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Only chatbot owners can manage team members. Create a chatbot first
          to invite other admins.
        </p>
      </div>
    );
  }

  const { data } = await serverClient.query<InvitedAdminsResponse>({
    query: GET_INVITED_ADMINS,
    variables: { owner_clerk_user_id: userId },
  });
  const invites = data?.admin_usersListByOwner ?? [];

  return (
    <div className="flex-1 p-4 md:p-10 pb-24 text-gray-900 w-full max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-semibold">Team</h1>
      <p className="mt-2 text-sm md:text-base text-muted-foreground">
        Invite people to review the chat sessions of your chatbots. They will
        be able to open the review-sessions page but cannot create, edit, or
        delete your chatbots.
      </p>

      <section className="mt-6 md:mt-10 rounded-md border bg-white p-5 md:p-6">
        <h2 className="text-base md:text-lg font-semibold">Invite by email</h2>
        <p className="text-xs text-muted-foreground mt-1">
          The address must match a Clerk account. If they haven&apos;t signed up
          yet, ask them to sign up with this email first.
        </p>
        <div className="mt-4">
          <InviteAdminForm />
        </div>
      </section>

      <section className="mt-8 md:mt-10">
        <h2 className="text-base md:text-lg font-semibold">
          Current admins ({invites.length})
        </h2>
        {invites.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No admins invited yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-md border bg-white">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {invite.invited_email ?? "(no email)"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invited {new Date(invite.created_at).toLocaleString()}
                    {invite.invited_clerk_user_id
                      ? ""
                      : " — pending sign-up"}
                  </p>
                </div>
                <RemoveAdminButton inviteId={invite.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}