import { supabase } from "../lib/supabase";

export const timeLogService = {
  // Get all time logs for the current user with related project and location data
  async getAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select(
        `
        *,
        projects:project (
          id,
          title,
          description
        ),
        locations:location (
          id,
          title,
          description
        ),
        created_by_profile:profiles!time_logs_created_by_fkey(id, full_name),
        updated_by_profile:profiles!time_logs_updated_by_fkey(id, full_name)
      `
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single time log by ID with related data
  async getById(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select(
        `
        *,
        projects:project (
          id,
          title,
          description
        ),
        locations:location (
          id,
          title,
          description
        ),
        created_by_profile:profiles!time_logs_created_by_fkey(id, full_name),
        updated_by_profile:profiles!time_logs_updated_by_fkey(id, full_name)
      `
      )
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new time log
  async create(timeLogData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .insert([
        {
          ...timeLogData,
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select(
        `
        *,
        projects:project (
          id,
          title,
          description
        ),
        locations:location (
          id,
          title,
          description
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing time log
  async update(id, timeLogData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .update({
        ...timeLogData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id)
      .select(
        `
        *,
        projects:project (
          id,
          title,
          description
        ),
        locations:location (
          id,
          title,
          description
        )
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a time log
  async delete(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("time_logs")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },

  // Get time logs filtered by project
  async getByProject(projectId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select(
        `
        *,
        projects:project (
          id,
          title,
          description
        ),
        locations:location (
          id,
          title,
          description
        )
      `
      )
      .eq("created_by", user.id)
      .eq("project", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get time logs filtered by location
  async getByLocation(locationId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select(
        `
        *,
        projects:project (
          id,
          title,
          description
        ),
        locations:location (
          id,
          title,
          description
        )
      `
      )
      .eq("created_by", user.id)
      .eq("location", locationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get total duration for a project
  async getTotalDurationByProject(projectId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .select("duration")
      .eq("created_by", user.id)
      .eq("project", projectId);

    if (error) throw error;

    const totalDuration = data.reduce(
      (sum, log) => sum + (log.duration || 0),
      0
    );
    return totalDuration;
  },
};
