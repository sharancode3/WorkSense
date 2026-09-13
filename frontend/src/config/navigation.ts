import { NavigationGroup, NavigationItem } from "@/types";

export interface RoleNavigationConfig {
  workspaceTitle: string;
  items: NavigationItem[];
  secondaryItems?: NavigationItem[];
}

export const ROLE_NAVIGATION: Record<string, RoleNavigationConfig> = {
  candidate: {
    workspaceTitle: "Candidate Journey",
    items: [
      {
        id: "cand-overview",
        title: "Application Overview",
        href: "/candidate",
        iconName: "UserCheck",
      },
      {
        id: "cand-onboarding",
        title: "My Onboarding",
        href: "/onboarding",
        iconName: "FileCheck",
      },
      {
        id: "cand-demo",
        title: "Guided Demo",
        href: "/demo",
        iconName: "Sparkles",
      },
    ],
    secondaryItems: [
      {
        id: "cand-access",
        title: "My Profile & Access",
        href: "/my-access",
        iconName: "Shield",
      },
    ],
  },
  employee: {
    workspaceTitle: "Employee Workplace",
    items: [
      {
        id: "emp-overview",
        title: "My Workplace Overview",
        href: "/employee",
        iconName: "User",
      },
      {
        id: "emp-onboarding",
        title: "My Onboarding Track",
        href: "/onboarding",
        iconName: "UserCheck",
      },
      {
        id: "emp-policy",
        title: "Policy Assistant",
        href: "/policies",
        iconName: "FileText",
      },
      {
        id: "emp-demo",
        title: "Guided Demo",
        href: "/demo",
        iconName: "Sparkles",
      },
    ],
    secondaryItems: [
      {
        id: "emp-access",
        title: "My Access & Scope",
        href: "/my-access",
        iconName: "Shield",
      },
    ],
  },
  manager: {
    workspaceTitle: "Team Leadership",
    items: [
      {
        id: "mgr-overview",
        title: "Team Overview",
        href: "/manager",
        iconName: "Users",
      },
      {
        id: "mgr-team",
        title: "Direct Reports",
        href: "/workforce/employees",
        iconName: "Users",
      },
      {
        id: "mgr-onboarding",
        title: "Team Onboarding",
        href: "/manager/onboarding",
        iconName: "UserCheck",
      },
      {
        id: "mgr-skills",
        title: "Team Skill Coverage",
        href: "/workforce/skills",
        iconName: "Share2",
      },
      {
        id: "mgr-approvals",
        title: "Action Approvals",
        href: "/recommendations",
        iconName: "AlertCircle",
      },
      {
        id: "mgr-policies",
        title: "Policy Reference",
        href: "/policies",
        iconName: "FileText",
      },
      {
        id: "mgr-demo",
        title: "Guided Demo",
        href: "/demo",
        iconName: "Sparkles",
      },
    ],
    secondaryItems: [
      {
        id: "mgr-access",
        title: "My Access & Scope",
        href: "/my-access",
        iconName: "Shield",
      },
    ],
  },
  recruiter: {
    workspaceTitle: "Talent Acquisition",
    items: [
      {
        id: "rec-overview",
        title: "Talent Overview",
        href: "/recruiter",
        iconName: "UserSearch",
      },
      {
        id: "rec-jobs",
        title: "Job Requisitions",
        href: "/recruitment/jobs",
        iconName: "Briefcase",
      },
      {
        id: "rec-candidates",
        title: "Candidate Profiles",
        href: "/workforce/candidates",
        iconName: "UserCheck",
      },
      {
        id: "rec-skills",
        title: "Skill Taxonomy",
        href: "/workforce/skills",
        iconName: "Share2",
      },
      {
        id: "rec-policies",
        title: "Hiring Policies",
        href: "/policies",
        iconName: "FileText",
      },
      {
        id: "rec-demo",
        title: "Guided Demo",
        href: "/demo",
        iconName: "Sparkles",
      },
    ],
    secondaryItems: [
      {
        id: "rec-roles",
        title: "Job Role Catalog",
        href: "/workforce/roles",
        iconName: "BookOpen",
      },
      {
        id: "rec-departments",
        title: "Departments & Org Tree",
        href: "/workforce/departments",
        iconName: "Building2",
      },
      {
        id: "rec-access",
        title: "My Access & Scope",
        href: "/my-access",
        iconName: "Shield",
      },
    ],
  },
  hr: {
    workspaceTitle: "Workforce Operations",
    items: [
      {
        id: "hr-dashboard",
        title: "Decision Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
      {
        id: "hr-directory",
        title: "People & Twins",
        href: "/workforce/employees",
        iconName: "Users",
      },
      {
        id: "hr-onboarding",
        title: "Adaptive Onboarding",
        href: "/hr/onboarding",
        iconName: "UserCheck",
      },
      {
        id: "hr-intelligence",
        title: "Workforce Intelligence",
        href: "/workforce/intelligence",
        iconName: "BarChart3",
      },
      {
        id: "hr-approvals",
        title: "Approvals & EnterPro",
        href: "/recommendations",
        iconName: "AlertCircle",
      },
      {
        id: "hr-policy",
        title: "Policy Reasoning",
        href: "/policies",
        iconName: "FileText",
      },
      {
        id: "hr-demo",
        title: "Guided Demo",
        href: "/demo",
        iconName: "Sparkles",
      },
    ],
    secondaryItems: [
      {
        id: "hr-dept-tree",
        title: "Departments & Org Tree",
        href: "/workforce/departments",
        iconName: "Building2",
      },
      {
        id: "hr-role-catalog",
        title: "Job Role Catalog",
        href: "/workforce/roles",
        iconName: "BookOpen",
      },
      {
        id: "hr-skill-graph",
        title: "Skill Graph",
        href: "/workforce/skills",
        iconName: "Share2",
      },
      {
        id: "hr-candidates",
        title: "Candidate Profiles",
        href: "/workforce/candidates",
        iconName: "UserSearch",
      },
      {
        id: "hr-data-quality",
        title: "Data Quality Engine",
        href: "/workforce/data-quality",
        iconName: "Activity",
      },
      {
        id: "hr-access",
        title: "My Access & Scope",
        href: "/my-access",
        iconName: "Shield",
      },
    ],
  },
  leadership: {
    workspaceTitle: "Executive Intelligence",
    items: [
      {
        id: "lead-overview",
        title: "Executive Overview",
        href: "/leadership",
        iconName: "BarChart3",
      },
      {
        id: "lead-dashboard",
        title: "Workforce Dashboard",
        href: "/dashboard",
        iconName: "LayoutDashboard",
      },
      {
        id: "lead-talent",
        title: "Talent Pipeline",
        href: "/recruitment/jobs",
        iconName: "Briefcase",
      },
      {
        id: "lead-capabilities",
        title: "Capability Heatmap",
        href: "/workforce/skills",
        iconName: "Share2",
      },
      {
        id: "lead-recommendations",
        title: "Strategic Approvals",
        href: "/recommendations",
        iconName: "AlertCircle",
      },
      {
        id: "lead-policies",
        title: "Governance Policies",
        href: "/policies",
        iconName: "FileText",
      },
      {
        id: "lead-demo",
        title: "Guided Demo",
        href: "/demo",
        iconName: "Sparkles",
      },
    ],
    secondaryItems: [
      {
        id: "lead-employees",
        title: "Employee Evidence",
        href: "/workforce/employees",
        iconName: "Users",
      },
      {
        id: "lead-dept-tree",
        title: "Org Hierarchy",
        href: "/workforce/departments",
        iconName: "Building2",
      },
      {
        id: "lead-access",
        title: "My Access & Scope",
        href: "/my-access",
        iconName: "Shield",
      },
    ],
  },
  administrator: {
    workspaceTitle: "Platform Administration",
    items: [
      {
        id: "admin-access-mgmt",
        title: "Access & Governance",
        href: "/admin/access",
        iconName: "ShieldAlert",
      },
      {
        id: "admin-system-health",
        title: "System & Model Health",
        href: "/status",
        iconName: "Activity",
      },
      {
        id: "admin-org-tree",
        title: "Departments & Org Tree",
        href: "/workforce/departments",
        iconName: "Building2",
      },
      {
        id: "admin-roles",
        title: "Job Role Catalog",
        href: "/workforce/roles",
        iconName: "BookOpen",
      },
      {
        id: "admin-skills",
        title: "Skill Taxonomy",
        href: "/workforce/skills",
        iconName: "Share2",
      },
      {
        id: "admin-policies",
        title: "Policy Documents",
        href: "/policies",
        iconName: "FileText",
      },
      {
        id: "admin-data-quality",
        title: "Data Quality Engine",
        href: "/workforce/data-quality",
        iconName: "Activity",
      },
      {
        id: "admin-demo",
        title: "Guided Demo",
        href: "/demo",
        iconName: "Sparkles",
      },
    ],
  },
};

/**
 * Resolves role-specific navigation groups based on the authoritative active role.
 */
export function getNavigationForUser(roles: string[]): NavigationGroup[] {
  if (!roles || roles.length === 0) {
    return [
      {
        id: "primary-workspace",
        title: "Core Navigation",
        items: [
          { id: "nav-overview", title: "Overview", href: "/dashboard", iconName: "LayoutDashboard" },
          { id: "nav-talent", title: "Talent Decision", href: "/workforce/candidates", iconName: "UserSearch" },
          { id: "nav-health", title: "Workforce Health", href: "/workforce/intelligence", iconName: "BarChart3" },
          { id: "nav-actions", title: "Review Actions", href: "/recommendations", iconName: "AlertCircle" },
          { id: "nav-demo", title: "Guided Demo", href: "/demo", iconName: "Sparkles" },
        ],
      },
    ];
  }

  // Priority resolution for primary active role workspace
  const primaryRole =
    roles.find((r) => ["administrator", "admin"].includes(r)) ? "administrator"
    : roles.includes("hr") ? "hr"
    : roles.includes("recruiter") ? "recruiter"
    : roles.includes("leadership") ? "leadership"
    : roles.includes("manager") ? "manager"
    : roles.includes("employee") ? "employee"
    : roles.includes("candidate") ? "candidate"
    : "hr";

  const config = ROLE_NAVIGATION[primaryRole] || ROLE_NAVIGATION.hr;
  const groups: NavigationGroup[] = [
    {
      id: "primary-workspace",
      title: config.workspaceTitle,
      items: config.items,
    },
  ];

  if (config.secondaryItems && config.secondaryItems.length > 0) {
    groups.push({
      id: "workforce-data-foundation",
      title: "Workforce Data & Taxonomy",
      items: config.secondaryItems,
    });
  }

  return groups;
}

// Fallback exported NAVIGATION_GROUPS for backward compatibility
export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    id: "workspaces",
    title: "Core Workspaces",
    items: [
      { id: "dashboard", title: "Overview", href: "/dashboard", iconName: "LayoutDashboard" },
      { id: "talent", title: "Talent Decision", href: "/workforce/candidates", iconName: "UserSearch" },
      { id: "intelligence", title: "Workforce Health", href: "/workforce/intelligence", iconName: "BarChart3" },
      { id: "actions", title: "Review Actions", href: "/recommendations", iconName: "AlertCircle" },
      { id: "demo", title: "Guided Demo", href: "/demo", iconName: "Sparkles" },
      { id: "my-access", title: "My Access & Scope", href: "/my-access", iconName: "Shield" },
    ],
  },
];
