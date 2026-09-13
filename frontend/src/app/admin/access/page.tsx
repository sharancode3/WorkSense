"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  UserPlus,
  Search,
  RefreshCw,
  History,
  CheckCircle2,
  AlertTriangle,
  UserX,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  listMembersApi,
  inviteMemberApi,
  updateMemberRoleApi,
  suspendMemberApi,
  reactivateMemberApi,
  listAuditLogsApi,
} from "@/lib/api/auth";
import { MemberItem, AuditLogItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/feedback/dialog";
import { Drawer } from "@/components/feedback/drawer";
import { InlineAlert } from "@/components/feedback/inline-alert";

export default function AdminAccessPage() {
  const { user, activeOrg } = useAuth();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [actionAlert, setActionAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteToken, setGeneratedInviteToken] = useState<string | null>(null);

  // Role Edit Dialog State
  const [roleEditTarget, setRoleEditTarget] = useState<MemberItem | null>(null);
  const [newRoleValue, setNewRoleValue] = useState("employee");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Suspend Dialog State
  const [suspendTarget, setSuspendTarget] = useState<MemberItem | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);

  // Audit Logs Drawer State
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listMembersApi({
        query: searchQuery || undefined,
        role: selectedRoleFilter !== "all" ? selectedRoleFilter : undefined,
      });
      setMembers(res.members);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load organization members";
      setActionAlert({ type: "danger", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedRoleFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    setActionAlert(null);
    try {
      const res = await inviteMemberApi({
        email: inviteEmail,
        role: inviteRole,
      });
      setGeneratedInviteToken(res.invitation_token);
      setActionAlert({ type: "success", message: `Invitation created for ${inviteEmail}.` });
      fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to issue invitation";
      setActionAlert({ type: "danger", message: msg });
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!roleEditTarget) return;
    setIsUpdatingRole(true);
    try {
      await updateMemberRoleApi(roleEditTarget.user_id, newRoleValue);
      setActionAlert({
        type: "success",
        message: `Updated ${roleEditTarget.full_name}'s role to ${newRoleValue}.`,
      });
      setRoleEditTarget(null);
      fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Role modification rejected";
      setActionAlert({ type: "danger", message: msg });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleToggleSuspension = async () => {
    if (!suspendTarget) return;
    setIsSuspending(true);
    try {
      if (suspendTarget.status === "suspended") {
        await reactivateMemberApi(suspendTarget.user_id);
        setActionAlert({
          type: "success",
          message: `Reactivated membership for ${suspendTarget.full_name}.`,
        });
      } else {
        await suspendMemberApi(suspendTarget.user_id);
        setActionAlert({
          type: "success",
          message: `Suspended membership for ${suspendTarget.full_name}.`,
        });
      }
      setSuspendTarget(null);
      fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action prohibited";
      setActionAlert({ type: "danger", message: msg });
    } finally {
      setIsSuspending(false);
    }
  };

  const openAuditLogs = async () => {
    setIsAuditDrawerOpen(true);
    setIsLoadingAudit(true);
    try {
      const res = await listAuditLogsApi(50);
      setAuditLogs(res.items);
    } catch {
      // Fallback
    } finally {
      setIsLoadingAudit(false);
    }
  };

  return (
    <ProtectedRoute requiredCapability="admin.access">
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-boundary-subtle">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Tenant Governance & Access Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
              Access Management Console
            </h1>
            <p className="text-xs text-content-secondary mt-0.5">
              Active Organization: <span className="font-semibold text-content-primary">{activeOrg?.name || "None"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openAuditLogs}
              className="gap-1.5"
            >
              <History className="h-4 w-4" />
              <span>Security Audit Trail</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setGeneratedInviteToken(null);
                setInviteEmail("");
                setInviteRole("employee");
                setIsInviteOpen(true);
              }}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Staff</span>
            </Button>
          </div>
        </div>

        {actionAlert && (
          <InlineAlert
            variant={actionAlert.type === "success" ? "success" : "danger"}
            title={actionAlert.type === "success" ? "Action Complete" : "Governance Alert"}
          >
            {actionAlert.message}
          </InlineAlert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-lg border border-boundary-subtle">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
            <input
              type="text"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-secondary border border-boundary-subtle text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              id="admin-role-filter"
              label=""
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              options={[
                { value: "all", label: "All Roles" },
                { value: "administrator", label: "Administrator" },
                { value: "hr", label: "HR Partner" },
                { value: "leadership", label: "Leadership" },
                { value: "recruiter", label: "Recruiter" },
                { value: "manager", label: "Manager" },
                { value: "employee", label: "Employee" },
              ]}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMembers}
            disabled={isLoading}
            className="self-stretch sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Member Table */}
        <div className="bg-surface rounded-xl border border-boundary-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary/70 border-b border-boundary-subtle text-content-muted uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Membership Status</th>
                  <th className="py-3 px-4 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boundary-subtle">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-content-muted">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-primary" />
                      Loading organization members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-content-muted">
                      No members match the active filters.
                    </td>
                  </tr>
                ) : (
                  members.map((mem) => {
                    const isSelf = mem.user_id === user?.id;
                    const isSuspended = mem.status === "suspended";

                    return (
                      <tr key={mem.id} className="hover:bg-surface-secondary/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-content-primary">
                          {mem.full_name}
                          {isSelf && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-brand-primary/10 text-[10px] text-brand-primary font-bold">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-content-secondary font-mono text-[11px]">
                          {mem.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-surface-secondary border border-boundary-subtle text-content-primary">
                            {mem.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold capitalize ${
                              isSuspended ? "text-status-danger" : "text-status-success"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isSuspended ? "bg-status-danger" : "bg-status-success"
                              }`}
                            />
                            {mem.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => {
                              setRoleEditTarget(mem);
                              setNewRoleValue(mem.role);
                            }}
                            title={isSelf ? "Self-role modification prohibited" : "Modify role"}
                          >
                            Change Role
                          </Button>
                          <Button
                            variant={isSuspended ? "outline" : "danger"}
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setSuspendTarget(mem)}
                            title={isSelf ? "Self-suspension prohibited" : isSuspended ? "Reactivate" : "Suspend"}
                          >
                            {isSuspended ? "Reactivate" : "Suspend"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1. Invite Modal */}
        <Dialog
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          title="Invite Internal Workforce Member"
          description="Provision a verified employee, manager, recruiter, HR, leadership, or administrator role within this organization."
        >
          {generatedInviteToken ? (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-status-success/10 border border-status-success/30 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-status-success font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Invitation Successfully Generated</span>
                </div>
                <p className="text-content-secondary">
                  Share this invitation link with the employee to complete account onboarding:
                </p>
                <div className="p-2 bg-surface rounded border border-boundary-subtle font-mono text-[11px] break-all select-all text-content-primary">
                  {`${window.location.origin}/auth/invite?token=${generatedInviteToken}`}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => setIsInviteOpen(false)}
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4 py-2">
              <Input
                id="invite-email-input"
                label="Employee Corporate Email"
                type="text"
                required
                placeholder="colleague@organization.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
              />

              <Select
                id="invite-role-select"
                label="Assigned System Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                options={[
                  { value: "employee", label: "Employee (Self-Service Portal)" },
                  { value: "manager", label: "Manager (Team-Scoped Workspace)" },
                  { value: "recruiter", label: "Recruiter (Talent Pipeline)" },
                  { value: "hr", label: "HR Partner (Workforce Governance)" },
                  { value: "leadership", label: "Leadership (Aggregate Insights)" },
                  { value: "administrator", label: "Administrator (Tenant Access Controls)" },
                ]}
                disabled={isInviting}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isInviting}
                  disabled={isInviting}
                >
                  Generate Invitation
                </Button>
              </div>
            </form>
          )}
        </Dialog>

        {/* 2. Change Role Dialog */}
        <Dialog
          isOpen={Boolean(roleEditTarget)}
          onClose={() => setRoleEditTarget(null)}
          title="Modify Member Functional Role"
          description={`Update role assignment for ${roleEditTarget?.full_name} (${roleEditTarget?.email}).`}
        >
          <div className="space-y-4 py-2">
            <Select
              id="modify-role-select"
              label="Select New Role"
              value={newRoleValue}
              onChange={(e) => setNewRoleValue(e.target.value)}
              options={[
                { value: "employee", label: "Employee" },
                { value: "manager", label: "Manager" },
                { value: "recruiter", label: "Recruiter" },
                { value: "hr", label: "HR Partner" },
                { value: "leadership", label: "Leadership" },
                { value: "administrator", label: "Administrator" },
              ]}
              disabled={isUpdatingRole}
            />

            <div className="text-[11px] text-content-muted bg-surface-secondary p-2.5 rounded border border-boundary-subtle">
              <span className="font-semibold text-content-primary">Governance Guard: </span>
              If this member is the sole active administrator, demotion is strictly prohibited.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setRoleEditTarget(null)}
                disabled={isUpdatingRole}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateRole}
                isLoading={isUpdatingRole}
                disabled={isUpdatingRole}
              >
                Confirm Role Change
              </Button>
            </div>
          </div>
        </Dialog>

        {/* 3. Suspend / Reactivate Confirmation Dialog */}
        <Dialog
          isOpen={Boolean(suspendTarget)}
          onClose={() => setSuspendTarget(null)}
          title={suspendTarget?.status === "suspended" ? "Reactivate Membership" : "Suspend Member Access"}
          description={
            suspendTarget?.status === "suspended"
              ? `Restore active system access for ${suspendTarget?.full_name}.`
              : `Immediately suspend access for ${suspendTarget?.full_name}. Suspended accounts cannot access confidential resources.`
          }
        >
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-2 p-3 bg-status-danger/10 border border-status-danger/30 rounded-lg text-xs text-content-primary">
              <AlertTriangle className="h-4 w-4 text-status-danger flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Security Confirmation: </span>
                This action is audited. Last active administrators cannot be suspended.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSuspendTarget(null)}
                disabled={isSuspending}
              >
                Cancel
              </Button>
              <Button
                variant={suspendTarget?.status === "suspended" ? "primary" : "danger"}
                onClick={handleToggleSuspension}
                isLoading={isSuspending}
                disabled={isSuspending}
              >
                {suspendTarget?.status === "suspended" ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    <span>Confirm Reactivation</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-1.5" />
                    <span>Confirm Suspension</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* 4. Security Audit Log Drawer */}
        <Drawer
          isOpen={isAuditDrawerOpen}
          onClose={() => setIsAuditDrawerOpen(false)}
          title="Organization Security Audit Trail"
          description="Immutable append-only record of administrative role grants, invitations, and access suspensions."
        >
          <div className="space-y-3 py-2">
            {isLoadingAudit ? (
              <div className="py-8 text-center text-content-muted text-xs">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-primary" />
                Querying audit events...
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-xs text-content-muted text-center py-6">
                Zero security events recorded for this organization.
              </p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-surface-secondary border border-boundary-subtle rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-primary font-mono text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-content-muted">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-content-primary">
                      Actor: <span className="font-semibold">{log.actor_name}</span>
                    </div>
                    <div className="text-content-muted text-[11px] font-mono truncate">
                      Result: <span className="text-status-success font-semibold">{log.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer>
      </div>
    </ProtectedRoute>
  );
}
