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
        status,
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
      .order("deadline_at", { ascending: true })
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
        status,
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
          status: timeLogData.status || "in_progress", // Default to In Progress
          created_by: user.id,
          updated_by: user.id,
        },
      ])
      .select(
        `
        *,
        status,
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

  // Archive a time log (copy to archive and delete from main)
  async archive(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First get the current time log data
    const { data: currentLog, error: fetchError } = await supabase
      .from("time_logs")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (fetchError) throw fetchError;

    // Archive the current data (exclude id, created_at, updated_at to let Supabase generate new timestamps)
    const {
      id: _,
      created_at: __,
      updated_at: ___,
      ...archiveData
    } = currentLog; // Exclude id and timestamp fields

    const { data: archivedLog, error: archiveError } = await supabase
      .from("time_logs_archive")
      .insert([
        {
          ...archiveData,
          original_time_log: id,
          // Don't include created_at - Supabase will auto-generate it with NOW()
        },
      ])
      .select()
      .single();

    if (archiveError) throw archiveError;

    // Delete the original time log
    const { error: deleteError } = await supabase
      .from("time_logs")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (deleteError) throw deleteError;

    return archivedLog;
  },

  // Archive a time log before updating
  async archiveTimeLog(id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // First get the current time log data
    const { data: currentLog, error: fetchError } = await supabase
      .from("time_logs")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (fetchError) throw fetchError;

    // Archive the current data (exclude id, created_at, updated_at to let Supabase generate new timestamps)
    const {
      id: _,
      created_at: __,
      updated_at: ___,
      ...archiveData
    } = currentLog; // Exclude id and timestamp fields

    const { data: archivedLog, error: archiveError } = await supabase
      .from("time_logs_archive")
      .insert([
        {
          ...archiveData,
          original_time_log: id,
          // Don't include created_at - Supabase will auto-generate it with NOW()
        },
      ])
      .select()
      .single();

    if (archiveError) throw archiveError;
    return archivedLog;
  },

  // Update an existing time log (with optional archiving)
  async update(id, timeLogData, shouldArchive = false) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Archive the current data if requested
    if (shouldArchive) {
      await this.archiveTimeLog(id);
    }

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
        status,
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

  // Update time log status
  async updateStatus(id, status) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs")
      .update({
        status: status,
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
      .order("deadline_at", { ascending: true })
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
      .order("deadline_at", { ascending: true })
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

  // Get archived time logs for a specific original time log
  async getArchivedLogs(originalTimeLogId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs_archive")
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
        created_by_profile:profiles!time_logs_archive_created_by_fkey(id, full_name),
        updated_by_profile:profiles!time_logs_archive_updated_by_fkey(id, full_name)
      `
      )
      .eq("original_time_log", originalTimeLogId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get all archived time logs for the current user
  async getAllArchived() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs_archive")
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
        created_by_profile:profiles!time_logs_archive_created_by_fkey(id, full_name),
        updated_by_profile:profiles!time_logs_archive_updated_by_fkey(id, full_name)
      `
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Delete an archived time log
  async deleteArchive(archivedLogId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("time_logs_archive")
      .delete()
      .eq("id", archivedLogId)
      .eq("created_by", user.id);

    if (error) throw error;
    return true;
  },

  // Update an archived time log
  async updateArchive(archivedLogId, archiveData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("time_logs_archive")
      .update({
        ...archiveData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", archivedLogId)
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

  // Restore an archived time log (optional feature)
  async restoreArchivedLog(archivedLogId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get the archived log
    const { data: archivedLog, error: fetchError } = await supabase
      .from("time_logs_archive")
      .select("*")
      .eq("id", archivedLogId)
      .eq("created_by", user.id)
      .single();

    if (fetchError) throw fetchError;

    // Update the original time log with archived data
    const { data, error } = await supabase
      .from("time_logs")
      .update({
        title: archivedLog.title,
        description: archivedLog.description,
        project: archivedLog.project,
        location: archivedLog.location,
        duration: archivedLog.duration,
        deadline_at: archivedLog.deadline_at,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", archivedLog.original_time_log)
      .eq("created_by", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
