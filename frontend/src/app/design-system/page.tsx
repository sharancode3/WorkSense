"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog } from "@/components/feedback/dialog";
import { Drawer } from "@/components/feedback/drawer";
import { useToast } from "@/components/feedback/toast";

export default function DesignSystemPage() {
  const { showToast } = useToast();
  const [btnLoading, setBtnLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [checkVal, setCheckVal] = useState(true);
  const [switchVal, setSwitchVal] = useState(false);

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="pb-4 border-b border-boundary-subtle">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
          Design System & Component Primitives
        </h1>
        <p className="text-xs sm:text-sm text-content-secondary mt-1">
          Strict flat design system: zero drop shadows, solid color blocks, geometric typography (Outfit & Inter), and WCAG 2.1 AA contrast.
        </p>
      </div>

      {/* 1. Color Palette & Structure */}
      <section className="space-y-4">
        <h2 className="text-base font-bold font-display uppercase tracking-wider text-content-muted">
          01. Color Palette & Structure
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-md bg-brand-primary text-white space-y-1">
            <span className="text-[11px] font-bold uppercase">Primary Blue</span>
            <p className="text-xs font-mono opacity-80">#2563EB</p>
          </div>
          <div className="p-3 rounded-md bg-brand-accent text-white space-y-1">
            <span className="text-[11px] font-bold uppercase">Emerald Accent</span>
            <p className="text-xs font-mono opacity-80">#10B981</p>
          </div>
          <div className="p-3 rounded-md bg-status-warning text-white space-y-1">
            <span className="text-[11px] font-bold uppercase">Warning Amber</span>
            <p className="text-xs font-mono opacity-80">#F59E0B</p>
          </div>
          <div className="p-3 rounded-md bg-status-danger text-white space-y-1">
            <span className="text-[11px] font-bold uppercase">Danger Red</span>
            <p className="text-xs font-mono opacity-80">#EF4444</p>
          </div>
          <div className="p-3 rounded-md bg-surface border border-boundary-subtle text-content-primary space-y-1">
            <span className="text-[11px] font-bold uppercase">Surface White</span>
            <p className="text-xs font-mono text-content-muted">#FFFFFF</p>
          </div>
          <div className="p-3 rounded-md bg-surface-secondary text-content-primary space-y-1">
            <span className="text-[11px] font-bold uppercase">Muted Gray 100</span>
            <p className="text-xs font-mono text-content-muted">#F3F4F6</p>
          </div>
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-base font-bold font-display uppercase tracking-wider text-content-muted">
          02. Geometric Typography (Outfit & Inter)
        </h2>
        <div className="p-6 rounded-lg bg-surface border border-boundary-subtle space-y-4">
          <div>
            <span className="text-[10px] font-mono text-content-muted uppercase">Display Heading 1</span>
            <p className="text-3xl font-extrabold font-display tracking-tight text-content-primary">
              WorkSense Talent Intelligence Engine
            </p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-content-muted uppercase">Section Heading 2</span>
            <p className="text-xl font-bold font-display tracking-tight text-content-primary">
              Workforce Twin & Relational Skill Graph
            </p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-content-muted uppercase">Card Title / Subheading</span>
            <p className="text-base font-bold font-display text-content-primary">
              Executive Decision Simulator (Google OR-Tools)
            </p>
          </div>
          <div>
            <span className="text-[10px] font-mono text-content-muted uppercase">Body Text (Inter)</span>
            <p className="text-sm text-content-secondary leading-relaxed">
              Every insight follows the standard: WHAT &rarr; WHY &rarr; EVIDENCE &rarr; WHAT NEXT.
              Algorithmic calculations are delegated to deterministic solvers while explanations are synthesized by bounded models.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Buttons & Actions */}
      <section className="space-y-4">
        <h2 className="text-base font-bold font-display uppercase tracking-wider text-content-muted">
          03. Flat Button Styles (Zero Shadows)
        </h2>
        <div className="p-6 rounded-lg bg-surface border border-boundary-subtle space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              isLoading={btnLoading}
              onClick={() => setBtnLoading((prev) => !prev)}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Primary Action
            </Button>
            <Button variant="secondary">Secondary Neutral</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
              Destructive
            </Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Form Inputs */}
      <section className="space-y-4">
        <h2 className="text-base font-bold font-display uppercase tracking-wider text-content-muted">
          04. Form Controls & Inputs
        </h2>
        <div className="p-6 rounded-lg bg-surface border border-boundary-subtle space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Candidate Full Name"
              placeholder="e.g., Sarah Lin"
              helperText="Matches verified identity in talent pool."
            />
            <SearchInput
              placeholder="Search skills, roles, policies..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onClear={() => setSearchVal("")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department / Org Unit"
              options={[
                { value: "eng", label: "Engineering & Infrastructure" },
                { value: "product", label: "Product & Architecture" },
                { value: "hr", label: "People & Workforce Ops" },
              ]}
            />
            <Textarea
              label="Competency Evidence Notes"
              placeholder="Summarize verified PRs, commits, or certification artifacts..."
              rows={2}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Checkbox
              label="Enforce Row-Level Security (RLS)"
              checked={checkVal}
              onChange={(e) => setCheckVal(e.target.checked)}
            />
            <Switch
              label="Enable AI-Degraded Mode Fallback"
              checked={switchVal}
              onChange={(e) => setSwitchVal(e.target.checked)}
            />
          </div>
        </div>
      </section>

      {/* 5. Status Badges & Pills */}
      <section className="space-y-4">
        <h2 className="text-base font-bold font-display uppercase tracking-wider text-content-muted">
          05. Badges & Vocabulary Indicators
        </h2>
        <div className="p-6 rounded-lg bg-surface border border-boundary-subtle space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="VERIFIED" />
            <StatusBadge status="HEALTHY" />
            <StatusBadge status="PENDING_APPROVAL" />
            <StatusBadge status="DEGRADED" />
            <StatusBadge status="UNAVAILABLE" />
            <StatusBadge status="NOT_CONFIGURED" />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="primary">Primary Tag</Badge>
            <Badge variant="accent">Accent Tag</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Pass</Badge>
            <Badge variant="warning">Caution</Badge>
            <Badge variant="danger">Critical</Badge>
          </div>
        </div>
      </section>

      {/* 6. Overlays & Feedback */}
      <section className="space-y-4">
        <h2 className="text-base font-bold font-display uppercase tracking-wider text-content-muted">
          06. Accessible Overlays & Feedback
        </h2>
        <div className="p-6 rounded-lg bg-surface border border-boundary-subtle space-y-4">
          <p className="text-xs text-content-secondary">
            Test accessible modals and dismissible feedback overlays with keyboard escape support.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
              Open Dialog Modal
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
              Open Side Drawer
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                showToast({
                  type: "success",
                  title: "Flat Design Verified",
                  message: "Zero shadows and clean high-contrast styling applied.",
                })
              }
            >
              Trigger Success Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                showToast({
                  type: "warning",
                  title: "Connection Standby",
                  message: "Local gateway offline; running in degraded mode.",
                })
              }
            >
              Trigger Warning Toast
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Dialog Modal */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Verified Flat Modal"
        description="This modal enforces zero drop shadows, solid surface colors, and accessible focus trapping."
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-content-secondary leading-relaxed">
            Flat design removes artificial depth illusions. Modal boundaries are defined by solid surface contrast
            and crisp borders rather than floating shadows.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsDialogOpen(false)}>
              Confirm Action
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Interactive Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Side Detail Drawer"
        description="Slide-out panel without backdrop blur or box shadows."
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-content-secondary leading-relaxed">
            Side panels in WorkSense allow deep inspection of skill evidence ledgers, candidate transcripts,
            and EnterPro approval workflows without losing primary view context.
          </p>
          <div className="p-3 rounded bg-surface-secondary text-xs text-content-muted">
            Focus trapped: press ESC or click outside to dismiss.
          </div>
          <div className="pt-4 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Close Panel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
