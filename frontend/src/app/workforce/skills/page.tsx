"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Share2, ChevronRight, Plus, Search, Filter, Grid, ArrowRight } from "lucide-react";
import { listSkillsApi, getSkillGraphApi, createSkillApi, addSkillRelationshipApi } from "@/lib/api/workforce";
import { Skill, SkillGraphResponse } from "@/types/workforce";
import { useAuth } from "@/context/auth-context";

export default function SkillsPage() {
  const { roles } = useAuth();
  const canManage = roles.some((r) => ["administrator", "hr"].includes(r));

  const [skills, setSkills] = useState<Skill[]>([]);
  const [graphData, setGraphData] = useState<SkillGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"graph" | "taxonomy">("graph");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Add Skill Modal
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkillCode, setNewSkillCode] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Backend");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillAliases, setNewSkillAliases] = useState("");
  const [submittingSkill, setSubmittingSkill] = useState(false);

  // Add Relationship Modal
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [sourceSkillId, setSourceSkillId] = useState("");
  const [targetSkillId, setTargetSkillId] = useState("");
  const [relType, setRelType] = useState<"ADJACENT_TO" | "PREREQUISITE_OF" | "TRANSFERABLE_TO" | "SPECIALIZATION_OF">("ADJACENT_TO");
  const [weight, setWeight] = useState(0.8);
  const [submittingRel, setSubmittingRel] = useState(false);

  const loadData = useCallback(async (queryOverride?: string) => {
    try {
      setLoading(true);
      setError(null);
      const query = queryOverride !== undefined ? queryOverride : searchQuery;
      const [sData, gData] = await Promise.all([
        listSkillsApi({
          category: selectedCategory || undefined,
          search: query || undefined,
        }),
        getSkillGraphApi({ query: query || undefined }),
      ]);
      setSkills(sData);
      setGraphData(gData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load skills";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillCode || !newSkillName) return;
    try {
      setSubmittingSkill(true);
      const aliasesList = newSkillAliases
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await createSkillApi({
        code: newSkillCode.trim(),
        name: newSkillName.trim(),
        category: newSkillCategory.trim(),
        description: newSkillDesc.trim(),
        aliases: aliasesList,
      });
      setIsSkillModalOpen(false);
      setNewSkillCode("");
      setNewSkillName("");
      setNewSkillDesc("");
      setNewSkillAliases("");
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create skill");
    } finally {
      setSubmittingSkill(false);
    }
  };

  const handleCreateRel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceSkillId || !targetSkillId || sourceSkillId === targetSkillId) {
      alert("Please select two distinct skills.");
      return;
    }

    try {
      setSubmittingRel(true);
      await addSkillRelationshipApi(sourceSkillId, {
        target_skill_id: targetSkillId,
        relationship_type: relType,
        similarity_weight: weight,
      });
      setIsRelModalOpen(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to link skills");
    } finally {
      setSubmittingRel(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [skills]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-boundary-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted uppercase tracking-wider">
            <span>Workforce Foundation</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-content-primary">Capability Framework</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mt-1">Skill Taxonomy & Relational Graph</h1>
          <p className="text-sm text-content-secondary mt-1">
            Canonical taxonomy, alias resolution, and deterministic topological graph edges without external graph databases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-boundary-subtle bg-surface p-1">
            <button
              onClick={() => setActiveTab("graph")}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                activeTab === "graph"
                  ? "bg-brand-primary text-white"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              <Share2 className="h-3.5 w-3.5 inline mr-1" />
              Graph View
            </button>
            <button
              onClick={() => setActiveTab("taxonomy")}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                activeTab === "taxonomy"
                  ? "bg-brand-primary text-white"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              <Grid className="h-3.5 w-3.5 inline mr-1" />
              Taxonomy Table
            </button>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRelModalOpen(true)}
                className="px-3 py-2 border border-boundary-subtle bg-surface text-content-primary text-xs font-semibold rounded-md hover:bg-surface-secondary transition-colors"
              >
                Add Edge
              </button>
              <button
                onClick={() => setIsSkillModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Skill
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 border border-boundary-subtle rounded-lg">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-content-muted" />
            <input
              type="text"
              placeholder="Search skill by name, code, or alias (e.g. 'Postgres', 'K8s')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-opacity-90"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-content-muted" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-1.5 border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary w-full sm:w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md border border-error-subtle bg-error-subtle/10 text-error text-sm">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="h-96 bg-surface-secondary animate-pulse rounded-lg border border-boundary-subtle" />
      ) : activeTab === "graph" ? (
        /* Relational Graph Visualization */
        <div className="border border-boundary-subtle rounded-lg bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-boundary-subtle pb-4">
            <div>
              <h2 className="text-sm font-bold text-content-primary">Relational Topology</h2>
              <p className="text-xs text-content-muted mt-0.5">
                {graphData?.nodes.length || 0} Canonical Skills &bull; {graphData?.edges.length || 0} Adjacency Edges
              </p>
            </div>

            {/* Edge Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span>ADJACENT_TO</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                <span>PREREQUISITE_OF</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-600" />
                <span>TRANSFERABLE_TO</span>
              </span>
            </div>
          </div>

          {/* Node & Edge Cards Representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {graphData?.nodes.map((node) => {
              const connectedEdges = graphData.edges.filter(
                (e) => e.source === node.id || e.target === node.id
              );

              return (
                <div
                  key={node.id}
                  className="p-4 rounded-lg border border-boundary-subtle bg-surface-secondary/20 hover:border-brand-primary transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-content-primary">{node.label}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface border border-boundary-subtle text-content-secondary">
                        {node.category}
                      </span>
                    </div>

                    {/* Node Edges */}
                    <div className="mt-3 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                        Connected Relationships ({connectedEdges.length})
                      </div>

                      {connectedEdges.length === 0 ? (
                        <p className="text-[11px] text-content-muted italic">No active graph relationships.</p>
                      ) : (
                        connectedEdges.map((edge) => {
                          const isSource = edge.source === node.id;
                          const otherNodeId = isSource ? edge.target : edge.source;
                          const otherNode = graphData.nodes.find((n) => n.id === otherNodeId);
                          const isPrereq = edge.relationship_type === "PREREQUISITE_OF";
                          const isAdjacent = edge.relationship_type === "ADJACENT_TO";

                          return (
                            <div
                              key={edge.id}
                              className="text-[11px] p-2 rounded bg-surface border border-boundary-subtle flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    isPrereq
                                      ? "bg-amber-100 text-amber-800"
                                      : isAdjacent
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                  }`}
                                >
                                  {edge.relationship_type}
                                </span>
                                <ArrowRight className="h-3 w-3 text-content-muted" />
                                <span className="font-semibold text-content-primary">{otherNode?.label || "Skill"}</span>
                              </div>
                              <span className="font-mono text-content-muted text-[10px]">
                                {(edge.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Accessible Taxonomy Table */
        <div className="border border-boundary-subtle rounded-lg bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary border-b border-boundary-subtle text-content-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Canonical Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Recognized Aliases</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boundary-subtle">
                {skills.map((skill) => (
                  <tr key={skill.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-content-primary">{skill.code}</td>
                    <td className="px-4 py-3 font-bold text-content-primary">{skill.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle text-[10px]">
                        {skill.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {skill.aliases && skill.aliases.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skill.aliases.map((a) => (
                            <span
                              key={a}
                              className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-mono font-semibold"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-content-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-content-secondary max-w-md">{skill.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Skill Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-content-primary">Add Canonical Skill</h3>
            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Skill Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. skill_kafka"
                  value={newSkillCode}
                  onChange={(e) => setNewSkillCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Canonical Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apache Kafka"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems"
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Recognized Aliases</label>
                <input
                  type="text"
                  placeholder="Comma-separated e.g. Kafka, Confluent, event-stream"
                  value={newSkillAliases}
                  onChange={(e) => setNewSkillAliases(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Core domain capabilities..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-boundary-subtle">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSkill}
                  className="px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submittingSkill ? "Saving..." : "Save Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Graph Relationship Modal */}
      {isRelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface border border-boundary-subtle rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-content-primary">Define Relational Graph Edge</h3>
            <p className="text-xs text-content-secondary">
              Connect skills in the capability graph with typed adjacency or prerequisite requirements.
            </p>

            <form onSubmit={handleCreateRel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Source Skill</label>
                <select
                  required
                  value={sourceSkillId}
                  onChange={(e) => setSourceSkillId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                >
                  <option value="">— Select Source Skill —</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-primary mb-1">Target Skill</label>
                <select
                  required
                  value={targetSkillId}
                  onChange={(e) => setTargetSkillId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                >
                  <option value="">— Select Target Skill —</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">Relation Type</label>
                  <select
                    value={relType}
                    onChange={(e) =>
                      setRelType(
                        e.target.value as "ADJACENT_TO" | "PREREQUISITE_OF" | "TRANSFERABLE_TO" | "SPECIALIZATION_OF"
                      )
                    }
                    className="w-full px-3 py-2 text-xs border border-boundary-subtle rounded bg-surface focus:outline-none focus:border-brand-primary"
                  >
                    <option value="ADJACENT_TO">ADJACENT_TO</option>
                    <option value="PREREQUISITE_OF">PREREQUISITE_OF</option>
                    <option value="TRANSFERABLE_TO">TRANSFERABLE_TO</option>
                    <option value="SPECIALIZATION_OF">SPECIALIZATION_OF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Similarity Weight: {weight}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-boundary-subtle">
                <button
                  type="button"
                  onClick={() => setIsRelModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRel}
                  className="px-4 py-2 text-xs font-semibold bg-brand-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submittingRel ? "Connecting..." : "Add Graph Edge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
